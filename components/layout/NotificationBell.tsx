"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, AlertCircle, Clock, MessageSquare, X, Reply } from "lucide-react";
import type { ReplyWithLead } from "@/lib/queries";

export function NotificationBell({
  pendingAudits,
  followUps,
  replies,
}: {
  pendingAudits: number;
  followUps: number;
  replies: ReplyWithLead[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(replies);
  const [expanded, setExpanded] = useState<string | null>(null);

  const unread = items.filter((r) => !r.is_read).length;
  const total = unread + pendingAudits + followUps;

  async function openReply(r: ReplyWithLead) {
    setExpanded(expanded === r.id ? null : r.id);
    if (!r.is_read) {
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_read: true } : x)));
      try {
        await fetch(`/api/replies/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        });
      } catch {
        /* best-effort */
      }
    }
  }

  return (
    <div className="relative">
      <button
        aria-label={total > 0 ? `${total} notification(s)` : "Notifications"}
        onClick={() => setOpen((o) => !o)}
        className="levo-pressable relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/70 text-muted transition-colors hover:text-ink"
      >
        <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orion px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(92vw,380px)] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lift">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[13px] font-semibold text-ink">Notifications</p>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-muted hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* À traiter */}
            {(pendingAudits > 0 || followUps > 0) && (
              <div className="mb-1">
                {pendingAudits > 0 && (
                  <Link
                    href="/dashboard/orion"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-black/[0.03]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger/12 text-danger">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                    <span className="text-[13px] text-ink">
                      <strong>{pendingAudits} audit{pendingAudits > 1 ? "s" : ""}</strong> à traiter
                    </span>
                  </Link>
                )}
                {followUps > 0 && (
                  <Link
                    href="/dashboard/orion"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-black/[0.03]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning/12 text-warning">
                      <Clock className="h-4 w-4" />
                    </span>
                    <span className="text-[13px] text-ink">
                      <strong>{followUps} relance{followUps > 1 ? "s" : ""}</strong> à faire
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Réponses (inbox) */}
            <p className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Réponses</p>
            {items.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12.5px] text-muted">Aucune réponse pour l'instant.</p>
            ) : (
              items.map((r) => (
                <div key={r.id} className="rounded-xl px-2 py-2 hover:bg-black/[0.02]">
                  <button onClick={() => openReply(r)} className="flex w-full items-start gap-2.5 text-left">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orion/12 text-orion">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {!r.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orion" />}
                        <span className={`truncate text-[13px] ${r.is_read ? "text-ink" : "font-semibold text-ink"}`}>
                          {r.company ?? r.full_name ?? r.from_email ?? "Prospect"}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted">
                        {r.subject ?? (r.body ? r.body.slice(0, 60) : "—")}
                      </span>
                    </span>
                  </button>
                  {expanded === r.id && (
                    <div className="mt-2 rounded-xl bg-black/[0.03] p-3">
                      {r.body && <p className="whitespace-pre-wrap text-[12.5px] text-ink">{r.body}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10.5px] text-muted/70">
                          {new Date(r.received_at).toLocaleString("fr-FR")}
                        </span>
                        {r.from_email && (
                          <a
                            href={`mailto:${r.from_email}`}
                            className="flex items-center gap-1 rounded-full bg-orion px-2.5 py-1 text-[11px] font-medium text-white"
                          >
                            <Reply className="h-3 w-3" /> Répondre
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
