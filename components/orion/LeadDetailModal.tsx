"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Phone, MapPin, Globe, Facebook, Linkedin, Loader2, ClipboardCheck, Send, Check } from "lucide-react";
import type { Audit, Lead, LeadStage, Niche } from "@/lib/db";

/** Libellés FR des questions d'audit (site vitrine). Clé inconnue → clé formatée. */
const AUDIT_LABELS: Record<string, string> = {
  secteur: "Secteur",
  demandes_semaine: "Demandes / semaine",
  temps_reponse: "Temps de réponse actuel",
  devis_semaine: "Devis / semaine",
  temps_devis: "Temps par devis",
  clients_perdus: "Clients perdus / mois",
  panier_moyen: "Panier moyen",
  horizon: "Horizon du projet",
};
/** Champs déjà affichés ailleurs (en-tête, contact, stats) → exclus du détail. */
const AUDIT_SKIP = new Set([
  "prenom", "nom", "email", "entreprise", "taches", "temps_par_tache",
  "heures_perdues_semaine", "perte_mensuelle_estimee",
]);

function renderAuditValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.map((x) => taskLabel(String(x))).join(", ");
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${taskLabel(k)}: ${val}`)
      .join(" · ");
  }
  return String(v);
}

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

function taskLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function LeadDetailModal({
  lead,
  niche,
  audit,
  onClose,
}: {
  lead: Lead;
  niche: Niche | null;
  audit?: Audit | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [saving, setSaving] = useState(false);
  const [loomUrl, setLoomUrl] = useState("");
  const [loomState, setLoomState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [loomError, setLoomError] = useState<string | null>(null);

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

  async function sendLoom() {
    const url = loomUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setLoomState("error");
      setLoomError("Le lien doit commencer par https:// (ex: https://www.loom.com/share/…)");
      return;
    }
    setLoomState("sending");
    setLoomError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/loom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loom_url: url }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        data = { error: raw.slice(0, 140) || `HTTP ${res.status}` };
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }
      setLoomState("sent");
      setStage("loom_sent");
      router.refresh();
      // Laisse voir le message de succès, puis ferme pour révéler le board rafraîchi.
      setTimeout(() => onClose(), 1600);
    } catch (err) {
      setLoomState("error");
      setLoomError(err instanceof Error ? err.message : "Échec réseau — réessaie.");
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

        {audit?.answers && (() => {
          const a = audit.answers as Record<string, unknown>;
          const heures = typeof a.heures_perdues_semaine === "number" ? a.heures_perdues_semaine : null;
          const perte = typeof a.perte_mensuelle_estimee === "number" ? a.perte_mensuelle_estimee : null;
          const taches = Array.isArray(a.taches) ? (a.taches as string[]) : [];
          const detailKeys = Object.keys(a).filter((k) => !AUDIT_SKIP.has(k) && a[k] !== null && a[k] !== "");
          return (
            <div className="mt-4 rounded-2xl bg-orion/[0.06] p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-orion">
                <ClipboardCheck className="h-3 w-3" /> Rapport d'audit
              </p>
              {(heures !== null || perte !== null) && (
                <div className="mb-3 flex gap-2">
                  {heures !== null && (
                    <div className="flex-1 rounded-xl bg-white px-3 py-2">
                      <p className="text-[15px] font-semibold text-ink">{heures}h</p>
                      <p className="text-[10.5px] text-muted">perdues / semaine</p>
                    </div>
                  )}
                  {perte !== null && (
                    <div className="flex-1 rounded-xl bg-white px-3 py-2">
                      <p className="text-[15px] font-semibold text-ink">{perte}€</p>
                      <p className="text-[10.5px] text-muted">perte estimée / mois</p>
                    </div>
                  )}
                </div>
              )}
              {taches.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Tâches chronophages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {taches.map((t) => (
                      <span key={t} className="rounded-full bg-white px-2 py-0.5 text-[11.5px] text-ink">{taskLabel(t)}</span>
                    ))}
                  </div>
                </div>
              )}
              {detailKeys.length > 0 && (
                <dl className="divide-y divide-black/[0.06] rounded-xl bg-white/60 px-3">
                  {detailKeys.map((k) => (
                    <div key={k} className="flex items-start justify-between gap-3 py-1.5">
                      <dt className="text-[12px] text-muted">{AUDIT_LABELS[k] ?? taskLabel(k)}</dt>
                      <dd className="text-right text-[12.5px] font-medium text-ink">{renderAuditValue(a[k])}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-[10.5px] text-muted/70">
                Soumis le {audit.submitted_at ? new Date(audit.submitted_at).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
          );
        })()}

        {/* Envoi de la démo (Loom) — dispo dès qu'un audit est arrivé */}
        {audit && (
          <div className="mt-4 rounded-2xl border border-orion/20 p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-orion">Envoyer la démo</p>
            {audit.loom_url && loomState !== "sent" ? (
              <p className="mb-2 text-[12px] text-success">
                ✓ Démo déjà envoyée (<a href={audit.loom_url} target="_blank" rel="noreferrer" className="underline">lien</a>)
              </p>
            ) : null}
            {loomState === "sent" ? (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-success">
                <Check className="h-4 w-4" /> Démo envoyée — lead passé en « Loom envoyé »
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={loomUrl}
                    onChange={(e) => setLoomUrl(e.target.value)}
                    placeholder="Colle le lien Loom ici…"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-orion"
                  />
                  <button
                    onClick={sendLoom}
                    disabled={loomState === "sending" || !loomUrl.trim()}
                    className="levo-pressable flex shrink-0 items-center gap-1.5 rounded-xl bg-orion px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                  >
                    {loomState === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Envoyer
                  </button>
                </div>
                {loomError && (
                  <p className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">
                    {loomError}
                  </p>
                )}
                <p className="mt-1.5 text-[10.5px] text-muted/70">
                  Le prospect reçoit un mail avec le lien + ta signature. Réponse dirigée vers ta boîte d'envoi.
                </p>
              </>
            )}
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
