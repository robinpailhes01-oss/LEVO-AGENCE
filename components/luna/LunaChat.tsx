"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, PenSquare } from "lucide-react";
import type { ContentItem } from "@/lib/db";
import { CarouselPreview } from "@/components/luna/CarouselPreview";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "luna_active_content_id";

function readHistory(item: ContentItem | undefined): ChatMessage[] {
  if (!item || !Array.isArray(item.chat_history)) return [];
  return item.chat_history as ChatMessage[];
}

/** Chat LUNA — brief conversationnel persisté en base, puis génération du carrousel. */
export function LunaChat({ content }: { content: ContentItem[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    setError(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content_id: activeId, message: text }),
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
              Brief LUNA : client, sujet, chiffres, angle... Elle pose des questions si besoin.
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

        <div className="flex items-end gap-2 border-t border-line/60 p-3">
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
            disabled={sending || !input.trim()}
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
