"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_COPY, CONTACT_URL } from "@/lib/constants/contact";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/customers", label: "顧客", icon: Users },
  { href: "/deals", label: "案件", icon: Briefcase },
  { href: "/quotes", label: "見積", icon: FileText },
  { href: "/invoices", label: "請求", icon: Receipt },
  { href: "/settings", label: "設定", icon: SettingsIcon },
];

type NavListProps = {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function NavList({ onNavigate, variant = "desktop" }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className={cn(
        "flex flex-col",
        variant === "mobile" ? "gap-1 p-3" : "gap-1 p-3",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-[var(--color-accent-50)] text-[var(--color-accent-700)] shadow-sm"
                : "text-[var(--color-ink-700)] hover:bg-[var(--color-bg-elevated)] hover:translate-x-0.5",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-[var(--color-accent-600)]"
              />
            ) : null}
            <Icon
              className={cn(
                "h-4 w-4 transition-transform",
                active
                  ? "text-[var(--color-accent-600)]"
                  : "text-[var(--color-ink-500)] group-hover:text-[var(--color-accent-600)]",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 self-start overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-bg-soft)] lg:flex lg:flex-col">
      <div className="px-5 py-4 border-b border-[var(--color-line)]">
        <p className="text-xs uppercase tracking-wider text-[var(--color-ink-500)]">
          Business Hub
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--color-ink-950)]">
          統合業務ハブ
        </p>
      </div>
      <NavList />
      <div className="mt-auto flex flex-col gap-3 border-t border-[var(--color-line)] p-4">
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-xl border border-[var(--color-accent-200)] bg-gradient-to-br from-[var(--color-accent-50)] via-card to-[var(--color-cyan-50)] p-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent-300)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[var(--color-accent-100)] opacity-50 blur-xl transition-opacity group-hover:opacity-80"
          />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[var(--color-accent-600)]" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-700)]">
                For Business
              </p>
            </div>
            <p className="mt-1.5 text-[13px] font-bold leading-snug text-[var(--color-ink-950)]">
              {CONTACT_COPY.sidebarHeadline}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-600)]">
              {CONTACT_COPY.sidebarSub}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-accent-700)]">
              {CONTACT_COPY.sidebarCta}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </div>
        </a>
        <p className="text-[10px] text-[var(--color-ink-500)]">
          Demo · localStorage 完結
        </p>
      </div>
    </aside>
  );
}
