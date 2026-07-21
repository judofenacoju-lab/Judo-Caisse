import { NextRequest, NextResponse } from "next/server";
import { addAuditLog, getExportData } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateExcelBuffer, generatePdfBuffer } from "@/lib/export";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format");
  const { stats, transactions } = await getExportData();
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "xlsx" || format === "pdf") {
    await addAuditLog({
      action: "export",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      details: `Export du rapport caisse au format ${format.toUpperCase()}`,
      metadata: { format },
    });
  }

  if (format === "xlsx") {
    const buffer = await generateExcelBuffer(stats, transactions);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="judo-caisse-${dateStamp}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = generatePdfBuffer(stats, transactions);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="judo-caisse-${dateStamp}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Format invalide (pdf ou xlsx)" }, { status: 400 });
}
