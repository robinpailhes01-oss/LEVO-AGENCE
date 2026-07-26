import { isAuthenticated } from "@/lib/auth-guard";
import { addLunaLearning } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Ajoute une note de Robin aux apprentissages de LUNA. Body : { note: string }. */
export async function POST(req: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400 });
  }
  const note = (body.note ?? "").trim();
  if (!note) {
    return new Response(JSON.stringify({ error: "note requise" }), { status: 400 });
  }

  try {
    await addLunaLearning(note);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'enregistrement.";
    console.error("[luna:learnings]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
