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
  /** Images de référence jointes par l'utilisateur (data URI base64), tour "user" uniquement. */
  images?: string[];
}

export interface ClaudeChatCall {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

const IMAGE_DATA_URI = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/;

function toMessageParam(turn: ChatTurn): Anthropic.MessageParam {
  if (!turn.images?.length) return { role: turn.role, content: turn.content };
  const blocks: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [];
  for (const uri of turn.images) {
    const match = uri.match(IMAGE_DATA_URI);
    const mediaType = match?.[1];
    const data = match?.[2];
    if (!mediaType || !data) continue;
    blocks.push({
      type: "image",
      source: { type: "base64", media_type: mediaType as Anthropic.ImageBlockParam.Source["media_type"], data },
    });
  }
  blocks.push({ type: "text", text: turn.content });
  return { role: turn.role, content: blocks };
}

/** Complétion multi-tour (chat) — pour un agent qui garde le fil d'une conversation, pas un one-shot. */
export async function callClaudeChat(opts: ClaudeChatCall): Promise<string> {
  const message = await anthropic().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: opts.messages.map(toMessageParam),
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
