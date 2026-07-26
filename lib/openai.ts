import "server-only";
import { serverEnv } from "@/lib/env";

/** Client image OpenAI (gpt-image-1) — fetch brut, pas de SDK (même style que lib/resend.ts/lib/outscraper.ts). */

const IMAGES_URL = "https://api.openai.com/v1/images/generations";

/** Génère une slide de carrousel à partir d'un prompt détaillé. Renvoie une data URI PNG base64. */
export async function generateSlideImage(prompt: string): Promise<string> {
  const apiKey = serverEnv.openaiApiKey;
  const res = await fetch(IMAGES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
    }),
  });
  const body = (await res.json()) as { data?: { b64_json?: string }[]; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`OpenAI images ${res.status} : ${body.error?.message ?? JSON.stringify(body)}`);
  }
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI n'a renvoyé aucune image.");
  return `data:image/png;base64,${b64}`;
}
