import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeChat, callClaudeJson, type ChatTurn } from "@/lib/claude";
import { generateSlideImage } from "@/lib/openai";
import { lunaSystemPrompt, lunaGeneratePrompt, type LunaCarouselResult } from "@/prompts/luna";
import type { ContentItem } from "@/lib/db";

async function getLearnings(): Promise<string | null> {
  const { data } = await supabaseAdmin().from("settings").select("value").eq("key", "luna_learnings").maybeSingle();
  const value = (data as { value: unknown } | null)?.value;
  return typeof value === "string" ? value : null;
}

/** Un tour de chat avec LUNA. Crée le post (statut "idea") au premier message si contentId est absent. */
export async function chatWithLuna(contentId: string | null, message: string): Promise<{ contentId: string; reply: string }> {
  const db = supabaseAdmin();

  let row: ContentItem;
  if (contentId) {
    const { data } = await db.from("content_calendar").select("*").eq("id", contentId).maybeSingle();
    if (!data) throw new Error("Post introuvable.");
    row = data as ContentItem;
  } else {
    const { data, error } = await db
      .from("content_calendar")
      .insert({ title: message.slice(0, 80), status: "idea", created_by: "LUNA" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    row = data as ContentItem;
  }

  const history = (Array.isArray(row.chat_history) ? row.chat_history : []) as ChatTurn[];

  const learnings = await getLearnings();
  const messages: ChatTurn[] = [...history, { role: "user", content: message }];

  const reply = await callClaudeChat({
    system: lunaSystemPrompt(learnings),
    messages,
    maxTokens: 1000,
    temperature: 0.8,
  });

  const updatedHistory: ChatTurn[] = [...messages, { role: "assistant", content: reply }];
  await db.from("content_calendar").update({ chat_history: updatedHistory }).eq("id", row.id);

  return { contentId: row.id, reply };
}

/** Extrait le carrousel structuré (slides + prompts image) depuis la conversation. Statut -> "drafted". */
export async function generateCarousel(contentId: string): Promise<ContentItem> {
  const db = supabaseAdmin();
  const { data } = await db.from("content_calendar").select("*").eq("id", contentId).maybeSingle();
  if (!data) throw new Error("Post introuvable.");
  const row = data as ContentItem;
  const history = (Array.isArray(row.chat_history) ? row.chat_history : []) as ChatTurn[];
  if (history.length === 0) throw new Error("Aucune conversation à générer — brief LUNA d'abord.");

  const learnings = await getLearnings();
  const result = await callClaudeJson<LunaCarouselResult>({
    system: lunaSystemPrompt(learnings),
    prompt: lunaGeneratePrompt(history),
    maxTokens: 4000,
    temperature: 0.6,
  });

  const { data: updated, error } = await db
    .from("content_calendar")
    .update({
      title: result.sujet,
      theme: result.theme,
      hook_slide1: result.slides[0]?.titre ?? null,
      slides_content: result.slides,
      image_prompts: result.slides.map((s) => s.prompt_image),
      caption: result.caption,
      hashtags: result.hashtags,
      status: "drafted",
    })
    .eq("id", contentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return updated as ContentItem;
}

/** Génère les visuels de chaque slide (gpt-image-1). Best-effort : garde les réussites même si une échoue. */
export async function renderCarouselImages(contentId: string): Promise<{ item: ContentItem; failed: number[] }> {
  const db = supabaseAdmin();
  const { data } = await db.from("content_calendar").select("*").eq("id", contentId).maybeSingle();
  if (!data) throw new Error("Post introuvable.");
  const row = data as ContentItem;
  const prompts = Array.isArray(row.image_prompts) ? (row.image_prompts as string[]) : [];
  if (prompts.length === 0) throw new Error("Aucun prompt image — génère d'abord le carrousel.");

  await db.from("content_calendar").update({ status: "generating" }).eq("id", contentId);

  const images: (string | null)[] = new Array(prompts.length).fill(null);
  const failed: number[] = [];
  const CONCURRENCY = 3;
  for (let i = 0; i < prompts.length; i += CONCURRENCY) {
    const batch = prompts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((p) => generateSlideImage(p)));
    results.forEach((r, j) => {
      const idx = i + j;
      if (r.status === "fulfilled") images[idx] = r.value;
      else failed.push(idx);
    });
  }

  const { data: updated, error } = await db
    .from("content_calendar")
    .update({ generated_images: images, status: failed.length === prompts.length ? "drafted" : "ready" })
    .eq("id", contentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { item: updated as ContentItem, failed };
}

/** Régénère une seule slide (retouche sans tout relancer). */
export async function regenerateSlideImage(contentId: string, slideIndex: number): Promise<ContentItem> {
  const db = supabaseAdmin();
  const { data } = await db.from("content_calendar").select("*").eq("id", contentId).maybeSingle();
  if (!data) throw new Error("Post introuvable.");
  const row = data as ContentItem;
  const prompts = Array.isArray(row.image_prompts) ? (row.image_prompts as string[]) : [];
  const prompt = prompts[slideIndex];
  if (!prompt) throw new Error("Slide introuvable.");

  const image = await generateSlideImage(prompt);
  const images = Array.isArray(row.generated_images) ? [...row.generated_images] : new Array(prompts.length).fill(null);
  images[slideIndex] = image;

  const { data: updated, error } = await db
    .from("content_calendar")
    .update({ generated_images: images })
    .eq("id", contentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return updated as ContentItem;
}

/** Ajoute un retour de Robin aux apprentissages de LUNA (injectés dans le prompt des prochaines générations). */
export async function addLunaLearning(note: string): Promise<void> {
  const db = supabaseAdmin();
  const current = (await getLearnings()) ?? "";
  const updated = current ? `${current}\n- ${note.trim()}` : `- ${note.trim()}`;
  await db.from("settings").update({ value: updated, updated_at: new Date().toISOString() }).eq("key", "luna_learnings");
}
