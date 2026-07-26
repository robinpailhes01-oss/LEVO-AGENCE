"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import type { LunaReference } from "@/lib/db";

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Mémoire de LUNA : retours texte (settings.luna_learnings, injectés dans
 * chaque génération) + bibliothèque de références visuelles permanentes
 * (luna_references, réinjectées au début de chaque nouveau brief).
 */
export function LunaMemory({ learnings, references }: { learnings: string; references: LunaReference[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [learningsText, setLearningsText] = useState(learnings);
  const [refs, setRefs] = useState(references);
  useEffect(() => setLearningsText(learnings), [learnings]);
  useEffect(() => setRefs(references), [references]);

  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [pendingImage, setPendingImage] = useState<{ name: string; dataUri: string } | null>(null);
  const [refNote, setRefNote] = useState("");
  const [savingRef, setSavingRef] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function saveNote() {
    const text = note.trim();
    if (!text || savingNote) return;
    setSavingNote(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/learnings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(`${file.name} dépasse 8 Mo — compresse-la avant de la joindre.`);
      return;
    }
    try {
      setPendingImage({ name: file.name, dataUri: await readFileAsDataUri(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la lecture d'image.");
    }
  }

  async function saveReference() {
    const text = refNote.trim();
    if (!text || !pendingImage || savingRef) return;
    setSavingRef(true);
    setError(null);
    try {
      const res = await fetch("/api/luna/references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: text, image: pendingImage.dataUri }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      setPendingImage(null);
      setRefNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSavingRef(false);
    }
  }

  async function removeReference(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/luna/references/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Erreur ${res.status}`);
      setRefs((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="levo-card space-y-5 p-5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-luna" />
        <span className="text-[13.5px] font-semibold text-ink">Mémoire de LUNA</span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-muted">
        Retours texte injectés à chaque génération, et références visuelles réinjectées à chaque nouveau brief.
        Reste volontaire et curée par toi — pas d'apprentissage automatique caché.
      </p>

      {error && <p className="text-[11.5px] font-medium text-danger">{error}</p>}

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Retours généraux</p>
        {learningsText.trim() ? (
          <div className="whitespace-pre-wrap rounded-xl bg-background px-3 py-2.5 text-[12px] leading-relaxed text-ink">
            {learningsText}
          </div>
        ) : (
          <p className="text-[12px] text-muted/70">Rien pour l'instant.</p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveNote()}
            placeholder="Ex : les accroches sont trop longues, aller plus vite au point..."
            className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] outline-none focus:border-current"
          />
          <button
            onClick={saveNote}
            disabled={!note.trim() || savingNote}
            className="levo-pressable flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink disabled:opacity-50"
          >
            {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Ajouter
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-line/60 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Références visuelles permanentes</p>

        {refs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {refs.map((r) => (
              <div key={r.id} className="group relative overflow-hidden rounded-xl border border-line/60">
                <img src={r.image_data} alt={r.note} title={r.note} className="aspect-square w-full object-cover" />
                <button
                  onClick={() => removeReference(r.id)}
                  disabled={deletingId === r.id}
                  className="levo-pressable absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
                  aria-label="Supprimer"
                >
                  {deletingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files);
            e.target.value = "";
          }}
        />

        {pendingImage ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-background p-2">
            <img src={pendingImage.dataUri} alt={pendingImage.name} className="h-12 w-12 rounded-lg object-cover" />
            <input
              value={refNote}
              onChange={(e) => setRefNote(e.target.value)}
              placeholder="Pourquoi cette image compte (palette, composition, à éviter...)"
              className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-current"
            />
            <button
              onClick={saveReference}
              disabled={!refNote.trim() || savingRef}
              className="levo-pressable flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#1A3BFF" }}
            >
              {savingRef ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setPendingImage(null)}
              className="levo-pressable rounded-lg px-2 py-1.5 text-[12px] text-muted hover:text-ink"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="levo-pressable flex items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:text-ink"
          >
            <ImagePlus className="h-3.5 w-3.5" /> Ajouter une référence visuelle
          </button>
        )}
      </div>
    </div>
  );
}
