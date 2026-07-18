"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";

/** Approuve d'un coup tous les brouillons en attente (après relecture rapide du lot). */
export function HermesApproveAll({ count }: { count: number }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading">("idle");

  async function approveAll() {
    if (!confirm(`Approuver les ${count} brouillons d'un coup ?`)) return;
    setState("loading");
    try {
      const res = await fetch("/api/hermes/approve-all", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error();
      router.refresh();
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={approveAll}
      disabled={state === "loading"}
      className="levo-pressable inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-ink disabled:opacity-50"
    >
      {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      Tout approuver ({count})
    </button>
  );
}
