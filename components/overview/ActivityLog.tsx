import { ACTIVITY_MOCK } from "@/lib/mock";

export function ActivityLog() {
  return (
    <ul className="relative space-y-0.5">
      {ACTIVITY_MOCK.map((item, i) => (
        <li
          key={i}
          className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-background"
        >
          <span className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
            <span
              className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
          </span>
          <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink/75">
            {item.text}
          </p>
          <time className="shrink-0 pt-0.5 text-xs tabular-nums text-muted/70">
            {item.time}
          </time>
        </li>
      ))}
    </ul>
  );
}
