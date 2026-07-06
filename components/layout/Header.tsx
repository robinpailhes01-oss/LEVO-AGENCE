"use client";

import { Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import type { ReplyWithLead } from "@/lib/queries";

export function Header({
  canLogout = false,
  pendingAudits = 0,
  followUps = 0,
  replies = [],
}: {
  canLogout?: boolean;
  pendingAudits?: number;
  followUps?: number;
  replies?: ReplyWithLead[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <header className="frost sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line/50 px-4 md:h-16 md:px-8">
      <span className="md:hidden">
        <Logo className="text-lg" />
      </span>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          aria-label="Rechercher"
          className="levo-pressable hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/70 text-muted transition-colors hover:text-ink sm:flex"
        >
          <Search className="h-[17px] w-[17px]" strokeWidth={1.9} />
        </button>
        <NotificationBell pendingAudits={pendingAudits} followUps={followUps} replies={replies} />
        {canLogout && (
          <button
            onClick={logout}
            disabled={loading}
            aria-label="Déconnexion"
            className="levo-pressable flex h-9 items-center gap-2 rounded-xl border border-line bg-white/70 px-3 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.9} />
            <span className="hidden sm:inline">Sortir</span>
          </button>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3A56FF] text-sm font-semibold text-white shadow-soft md:hidden">
          R
        </span>
      </div>
    </header>
  );
}
