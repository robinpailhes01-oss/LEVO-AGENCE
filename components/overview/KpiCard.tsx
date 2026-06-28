import { Euro, Users, Image as ImageIcon, Heart, type LucideIcon } from "lucide-react";
import type { KpiMock } from "@/lib/mock";
import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/utils";

const ICONS: Record<KpiMock["icon"], LucideIcon> = {
  euro: Euro,
  users: Users,
  image: ImageIcon,
  heart: Heart,
};

export function KpiCard({ kpi }: { kpi: KpiMock }) {
  const Icon = ICONS[kpi.icon];
  return (
    <div className="levo-card group overflow-hidden p-5 transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${kpi.accent}12`, color: kpi.accent }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            kpi.direction === "up" && "bg-success/10 text-success",
            kpi.direction === "down" && "bg-danger/10 text-danger",
            kpi.direction === "flat" && "bg-background text-muted",
          )}
        >
          {kpi.direction === "up" && "↑"}
          {kpi.direction === "down" && "↓"}
          {kpi.trend}
        </span>
      </div>
      <p className="mt-4 font-display text-[28px] font-semibold leading-none tracking-tightest text-ink">
        {kpi.value}
      </p>
      <p className="mt-1.5 text-xs text-muted">{kpi.label}</p>
      <div className="-mx-5 -mb-5 mt-3">
        <Sparkline data={kpi.spark} color={kpi.accent} id={kpi.label.replace(/\s+/g, "")} height={38} />
      </div>
    </div>
  );
}
