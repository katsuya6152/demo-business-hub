import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "accent" | "warn" | "success";
  className?: string;
};

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "",
  accent: "border-[var(--color-accent-200)] bg-[var(--color-accent-50)]",
  warn: "border-amber-200 bg-amber-50",
  success: "border-[var(--color-cyan-200)] bg-[var(--color-cyan-50)]",
};

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-line)] bg-card px-5 py-4 shadow-sm",
        toneClasses[tone],
        className,
      )}
    >
      <p className="text-xs font-medium text-[var(--color-ink-500)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-ink-950)]">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-[var(--color-ink-500)]">{sub}</p>
      ) : null}
    </div>
  );
}
