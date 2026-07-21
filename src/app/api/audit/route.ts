import { NextResponse } from "next/server";
import { canManageUsers, clearAuditLogs, getAuditLogs } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canManageUsers(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const logs = await getAuditLogs(300);
  return NextResponse.json({ logs });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canManageUsers(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await clearAuditLogs({
    id: session.userId,
    name: session.name,
    role: session.role,
  });

  const logs = await getAuditLogs(300);
  return NextResponse.json({ ok: true, logs });
}
