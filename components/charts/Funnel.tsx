/** Conversion funnel — centered decreasing bars (pure CSS/HTML). */
export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value)) || 1;

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct = 40 + (stage.value / max) * 60; // 40%..100%
        const conv = i === 0 ? 100 : Math.round((stage.value / stages[0]!.value) * 100);
        return (
          <div key={stage.label} className="flex flex-col items-center">
            <div
              className="relative flex h-12 items-center justify-between rounded-xl px-4 text-white shadow-soft transition-all duration-300"
              style={{
                width: `${widthPct}%`,
                background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`,
              }}
            >
              <span className="text-[13px] font-medium">{stage.label}</span>
              <span className="font-display text-lg font-semibold tabular-nums">
                {stage.value.toLocaleString("fr-FR")}
              </span>
            </div>
            <span className="mt-0.5 text-[10px] text-muted">{conv}%</span>
          </div>
        );
      })}
    </div>
  );
}
