import { isAuthenticated } from "@/lib/auth-guard";
import { regenerateSlideImage } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Régénère le visuel d'une seule slide. Body : { slide_index: number }. */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const { id } = await context.params;

  let body: { slide_index?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400 });
  }
  const slideIndex = body.slide_index;
  if (typeof slideIndex !== "number" || slideIndex < 0) {
    return new Response(JSON.stringify({ error: "slide_index requis" }), { status: 400 });
  }

  try {
    const item = await regenerateSlideImage(id, slideIndex);
    return new Response(JSON.stringify({ item }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de génération.";
    console.error("[luna:regenerate-slide]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
