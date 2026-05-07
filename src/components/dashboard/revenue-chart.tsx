"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { usePaymentsStore } from "@/lib/store/payments";
import { monthlyRevenue } from "@/lib/utils/aggregations";

const TICK_FONT = { fontSize: 11, fill: "var(--color-ink-500)" } as const;

function formatTick(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return String(amount);
}

export function RevenueChart() {
  const payments = usePaymentsStore((s) => s.payments);
  const data = monthlyRevenue(payments, 6).map((row) => ({
    month: row.month.slice(5),
    amount: row.amount,
  }));

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-[var(--color-ink-950)]">
          売上推移（直近6ヶ月）
        </h3>
        <p className="text-xs text-[var(--color-ink-500)]">
          月別の入金合計
        </p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
            <XAxis dataKey="month" tick={TICK_FONT} tickLine={false} />
            <YAxis
              tickFormatter={formatTick}
              tick={TICK_FONT}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "var(--color-accent-50)" }}
              formatter={(value) => [
                `¥${Number(value ?? 0).toLocaleString()}`,
                "入金",
              ]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-line)",
              }}
            />
            <Bar
              dataKey="amount"
              fill="var(--color-accent-600)"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
