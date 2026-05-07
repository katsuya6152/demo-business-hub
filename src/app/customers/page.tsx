"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerSheet } from "@/components/customers/customer-sheet";
import { useCustomersStore } from "@/lib/store/customers";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import {
  CUSTOMER_STATUS_LABELS,
  type Customer,
  type CustomerStatus,
} from "@/lib/types/customer";

type StatusFilter = "all" | CustomerStatus;

export default function CustomersPage() {
  const customers = useCustomersStore((s) => s.customers);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [customers, query, statusFilter]);

  const handleSelect = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  return (
    <AppShell>
      <div className="space-y-4 pb-20 sm:space-y-6 sm:pb-0">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
              顧客
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              {customers.length} 件登録 ・ 検索 / フィルタ / ソート可能
            </p>
          </div>
          {/* Desktop / tablet only — mobile uses FAB */}
          <Button
            onClick={() => setSheetOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            新規顧客
          </Button>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="顧客名 / 担当者 / メールで検索"
              aria-label="顧客検索"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v) setStatusFilter(v as StatusFilter);
            }}
          >
            <SelectTrigger
              aria-label="ステータスでフィルタ"
              className="w-full sm:w-44"
            >
              <SelectValue>
                {statusFilter === "all"
                  ? "全てのステータス"
                  : CUSTOMER_STATUS_LABELS[statusFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのステータス</SelectItem>
              <SelectItem value="active">
                {CUSTOMER_STATUS_LABELS.active}
              </SelectItem>
              <SelectItem value="prospect">
                {CUSTOMER_STATUS_LABELS.prospect}
              </SelectItem>
              <SelectItem value="inactive">
                {CUSTOMER_STATUS_LABELS.inactive}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={
              customers.length === 0
                ? "顧客がまだ登録されていません"
                : "条件に一致する顧客がありません"
            }
            description={
              customers.length === 0
                ? "「+ 新規顧客」から最初の顧客を追加しましょう。"
                : "検索条件やフィルタを変えてみてください。"
            }
            action={
              customers.length === 0 ? (
                <Button onClick={() => setSheetOpen(true)}>
                  <Plus className="h-4 w-4" />
                  新規顧客
                </Button>
              ) : null
            }
          />
        ) : (
          <CustomerTable
            customers={filtered}
            invoices={invoices}
            payments={payments}
            onSelectCustomer={handleSelect}
          />
        )}
      </div>

      {/* Mobile FAB — bottom-nav (h-14) と被らないよう余白を取る */}
      <button
        type="button"
        aria-label="新規顧客を追加"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-600)] text-white shadow-lg transition-transform hover:scale-105 active:translate-y-px sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CustomerSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </AppShell>
  );
}
