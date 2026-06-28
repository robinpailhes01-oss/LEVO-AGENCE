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
      {/* header: avatar + identity */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {/* soft colored glow */}
          <span
            aria-hidden
            className="absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40"
            style={{ backgroundColor: agent.color }}
          />
          <span
            className="relative block rounded-full p-[2.5px]"
            style={{ backgroundColor: `${agent.color}26` }}
          >
            <Image
              src={agent.avatar}
              alt={agent.name}
              width={68}
              height={68}
              className="h-[68px] w-[68px] rounded-full object-cover"
              style={{
                objectPosition: "50% 22%",
                boxShadow: `0 0 0 1.5px ${agent.color}55`,
              }}
            />
          </span>
          <span
            className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-white"
            style={{ backgroundColor: status.color }}
            aria-hidden
          />
        </div>

        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none tracking-tightest text-ink">
            {agent.name}
          </p>
          <p className="mt-1 text-[13px] text-muted">{agent.role}</p>
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium"
            style={{ color: status.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {status.label}
          </span>
        </div>
      </div>

      {/* speech bubble */}
      <p className="mt-5 text-[14px] leading-relaxed text-ink/65">
        <span className="mr-0.5 font-display text-lg leading-none text-ink/25">“</span>
        {agent.speech}
      </p>

      {/* stat */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p
            className="font-display text-[40px] font-semibold leading-none tracking-tightest"
            style={{ color: agent.color }}
          >
            {agent.stat.value}
          </p>
          <p className="mt-1.5 text-xs text-muted">{agent.stat.label}</p>
        </div>
      </div>

      {/* CTA — tinted by default, fills on hover */}
      <Link
        href={`/dashboard/${agent.key === "veille" ? "luna" : agent.key}`}
        className="agent-cta levo-pressable mt-5 inline-flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300"
      >
        Parler à {agent.name}
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}
