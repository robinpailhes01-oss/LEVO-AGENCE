"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar text-white/80">
      <div className="flex h-16 items-center px-6">
        <Logo variant="dark" className="text-2xl" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            R
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Robin</p>
            <p className="truncate text-xs text-white/45">Levo · Montpellier</p>
          </div>
          <Link
            href="/dashboard/settings"
            aria-label="Paramètres"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isActive(pathname, "/dashboard/settings")
                ? "bg-white/10 text-white"
                : "text-white/45 hover:bg-white/5 hover:text-white",
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
