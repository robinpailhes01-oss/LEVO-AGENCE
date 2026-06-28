import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AgentMock, AgentStatus } from "@/lib/mock";

const STATUS: Record<AgentStatus, { label: string; color: string }> = {
  active: { label: "Actif", color: "#1D9E75" },
  working: { label: "Au travail", color: "#E0922A" },
  idle: { label: "En veille", color: "#9AA0AC" },
};

export function AgentCard({ agent }: { agent: AgentMock }) {
  const status = STATUS[agent.status];

  return (
    <div
      className="group relative flex w-[78vw] shrink-0 flex-col rounded-[26px] bg-card p-6 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lift sm:w-[300px] md:w-auto"
      style={{ ["--agent" as string]: agent.color } as React.CSSProperties}
    >
      {/* header: large portrait + identity */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {/* soft colored halo, always visible, stronger on hover */}
          <span
            aria-hidden
            className="absolute -inset-1.5 rounded-full opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-60"
            style={{ backgroundColor: agent.color }}
          />
          <span
            className="relative block rounded-full p-[3px]"
            style={{ background: `linear-gradient(145deg, ${agent.color}, ${agent.color}55)` }}
          >
            <Image
              src={agent.avatar}
              alt={agent.name}
              width={104}
              height={104}
              className="h-[92px] w-[92px] rounded-full border-[3px] border-white bg-white object-cover"
              style={{ objectPosition: "50% 26%" }}
              priority
            />
          </span>
          <span
            className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-white"
            style={{ backgroundColor: status.color }}
            aria-hidden
          >
            {agent.status === "working" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none tracking-tightest text-ink">
            {agent.name}
          </p>
          <p className="mt-1.5 text-[13px] text-muted">{agent.role}</p>
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${status.color}14`, color: status.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        </div>
      </div>

      {/* chat bubble — as if the agent is talking to you */}
      <div className="relative mt-5">
        <span
          aria-hidden
          className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 rounded-[2px]"
          style={{ backgroundColor: `${agent.color}12` }}
        />
        <div
          className="rounded-2xl px-4 py-3"
          style={{ backgroundColor: `${agent.color}12` }}
        >
          <p className="text-[13.5px] italic leading-relaxed text-ink/75">
            {agent.speech}
          </p>
        </div>
      </div>

      {/* stat */}
      <div className="mt-5">
        <p
          className="font-display text-[40px] font-semibold leading-none tracking-tightest"
          style={{ color: agent.color }}
        >
          {agent.stat.value}
        </p>
        <p className="mt-1.5 text-xs text-muted">{agent.stat.label}</p>
      </div>

      {/* CTA — fills with the agent color on hover */}
      <Link
        href={`/dashboard/${agent.key === "veille" ? "luna" : agent.key}`}
        className="agent-cta levo-pressable mt-5 inline-flex items-center justify-between rounded-full px-5 py-3 text-sm font-medium transition-all duration-300"
      >
        Parler à {agent.name}
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}
