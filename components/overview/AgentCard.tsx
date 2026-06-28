import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AgentMock, AgentStatus } from "@/lib/mock";

const STATUS: Record<AgentStatus, { label: string; color: string }> = {
  active: { label: "Actif", color: "#1D9E75" },
  working: { label: "Au travail", color: "#E08A1E" },
  idle: { label: "En veille", color: "#9AA3AF" },
};

/** Soft tint of the agent color for the speech bubble. */
function tint(hex: string): string {
  return `${hex}12`;
}

export function AgentCard({ agent }: { agent: AgentMock }) {
  const status = STATUS[agent.status];

  return (
    <div
      className="flex w-[min(85vw,320px)] shrink-0 flex-col rounded-2xl bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift md:w-auto"
      style={{ borderTop: `3px solid ${agent.color}` }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src={agent.avatar}
            alt={agent.name}
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full"
          />
          <span
            className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white"
            style={{ backgroundColor: status.color }}
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-tight text-ink">
            {agent.name}
          </p>
          <p className="text-sm text-muted">{agent.role}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: status.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl px-3.5 py-3"
        style={{ backgroundColor: tint(agent.color) }}
      >
        <p className="text-[13px] italic leading-snug text-ink/75">
          “{agent.speech}”
        </p>
      </div>

      <div className="mt-4">
        <p
          className="font-display text-3xl font-semibold leading-none"
          style={{ color: agent.color }}
        >
          {agent.stat.value}
        </p>
        <p className="mt-1 text-xs text-muted">{agent.stat.label}</p>
      </div>

      <Link
        href={`/dashboard/${agent.key === "veille" ? "luna" : agent.key}`}
        className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: agent.color }}
      >
        Parler à {agent.name}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
