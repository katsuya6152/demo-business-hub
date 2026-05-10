"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { ContactBanner } from "./contact-banner";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboardShortcuts({ onShowHelp: () => setHelpOpen(true) });

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto px-4 pb-20 pt-6 md:px-6 md:pt-8 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </main>
        </div>
        <MobileBottomNav />
        <ContactBanner />
      </div>
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </CommandPaletteProvider>
  );
}
