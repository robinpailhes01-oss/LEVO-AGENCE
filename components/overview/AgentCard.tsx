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
      {/* header: clean portrait + identity (no glow — Apple restraint) */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className="rounded-full p-[2px] shadow-[0_8px_20px_-8px_rgba(16,24,40,0.25)]"
            style={{ backgroundColor: `${agent.color}66` }}
          >
            <Image
              src={agent.avatar}
              alt={agent.name}
              width={104}
              height={104}
              className="h-[88px] w-[88px] rounded-full border-2 border-white bg-white object-cover"
              style={{ objectPosition: "50% 26%" }}
              priority
            />
          </div>
          <span
            className="absolute bottom-0.5 right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[3px] border-white"
            style={{ backgroundColor: status.color }}
            aria-hidden
          >
            {agent.status === "working" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-display text-[22px] font-semibold leading-none tracking-tightest text-ink">
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

      {/* speech bubble — neutral iMessage-style gray */}
      <div className="relative mt-5">
        <span
          aria-hidden
          className="absolute -top-1 left-6 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink/[0.045]"
        />
        <div className="rounded-2xl bg-ink/[0.045] px-4 py-3">
          <p className="text-[13.5px] italic leading-relaxed text-ink/70">
            {agent.speech}
          </p>
        </div>
      </div>

      {/* stat */}
      <div className="mt-5">
        <p
          className="font-display text-[40px] font-semibold leading-none tracking-apple-tight"
          style={{ color: agent.color }}
        >
          {agent.stat.value}
        </p>
        <p className="mt-1.5 text-xs text-muted">{agent.stat.label}</p>
      </div>

      {/* CTA — tinted, fills with the agent color on hover */}
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
