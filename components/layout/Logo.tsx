import { cn } from "@/lib/utils";

/** Levo wordmark — accent dot + Cormorant display. */
export function Logo({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-semibold tracking-tightest",
        variant === "dark" ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(26,59,255,0.6)]" />
      Levo
    </span>
  );
}
