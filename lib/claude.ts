import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";

/** Default model for agent reasoning. */
export const CLAUDE_MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

function anthropic(): Anthropic {
  if (client) return client;
  client = new Anthropic({ apiKey: serverEnv.anthropicApiKey });
  return client;
}

export interface ClaudeCallOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Single-turn completion. Returns the concatenated text output.
 * Always server-side. Throws on API failure (callers handle it).
 */
export async function callClaude(opts: ClaudeCallOptions): Promise<string> {
  const message = await anthropic().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/**
 * Completion that expects a JSON object back. Strips code fences and parses.
 * Throws a descriptive error if the model output is not valid JSON.
 */
export async function callClaudeJson<T>(opts: ClaudeCallOptions): Promise<T> {
  const raw = await callClaude({
    ...opts,
    system: `${opts.system}\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans bloc de code markdown.`,
  });

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Best-effort: extract the first {...} block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("La réponse du modèle n'est pas un JSON valide.");
  }
}
