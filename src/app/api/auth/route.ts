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
import {
  canAccessWorkspace,
  defaultWorkspaceForRole,
  isWorkspace,
  type Workspace,
} from "@/lib/workspace";

function setSessionCookie(response: NextResponse, session: {
  userId: number;
  name: string;
  role: "financiere" | "coordon" | "admin";
  workspace: Workspace | null;
}) {
  response.cookies.set(SESSION_COOKIE, sessionCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  try {
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

    const session = {
      userId: user.id,
      name: user.name,
      role: user.role,
      workspace: defaultWorkspaceForRole(user.role),
    };

    await addAuditLog({
      action: "login",
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      details: `Connexion de ${user.name} (${user.role})`,
      workspace: session.workspace,
    });

    const response = NextResponse.json({ user: session });
    setSessionCookie(response, session);
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur serveur lors de la connexion";
    console.error("[auth/POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const current = await getSession();
  if (!current) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const { workspace, clearWorkspace } = body as {
    workspace?: Workspace;
    clearWorkspace?: boolean;
  };

  const freshUser = await getFreshSession({
    ...current,
    workspace: null,
  });
  if (!freshUser) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  if (clearWorkspace) {
    if (freshUser.role === "coordon") {
      return NextResponse.json(
        { error: "Le Coordon utilise uniquement Judo-Vacances" },
        { status: 403 }
      );
    }
    const session = { ...freshUser, workspace: null };
    const response = NextResponse.json({ user: session });
    setSessionCookie(response, session);
    return response;
  }

  if (!isWorkspace(workspace)) {
    return NextResponse.json(
      { error: "Tableau de bord invalide" },
      { status: 400 }
    );
  }

  if (!canAccessWorkspace(freshUser.role, workspace)) {
    return NextResponse.json(
      { error: "Accès refusé à ce tableau de bord" },
      { status: 403 }
    );
  }

  const session = { ...freshUser, workspace };
  await addAuditLog({
    action: "login",
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    details: `Ouverture du tableau de bord ${workspace}`,
    workspace,
  });

  const response = NextResponse.json({ user: session });
  setSessionCookie(response, session);
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
