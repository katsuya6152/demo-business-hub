"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Wallet, Trash2 } from "lucide-react";
import { parseISO, isBefore } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";
import type { Invoice, InvoiceStatus } from "@/lib/types/invoice";
import type { Customer } from "@/lib/types/customer";

type InvoiceTableProps = {
  invoices: Invoice[];
  customers: Customer[];
  onPay: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
};

function effectiveStatus(invoice: Invoice, ref: Date): InvoiceStatus {
  if (
    invoice.status === "sent" &&
    isBefore(parseISO(invoice.dueDate), ref)
  ) {
    return "overdue";
  }
  return invoice.status;
}

export function InvoiceTable({
  invoices,
  customers,
  onPay,
  onDelete,
}: InvoiceTableProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const customerById = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  return (
    <>
      {/* Mobile / small tablet: card list */}
      <ul className="space-y-3 lg:hidden">
        {invoices.map((inv) => {
          const status = effectiveStatus(inv, today);
          const customer = customerById.get(inv.customerId);
          return (
            <li key={inv.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/invoices/${inv.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/invoices/${inv.id}`);
                  }
                }}
                className="block w-full cursor-pointer rounded-lg border border-[var(--color-line)] bg-card p-4 text-left transition-colors hover:bg-[var(--color-bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[var(--color-ink-950)]">
                        {inv.number}
                      </span>
                      <InvoiceStatusBadge status={status} />
                    </div>
                    <p className="text-sm text-[var(--color-ink-700)]">
                      {customer?.name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-[var(--color-ink-500)]">
                      {inv.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold tabular-nums text-[var(--color-ink-950)]">
                      {formatYen(inv.total)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[var(--color-ink-500)]">
                      発行 {fmtDate(inv.issueDate)}
                    </span>
                    <span
                      className={
                        status === "overdue"
                          ? "font-medium text-red-600"
                          : "text-[var(--color-ink-500)]"
                      }
                    >
                      期限 {fmtDate(inv.dueDate)}
                    </span>
                  </div>
                  <span
                    role="presentation"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="メニュー"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPay(inv)}
                          disabled={inv.status === "paid"}
                        >
                          <Wallet className="h-4 w-4" />
                          入金記録
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(inv)}
                        >
                          <Trash2 className="h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Tablet / desktop: table (some columns hidden on tablet) */}
      <div className="hidden rounded-lg border border-[var(--color-line)] bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--color-bg-soft)]">
              <TableHead className="text-xs text-[var(--color-ink-500)]">
                番号
              </TableHead>
              <TableHead className="text-xs text-[var(--color-ink-500)]">
                顧客
              </TableHead>
              <TableHead className="hidden text-xs text-[var(--color-ink-500)] xl:table-cell">
                件名
              </TableHead>
              <TableHead className="text-right text-xs text-[var(--color-ink-500)]">
                金額
              </TableHead>
              <TableHead className="hidden text-xs text-[var(--color-ink-500)] xl:table-cell">
                発行
              </TableHead>
              <TableHead className="text-xs text-[var(--color-ink-500)]">
                期限
              </TableHead>
              <TableHead className="text-xs text-[var(--color-ink-500)]">
                状態
              </TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const status = effectiveStatus(inv, today);
              const customer = customerById.get(inv.customerId);
              return (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                >
                  <TableCell className="font-medium text-[var(--color-ink-950)]">
                    {inv.number}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-ink-700)]">
                    {customer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-md truncate text-sm text-[var(--color-ink-700)] xl:table-cell">
                    {inv.title}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-[var(--color-ink-950)]">
                    {formatYen(inv.total)}
                  </TableCell>
                  <TableCell className="hidden text-sm text-[var(--color-ink-500)] xl:table-cell">
                    {fmtDate(inv.issueDate)}
                  </TableCell>
                  <TableCell
                    className={
                      status === "overdue"
                        ? "text-sm font-medium text-red-600"
                        : "text-sm text-[var(--color-ink-500)]"
                    }
                  >
                    {fmtDate(inv.dueDate)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={status} />
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
                            aria-label="メニュー"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPay(inv)}
                          disabled={inv.status === "paid"}
                        >
                          <Wallet className="h-4 w-4" />
                          入金記録
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(inv)}
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
