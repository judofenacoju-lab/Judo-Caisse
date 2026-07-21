import { NextRequest, NextResponse } from "next/server";
import {
  addAuditLog,
  adminResetUserPin,
  adminUpdateUserName,
  canManageUsers,
  getStaffUsers,
} from "@/lib/db";
import { getSession } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!canManageUsers(session.role)) return forbidden();

  const users = await getStaffUsers();
  return NextResponse.json({ users });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!canManageUsers(session.role)) return forbidden();

  const body = await request.json();
  const { userId, name, newPin } = body as {
    userId?: number;
    name?: string;
    newPin?: string;
  };

  if (!userId) {
    return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 });
  }

  if (name !== undefined) {
    const users = await getStaffUsers();
    const before = users.find((u) => u.id === userId);
    const result = await adminUpdateUserName(userId, name);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await addAuditLog({
      action: "user_name_update",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      details: `Modification du nom : « ${before?.name ?? "?"} » → « ${result.user.name} » (${result.user.role})`,
      metadata: { targetUserId: userId },
    });
    return NextResponse.json({ user: result.user });
  }

  if (newPin !== undefined) {
    const users = await getStaffUsers();
    const target = users.find((u) => u.id === userId);
    const result = await adminResetUserPin(userId, newPin);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await addAuditLog({
      action: "user_pin_reset",
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      details: `Réinitialisation du PIN de « ${target?.name ?? `#${userId}`} » (${target?.role ?? "?"})`,
      metadata: { targetUserId: userId },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nom ou nouveau PIN requis" }, { status: 400 });
}
