import { Images, Film } from "lucide-react";
import { LUNA_BOARD } from "@/lib/mock";

export function ContentKanban() {
  return (
    <div className="scroll-slim -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-5">
      {LUNA_BOARD.map((col) => (
        <div key={col.key} className="flex w-[78vw] shrink-0 flex-col sm:w-64 md:w-auto">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-ink">{col.label}</span>
            <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted shadow-soft">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white/40 p-2">
            {col.items.map((card, i) => {
              const isReel = card.type.toLowerCase() === "reel";
              return (
                <div
                  key={i}
                  className="cursor-pointer rounded-xl border border-line/60 bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted">
                    {isReel ? <Film className="h-3 w-3" /> : <Images className="h-3 w-3" />}
                    {card.type}
                  </span>
                  <p className="mt-2 text-sm font-medium leading-snug text-ink">
                    {card.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                    <span>{isReel ? "1 vidéo" : `${card.slides} slides`}</span>
                    <span>{card.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
