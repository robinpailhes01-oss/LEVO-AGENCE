import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: string;
}

export function KpiCard({ label, value, icon: Icon, trend, accent = "#1A3BFF" }: KpiCardProps) {
  return (
    <div className="levo-kpi flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.positive ? "text-success" : "text-danger",
            )}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
