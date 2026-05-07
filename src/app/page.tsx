"use client";

import { useSettingsStore } from "@/lib/store/settings";
import { useMounted } from "@/hooks/use-mounted";
import { Onboarding } from "@/components/onboarding/onboarding";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { Skeleton, SkeletonStatCard } from "@/components/shared/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function Home() {
  const initialized = useSettingsStore((s) => s.initialized);
  const mounted = useMounted();

  if (!mounted) {
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
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
