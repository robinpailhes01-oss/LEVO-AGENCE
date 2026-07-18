"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Save } from "lucide-react";

interface DraftProps {
  id: string;
  subjectLine: string;
  emailBody: string;
  confidenceScore: number | null;
  hook: string | null;
}

/** Carte de validation humaine d'un brouillon Hermes : édition libre + approuver/refuser. */
export function HermesDraftCard({ id, subjectLine, emailBody, confidenceScore, hook }: DraftProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(subjectLine);
  const [body, setBody] = useState(emailBody);
  const [state, setState] = useState<"idle" | "saving" | "approving" | "rejecting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = subject !== subjectLine || body !== emailBody;

  async function call(action: "approve" | "reject" | "edit") {
    setError(null);
    try {
      const res = await fetch(`/api/hermes/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, subject_line: subject, email_body: body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      if (action === "edit") {
        setState("idle");
        router.refresh();
      } else {
        setState("done");
        setTimeout(() => router.refresh(), 900);
      }
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Échec de l'action.");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
        <Check className="h-4 w-4" /> Traité.
      </p>
    );
  }

  const confidenceTone = (confidenceScore ?? 0) >= 60 ? "text-success" : (confidenceScore ?? 0) >= 35 ? "text-amber-600" : "text-danger";

  return (
    <div className="space-y-3">
      {hook && (
        <div className="rounded-xl bg-background px-3 py-2.5 text-[12px] text-muted">
          <p><span className="font-medium text-ink">Accroche :</span> {hook}</p>
          <p className={`mt-1 font-medium ${confidenceTone}`}>Confiance : {confidenceScore ?? 0}%</p>
        </div>
      )}

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Objet du mail"
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-medium outline-none focus:border-[#BA7517]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={9}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-[#BA7517]"
      />

      {error && <p className="text-[11.5px] font-medium text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {dirty && (
          <button
            onClick={() => { setState("saving"); call("edit"); }}
            disabled={state === "saving"}
            className="levo-pressable flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink disabled:opacity-50"
          >
            {state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        )}
        <button
          onClick={() => { setState("approving"); call("approve"); }}
          disabled={state !== "idle"}
          className="levo-pressable flex items-center gap-1.5 rounded-xl bg-[#BA7517] px-3 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-50"
        >
          {state === "approving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approuver
        </button>
        <button
          onClick={() => { setState("rejecting"); call("reject"); }}
          disabled={state !== "idle"}
          className="levo-pressable flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-muted disabled:opacity-50"
        >
          {state === "rejecting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Refuser
        </button>
      </div>
    </div>
  );
}
