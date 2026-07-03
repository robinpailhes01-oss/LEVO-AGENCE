"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Phone, MapPin, Globe, Facebook, Linkedin, Loader2 } from "lucide-react";
import type { Lead, LeadStage, Niche } from "@/lib/db";

const STAGE_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  opened: "Ouvert",
  replied: "Répondu",
  audit_received: "Audit reçu",
  loom_sent: "Loom envoyé",
  follow_up: "Suivi",
  won: "Gagné",
  lost: "Perdu",
};

const STAGE_OPTIONS: LeadStage[] = [
  "new", "contacted", "opened", "replied", "audit_received", "loom_sent", "follow_up", "won", "lost",
];

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[13.5px] text-ink">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function LeadDetailModal({
  lead,
  niche,
  onClose,
}: {
  lead: Lead;
  niche: Niche | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [saving, setSaving] = useState(false);

  const enrichment = (lead.enrichment_data ?? {}) as Record<string, unknown>;
  const phone = typeof enrichment.phone === "string" ? enrichment.phone : null;
  const address = typeof enrichment.address === "string" ? enrichment.address : null;
  const city = typeof enrichment.city === "string" ? enrichment.city : null;
  const facebook = typeof enrichment.facebook === "string" ? enrichment.facebook : null;
  const linkedin = typeof enrichment.linkedin === "string" ? enrichment.linkedin : null;
  const icebreaker = typeof enrichment.icebreaker === "string" ? enrichment.icebreaker : null;

  async function changeStage(next: LeadStage) {
    const previous = stage;
    setStage(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStage(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[17px] font-semibold text-ink">{lead.company ?? lead.full_name ?? "Sans nom"}</p>
            <p className="text-[13px] text-muted">{lead.sector ?? "—"}</p>
          </div>
          <button onClick={onClose} className="levo-pressable rounded-full bg-black/[0.04] p-1.5 text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={stage}
              disabled={saving}
              onChange={(e) => changeStage(e.target.value as LeadStage)}
              className="appearance-none rounded-full bg-orion/10 py-1 pl-2.5 pr-6 text-[11px] font-semibold text-orion outline-none disabled:opacity-60"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            {saving && (
              <Loader2 className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-orion" />
            )}
          </div>
          {niche && (
            <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-ink">
              {niche.name}
            </span>
          )}
          {lead.score > 0 && (
            <span className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
              Score {lead.score}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {lead.email && (
            <Row icon={<Mail className="h-3.5 w-3.5" />}>
              <a href={`mailto:${lead.email}`} className="hover:text-orion">{lead.email}</a>
            </Row>
          )}
          {phone && (
            <Row icon={<Phone className="h-3.5 w-3.5" />}>
              <a href={`tel:${phone}`} className="hover:text-orion">{phone}</a>
            </Row>
          )}
          {(address ?? city) && (
            <Row icon={<MapPin className="h-3.5 w-3.5" />}>{address ?? city}</Row>
          )}
          {lead.linkedin_url && (
            <Row icon={<Globe className="h-3.5 w-3.5" />}>
              <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="break-all hover:text-orion">
                {lead.linkedin_url}
              </a>
            </Row>
          )}
          {facebook && (
            <Row icon={<Facebook className="h-3.5 w-3.5" />}>
              <a href={facebook} target="_blank" rel="noreferrer" className="break-all hover:text-orion">Facebook</a>
            </Row>
          )}
          {linkedin && (
            <Row icon={<Linkedin className="h-3.5 w-3.5" />}>
              <a href={linkedin} target="_blank" rel="noreferrer" className="break-all hover:text-orion">LinkedIn</a>
            </Row>
          )}
        </div>

        {icebreaker && (
          <div className="mt-4 rounded-2xl bg-black/[0.025] p-3.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Accroche ORION</p>
            <p className="text-[13px] text-ink">{icebreaker}</p>
          </div>
        )}

        {lead.notes && (
          <div className="mt-4 rounded-2xl bg-black/[0.025] p-3.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Notes</p>
            <p className="text-[13px] text-ink">{lead.notes}</p>
          </div>
        )}

        <p className="mt-5 text-center text-[11px] text-muted/60">
          Ajouté le {new Date(lead.created_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
