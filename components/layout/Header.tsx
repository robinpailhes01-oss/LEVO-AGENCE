"use client";

import { Bell, Search } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
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
        <button
          aria-label="Notifications"
          className="levo-pressable relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/70 text-muted transition-colors hover:text-ink"
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-white" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3A56FF] text-sm font-semibold text-white shadow-soft md:hidden">
          R
        </span>
      </div>
    </header>
  );
}
