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
    <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-[248px] md:flex-col md:bg-sidebar md:p-3">
      <div className="flex h-14 items-center px-3">
        <Logo variant="dark" className="text-[22px]" />
      </div>

      <nav className="mt-2 flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ease-smooth",
                active
                  ? "bg-white/[0.07] text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105"
                strokeWidth={1.9}
                style={active ? { color: "#6E80FF" } : undefined}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 rounded-2xl bg-white/[0.04] p-2">
        <div className="flex items-center gap-3 px-1.5 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3A56FF] text-sm font-semibold text-white shadow-soft">
            R
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">Robin</p>
            <p className="truncate text-[11px] text-white/40">Luma · Montpellier</p>
          </div>
          <Link
            href="/dashboard/settings"
            aria-label="Paramètres"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
              isActive(pathname, "/dashboard/settings")
                ? "bg-white/10 text-white"
                : "text-white/40 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <Settings className="h-[17px] w-[17px]" strokeWidth={1.9} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
