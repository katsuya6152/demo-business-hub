import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-bg-elevated)]",
        className,
      )}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-card px-5 py-4 shadow-sm">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-[var(--color-line)]">
      {[60, 100, 120, 80, 60].map((w, i) => (
        <td key={i} className="px-3 py-3">
          <Skeleton className="h-3" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}
