import { isAuthenticated } from "@/lib/auth-guard";
import { generateCarousel } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Extrait le carrousel structuré (slides + prompts image) depuis la conversation en cours. */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const { id } = await context.params;
  try {
    const item = await generateCarousel(id);
    return new Response(JSON.stringify({ item }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de génération.";
    console.error("[luna:generate]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
