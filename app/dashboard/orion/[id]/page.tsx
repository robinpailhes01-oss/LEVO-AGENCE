import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Globe, Instagram, MapPin } from "lucide-react";
import { getLead } from "@/lib/queries";
import { LeadDetailActions } from "@/components/orion/LeadDetailActions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function scoreTone(score: number): "green" | "amber" | "neutral" {
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "neutral";
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  const enrichment = lead.enrichment as
    | { niche?: string; signals?: string[]; angles?: string[]; rationale?: string }
    | null;

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/dashboard/orion"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au pipeline
      </Link>

      <div className="levo-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone={scoreTone(lead.score)}>Score {lead.score}/100</Badge>
              <Badge tone="neutral">{lead.status}</Badge>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              {lead.name}
            </h2>
            <p className="text-sm text-muted">
              {lead.company ?? "—"}
              {lead.niche ? ` · ${lead.niche}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          {lead.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {lead.email}
            </span>
          )}
          {lead.website && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> {lead.website}
            </span>
          )}
          {lead.instagram_handle && (
            <span className="inline-flex items-center gap-1.5">
              <Instagram className="h-4 w-4" /> {lead.instagram_handle}
            </span>
          )}
          {lead.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {lead.location}
            </span>
          )}
        </div>
      </div>

      <LeadDetailActions lead={lead} />

      {enrichment && (
        <div className="levo-card p-5">
          <h3 className="font-display text-lg font-semibold text-ink">
            Profil enrichi
          </h3>
          {enrichment.rationale && (
            <p className="mt-2 text-sm text-ink/80">{enrichment.rationale}</p>
          )}
          {enrichment.signals && enrichment.signals.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Signaux d'opportunité
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink/80">
                {enrichment.signals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {enrichment.angles && enrichment.angles.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Angles d'accroche
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink/80">
                {enrichment.angles.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {lead.notes && (
        <div className="levo-card p-5">
          <h3 className="font-display text-lg font-semibold text-ink">Notes</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">
            {lead.notes}
          </p>
        </div>
      )}
    </div>
  );
}
