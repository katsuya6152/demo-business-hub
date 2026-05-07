"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useCustomersStore } from "@/lib/store/customers";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { buildCohortRevenue } from "@/lib/utils/cohort";

const TICK_FONT = { fontSize: 11, fill: "var(--color-ink-500)" } as const;

const COHORT_COLORS = [
  "var(--color-accent-600)",
  "var(--color-cyan-600)",
  "var(--color-accent-400)",
  "#8b5cf6", // purple-500（補助、テーマ token に無いので直書き）
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
];

function formatTick(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}

export function CohortChart() {
  const customers = useCustomersStore((s) => s.customers);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const { chartData, cohortSeries } = useMemo(() => {
    const { cohorts, monthOffsets } = buildCohortRevenue(
      customers,
      invoices,
      payments,
    );
    const series = cohorts.filter((c) => c.size > 0);
    const data = monthOffsets.map((offset) => {
      const row: Record<string, number | string> = { offset: `${offset}M` };
      series.forEach((c) => {
        row[c.cohort] = c.values[offset] ?? 0;
      });
      return row;
    });
    return { chartData: data, cohortSeries: series };
  }, [customers, invoices, payments]);

  const hasData = cohortSeries.length > 0;

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[var(--color-ink-950)]">
          コホート分析（累積入金）
        </h3>
        <p className="text-xs text-[var(--color-ink-500)]">
          顧客獲得月ごとの累積入金推移（横軸：獲得からの経過月）
        </p>
      </div>
      {!hasData ? (
        <p className="py-8 text-center text-xs text-[var(--color-ink-500)]">
          コホートを構成するデータがまだありません。
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-line)"
              />
              <XAxis dataKey="offset" tick={TICK_FONT} tickLine={false} />
              <YAxis
                tickFormatter={formatTick}
                tick={TICK_FONT}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-accent-300)" }}
                formatter={(value, name) => [
                  `¥${Number(value ?? 0).toLocaleString()}`,
                  String(name),
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--color-line)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="line"
              />
              {cohortSeries.map((c, i) => (
                <Line
                  key={c.cohort}
                  type="monotone"
                  dataKey={c.cohort}
                  name={`${c.cohort} (${c.size}社)`}
                  stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
