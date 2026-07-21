import { NextRequest, NextResponse } from "next/server";
import {
  addAuditLog,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type TransactionType,
} from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as TransactionType | null;

  const categories = await getCategories(type ?? undefined);
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type } = body as { name?: string; type?: TransactionType };

  if (!name?.trim() || !type) {
    return NextResponse.json({ error: "Nom et type requis" }, { status: 400 });
  }

  try {
    const category = await createCategory(name, type);
    await addAuditLog({
      action: "category_create",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      details: `Création de la catégorie « ${category.name} » (${type === "entree" ? "entrée" : "sortie"})`,
      metadata: { categoryId: category.id, type },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name } = body as { id?: number; name?: string };

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "ID et nom requis" }, { status: 400 });
  }

  try {
    const categories = await getCategories();
    const before = categories.find((c) => c.id === id);
    const category = await updateCategory(id, name);
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
    }
    await addAuditLog({
      action: "category_update",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      details: `Renommage de la catégorie « ${before?.name ?? "?"} » → « ${category.name} »`,
      metadata: { categoryId: category.id },
    });
    return NextResponse.json({ category });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const id = parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const categories = await getCategories();
  const before = categories.find((c) => c.id === id);
  const result = await deleteCategory(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await addAuditLog({
    action: "category_delete",
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    details: `Suppression de la catégorie « ${before?.name ?? `#${id}`} »`,
    metadata: { categoryId: id },
  });

  return NextResponse.json({ ok: true });
}
