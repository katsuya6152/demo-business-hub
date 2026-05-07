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

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--color-bg-soft)]">
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              番号
            </TableHead>
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              顧客
            </TableHead>
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              件名
            </TableHead>
            <TableHead className="text-right text-xs text-[var(--color-ink-500)]">
              金額
            </TableHead>
            <TableHead className="text-xs text-[var(--color-ink-500)]">
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
                  {customerName(inv.customerId)}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-ink-700)]">
                  {inv.title}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[var(--color-ink-950)]">
                  {formatYen(inv.total)}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-ink-500)]">
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
  );
}
