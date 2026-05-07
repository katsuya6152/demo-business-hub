"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const TAB_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: LayoutDashboard, exact: true },
  { href: "/customers", label: "顧客", icon: Users },
  { href: "/deals", label: "案件", icon: Briefcase },
  { href: "/quotes", label: "見積", icon: FileText },
  { href: "/invoices", label: "請求", icon: Receipt },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主要画面タブ"
      className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-[var(--color-line)] bg-card/95 backdrop-blur lg:hidden"
    >
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active
                ? "text-[var(--color-accent-700)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)]",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[var(--color-accent-600)]"
              />
            ) : null}
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
