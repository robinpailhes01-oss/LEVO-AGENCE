"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, PenSquare, Paperclip, X } from "lucide-react";
import type { ContentItem } from "@/lib/db";
import { CarouselPreview } from "@/components/luna/CarouselPreview";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface Attachment {
  name: string;
  dataUri: string;
}

const STORAGE_KEY = "luna_active_content_id";
const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function readHistory(item: ContentItem | undefined): ChatMessage[] {
  if (!item || !Array.isArray(item.chat_history)) return [];
  return item.chat_history as ChatMessage[];
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

/** Chat LUNA — brief conversationnel persisté en base (texte + images de référence), puis génération du carrousel. */
export function LunaChat({ content }: { content: ContentItem[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeItem = activeId ? content.find((c) => c.id === activeId) : undefined;

  // Hydratation initiale depuis localStorage + historique persisté en base.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setActiveId(stored);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (activeId && !content.find((c) => c.id === activeId)) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveId(null);
      setMessages([]);
      return;
    }
    setMessages(readHistory(activeItem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeId, activeItem?.chat_history]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, sending]);

  function startNew() {
    localStorage.removeItem(STORAGE_KEY);
    setActiveId(null);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setError(null);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_IMAGES - attachments.length;
    if (room <= 0) {
      setError(`Maximum ${MAX_IMAGES} images par message.`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    const oversized = picked.find((f) => f.size > MAX_FILE_BYTES);
    if (oversized) {
      setError(`${oversized.name} dépasse 8 Mo — compresse-la avant de la joindre.`);
      return;
    }
    try {
      const encoded = await Promise.all(picked.map(async (f) => ({ name: f.name, dataUri: await readFileAsDataUri(f) })));
      setAttachments((a) => [...a, ...encoded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la lecture d'image.");
    }
  }

  function removeAttachment(index: number) {
    setAttachments((a) => a.filter((_, i) => i !== index));
  }

  async function send() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;
    const images = attachments.map((a) => a.dataUri);
    setMessages((m) => [...m, { role: "user", content: text, ...(images.length ? { images } : {}) }]);
    setInput("");
    setAttachments([]);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content_id: activeId, message: text || "(voir images jointes)", images }),
      });
      const data = (await res.json()) as { contentId?: string; reply?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      if (data.contentId && data.contentId !== activeId) {
        setActiveId(data.contentId);
        localStorage.setItem(STORAGE_KEY, data.contentId);
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  async function generateCarousel() {
    if (!activeId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/luna/${activeId}/generate`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la génération.");
    } finally {
      setGenerating(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canGenerate = activeId && !activeItem?.slides_content && userTurns >= 1;

  return (
    <div className="space-y-4">
      <div className="levo-card flex h-[520px] flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5">
          <span className="text-[12.5px] font-medium text-muted">
            {activeItem ? activeItem.title : "Nouveau brief"}
          </span>
          <button
            onClick={startNew}
            className="levo-pressable flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11.5px] font-medium text-muted hover:text-ink"
          >
            <PenSquare className="h-3.5 w-3.5" /> Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted">
              Brief LUNA : client, sujet, chiffres, angle... Joins des images de référence si besoin
              (moodboard, exemple à suivre ou concurrent). Elle pose des questions si besoin.
            </p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "user" ? "text-white" : "bg-background text-ink"
                  }`}
                  style={m.role === "user" ? { backgroundColor: "#1A3BFF" } : undefined}
                >
                  {m.images && m.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.images.map((src, j) => (
                        <img key={j} src={src} alt="Référence jointe" className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-background px-3.5 py-2.5 text-[12.5px] text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> LUNA réfléchit…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="border-t border-line/60 px-4 py-2 text-[11.5px] font-medium text-danger">{error}</p>}

        {canGenerate && (
          <div className="border-t border-line/60 px-4 py-2.5">
            <button
              onClick={generateCarousel}
              disabled={generating}
              className="levo-pressable flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#1A3BFF" }}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer le carrousel
            </button>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-line/60 px-3 pt-3">
            {attachments.map((a, i) => (
              <div key={i} className="relative">
                <img src={a.dataUri} alt={a.name} className="h-14 w-14 rounded-lg object-cover" />
                <button
                  onClick={() => removeAttachment(i)}
                  className="levo-pressable absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white"
                  aria-label="Retirer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 border-t border-line/60 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= MAX_IMAGES}
            className="levo-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-muted disabled:opacity-40"
            aria-label="Joindre une image"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Brief LUNA (client, sujet, chiffres...)"
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-current"
          />
          <button
            onClick={send}
            disabled={sending || (!input.trim() && attachments.length === 0)}
            className="levo-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
            style={{ backgroundColor: "#1A3BFF" }}
            aria-label="Envoyer"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <CarouselPreview item={activeItem ?? null} />
    </div>
  );
}
