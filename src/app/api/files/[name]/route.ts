import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getJustificationBytes, getMimeType } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { name } = await params;
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Fichier invalide" }, { status: 400 });
  }

  const file = await getJustificationBytes(name);
  if (!file) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType || getMimeType(name),
      "Content-Disposition": `inline; filename="${name}"`,
    },
  });
}
