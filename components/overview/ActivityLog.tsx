import { ACTIVITY_MOCK } from "@/lib/mock";

export function ActivityLog() {
  return (
    <ul className="space-y-1">
      {ACTIVITY_MOCK.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-background"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <p className="min-w-0 flex-1 text-sm text-ink/80">{item.text}</p>
          <time className="shrink-0 text-xs text-muted/70">{item.time}</time>
        </li>
      ))}
    </ul>
  );
}
