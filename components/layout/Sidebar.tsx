"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/lib/nav";
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
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className="h-5 w-5 shrink-0"
                style={active && item.accent ? { color: item.accent } : undefined}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link
          href={SETTINGS_ITEM.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(pathname, SETTINGS_ITEM.href)
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <SETTINGS_ITEM.icon className="h-5 w-5" />
          {SETTINGS_ITEM.label}
        </Link>
      </div>
    </aside>
  );
}
