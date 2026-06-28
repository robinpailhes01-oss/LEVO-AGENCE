import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "green" | "amber" | "purple" | "red";

const toneMap: Record<Tone, string> = {
  neutral: "bg-background text-muted border-line",
  blue: "bg-accent/10 text-accent border-accent/20",
  green: "bg-success/10 text-success border-success/20",
  amber: "bg-warning/10 text-warning border-warning/20",
  purple: "bg-veille/10 text-veille border-veille/20",
  red: "bg-danger/10 text-danger border-danger/20",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneMap[tone],
        className,
      )}
      {...props}
    />
  );
}
