"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { ContentItem, ContentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const FORMAT_LABEL: Record<ContentItem["format"], string> = {
  carousel: "Carrousel",
  reel: "Reel",
  single: "Post",
  story: "Story",
};

export interface CarouselCardProps {
  item: ContentItem;
  onMove: (item: ContentItem, direction: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  busy: boolean;
}

export function CarouselCard({
  item,
  onMove,
  canMoveLeft,
  canMoveRight,
  busy,
}: CarouselCardProps) {
  return (
    <div className="rounded-xl border border-line/70 bg-white p-3 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted">
          <Images className="h-3 w-3" />
          {FORMAT_LABEL[item.format]}
        </span>
      </div>

      <Link href={`/dashboard/luna/${item.id}`} className="mt-2 block">
        <p className="line-clamp-2 text-sm font-medium text-ink hover:text-accent">
          {item.title}
        </p>
        {item.hook && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.hook}</p>
        )}
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => onMove(item, -1)}
          disabled={!canMoveLeft || busy}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-ink disabled:opacity-30",
          )}
          aria-label="Reculer l'étape"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {item.pillar && (
          <span className="truncate text-[10px] text-muted/80">
            {item.pillar}
          </span>
        )}
        <button
          onClick={() => onMove(item, 1)}
          disabled={!canMoveRight || busy}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-ink disabled:opacity-30"
          aria-label="Avancer l'étape"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const CONTENT_COLUMNS: { key: ContentStatus; label: string }[] = [
  { key: "idea", label: "Idée" },
  { key: "approved", label: "Approuvé" },
  { key: "drafted", label: "Rédigé" },
  { key: "validated", label: "Validé" },
  { key: "published", label: "Publié" },
];
