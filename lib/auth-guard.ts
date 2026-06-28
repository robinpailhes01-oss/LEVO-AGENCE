import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/** True when the current request carries a valid dashboard session cookie. */
export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  return session !== null;
}
