"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check } from "lucide-react";

/** Envoi de la démo (Loom) directement depuis la carte d'audit sur l'accueil. */
export function AuditLoomAction({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const link = url.trim();
    if (!/^https?:\/\//i.test(link)) {
      setState("error");
      setError("Le lien doit commencer par https:// (ex: https://www.loom.com/share/…)");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/loom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loom_url: link }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        data = { error: raw.slice(0, 140) || `HTTP ${res.status}` };
      }
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setState("sent");
      // Le lead passe en "Loom envoyé" → il sort de la liste des audits à traiter.
      setTimeout(() => router.refresh(), 1200);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    }
  }

  if (state === "sent") {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-success">
        <Check className="h-4 w-4" /> Démo envoyée — lead passé en « Loom envoyé »
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Colle le lien Loom ici…"
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] outline-none focus:border-orion"
        />
        <button
          onClick={send}
          disabled={state === "sending" || !url.trim()}
          className="levo-pressable flex shrink-0 items-center gap-1.5 rounded-xl bg-orion px-3 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
        >
          {state === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Envoyer
        </button>
      </div>
      {error && (
        <p className="mt-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-[11.5px] font-medium text-danger">{error}</p>
      )}
      <p className="mt-1.5 text-[10.5px] text-muted/70">
        Le prospect reçoit un mail avec le lien + ta signature. Réponse dirigée vers ta boîte.
      </p>
    </div>
  );
}
