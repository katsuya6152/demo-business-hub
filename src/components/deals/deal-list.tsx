"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DealStageBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";
import type { Deal } from "@/lib/types/deal";
import type { Customer } from "@/lib/types/customer";

type DealListProps = {
  deals: Deal[];
  customers: Customer[];
};

export function DealList({ deals, customers }: DealListProps) {
  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  if (deals.length === 0) {
    return (
      <EmptyState
        title="案件がまだありません"
        description="「+ 新規案件」から最初の案件を登録してください"
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>顧客</TableHead>
            <TableHead>ステージ</TableHead>
            <TableHead className="text-right">金額</TableHead>
            <TableHead className="text-right">確度</TableHead>
            <TableHead>期待クローズ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const customer = customerMap.get(deal.customerId);
            return (
              <TableRow key={deal.id}>
                <TableCell>
                  <Link
                    href={`/deals/${deal.id}`}
                    className="font-medium text-[var(--color-ink-950)] hover:underline"
                  >
                    {deal.title}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--color-ink-700)]">
                  {customer?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <DealStageBadge stage={deal.stage} />
                </TableCell>
                <TableCell className="text-right font-medium text-[var(--color-ink-950)]">
                  {formatYen(deal.amount)}
                </TableCell>
                <TableCell className="text-right text-[var(--color-ink-700)]">
                  {deal.probability}%
                </TableCell>
                <TableCell className="text-[var(--color-ink-700)]">
                  {fmtDate(deal.expectedCloseDate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
