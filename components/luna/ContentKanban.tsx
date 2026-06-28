import { Images, Film } from "lucide-react";
import { LUNA_BOARD } from "@/lib/mock";

export function ContentKanban() {
  return (
    <div className="scroll-slim -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-5">
      {LUNA_BOARD.map((col) => (
        <div key={col.key} className="flex w-[76vw] shrink-0 flex-col sm:w-64 md:w-auto">
          <div className="mb-2.5 flex items-center justify-between px-1.5">
            <span className="text-[13px] font-semibold text-ink">{col.label}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-muted shadow-xs">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 rounded-3xl bg-black/[0.025] p-2.5">
            {col.items.map((card, i) => {
              const isReel = card.type.toLowerCase() === "reel";
              return (
                <div
                  key={i}
                  className="levo-card levo-pressable cursor-pointer p-3.5 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-luna/[0.08] px-2 py-0.5 text-[10px] font-medium text-luna">
                    {isReel ? <Film className="h-3 w-3" /> : <Images className="h-3 w-3" />}
                    {card.type}
                  </span>
                  <p className="mt-2.5 text-[13.5px] font-medium leading-snug text-ink">
                    {card.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                    <span>{isReel ? "1 vidéo" : `${card.slides} slides`}</span>
                    <span className="tabular-nums">{card.date}</span>
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
