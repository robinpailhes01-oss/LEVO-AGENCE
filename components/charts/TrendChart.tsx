/** Multi-series smooth area/line chart (pure SVG, dependency-free). */
export interface Series {
  name: string;
  color: string;
  data: number[];
}

function smooth(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function TrendChart({
  series,
  labels,
}: {
  series: Series[];
  labels: string[];
}) {
  const W = 720;
  const H = 240;
  const padX = 8;
  const padTop = 14;
  const padBottom = 14;
  const n = labels.length;

  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues) * 1.12;
  const min = 0;
  const span = max - min || 1;

  const xAt = (i: number) => padX + (i * (W - padX * 2)) / (n - 1);
  const yAt = (v: number) =>
    padTop + (1 - (v - min) / span) * (H - padTop - padBottom);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padTop + t * (H - padTop - padBottom));

  return (
    <div>
      {/* legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
            <span className="font-semibold text-ink">
              {s.data[s.data.length - 1]}
            </span>
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} aria-hidden>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`trend-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* grid */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="#1A1A1A"
            strokeOpacity={0.06}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* areas + lines */}
        {series.map((s, i) => {
          const pts = s.data.map((v, idx) => ({ x: xAt(idx), y: yAt(v) }));
          const line = smooth(pts);
          const area = `${line} L ${pts[pts.length - 1]!.x},${H - padBottom} L ${pts[0]!.x},${H - padBottom} Z`;
          return (
            <g key={s.name}>
              <path d={area} fill={`url(#trend-${i})`} />
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={pts[pts.length - 1]!.x}
                cy={pts[pts.length - 1]!.y}
                r={3.5}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* x labels */}
      <div className="mt-2 flex justify-between px-1 text-[11px] text-muted/80">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
