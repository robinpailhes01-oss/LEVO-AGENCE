import { Sparkles, Inbox, Download, Phone, Globe, MapPin, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HermesAnalyzeButton } from "@/components/hermes/HermesAnalyzeButton";
import { HermesDraftCard } from "@/components/hermes/HermesDraftCard";
import { getHermesQueue, getHermesCandidates } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HermesPage() {
  const [queue, candidates, approved] = await Promise.all([
    getHermesQueue("draft"),
    getHermesCandidates(20),
    getHermesQueue("approved"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="HERMES — Agent commercial IA"
        subtitle="Analyse les leads, rédige des emails personnalisés, propose — tu valides avant tout envoi."
        action={
          approved.length > 0 ? (
            <a
              href="/api/export/hermes"
              className="levo-pressable inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
              style={{ backgroundColor: "#BA7517", boxShadow: "0 10px 24px -10px #BA751799" }}
            >
              <Download className="h-4 w-4" />
              Exporter {approved.length} approuvé{approved.length > 1 ? "s" : ""} (CSV Instantly)
            </a>
          ) : undefined
        }
      />

      <section className="levo-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#BA751714] text-[#BA7517]">
            <Sparkles className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <h2 className="font-display text-[16px] font-semibold text-ink">Nouveaux leads à analyser</h2>
        </div>
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucun nouveau lead en attente d'analyse pour l'instant.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {candidates.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{lead.company ?? lead.full_name ?? "Sans nom"}</p>
                  <p className="truncate text-[12px] text-muted">{lead.sector ?? "—"} · {lead.email ?? "—"}</p>
                </div>
                <HermesAnalyzeButton leadId={lead.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#BA751714] text-[#BA7517]">
            <Inbox className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <h2 className="font-display text-[16px] font-semibold text-ink">
            À valider {queue.length > 0 && <span className="text-muted">({queue.length})</span>}
          </h2>
        </div>
        {queue.length === 0 ? (
          <div className="levo-card p-8 text-center text-sm text-muted">
            Aucun brouillon en attente. Lance une analyse ci-dessus pour en générer un.
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div key={item.id} className="levo-card p-5">
                <div className="mb-3 rounded-xl bg-background px-3 py-3">
                  <p className="text-[14px] font-semibold text-ink">
                    {item.lead?.company ?? item.lead?.full_name ?? "Prospect"}
                  </p>
                  <p className="text-[12px] text-muted">{item.lead?.sector ?? "—"} · {item.lead?.email ?? "—"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink/80">
                    {item.lead?.phone && (
                      <a href={`tel:${item.lead.phone.replace(/\s+/g, "")}`} className="flex items-center gap-1 hover:text-[#BA7517]">
                        <Phone className="h-3 w-3" /> {item.lead.phone}
                      </a>
                    )}
                    {item.lead?.website && (
                      <a href={item.lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#BA7517]">
                        <Globe className="h-3 w-3" /> {item.lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                    {item.lead?.city && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.lead.city}</span>
                    )}
                    {item.contact_first_name && (
                      <span className="flex items-center gap-1 font-medium text-success">
                        <User className="h-3 w-3" /> Prénom identifié : {item.contact_first_name}
                      </span>
                    )}
                  </div>
                </div>
                <HermesDraftCard
                  id={item.id}
                  subjectLine={item.subject_line ?? ""}
                  emailBody={item.email_body ?? ""}
                  confidenceScore={item.confidence_score}
                  hook={item.hook}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
