import { serverEnv } from "@/lib/env";
import { sendTelegramMessage } from "@/lib/telegram";
import { getLatestCampaignStats } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Webhook Telegram — le bot "manager" répond à la demande (pas de cron).
 * Sécurité : Telegram supporte nativement un secret vérifié par header
 * (contrairement à Instantly/Resend) — posé via setWebhook côté Telegram,
 * vérifié ici. En plus, on n'accepte de commande QUE venant du chat_id de
 * Robin, même si le token venait à fuiter.
 */

function secretValid(req: Request): boolean {
  const header = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  let expected: string;
  try {
    expected = serverEnv.mcpSecret;
  } catch {
    return false;
  }
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function formatStats(stats: Awaited<ReturnType<typeof getLatestCampaignStats>>): string {
  if (!stats) return "Aucune campagne trouvée pour l'instant.";
  const channelLabel = stats.channel === "resend" ? "Resend" : "Instantly";
  return [
    `<b>${stats.campaignName}</b> (${channelLabel})`,
    `Envoyés : ${stats.sent}`,
    `Ouverts : ${stats.opened}`,
    `Cliqués : ${stats.clicked}`,
    `Répondus : ${stats.replied}`,
    `Bounces : ${stats.bounced}`,
  ].join("\n");
}

export async function POST(req: Request): Promise<Response> {
  if (!secretValid(req)) return new Response("Token invalide", { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }

  const message = body.message as { chat?: { id?: number | string }; text?: string } | undefined;
  const chatId = message?.chat?.id != null ? String(message.chat.id) : null;
  const expectedChatId = serverEnv.telegramChatId;

  if (!chatId || !expectedChatId || chatId !== expectedChatId) {
    // Pas Robin (ou bot mal configuré) — on ignore silencieusement, jamais de récap à un inconnu.
    return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
  }

  try {
    const stats = await getLatestCampaignStats();
    await sendTelegramMessage(formatStats(stats));
  } catch (err) {
    console.error("[webhook:telegram]", err);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
}
