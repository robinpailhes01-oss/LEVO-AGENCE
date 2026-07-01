import type { AgentLog, AgentName } from "@/lib/db";

const AGENT_COLOR: Record<AgentName, string> = {
  LUNA: "#1A3BFF",
  ORION: "#1D9E75",
  HERMES: "#BA7517",
  VEILLE: "#7B2FBE",
  LEA: "#0D9488",
};

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function ActivityLog({ logs }: { logs: AgentLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Aucune activité pour l'instant. Les actions des agents apparaîtront ici.
      </p>
    );
  }
  return (
    <ul className="relative space-y-0.5">
      {logs.map((log) => (
        <li
          key={log.id}
          className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-background"
        >
          <span className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
            <span
              className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: AGENT_COLOR[log.agent_name] ?? "#6B7280" }}
            />
          </span>
          <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink/75">
            <span className="font-semibold text-ink">{log.agent_name}</span> {log.action}
          </p>
          <time className="shrink-0 pt-0.5 text-xs tabular-nums text-muted/70">
            {relative(log.created_at)}
          </time>
        </li>
      ))}
    </ul>
  );
}
