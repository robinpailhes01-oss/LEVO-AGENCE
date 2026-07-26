"use client";

import { useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

/** Widget de chat générique — parle à n'importe quel agent Hermès via /api/chat/[agent]. */
export function AgentChatWidget({
  agent,
  accent,
  placeholder = "Écris à l'agent…",
}: {
  agent: string;
  accent: string;
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/${agent}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      setMessages((m) => [...m, { role: "agent", text: data.reply ?? "(réponse vide)" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="levo-card flex h-[520px] flex-col overflow-hidden p-0">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted">
            Écris ton brief à {agent.charAt(0).toUpperCase() + agent.slice(1)} pour commencer.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user" ? "text-white" : "bg-background text-ink"
                }`}
                style={m.role === "user" ? { backgroundColor: accent } : undefined}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-background px-3.5 py-2.5 text-[12.5px] text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> réponse en cours…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="border-t border-line/60 px-4 py-2 text-[11.5px] font-medium text-danger">{error}</p>}

      <div className="flex items-end gap-2 border-t border-line/60 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-current"
          style={{ color: undefined }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="levo-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
