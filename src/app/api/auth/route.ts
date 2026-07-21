import { NextRequest, NextResponse } from "next/server";
import {
  addAuditLog,
  authenticateAdmin,
  authenticateUser,
  getFreshSession,
  type StaffRole,
} from "@/lib/db";
import {
  getSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieValue,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { role, pin } = body as { role?: StaffRole | null; pin?: string };

  if (!pin) {
    return NextResponse.json({ error: "Code PIN requis" }, { status: 400 });
  }

  const user = !role
    ? await authenticateAdmin(pin)
    : await authenticateUser(role, pin);

  if (!user) {
    return NextResponse.json({ error: "Code PIN incorrect" }, { status: 401 });
  }

  const session = { userId: user.id, name: user.name, role: user.role };

  await addAuditLog({
    action: "login",
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    details: `Connexion de ${user.name} (${user.role})`,
  });

  const response = NextResponse.json({ user: session });
  response.cookies.set(SESSION_COOKIE, sessionCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const fresh = await getFreshSession(session);
  if (!fresh) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }
  return NextResponse.json({ user: fresh });
}
