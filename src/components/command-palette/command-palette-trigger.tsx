"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "./command-palette-provider";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/**
 * Header trigger button. Shows full pill on sm+ ("コマンドを検索" + "Cmd+K"),
 * collapses to icon-only on mobile.
 */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const { setOpen } = useCommandPalette();
  const mounted = useMounted();
  const isMac =
    mounted &&
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <>
      {/* Desktop / tablet: pill style with placeholder + shortcut */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="コマンドパレットを開く"
        className={cn(
          "hidden sm:inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-2.5 text-xs text-[var(--color-ink-500)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)]",
          className,
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span>コマンドを検索</span>
        <kbd className="ml-2 rounded border border-[var(--color-line)] bg-card px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-700)]">
          {shortcut}
        </kbd>
      </button>

      {/* Mobile: icon-only */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="コマンドパレットを開く"
        className="sm:hidden"
      >
        <Search className="h-4 w-4" />
      </Button>
    </>
  );
}
