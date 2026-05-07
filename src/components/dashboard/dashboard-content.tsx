"use client";

import { format } from "date-fns";
import { useIndustry } from "@/hooks/use-industry";
import { INDUSTRY_LABELS, INDUSTRY_EMOJIS } from "@/lib/types/industry";
import { useSettingsStore } from "@/lib/store/settings";
import { AiQueryBar } from "./ai-query-bar";
import { KpiCards } from "./kpi-cards";
import { RevenueChart } from "./revenue-chart";
import { PipelineSummary } from "./pipeline-summary";
import { RecentActivity } from "./recent-activity";

export function DashboardContent() {
  const industry = useIndustry();
  const meta = useSettingsStore((s) => s.meta);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
          ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          {INDUSTRY_EMOJIS[industry]} {INDUSTRY_LABELS[industry]} ・ 最終更新{" "}
          {meta.lastResetAt
            ? format(new Date(meta.lastResetAt), "yyyy-MM-dd HH:mm")
            : "—"}
        </p>
      </div>

      <AiQueryBar />

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart />
        <PipelineSummary />
      </div>

      <RecentActivity />
    </div>
  );
}
