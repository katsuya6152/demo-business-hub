import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "accent" | "warn" | "success";
  interactive?: boolean;
  className?: string;
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "",
  accent: "border-[var(--color-accent-200)] bg-[var(--color-accent-50)]",
  warn: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
  success: "border-[var(--color-cyan-200)] bg-[var(--color-cyan-50)]",
};

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  interactive = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-line)] bg-card px-5 py-4 shadow-sm transition-all duration-200",
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-accent-300)]",
        toneClasses[tone],
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-500)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-ink-950)] md:text-[26px]">
        {value}
      </p>
      {sub ? (
        <div className="mt-1.5 text-xs text-[var(--color-ink-500)]">{sub}</div>
      ) : null}
    </div>
  );
}
