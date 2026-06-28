import type { AgentLog, AgentName } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const AGENT_COLOR: Record<AgentName, string> = {
  luna: "#1A3BFF",
  orion: "#1D9E75",
  hermes: "#BA7517",
  veille: "#7B2FBE",
  system: "#6B7280",
};

const STATUS_RING: Record<AgentLog["status"], string> = {
  success: "#1D9E75",
  error: "#DC2626",
  info: "#6B7280",
};

export function ActivityLog({ logs }: { logs: AgentLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Aucune activité pour l'instant. Les agents la rempliront ici.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-background"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_RING[log.status] }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              <span
                className="font-semibold uppercase"
                style={{ color: AGENT_COLOR[log.agent] }}
              >
                {log.agent}
              </span>{" "}
              <span className="text-ink/80">{log.action}</span>
            </p>
            {log.summary && (
              <p className="truncate text-xs text-muted">{log.summary}</p>
            )}
          </div>
          <time className="shrink-0 text-xs text-muted/70">
            {formatRelativeTime(log.created_at)}
          </time>
        </li>
      ))}
    </ul>
  );
}
