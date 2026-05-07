import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-50)] text-[var(--color-accent-600)] ring-1 ring-[var(--color-accent-200)]">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm">
        <p className="text-base font-semibold text-[var(--color-ink-950)]">
          {title}
        </p>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-500)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
