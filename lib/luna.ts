import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaudeChat, callClaudeJson, type ChatTurn } from "@/lib/claude";
import { renderSlideToPng, type LunaSlide } from "@/lib/luna-render";
import { lunaSystemPrompt, lunaGeneratePrompt, type LunaCarouselResult } from "@/prompts/luna";
import type { ContentItem, LunaReference } from "@/lib/db";

const REFERENCE_LIMIT = 6;

async function getLearnings(): Promise<string | null> {
  const { data } = await supabaseAdmin().from("settings").select("value").eq("key", "luna_learnings").maybeSingle();
  const value = (data as { value: unknown } | null)?.value;
  return typeof value === "string" ? value : null;
}

/** Texte des apprentissages actuels — pour affichage dans l'UI mémoire. */
export async function getLearningsText(): Promise<string> {
  return (await getLearnings()) ?? "";
}

/** Bibliothèque de références visuelles permanentes, les plus récentes d'abord. */
export async function listReferences(): Promise<LunaReference[]> {
  const { data, error } = await supabaseAdmin()
    .from("luna_references")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LunaReference[];
}

/** Ajoute une référence visuelle permanente (image + pourquoi elle compte). */
export async function addReference(note: string, imageData: string): Promise<LunaReference> {
  const { data, error } = await supabaseAdmin()
    .from("luna_references")
    .insert({ note: note.trim(), image_data: imageData })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as LunaReference;
}

export async function deleteReference(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("luna_references").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Contexte à injecter au premier message d'une NOUVELLE conversation : les
 * références visuelles les plus récentes de la bibliothèque, sous forme de
 * texte + images à fusionner dans le premier tour utilisateur (l'API Claude
 * exige des rôles alternés — impossible d'insérer un tour "user" séparé
 * avant le vrai message).
 */
async function buildReferencePrefix(): Promise<{ text: string; images: string[] }> {
  const refs = (await listReferences()).slice(0, REFERENCE_LIMIT);
  if (refs.length === 0) return { text: "", images: [] };
  const text = `[Mémoire LUNA — références visuelles permanentes à garder en tête]\n${refs
    .map((r) => `- ${r.note}`)
    .join("\n")}\n\n`;
  return { text, images: refs.map((r) => r.image_data) };
}

/** Un tour de chat avec LUNA. Crée le post (statut "idea") au premier message si contentId est absent. */
export async function chatWithLuna(
  contentId: string | null,
  message: string,
  images?: string[],
): Promise<{ contentId: string; reply: string }> {
  const db = supabaseAdmin();
  const isNewConversation = !contentId;

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

  // Le tour réellement persisté/affiché reste celui que Robin a écrit — la
  // bibliothèque de références n'est injectée que dans l'appel API du
  // premier message (pas de rôle "user" séparé possible, l'API exige des
  // rôles alternés), pour ne pas polluer l'historique visible ni le
  // re-envoyer à chaque tour suivant.
  const userTurn: ChatTurn = { role: "user", content: message, ...(images?.length ? { images } : {}) };
  const prefix = isNewConversation ? await buildReferencePrefix() : { text: "", images: [] };
  const apiUserTurn: ChatTurn = prefix.text
    ? { role: "user", content: `${prefix.text}${message}`, images: [...prefix.images, ...(images ?? [])] }
    : userTurn;

  const learnings = await getLearnings();
  const reply = await callClaudeChat({
    system: lunaSystemPrompt(learnings),
    messages: [...history, apiUserTurn],
    maxTokens: 1000,
    temperature: 0.8,
  });

  const updatedHistory: ChatTurn[] = [...history, userTurn, { role: "assistant", content: reply }];
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
      image_prompts: null,
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

/** Rend les visuels de chaque slide (satori/resvg, rendu texte déterministe). Best-effort : garde les réussites même si une échoue. */
export async function renderCarouselImages(contentId: string): Promise<{ item: ContentItem; failed: number[] }> {
  const db = supabaseAdmin();
  const { data } = await db.from("content_calendar").select("*").eq("id", contentId).maybeSingle();
  if (!data) throw new Error("Post introuvable.");
  const row = data as ContentItem;
  const slides = Array.isArray(row.slides_content) ? (row.slides_content as LunaSlide[]) : [];
  if (slides.length === 0) throw new Error("Aucun carrousel à rendre — génère d'abord le carrousel.");

  await db.from("content_calendar").update({ status: "generating" }).eq("id", contentId);

  const images: (string | null)[] = new Array(slides.length).fill(null);
  const failed: number[] = [];
  for (let i = 0; i < slides.length; i++) {
    try {
      images[i] = await renderSlideToPng(slides[i]!, i, slides.length);
    } catch (err) {
      console.error("[luna:render-slide]", i, err);
      failed.push(i);
    }
  }

  const { data: updated, error } = await db
    .from("content_calendar")
    .update({ generated_images: images, status: failed.length === slides.length ? "drafted" : "ready" })
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
  const slides = Array.isArray(row.slides_content) ? (row.slides_content as LunaSlide[]) : [];
  const slide = slides[slideIndex];
  if (!slide) throw new Error("Slide introuvable.");

  const image = await renderSlideToPng(slide, slideIndex, slides.length);
  const images = Array.isArray(row.generated_images) ? [...row.generated_images] : new Array(slides.length).fill(null);
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

/** Supprime un brief/carrousel (conversation + slides + images générées). */
export async function deleteContent(contentId: string): Promise<void> {
  const { error } = await supabaseAdmin().from("content_calendar").delete().eq("id", contentId);
  if (error) throw new Error(error.message);
}
