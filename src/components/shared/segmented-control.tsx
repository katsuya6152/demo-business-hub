"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
  /**
   * Optional shared id used to wire tab <-> tabpanel via aria-controls.
   * If omitted, an internal useId() is generated (tab -> panel link not externally addressable).
   */
  groupId?: string;
};

/**
 * Pill-shaped segmented control with a sliding indicator.
 * - WAI-ARIA tablist semantics + arrow-key navigation
 * - Indicator slides via translateX with equal-width auto-cols-fr grid
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
  groupId,
}: SegmentedControlProps<T>) {
  const internalId = useId();
  const id = groupId ?? internalId;
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const heightCls = size === "sm" ? "h-9" : "h-10 md:h-9";

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    e.preventDefault();
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % options.length;
    if (e.key === "ArrowLeft") next = (index - 1 + options.length) % options.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = options.length - 1;
    onChange(options[next].value);
    // Move focus to the newly active button
    requestAnimationFrame(() => {
      buttonsRef.current[next]?.focus();
    });
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-grid grid-flow-col auto-cols-fr items-center rounded-full bg-[var(--color-accent-100)] p-1",
        heightCls,
        className,
      )}
    >
      {/* Sliding indicator */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-card shadow-sm ring-1 ring-[var(--color-line)] transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${opt.value}`}
            aria-selected={active}
            aria-controls={`${id}-panel-${opt.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)]",
              size === "sm" ? "h-7" : "h-8",
              active
                ? "text-[var(--color-accent-700)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)]",
            )}
          >
            {opt.icon ? (
              <span
                className={cn(
                  "inline-flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4",
                )}
              >
                {opt.icon}
              </span>
            ) : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
