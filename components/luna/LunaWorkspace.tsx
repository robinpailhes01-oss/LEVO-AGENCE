"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentItem, ContentSummary } from "@/lib/db";
import { LunaChat } from "@/components/luna/LunaChat";
import { ContentKanban } from "@/components/luna/ContentKanban";

const STORAGE_KEY = "luna_active_content_id";

/**
 * localStorage peut lever (Safari iOS en navigation privée stricte, cookies
 * tiers bloqués...) — jamais laisser ça planter l'hydratation React : sans
 * error boundary ailleurs dans l'app, une exception ici rendrait TOUTE la
 * page (sidebar/nav compris) non cliquable, pas juste ce composant.
 */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible — activeId reste en mémoire pour cette session, tant pis pour la persistance */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* idem */
  }
}

/**
 * Coordonne le chat et le kanban : cliquer une carte rouvre sa conversation/
 * son carrousel dans le chat. `content` (la liste, prop serveur) ne contient
 * QUE les colonnes légères (voir ContentSummary) — la ligne complète d'un
 * post (chat_history, slides_content, generated_images) est chargée à la
 * demande ici, uniquement pour l'item actif, via GET /api/luna/[id].
 */
export function LunaWorkspace({ content, children }: { content: ContentSummary[]; children?: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);

  const loadActiveItem = useCallback(async (id: string) => {
    setLoadingItem(true);
    try {
      const res = await fetch(`/api/luna/${id}`);
      if (!res.ok) {
        setActiveItem(null);
        return;
      }
      const data = (await res.json()) as { item?: ContentItem };
      setActiveItem(data.item ?? null);
    } catch {
      setActiveItem(null);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  // Hydratation une seule fois, au montage — validée contre le contenu déjà
  // chargé côté serveur. Après ça, `activeId` est piloté par l'utilisateur
  // (nouveau message, clic sur une carte, "Nouvelle conversation"), jamais
  // ré-invalidé automatiquement en cours de route.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? safeGet(STORAGE_KEY) : null;
    if (stored && content.some((c) => c.id === stored)) {
      setActiveId(stored);
    } else if (stored) {
      safeRemove(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) {
      setActiveItem(null);
      return;
    }
    loadActiveItem(activeId);
  }, [activeId, loadActiveItem]);

  function handleActiveIdChange(id: string | null) {
    setActiveId(id);
    if (id) safeSet(STORAGE_KEY, id);
    else safeRemove(STORAGE_KEY);
  }

  function handleItemMutated() {
    if (activeId) loadActiveItem(activeId);
  }

  return (
    <div className="space-y-6">
      <LunaChat
        activeId={activeId}
        activeItem={activeItem}
        loadingItem={loadingItem}
        onActiveIdChange={handleActiveIdChange}
        onItemMutated={handleItemMutated}
      />
      {children}
      <ContentKanban content={content} activeId={activeId} onSelect={handleActiveIdChange} />
    </div>
  );
}
