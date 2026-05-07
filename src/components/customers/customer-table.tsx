"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerStatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { customerRevenue } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { fmtRelative } from "@/lib/utils/date";
import type { Customer } from "@/lib/types/customer";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";

export type CustomerSortKey = "name" | "revenue" | "updatedAt";
export type SortDir = "asc" | "desc";

type CustomerTableProps = {
  customers: Customer[];
  payments: Payment[];
  invoices: Invoice[];
  onSelectCustomer: (customer: Customer) => void;
};

export function CustomerTable({
  customers,
  payments,
  invoices,
  onSelectCustomer,
}: CustomerTableProps) {
  const [sortKey, setSortKey] = useState<CustomerSortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    return customers.map((c) => ({
      customer: c,
      revenue: customerRevenue(c.id, payments, invoices),
    }));
  }, [customers, payments, invoices]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.customer.name.localeCompare(b.customer.name, "ja");
      } else if (sortKey === "revenue") {
        cmp = a.revenue - b.revenue;
      } else {
        cmp =
          new Date(a.customer.updatedAt).getTime() -
          new Date(b.customer.updatedAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: CustomerSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--color-bg-soft)]">
            <SortableHead
              label="顧客名"
              sortKey="name"
              activeKey={sortKey}
              dir={sortDir}
              onClick={() => toggleSort("name")}
            />
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              業種
            </TableHead>
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              担当
            </TableHead>
            <TableHead className="text-xs text-[var(--color-ink-500)]">
              ステータス
            </TableHead>
            <SortableHead
              label="累積取引"
              sortKey="revenue"
              activeKey={sortKey}
              dir={sortDir}
              onClick={() => toggleSort("revenue")}
              align="right"
            />
            <SortableHead
              label="最終更新"
              sortKey="updatedAt"
              activeKey={sortKey}
              dir={sortDir}
              onClick={() => toggleSort("updatedAt")}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(({ customer, revenue }) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer"
              onClick={() => onSelectCustomer(customer)}
            >
              <TableCell className="font-medium text-[var(--color-ink-950)]">
                {customer.name}
              </TableCell>
              <TableCell className="text-sm text-[var(--color-ink-700)]">
                {customer.industry || "—"}
              </TableCell>
              <TableCell className="text-sm text-[var(--color-ink-700)]">
                <div className="flex flex-col">
                  <span>{customer.contactPerson}</span>
                  {customer.contactRole ? (
                    <span className="text-xs text-[var(--color-ink-500)]">
                      {customer.contactRole}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status} />
              </TableCell>
              <TableCell className="text-right font-medium text-[var(--color-ink-950)] tabular-nums">
                {formatYen(revenue)}
              </TableCell>
              <TableCell className="text-sm text-[var(--color-ink-500)]">
                {fmtRelative(customer.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align,
}: {
  label: string;
  sortKey: CustomerSortKey;
  activeKey: CustomerSortKey;
  dir: SortDir;
  onClick: () => void;
  align?: "right";
}) {
  const isActive = sortKey === activeKey;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead
      className={cn(
        "text-xs",
        isActive
          ? "text-[var(--color-ink-950)]"
          : "text-[var(--color-ink-500)]",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-[var(--color-ink-950)]",
          align === "right" && "ml-auto flex w-full justify-end",
        )}
      >
        <span>{label}</span>
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}
