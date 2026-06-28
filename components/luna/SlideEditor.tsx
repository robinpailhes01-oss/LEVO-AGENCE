"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ContentSlide } from "@/lib/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié" : "Copier le prompt"}
    </button>
  );
}

export function SlideEditor({
  contentId,
  slide,
  index,
}: {
  contentId: string;
  slide: ContentSlide;
  index: number;
}) {
  const [current, setCurrent] = useState(slide);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (!feedback.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/regenerate-slide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contentId,
          slideId: current.id,
          feedback: feedback.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        data?: ContentSlide;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.data) {
        throw new Error(data.error ?? "Régénération impossible");
      }
      setCurrent(data.data);
      setFeedback("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Régénération impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="levo-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-accent">
          Slide {index + 1}
        </span>
        {current.image_prompt && <CopyButton text={current.image_prompt} />}
      </div>

      <h4 className="mt-2 font-display text-lg font-semibold text-ink">
        {current.headline || "—"}
      </h4>
      <p className="mt-1 text-sm text-ink/80">{current.body || "—"}</p>

      {current.image_prompt && (
        <div className="mt-3 rounded-xl bg-background px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Prompt image (ChatGPT Image 2)
          </p>
          <p className="mt-1 text-xs text-ink/70">{current.image_prompt}</p>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Retour ciblé sur cette slide (ex : hook plus percutant)…"
          rows={2}
          disabled={loading}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button
          size="sm"
          variant="secondary"
          onClick={regenerate}
          disabled={loading || !feedback.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Régénération…
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" /> Régénérer cette slide
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
