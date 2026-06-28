/** Donut / ring chart with center total and legend (pure SVG). */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  segments,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  const stroke = 16;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="chart-ring relative shrink-0">
        <svg viewBox="0 0 140 140" className="h-[140px] w-[140px] -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#1A1A1A" strokeOpacity={0.05} strokeWidth={stroke} />
          {segments.map((seg) => {
            const frac = seg.value / total;
            const dash = frac * C;
            const el = (
              <circle
                key={seg.label}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tracking-tightest text-ink">
            {total}
          </span>
          {centerLabel && (
            <span className="text-[10px] text-muted">{centerLabel}</span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-2 text-ink/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              {seg.label}
            </span>
            <span className="font-medium tabular-nums text-muted">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
