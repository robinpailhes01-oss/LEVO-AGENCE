import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, authEnabled } from "@/lib/auth";

/** True si la requête a une session valide (ou si l'auth n'est pas activée). */
export async function isAuthenticated(): Promise<boolean> {
  if (!authEnabled()) return true;
  const token = cookies().get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) !== null;
}
