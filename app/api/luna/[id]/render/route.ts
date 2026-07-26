import { isAuthenticated } from "@/lib/auth-guard";
import { renderCarouselImages } from "@/lib/luna";

export const runtime = "nodejs";
// Génération image (gpt-image-1) plus lente qu'un simple appel texte — plusieurs
// slides en jeu, on laisse plus de marge que les autres routes (60s).
export const maxDuration = 120;

/** Génère les visuels de chaque slide via l'API image OpenAI. */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const { id } = await context.params;
  try {
    const { item, failed } = await renderCarouselImages(id);
    return new Response(JSON.stringify({ item, failed }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de génération d'images.";
    console.error("[luna:render]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
