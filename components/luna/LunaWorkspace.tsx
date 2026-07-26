"use client";

import { useEffect, useState } from "react";
import type { ContentItem } from "@/lib/db";
import { LunaChat } from "@/components/luna/LunaChat";
import { ContentKanban } from "@/components/luna/ContentKanban";

const STORAGE_KEY = "luna_active_content_id";

/** Coordonne le chat et le kanban : cliquer une carte rouvre sa conversation/son carrousel dans le chat. */
export function LunaWorkspace({ content, children }: { content: ContentItem[]; children?: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Hydratation une seule fois, au montage — validée contre le contenu déjà
  // chargé côté serveur. Après ça, `activeId` est piloté par l'utilisateur
  // (nouveau message, clic sur une carte, "Nouvelle conversation"), jamais
  // ré-invalidé automatiquement en cours de route.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && content.some((c) => c.id === stored)) {
      setActiveId(stored);
    } else if (stored) {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleActiveIdChange(id: string | null) {
    setActiveId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="space-y-6">
      <LunaChat content={content} activeId={activeId} onActiveIdChange={handleActiveIdChange} />
      {children}
      <ContentKanban content={content} activeId={activeId} onSelect={handleActiveIdChange} />
    </div>
  );
}
