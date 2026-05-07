"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
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

const SORT_LABELS: Record<CustomerSortKey, string> = {
  name: "顧客名",
  revenue: "累積取引",
  updatedAt: "最終更新",
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
    <>
      {/* Mobile: card list (<640px) */}
      <div className="space-y-2 sm:hidden">
        <MobileSortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onChange={toggleSort}
        />
        <ul className="space-y-2">
          {sorted.map(({ customer, revenue }) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => onSelectCustomer(customer)}
                className="flex w-full flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-card p-4 text-left transition-colors hover:bg-[var(--color-bg-soft)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-[var(--color-ink-950)]">
                      {customer.name}
                    </p>
                    {customer.industry ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-ink-500)]">
                        {customer.industry}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CustomerStatusBadge status={customer.status} />
                    <ChevronRight className="h-4 w-4 text-[var(--color-ink-500)]" />
                  </div>
                </div>
                <div className="text-xs text-[var(--color-ink-700)]">
                  {customer.contactPerson}
                  {customer.contactRole ? (
                    <span className="ml-1 text-[var(--color-ink-500)]">
                      ・ {customer.contactRole}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-500)]">
                      累積取引
                    </p>
                    <p className="text-base font-semibold text-[var(--color-ink-950)] tabular-nums">
                      {formatYen(revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--color-ink-500)]">
                    {fmtRelative(customer.updatedAt)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tablet & Desktop: table (≥640px) — 業種/役職列は lg 以上のみ */}
      <div className="hidden rounded-lg border border-[var(--color-line)] bg-card sm:block">
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
              <TableHead className="hidden text-xs text-[var(--color-ink-500)] lg:table-cell">
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
                <TableCell className="hidden text-sm text-[var(--color-ink-700)] lg:table-cell">
                  {customer.industry || "—"}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-ink-700)]">
                  <div className="flex flex-col">
                    <span>{customer.contactPerson}</span>
                    {customer.contactRole ? (
                      <span className="hidden text-xs text-[var(--color-ink-500)] lg:inline">
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
    </>
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

function MobileSortBar({
  sortKey,
  sortDir,
  onChange,
}: {
  sortKey: CustomerSortKey;
  sortDir: SortDir;
  onChange: (key: CustomerSortKey) => void;
}) {
  const keys: CustomerSortKey[] = ["updatedAt", "name", "revenue"];
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs text-[var(--color-ink-500)]">
        並び替え
      </span>
      {keys.map((k) => {
        const active = k === sortKey;
        const Icon = active
          ? sortDir === "asc"
            ? ArrowUp
            : ArrowDown
          : ArrowUpDown;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={active}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-[var(--color-accent-600)] bg-[var(--color-accent-50)] text-[var(--color-accent-700)]"
                : "border-[var(--color-line)] bg-card text-[var(--color-ink-700)] hover:bg-[var(--color-bg-soft)]",
            )}
          >
            <span>{SORT_LABELS[k]}</span>
            <Icon className="h-3 w-3" />
          </button>
        );
      })}
    </div>
  );
}
