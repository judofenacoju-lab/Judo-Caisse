import { NextRequest, NextResponse } from "next/server";
import {
  addAuditLog,
  canCreateTransactions,
  createTransaction,
  deleteTransaction,
  getTransactionCount,
  getTransactions,
  type Currency,
  type TransactionType,
} from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getSession, sessionHasWorkspace } from "@/lib/auth";
import {
  deleteJustificationFiles,
  saveJustificationFile,
  validateJustificationFile,
} from "@/lib/files";

function unauthorized() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

function forbidden(message = "Accès refusé") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!sessionHasWorkspace(session)) {
    return forbidden("Sélectionnez un tableau de bord");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as TransactionType | null;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const [transactions, total] = await Promise.all([
    getTransactions({
      workspace: session.workspace,
      type: type ?? undefined,
      limit,
      offset,
    }),
    getTransactionCount(session.workspace, type ?? undefined),
  ]);

  return NextResponse.json({ transactions, total });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!sessionHasWorkspace(session)) {
    return forbidden("Sélectionnez un tableau de bord");
  }
  if (!canCreateTransactions(session.role)) {
    return forbidden();
  }

  const contentType = request.headers.get("content-type") ?? "";

  let type: TransactionType | undefined;
  let amount: number | undefined;
  let currency: Currency = "USD";
  let description: string | undefined;
  let categoryId: number | null = null;
  let date: string | undefined;
  let justificationFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    type = formData.get("type") as TransactionType;
    amount = parseFloat(formData.get("amount") as string);
    const currencyRaw = (formData.get("currency") as string) ?? "USD";
    currency = currencyRaw === "FC" ? "FC" : "USD";
    description = formData.get("description") as string;
    const catRaw = formData.get("categoryId") as string;
    categoryId = catRaw ? parseInt(catRaw, 10) : null;
    date = formData.get("date") as string;
    justificationFiles = formData
      .getAll("justification")
      .filter((f): f is File => f instanceof File && f.size > 0);
  } else {
    return NextResponse.json({ error: "Format multipart requis" }, { status: 400 });
  }

  if (!type || !amount || !description?.trim() || !date) {
    return NextResponse.json(
      { error: "Type, montant, description et date requis" },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Le montant doit être positif" }, { status: 400 });
  }

  if (type === "sortie") {
    if (justificationFiles.length === 0) {
      return NextResponse.json(
        { error: "Au moins un justificatif (PDF ou JPG) est obligatoire pour les sorties" },
        { status: 400 }
      );
    }
    for (const file of justificationFiles) {
      const validationError = validateJustificationFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }
  }

  const savedFilenames: string[] = [];
  try {
    for (const file of justificationFiles) {
      savedFilenames.push(await saveJustificationFile(file));
    }

    const transaction = await createTransaction({
      type,
      amount,
      currency,
      description: description.trim(),
      categoryId,
      createdBy: session.userId,
      date,
      workspace: session.workspace,
      justificationFiles: savedFilenames,
    });

    await addAuditLog({
      action: "transaction_create",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      workspace: session.workspace,
      details: `Création d'une ${type === "entree" ? "entrée" : "sortie"} : « ${transaction.description} » — ${formatCurrency(amount, currency)}`,
      metadata: {
        transactionId: transaction.id,
        type,
        amount,
        currency,
        date,
        justifications: savedFilenames.length,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    await deleteJustificationFiles(savedFilenames);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!sessionHasWorkspace(session)) {
    return forbidden("Sélectionnez un tableau de bord");
  }
  if (!canCreateTransactions(session.role)) {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "", 10);

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const deleted = await deleteTransaction(id, session.workspace);
  if (!deleted) {
    return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  }

  await addAuditLog({
    action: "transaction_delete",
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    workspace: session.workspace,
    details: `Suppression d'une ${deleted.type === "entree" ? "entrée" : "sortie"} : « ${deleted.description} » — ${formatCurrency(deleted.amount, deleted.currency ?? "USD")}`,
    metadata: {
      transactionId: deleted.id,
      type: deleted.type,
      amount: deleted.amount,
      currency: deleted.currency ?? "USD",
      date: deleted.date,
    },
  });

  return NextResponse.json({ ok: true });
}
