import { Euro, Users, Image as ImageIcon, Heart, type LucideIcon } from "lucide-react";
import type { KpiMock } from "@/lib/mock";
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
    <div className="rounded-2xl bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${kpi.accent}14`, color: kpi.accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            kpi.direction === "up" && "text-success",
            kpi.direction === "down" && "text-danger",
            kpi.direction === "flat" && "text-muted",
          )}
        >
          {kpi.direction === "up" && "▲ "}
          {kpi.direction === "down" && "▼ "}
          {kpi.direction === "flat" && "→ "}
          {kpi.trend}
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">
        {kpi.value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{kpi.label}</p>
    </div>
  );
}
