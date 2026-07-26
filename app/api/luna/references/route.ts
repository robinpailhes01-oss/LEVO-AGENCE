import { isAuthenticated } from "@/lib/auth-guard";
import { addReference, listReferences } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const references = await listReferences();
    return new Response(JSON.stringify({ references }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de lecture.";
    console.error("[luna:references:get]", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

/** Ajoute une référence visuelle permanente. Body : { note: string, image: string (data URI) }. */
export async function POST(req: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { note?: string; image?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400 });
  }
  const note = (body.note ?? "").trim();
  const image = body.image ?? "";
  if (!note) return new Response(JSON.stringify({ error: "note requise" }), { status: 400 });
  if (!image.startsWith("data:image/")) {
    return new Response(JSON.stringify({ error: "image requise" }), { status: 400 });
  }

  try {
    const reference = await addReference(note, image);
    return new Response(JSON.stringify({ reference }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur d'enregistrement.";
    console.error("[luna:references:post]", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
