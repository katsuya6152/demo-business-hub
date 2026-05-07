"use client";

import { useSettingsStore } from "@/lib/store/settings";
import { useMounted } from "@/hooks/use-mounted";
import { Onboarding } from "@/components/onboarding/onboarding";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function Home() {
  const initialized = useSettingsStore((s) => s.initialized);
  const mounted = useMounted();

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
      </main>
    );
  }

  if (!initialized) {
    return <Onboarding />;
  }

  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
