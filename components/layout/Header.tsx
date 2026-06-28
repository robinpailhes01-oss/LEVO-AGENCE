"use client";

import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import { todayLabel } from "@/lib/mock";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/60 bg-background/80 px-4 backdrop-blur md:px-8">
      <span className="md:hidden">
        <Logo className="text-xl" />
      </span>
      <p className="hidden text-sm capitalize text-muted md:block">
        {todayLabel()}
      </p>

      <div className="ml-auto flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-muted transition-colors hover:text-ink"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white md:hidden">
          R
        </span>
      </div>
    </header>
  );
}
