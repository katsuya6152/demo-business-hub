"use client";

import { useRouter } from "next/navigation";
import { Copy, MoreVertical, Trash2 } from "lucide-react";

import type { Quote } from "@/lib/types/quote";
import type { Customer } from "@/lib/types/customer";
import { fmtDate } from "@/lib/utils/date";
import { formatYen } from "@/lib/utils/currency";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuoteStatusBadge } from "@/components/shared/status-badge";

type QuoteTableProps = {
  quotes: Quote[];
  customers: Customer[];
  onDuplicate: (id: string) => void;
  onRequestDelete: (id: string) => void;
};

export function QuoteTable({
  quotes,
  customers,
  onDuplicate,
  onRequestDelete,
}: QuoteTableProps) {
  const router = useRouter();
  const customerById = new Map(customers.map((c) => [c.id, c]));

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">番号</TableHead>
            <TableHead>顧客</TableHead>
            <TableHead>件名</TableHead>
            <TableHead className="text-right">金額</TableHead>
            <TableHead className="w-28">状態</TableHead>
            <TableHead className="w-32">発行日</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((q) => {
            const customer = customerById.get(q.customerId);
            return (
              <TableRow
                key={q.id}
                className="cursor-pointer"
                onClick={() => router.push(`/quotes/${q.id}`)}
              >
                <TableCell className="font-mono text-xs text-[var(--color-ink-700)]">
                  {q.number}
                </TableCell>
                <TableCell className="text-sm">
                  {customer?.name ?? (
                    <span className="text-[var(--color-ink-500)]">
                      （未設定）
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-md truncate text-sm">
                  {q.title}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatYen(q.total)}
                </TableCell>
                <TableCell>
                  <QuoteStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-xs text-[var(--color-ink-500)]">
                  {fmtDate(q.issueDate)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="操作"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDuplicate(q.id)}>
                        <Copy className="h-4 w-4" />
                        複製
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onRequestDelete(q.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
