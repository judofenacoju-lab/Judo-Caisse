import { NextRequest, NextResponse } from "next/server";
import { addAuditLog, updateUserPin } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { currentPin, newPin } = body as { currentPin?: string; newPin?: string };

  if (!currentPin || !newPin) {
    return NextResponse.json(
      { error: "PIN actuel et nouveau PIN requis" },
      { status: 400 }
    );
  }

  const result = await updateUserPin(session.userId, currentPin, newPin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await addAuditLog({
    action: "user_pin_change",
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    details: `${session.name} a modifié son propre code PIN`,
  });

  return NextResponse.json({ ok: true });
}
