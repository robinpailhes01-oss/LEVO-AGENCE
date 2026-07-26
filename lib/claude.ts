import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";

/** Modèle par défaut pour le raisonnement des agents. */
export const CLAUDE_MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (client) return client;
  client = new Anthropic({ apiKey: serverEnv.anthropicApiKey });
  return client;
}

export interface ClaudeCall {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/** Complétion simple. Renvoie le texte concaténé. Server-only. Throw si l'API échoue. */
export async function callClaude(opts: ClaudeCall): Promise<string> {
  const message = await anthropic().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Complétion qui attend un objet JSON. Nettoie les fences et parse. */
export async function callClaudeJson<T>(opts: ClaudeCall): Promise<T> {
  const raw = await callClaude({
    ...opts,
    system: `${opts.system}\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte autour ni bloc markdown.`,
  });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("La réponse du modèle n'est pas un JSON valide.");
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeChatCall {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/** Complétion multi-tour (chat) — pour un agent qui garde le fil d'une conversation, pas un one-shot. */
export async function callClaudeChat(opts: ClaudeChatCall): Promise<string> {
  const message = await anthropic().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
