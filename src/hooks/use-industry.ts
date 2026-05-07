"use client";

import { useSettingsStore } from "@/lib/store/settings";

export function useIndustry() {
  return useSettingsStore((s) => s.settings.industry);
}

export function useSetIndustry() {
  return useSettingsStore((s) => s.setIndustry);
}
