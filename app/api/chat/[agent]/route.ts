import { isAuthenticated } from "@/lib/auth-guard";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Proxy vers le micro-serveur Hermes du VPS de Robin (un agent = un chemin
 * /chat/<agent> côté VPS). Une seule route dynamique plutôt que 4 copiées-
 * collées — ajouter un agent = l'ajouter à AGENTS, rien d'autre.
 *
 * Protégée par la session dashboard (sinon n'importe qui trouvant l'URL
 * publique pourrait envoyer des messages illimités vers le VPS de Robin,
 * en dépensant sa clé Hermes/ses ressources).
 */
const AGENTS = new Set(["luna", "mila", "alex", "hermes"]);

export async function POST(req: Request, context: { params: Promise<{ agent: string }> }): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { agent } = await context.params;
  if (!AGENTS.has(agent)) {
    return new Response(JSON.stringify({ error: `Agent inconnu : ${agent}` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const message = (body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message requis" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const res = await fetch(`${serverEnv.hermesApiUrl}/chat/${agent}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${serverEnv.hermesApiToken}`,
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Hermes (${agent}) a répondu ${res.status} : ${text.slice(0, 300)}` }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    // On relaie tel quel (le VPS répond déjà en JSON) — pas de reparsing fragile.
    return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur réseau.";
    console.error(`[chat:${agent}]`, err);
    return new Response(JSON.stringify({ error: `Impossible de joindre l'agent ${agent} : ${message}` }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
