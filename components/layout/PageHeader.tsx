import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tightest text-ink md:text-[32px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Refined primary action button with an agent/brand color. */
export function ActionButton({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <button
      className="levo-pressable inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
      style={{
        backgroundColor: color,
        boxShadow: `0 10px 24px -10px ${color}99`,
      }}
    >
      {children}
    </button>
  );
}
