"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavList } from "./sidebar";

export function MobileNavTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="メニューを開く"
            className="lg:hidden"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 bg-[var(--color-bg-soft)] p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-[var(--color-line)] px-5 py-4">
          <SheetTitle className="text-left">
            <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-500)]">
              Business Hub
            </span>
            <span className="mt-1 block text-base font-bold text-[var(--color-ink-950)]">
              統合業務ハブ
            </span>
          </SheetTitle>
        </SheetHeader>
        <NavList variant="mobile" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
