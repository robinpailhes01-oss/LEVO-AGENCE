"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="frost fixed inset-x-0 bottom-0 z-40 border-t border-line/60 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-200",
                active ? "text-accent" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  active && "bg-accent/10",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.9} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
