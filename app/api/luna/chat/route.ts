import { isAuthenticated } from "@/lib/auth-guard";
import { chatWithLuna } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Un tour de chat avec LUNA. Body : { content_id?: string, message: string }. */
export async function POST(req: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { content_id?: string; message?: string; images?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400 });
  }
  const message = (body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message requis" }), { status: 400 });
  }
  const images = Array.isArray(body.images) ? body.images.filter((i) => typeof i === "string").slice(0, 4) : undefined;

  try {
    const result = await chatWithLuna(body.content_id ?? null, message, images);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Erreur LUNA.";
    console.error("[luna:chat]", err);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
