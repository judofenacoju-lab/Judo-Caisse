import { cookies } from "next/headers";
import type { Session } from "./db";
import type { Workspace } from "./workspace";
import { canAccessWorkspace, isWorkspace } from "./workspace";

export const SESSION_COOKIE = "judo_caisse_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.userId || !parsed?.role) return null;
    const workspace =
      parsed.workspace && isWorkspace(parsed.workspace)
        ? parsed.workspace
        : null;
    return {
      userId: parsed.userId,
      name: parsed.name,
      role: parsed.role,
      workspace,
    };
  } catch {
    return null;
  }
}

export function sessionCookieValue(session: Session): string {
  return JSON.stringify(session);
}

export function sessionHasWorkspace(
  session: Session
): session is Session & { workspace: Workspace } {
  return (
    !!session.workspace &&
    isWorkspace(session.workspace) &&
    canAccessWorkspace(session.role, session.workspace)
  );
}
