"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2, RefreshCw } from "lucide-react";
import type { ContentItem } from "@/lib/db";

interface LunaSlide {
  titre: string;
  corps: string;
  prompt_image: string;
}

const THEME_LABEL: Record<string, string> = {
  cas_client: "Cas client",
  hook_probleme: "Hook problème",
  educatif: "Éducatif",
  solution: "Solution",
  methode: "Méthode",
};

/** Aperçu + génération du carrousel (texte puis visuels) une fois le brief LUNA prêt. */
export function CarouselPreview({ item }: { item: ContentItem | null }) {
  const router = useRouter();
  const [rendering, setRendering] = useState(false);
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!item || !Array.isArray(item.slides_content) || item.slides_content.length === 0) return null;

  const slides = item.slides_content as LunaSlide[];
  const images = Array.isArray(item.generated_images) ? item.generated_images : [];

  async function renderImages() {
    if (rendering) return;
    setRendering(true);
    setError(null);
    try {
      const res = await fetch(`/api/luna/${item!.id}/render`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la génération des visuels.");
    } finally {
      setRendering(false);
    }
  }

  async function regenerateSlide(index: number) {
    if (regenerating !== null) return;
    setRegenerating(index);
    setError(null);
    try {
      const res = await fetch(`/api/luna/${item!.id}/regenerate-slide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slide_index: index }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la régénération.");
    } finally {
      setRegenerating(null);
    }
  }

  return (
    <div className="levo-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center rounded-full bg-luna/[0.08] px-2 py-0.5 text-[10px] font-medium text-luna">
            {item.theme ? THEME_LABEL[item.theme] ?? item.theme : "Carrousel"}
          </span>
          <p className="mt-1.5 text-[15px] font-semibold text-ink">{item.title}</p>
        </div>
        {item.status === "drafted" && (
          <button
            onClick={renderImages}
            disabled={rendering}
            className="levo-pressable flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#1A3BFF" }}
          >
            {rendering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Générer les visuels
          </button>
        )}
        {item.status === "generating" && (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Génération en cours…
          </span>
        )}
      </div>

      {error && <p className="text-[11.5px] font-medium text-danger">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line/60 bg-background">
            {images[i] ? (
              <img src={images[i]} alt={slide.titre} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-black/[0.03] px-4 text-center text-[11px] text-muted/70">
                {item.status === "generating" ? "…" : "Pas encore généré"}
              </div>
            )}
            <div className="space-y-1.5 p-3">
              <p className="text-[12.5px] font-medium leading-snug text-ink">{slide.titre}</p>
              <p className="text-[11.5px] leading-relaxed text-muted">{slide.corps}</p>
              {images[i] && (
                <button
                  onClick={() => regenerateSlide(i)}
                  disabled={regenerating !== null}
                  className="levo-pressable flex items-center gap-1 pt-1 text-[11px] font-medium text-muted hover:text-ink disabled:opacity-50"
                >
                  {regenerating === i ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Régénérer cette slide
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {item.caption && (
        <div className="rounded-xl bg-background px-3.5 py-3 text-[12.5px] leading-relaxed text-ink">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Légende</p>
          <p className="whitespace-pre-wrap">{item.caption}</p>
          {Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
            <p className="mt-1.5 text-muted">{item.hashtags.join(" ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
