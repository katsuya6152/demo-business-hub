"use client";

import { useDealsStore } from "@/lib/store/deals";
import { dealsByStage } from "@/lib/utils/aggregations";
import { Card } from "@/components/ui/card";
import { DEAL_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/types/deal";
import { formatYen } from "@/lib/utils/currency";

export function PipelineSummary() {
  const deals = useDealsStore((s) => s.deals);
  const grouped = dealsByStage(deals);

  const max = Math.max(
    1,
    ...PIPELINE_STAGES.map((s) =>
      grouped[s].reduce((sum, d) => sum + d.amount, 0),
    ),
  );

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-ink-950)]">
          案件パイプライン
        </h3>
        <p className="text-xs text-[var(--color-ink-500)]">
          ステージ別の合計金額
        </p>
      </div>
      <div className="space-y-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = grouped[stage];
          const total = items.reduce((sum, d) => sum + d.amount, 0);
          const ratio = total / max;
          return (
            <div key={stage}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-ink-700)]">
                  {DEAL_STAGE_LABELS[stage]}
                </span>
                <span className="font-mono text-[var(--color-ink-500)]">
                  {items.length}件 / {formatYen(total)}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent-600)]"
                  style={{ width: `${Math.max(2, ratio * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
