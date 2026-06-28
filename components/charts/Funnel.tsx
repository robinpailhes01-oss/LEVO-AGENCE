/** Conversion funnel as clean horizontal bars (legible, premium). */
export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const first = stages[0]?.value || 1;

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => {
        const widthPct = Math.max(8, (stage.value / first) * 100);
        const conv = i === 0 ? 100 : Math.round((stage.value / first) * 100);
        return (
          <div key={stage.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium text-ink">{stage.label}</span>
              <span className="flex items-baseline gap-2">
                <span className="font-sans text-[13px] font-semibold tabular-nums text-ink">
                  {stage.value.toLocaleString("fr-FR")}
                </span>
                <span className="w-9 text-right text-[11px] tabular-nums text-muted">
                  {conv}%
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/[0.05]">
              <div
                className="chart-bar h-full rounded-full"
                style={{
                  width: `${widthPct}%`,
                  animationDelay: `${i * 0.09}s`,
                  background: `linear-gradient(90deg, ${stage.color}, ${stage.color}bb)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
