import { cookies } from "next/headers";
import type { Session } from "./db";

export const SESSION_COOKIE = "judo_caisse_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function sessionCookieValue(session: Session): string {
  return JSON.stringify(session);
}
