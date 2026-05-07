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
        <SelectTrigger className="w-48 bg-card" aria-label="業種を切り替える">
          <SelectValue>
            <span className="mr-2">{INDUSTRY_EMOJIS[industry]}</span>
            {INDUSTRY_LABELS[industry]}
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
