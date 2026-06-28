"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CarouselCard, CONTENT_COLUMNS } from "./CarouselCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContentItem, ContentStatus } from "@/lib/types";

const ORDER: ContentStatus[] = CONTENT_COLUMNS.map((c) => c.key);

export function ContentKanban({ initial }: { initial: ContentItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();

  async function move(item: ContentItem, direction: -1 | 1) {
    const idx = ORDER.indexOf(item.status);
    const next = ORDER[idx + direction];
    if (!next) return;
    setBusyId(item.id);
    setError(null);
    // optimistic
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: next } : it)),
    );
    try {
      const res = await fetch("/api/luna/update-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentId: item.id, status: next }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
    } catch {
      // rollback
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: item.status } : it,
        ),
      );
      setError("Impossible de déplacer cette carte.");
    } finally {
      setBusyId(null);
    }
  }

  function generateIdeas() {
    setError(null);
    startGenerating(async () => {
      try {
        const res = await fetch("/api/luna/generate-ideas", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topic: topic.trim() || undefined, count: 4 }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          data?: ContentItem[];
          error?: string;
        };
        if (!res.ok || !data.ok || !data.data) {
          throw new Error(data.error ?? "Génération impossible");
        }
        setItems((prev) => [...data.data!, ...prev]);
        setTopic("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Génération impossible");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="levo-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Sparkles className="h-4 w-4 text-accent" />
          Générer des idées
        </div>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Thème (optionnel) — ex : automatisation pour artisans"
          className="flex-1"
          disabled={generating}
        />
        <Button onClick={generateIdeas} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Génération…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Générer 4 idées
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CONTENT_COLUMNS.map((col, colIdx) => {
          const colItems = items.filter((it) => it.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-ink">
                  {col.label}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                  {colItems.length}
                </span>
              </div>
              <div className="scroll-slim flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-background/60 p-2">
                {colItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted/70">—</p>
                ) : (
                  colItems.map((it) => (
                    <CarouselCard
                      key={it.id}
                      item={it}
                      onMove={move}
                      canMoveLeft={colIdx > 0}
                      canMoveRight={colIdx < CONTENT_COLUMNS.length - 1}
                      busy={busyId === it.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
