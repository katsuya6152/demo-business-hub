"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useIndustry } from "@/hooks/use-industry";
import { resetAllData } from "@/lib/store";
import {
  type Industry,
  INDUSTRIES,
  INDUSTRY_LABELS,
  INDUSTRY_EMOJIS,
} from "@/lib/types/industry";
import { toast } from "sonner";

export function IndustrySwitcher() {
  const industry = useIndustry();
  const [pending, setPending] = useState<Industry | null>(null);

  const handleChange = (next: Industry | null) => {
    if (!next || next === industry) return;
    setPending(next);
  };

  const confirmSwitch = () => {
    if (!pending) return;
    resetAllData(pending);
    toast.success(
      `業種を ${INDUSTRY_LABELS[pending]} に切り替えました（サンプルデータを再投入）`,
    );
    setPending(null);
  };

  return (
    <>
      <Select value={industry} onValueChange={handleChange}>
        <SelectTrigger
          className="h-9 w-auto min-w-[3.25rem] gap-1 bg-card px-2 sm:w-44 sm:min-w-0 sm:px-3 md:w-48"
          aria-label="業種を切り替える"
        >
          <SelectValue>
            <span className="inline-flex items-center gap-2">
              <span className="text-base leading-none">
                {INDUSTRY_EMOJIS[industry]}
              </span>
              <span className="hidden sm:inline">
                {INDUSTRY_LABELS[industry]}
              </span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {INDUSTRIES.map((ind) => (
            <SelectItem key={ind} value={ind}>
              <span className="mr-2">{INDUSTRY_EMOJIS[ind]}</span>
              {INDUSTRY_LABELS[ind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="業種を切り替えますか？"
        description={
          <>
            現在のデータがすべてリセットされ、
            <strong>
              {pending ? ` ${INDUSTRY_LABELS[pending]} ` : " "}
            </strong>
            のサンプルデータに置き換わります。元には戻せません。
          </>
        }
        confirmLabel="切り替える"
        variant="destructive"
        onConfirm={confirmSwitch}
      />
    </>
  );
}
