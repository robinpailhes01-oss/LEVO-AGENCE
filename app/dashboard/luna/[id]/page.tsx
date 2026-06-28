import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContentItem, getSlides } from "@/lib/queries";
import { SlideEditor } from "@/components/luna/SlideEditor";
import { DraftButton } from "@/components/luna/DraftButton";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  idea: "neutral",
  approved: "blue",
  drafted: "amber",
  validated: "green",
  published: "purple",
} as const;

export default async function CarouselDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getContentItem(params.id);
  if (!item) notFound();

  const slides = await getSlides(item.id);

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/dashboard/luna"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au pipeline
      </Link>

      <div className="levo-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
              {item.pillar && <Badge tone="neutral">{item.pillar}</Badge>}
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              {item.title}
            </h2>
            {item.hook && <p className="mt-1 text-sm text-muted">{item.hook}</p>}
          </div>
          <DraftButton contentId={item.id} hasSlides={slides.length > 0} />
        </div>

        {item.caption && (
          <div className="mt-4 rounded-xl bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Caption
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
              {item.caption}
            </p>
            {item.hashtags.length > 0 && (
              <p className="mt-2 text-xs text-accent">
                {item.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-ink">
          Slides {slides.length > 0 && `(${slides.length})`}
        </h3>
        {slides.length === 0 ? (
          <div className="levo-card p-8 text-center">
            <p className="text-sm text-muted">
              Aucune slide pour l'instant. Lance la rédaction pour générer le
              carrousel complet avec prompts d'image.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {slides.map((slide, i) => (
              <SlideEditor
                key={slide.id}
                contentId={item.id}
                slide={slide}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
