import "server-only";
import { serverEnv } from "@/lib/env";

/** Envoie un message via le bot Telegram "manager". Fetch brut, pas de SDK (même style que lib/resend.ts). */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = serverEnv.telegramBotToken;
  const chatId = serverEnv.telegramChatId;
  if (!token || !chatId) throw new Error("Telegram non configuré (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID manquants).");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    throw new Error(`Telegram ${res.status}: ${await res.text()}`);
  }
}
