import { cn } from "@/lib/utils";

/** Levo wordmark — Cormorant display + accent dot. */
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
        "font-display font-semibold tracking-tight inline-flex items-baseline",
        variant === "dark" ? "text-white" : "text-ink",
        className,
      )}
    >
      Levo
      <span className="ml-0.5 h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-accent" />
    </span>
  );
}
