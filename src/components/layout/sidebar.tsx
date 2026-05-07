"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/customers", label: "顧客", icon: Users },
  { href: "/deals", label: "案件", icon: Briefcase },
  { href: "/quotes", label: "見積", icon: FileText },
  { href: "/invoices", label: "請求", icon: Receipt },
  { href: "/settings", label: "設定", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-bg-soft)] md:flex md:flex-col">
      <div className="px-5 py-4 border-b border-[var(--color-line)]">
        <p className="text-xs uppercase tracking-wider text-[var(--color-ink-500)]">
          Business Hub
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--color-ink-950)]">
          統合業務ハブ
        </p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-600)] text-white shadow-sm"
                  : "text-[var(--color-ink-700)] hover:bg-[var(--color-bg-elevated)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[var(--color-line)] px-5 py-3 text-[10px] text-[var(--color-ink-500)]">
        Demo · localStorage 完結
      </div>
    </aside>
  );
}
