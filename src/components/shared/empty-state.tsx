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
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] py-12 px-6 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-[var(--color-ink-500)]">{icon}</div>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink-950)]">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-xs text-[var(--color-ink-500)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
