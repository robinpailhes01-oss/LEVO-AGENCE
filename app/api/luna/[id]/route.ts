import { isAuthenticated } from "@/lib/auth-guard";
import { deleteContent } from "@/lib/luna";

export const runtime = "nodejs";
export const maxDuration = 15;

/** Supprime un brief/carrousel LUNA. */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const { id } = await context.params;
  try {
    await deleteContent(id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de suppression.";
    console.error("[luna:delete]", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
