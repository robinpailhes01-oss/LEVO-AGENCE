"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Lead, LeadStatus } from "@/lib/types";

const COLUMNS: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "Nouveau" },
  { key: "enriched", label: "Enrichi" },
  { key: "contacted", label: "Contacté" },
  { key: "replied", label: "Répondu" },
  { key: "qualified", label: "Qualifié" },
  { key: "won", label: "Gagné" },
];
const ADVANCE_ORDER: LeadStatus[] = COLUMNS.map((c) => c.key);

export function LeadPipeline({ initial }: { initial: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    niche: "",
    location: "",
  });
  const [adding, startAdding] = useTransition();

  async function advance(lead: Lead) {
    const idx = ADVANCE_ORDER.indexOf(lead.status);
    const next = ADVANCE_ORDER[idx + 1];
    if (!next) return;
    setBusyId(lead.id);
    setError(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: next } : l)),
    );
    try {
      const res = await fetch("/api/orion/update-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)),
      );
      setError("Impossible de déplacer ce lead.");
    } finally {
      setBusyId(null);
    }
  }

  function addLead() {
    if (!form.name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setError(null);
    startAdding(async () => {
      try {
        const res = await fetch("/api/orion/add-lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as {
          ok: boolean;
          data?: Lead;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.data) {
          throw new Error(data.error ?? "Ajout impossible");
        }
        setLeads((prev) => [data.data!, ...prev]);
        setForm({ name: "", company: "", email: "", niche: "", location: "" });
        setShowForm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ajout impossible");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{leads.length} leads dans le pipeline</p>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Ajouter un lead
        </Button>
      </div>

      {showForm && (
        <div className="levo-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Nom *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Entreprise"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Niche"
            value={form.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Ville"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Button onClick={addLead} disabled={adding} className="shrink-0">
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col, colIdx) => {
          const colLeads = leads.filter((l) => l.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-ink">{col.label}</span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                  {colLeads.length}
                </span>
              </div>
              <div className="scroll-slim flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-background/60 p-2">
                {colLeads.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted/70">—</p>
                ) : (
                  colLeads.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      onAdvance={advance}
                      canAdvance={colIdx < COLUMNS.length - 1}
                      busy={busyId === l.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
