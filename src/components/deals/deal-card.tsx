"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Deal } from "@/lib/types/deal";
import type { Customer } from "@/lib/types/customer";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type DealCardProps = {
  deal: Deal;
  customer?: Customer;
};

export function DealCard({ deal, customer }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: deal.id });

  const probability = Math.max(0, Math.min(100, deal.probability));

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-card p-3 shadow-sm transition-shadow",
        isDragging
          ? "opacity-60 shadow-lg ring-2 ring-[var(--color-accent-300)]"
          : "hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="ドラッグ"
          className="-ml-1 mt-0.5 cursor-grab touch-none text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)] active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Link
          href={`/deals/${deal.id}`}
          className="block flex-1 min-w-0 hover:underline"
        >
          <p className="truncate text-sm font-semibold text-[var(--color-ink-950)]">
            {deal.title}
          </p>
          <p className="truncate text-xs text-[var(--color-ink-500)]">
            {customer?.name ?? "顧客未設定"}
          </p>
        </Link>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-bold text-[var(--color-accent-700)]">
          {formatYen(deal.amount)}
        </span>
        <span className="text-[11px] text-[var(--color-ink-500)]">
          {fmtDate(deal.expectedCloseDate)}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-500)]">
          <span>確度</span>
          <span className="font-medium text-[var(--color-ink-700)]">
            {probability}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
          <div
            className="h-1.5 rounded-full bg-[var(--color-accent-600)] transition-[width]"
            style={{ width: `${probability}%` }}
          />
        </div>
      </div>

      {deal.nextAction ? (
        <p className="truncate text-[11px] text-[var(--color-ink-500)]">
          次: {deal.nextAction}
        </p>
      ) : null}
    </div>
  );
}
