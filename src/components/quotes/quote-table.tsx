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
    <>
      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {quotes.map((q) => {
          const customer = customerById.get(q.customerId);
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => router.push(`/quotes/${q.id}`)}
                className="block w-full rounded-xl border border-[var(--color-line)] bg-card p-4 text-left shadow-sm transition-colors hover:bg-[var(--color-bg-soft)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">
                      {q.number}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-[var(--color-ink-950)]">
                      {q.title || "（無題）"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-ink-500)]">
                      {customer?.name ?? "（顧客未設定）"}
                    </p>
                  </div>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            nativeButton={false}
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
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-base font-bold tabular-nums text-[var(--color-ink-950)]">
                    {formatYen(q.total)}
                  </span>
                  <QuoteStatusBadge status={q.status} />
                </div>
                <div className="mt-2 text-[11px] text-[var(--color-ink-500)]">
                  発行日：{fmtDate(q.issueDate)}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Tablet & Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--color-line)] bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">番号</TableHead>
              <TableHead className="hidden lg:table-cell">顧客</TableHead>
              <TableHead>件名</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead className="w-28">状態</TableHead>
              <TableHead className="hidden w-32 xl:table-cell">
                発行日
              </TableHead>
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
                  <TableCell className="hidden text-sm lg:table-cell">
                    {customer?.name ?? (
                      <span className="text-[var(--color-ink-500)]">
                        （未設定）
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md text-sm">
                    <div className="truncate">{q.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--color-ink-500)] lg:hidden">
                      {customer?.name ?? "（顧客未設定）"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatYen(q.total)}
                  </TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="hidden text-xs text-[var(--color-ink-500)] xl:table-cell">
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
                            nativeButton={false}
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
    </>
  );
}
