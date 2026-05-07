"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  Plus,
  Receipt,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useQuotesStore } from "@/lib/store/quotes";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useSetIndustry, useIndustry } from "@/hooks/use-industry";
import { resetAllData } from "@/lib/store";
import {
  INDUSTRIES,
  INDUSTRY_EMOJIS,
  INDUSTRY_LABELS,
  type Industry,
} from "@/lib/types/industry";
import { formatYen } from "@/lib/utils/currency";
import { DEAL_STAGE_LABELS } from "@/lib/types/deal";
import { toast } from "sonner";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NAV_COMMANDS = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/customers", label: "顧客", icon: Users },
  { href: "/deals", label: "案件", icon: Briefcase },
  { href: "/quotes", label: "見積", icon: FileText },
  { href: "/invoices", label: "請求", icon: Receipt },
  { href: "/settings", label: "設定", icon: SettingsIcon },
] as const;

const NEW_COMMANDS = [
  { href: "/customers", label: "新規顧客", hint: "顧客を追加" },
  { href: "/deals", label: "新規案件", hint: "案件を追加" },
  { href: "/quotes/new", label: "新規見積", hint: "見積書を作成" },
  { href: "/invoices/new", label: "新規請求", hint: "請求書を作成" },
] as const;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const setIndustry = useSetIndustry();
  const currentIndustry = useIndustry();

  // Reset search when palette closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setSearch(""), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const switchIndustry = useCallback(
    (industry: Industry) => {
      close();
      if (industry === currentIndustry) return;
      resetAllData(industry);
      setIndustry(industry);
      toast.success(
        `${INDUSTRY_LABELS[industry]} のサンプルデータでリセットしました`,
      );
    },
    [close, currentIndustry, setIndustry],
  );

  // Limit displayed entities for performance; cmdk filtering applies to rendered items
  const customersToShow = customers.slice(0, 50);
  const dealsToShow = deals.slice(0, 50);
  const quotesToShow = quotes.slice(0, 50);
  const invoicesToShow = invoices.slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-label="コマンドパレット"
      >
        <Command
          label="コマンドパレット"
          loop
          filter={(value, search, keywords) => {
            // Default-style scoring with case-insensitive match across value + keywords
            const haystack = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
            const needle = search.toLowerCase().trim();
            if (!needle) return 1;
            return haystack.includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="コマンドを検索 / Cmd+K"
            autoFocus
          />
          <CommandList>
            <CommandEmpty>該当するコマンドはありません</CommandEmpty>

            <CommandGroup heading="移動">
              {NAV_COMMANDS.map((c) => {
                const Icon = c.icon;
                return (
                  <CommandItem
                    key={`nav-${c.href}`}
                    value={`移動 ${c.label} ${c.href}`}
                    keywords={[c.label, "移動", "navigate", c.href]}
                    onSelect={() => navigate(c.href)}
                  >
                    <Icon />
                    <span>{c.label}</span>
                    <CommandShortcut>{c.href}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="新規作成">
              {NEW_COMMANDS.map((c) => (
                <CommandItem
                  key={`new-${c.href}`}
                  value={`新規 ${c.label} ${c.hint}`}
                  keywords={[c.label, c.hint, "新規", "作成", "new", "create"]}
                  onSelect={() => navigate(c.href)}
                >
                  <Plus />
                  <span>{c.label}</span>
                  <CommandShortcut>{c.hint}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            {customersToShow.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="顧客">
                  {customersToShow.map((c) => (
                    <CommandItem
                      key={`customer-${c.id}`}
                      value={`customer ${c.name} ${c.industry} ${c.contactPerson}`}
                      keywords={[c.name, c.industry, c.contactPerson, c.email]}
                      onSelect={() => navigate(`/customers/${c.id}`)}
                    >
                      <Users />
                      <span className="truncate">{c.name}</span>
                      <CommandShortcut className="truncate">
                        {c.industry}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {dealsToShow.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="案件">
                  {dealsToShow.map((d) => {
                    const customer = customers.find(
                      (c) => c.id === d.customerId,
                    );
                    return (
                      <CommandItem
                        key={`deal-${d.id}`}
                        value={`deal ${d.title} ${customer?.name ?? ""} ${DEAL_STAGE_LABELS[d.stage]}`}
                        keywords={[
                          d.title,
                          customer?.name ?? "",
                          DEAL_STAGE_LABELS[d.stage],
                        ]}
                        onSelect={() => navigate(`/deals/${d.id}`)}
                      >
                        <Briefcase />
                        <span className="truncate">{d.title}</span>
                        <CommandShortcut>
                          {customer?.name ?? "—"} ・ {formatYen(d.amount)}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : null}

            {quotesToShow.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="見積">
                  {quotesToShow.map((q) => {
                    const customer = customers.find(
                      (c) => c.id === q.customerId,
                    );
                    return (
                      <CommandItem
                        key={`quote-${q.id}`}
                        value={`quote ${q.number} ${q.title} ${customer?.name ?? ""}`}
                        keywords={[q.number, q.title, customer?.name ?? ""]}
                        onSelect={() => navigate(`/quotes/${q.id}`)}
                      >
                        <FileText />
                        <span className="truncate">
                          {q.number} ・ {q.title}
                        </span>
                        <CommandShortcut>
                          {formatYen(q.total)}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : null}

            {invoicesToShow.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="請求">
                  {invoicesToShow.map((inv) => {
                    const customer = customers.find(
                      (c) => c.id === inv.customerId,
                    );
                    return (
                      <CommandItem
                        key={`invoice-${inv.id}`}
                        value={`invoice ${inv.number} ${inv.title} ${customer?.name ?? ""}`}
                        keywords={[inv.number, inv.title, customer?.name ?? ""]}
                        onSelect={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <Receipt />
                        <span className="truncate">
                          {inv.number} ・ {inv.title}
                        </span>
                        <CommandShortcut>
                          {formatYen(inv.total)}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : null}

            <CommandSeparator />

            <CommandGroup heading="業種">
              {INDUSTRIES.map((ind) => {
                const isActive = ind === currentIndustry;
                return (
                  <CommandItem
                    key={`industry-${ind}`}
                    value={`業種 ${INDUSTRY_LABELS[ind]} ${ind}`}
                    keywords={[INDUSTRY_LABELS[ind], ind, "業種", "industry"]}
                    onSelect={() => switchIndustry(ind)}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center text-base leading-none">
                      {INDUSTRY_EMOJIS[ind]}
                    </span>
                    <span>{INDUSTRY_LABELS[ind]}</span>
                    <CommandShortcut>
                      {isActive ? "現在" : "切替＋リセット"}
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <div className="mt-2 flex items-center justify-between border-t border-[var(--color-line)] px-2 pt-2 text-[10px] text-[var(--color-ink-500)]">
              <span>↑↓ 選択 ・ ⏎ 実行 ・ Esc 閉じる</span>
              <span className="hidden sm:inline">
                {customers.length + deals.length + quotes.length + invoices.length}{" "}
                件のレコード
              </span>
            </div>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Hook export deferred to provider; use useCommandPalette() from the provider
// re-export here to keep import surface tidy if needed
export type { CommandPaletteProps };
