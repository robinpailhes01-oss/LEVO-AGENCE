import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Marque une réponse comme lue / non lue depuis l'inbox du dashboard. */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) return new Response("Non autorisé", { status: 401 });

  const { id } = await context.params;
  let body: { is_read?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  const isRead = body.is_read ?? true;

  const { error } = await supabaseAdmin().from("replies").update({ is_read: isRead }).eq("id", id);
  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
