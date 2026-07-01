import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, authEnabled } from "@/lib/auth";

/**
 * Protège /dashboard/*.
 * - Si AUTH_SECRET n'est pas configuré → on laisse passer (mode démo public).
 * - Sinon → session valide requise, sinon redirection vers /login.
 * Exécuté sur l'Edge. Les routes API / login sont exclues via le matcher.
 */
export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
