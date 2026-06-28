"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const TITLES: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/dashboard", title: "Overview" },
  { match: (p) => p.startsWith("/dashboard/luna"), title: "LUNA — Contenu" },
  { match: (p) => p.startsWith("/dashboard/orion"), title: "ORION — Leads" },
  { match: (p) => p.startsWith("/dashboard/hermes"), title: "HERMES — Rapports" },
  { match: (p) => p.startsWith("/dashboard/clients"), title: "Clients" },
  { match: (p) => p.startsWith("/dashboard/settings"), title: "Paramètres" },
];

function titleFor(pathname: string): string {
  return TITLES.find((t) => t.match(pathname))?.title ?? "Dashboard";
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/60 bg-background/80 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <span className="md:hidden">
          <Logo className="text-xl" />
        </span>
        <h1 className="hidden font-display text-xl font-semibold text-ink md:block">
          {titleFor(pathname)}
        </h1>
      </div>

      <button
        onClick={logout}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
    </header>
  );
}
