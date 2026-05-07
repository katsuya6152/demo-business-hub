"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndustrySwitcher } from "./industry-switcher";
import { MobileNavTrigger } from "./mobile-nav";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useIndustry } from "@/hooks/use-industry";
import { resetAllData } from "@/lib/store";
import { INDUSTRY_LABELS } from "@/lib/types/industry";
import { toast } from "sonner";

export function Header() {
  const industry = useIndustry();
  const [now, setNow] = useState<string>("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const tick = () => setNow(format(new Date(), "yyyy-MM-dd HH:mm"));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleReset = () => {
    resetAllData(industry);
    toast.success(
      `${INDUSTRY_LABELS[industry]} のサンプルデータでリセットしました`,
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[var(--color-line)] bg-card/95 px-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <MobileNavTrigger />
        <p className="text-sm font-semibold text-[var(--color-ink-950)] truncate">
          統合業務ハブ
        </p>
        <span className="hidden lg:inline text-xs text-[var(--color-ink-500)] tabular-nums">
          {now}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CommandPaletteTrigger />
        <ThemeToggle />
        <IndustrySwitcher />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetOpen(true)}
          className="gap-1.5"
          aria-label="現在の業種でデータをリセット"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">リセット</span>
        </Button>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="現在の業種でデータをリセット"
        description={
          <>
            現在のデータがすべて初期サンプルデータに置き換わります。
            <strong className="block mt-1">
              業種: {INDUSTRY_LABELS[industry]}
            </strong>
          </>
        }
        confirmLabel="リセットする"
        variant="destructive"
        onConfirm={handleReset}
      />
    </header>
  );
}
