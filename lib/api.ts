import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: number): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Wrap an async route handler so any thrown error becomes a clean 500 JSON
 * response instead of an unhandled rejection.
 */
export async function withHandler(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur interne inattendue.";
    console.error("[route error]", err);
    return jsonError(message, 500);
  }
}
