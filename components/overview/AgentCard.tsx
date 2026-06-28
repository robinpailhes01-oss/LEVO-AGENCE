import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AgentMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

export type AgentStatus = "active" | "idle" | "working";

const STATUS_LABEL: Record<AgentStatus, string> = {
  active: "Actif",
  idle: "En veille",
  working: "Au travail",
};

const STATUS_COLOR: Record<AgentStatus, string> = {
  active: "#1D9E75",
  idle: "#9AA3AF",
  working: "#1A3BFF",
};

export interface AgentCardProps {
  agent: AgentMeta;
  href: string;
  status: AgentStatus;
  lastAction: string;
  stat: { value: string; label: string };
}

export function AgentCard({
  agent,
  href,
  status,
  lastAction,
  stat,
}: AgentCardProps) {
  return (
    <div
      className="levo-card flex flex-col p-5 transition-shadow hover:shadow-lift"
      style={{ borderTop: `3px solid ${agent.color}` }}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Image
            src={agent.avatar}
            alt={agent.name}
            width={52}
            height={52}
            className="rounded-full"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: STATUS_COLOR[status] }}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-tight text-ink">
            {agent.name}
          </p>
          <p className="truncate text-xs text-muted">{agent.role}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: `${STATUS_COLOR[status]}1A`,
            color: STATUS_COLOR[status],
          }}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* speech bubble — last action */}
      <div className="relative mt-4 rounded-xl bg-background px-3 py-2.5">
        <span
          className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 bg-background"
          aria-hidden
        />
        <p className="line-clamp-2 text-[13px] leading-snug text-ink/80">
          {lastAction}
        </p>
      </div>

      {/* main stat */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p
            className="font-display text-3xl font-semibold leading-none"
            style={{ color: agent.color }}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-muted">{stat.label}</p>
        </div>
      </div>

      <Link
        href={href}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: agent.color }}
      >
        Parler à {agent.name}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
