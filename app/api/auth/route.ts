import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSession,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }
  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ ok: false, error: "Mot de passe requis." }, { status: 400 });
  }
  try {
    if (!passwordMatches(password)) {
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
    }
    const token = await createSession();
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'authentification.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  cookies().set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
