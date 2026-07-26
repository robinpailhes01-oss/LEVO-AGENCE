"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Images, Loader2, Trash2 } from "lucide-react";
import type { ContentItem, ContentStatus } from "@/lib/db";

const COLUMNS: { key: string; label: string; statuses: ContentStatus[] }[] = [
  { key: "idea", label: "Idée", statuses: ["idea", "approved_idea"] },
  { key: "drafted", label: "Rédigé", statuses: ["drafted"] },
  { key: "validate", label: "À valider", statuses: ["approved_content"] },
  { key: "ready", label: "Prêt", statuses: ["generating", "ready", "scheduled"] },
  { key: "published", label: "Publié", statuses: ["published"] },
];

const THEME_LABEL: Record<string, string> = {
  cas_client: "Cas client",
  hook_probleme: "Hook",
  educatif: "Éducatif",
  solution: "Solution",
  methode: "Méthode",
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

interface ContentKanbanProps {
  content: ContentItem[];
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
}

/** Kanban des briefs/carrousels LUNA — cliquer une carte la rouvre dans le chat au-dessus. */
export function ContentKanban({ content, activeId, onSelect }: ContentKanbanProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (deletingId) return;
    if (!confirm("Supprimer ce brief/carrousel ? Cette action est définitive.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/luna/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      if (activeId === id) onSelect?.(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  if (content.length === 0) {
    return (
      <div className="levo-card p-10 text-center">
        <p className="text-sm text-muted">
          Aucun contenu pour l'instant. Brief LUNA dans le chat au-dessus pour créer une première idée ici.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-slim -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-5">
      {COLUMNS.map((col) => {
        const items = content.filter((c) => col.statuses.includes(c.status));
        return (
          <div key={col.key} className="flex w-[76vw] shrink-0 flex-col sm:w-64 md:w-auto">
            <div className="mb-2.5 flex items-center justify-between px-1.5">
              <span className="text-[13px] font-semibold text-ink">{col.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-muted shadow-xs">
                {items.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 rounded-3xl bg-black/[0.025] p-2.5">
              {items.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted/60">—</p>
              ) : (
                items.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelect?.(c.id)}
                    className={`levo-card levo-pressable group relative cursor-pointer p-3.5 hover:-translate-y-0.5 hover:shadow-lift ${
                      activeId === c.id ? "ring-2 ring-luna" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-luna/[0.08] px-2 py-0.5 text-[10px] font-medium text-luna">
                        <Images className="h-3 w-3" />
                        {c.theme ? THEME_LABEL[c.theme] ?? c.theme : "Contenu"}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        disabled={deletingId === c.id}
                        className="levo-pressable shrink-0 rounded-lg p-1 text-muted opacity-0 hover:text-danger group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        {deletingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="mt-2.5 text-[13.5px] font-medium leading-snug text-ink">
                      {c.title}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                      <span>{Array.isArray(c.platform) ? c.platform.join(", ") : "—"}</span>
                      <span className="tabular-nums">{fmtDate(c.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
