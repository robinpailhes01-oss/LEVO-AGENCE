import "server-only";
import { serverEnv } from "@/lib/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Boîte à laquelle répondre si différente de `from` (ex: l'inbox Instantly qui a envoyé le cold email). */
  replyTo?: string;
}

/** Envoi simple via l'API Resend. Throw si non configuré ou si Resend répond en erreur — à catcher côté appelant pour rester best-effort. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = serverEnv.resendApiKey;
  const from = serverEnv.emailFrom;
  if (!apiKey || !from) throw new Error("Resend non configuré (RESEND_API_KEY / EMAIL_FROM manquants).");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}
