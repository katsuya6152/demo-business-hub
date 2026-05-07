import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Industry } from "@/lib/types/industry";
import {
  type CompanyInfo,
  type Meta,
  type Settings,
  DEFAULT_COMPANY,
} from "@/lib/types/settings";
import { todayIso } from "@/lib/utils/date";

type SettingsStore = {
  settings: Settings;
  meta: Meta;
  initialized: boolean;
  setIndustry: (industry: Industry) => void;
  updateCompany: (patch: Partial<CompanyInfo>) => void;
  setLastResetAt: (industry: Industry) => void;
  markInitialized: () => void;
  resetMeta: () => void;
};

const DEFAULT_SETTINGS: Settings = {
  industry: "it-services",
  company: DEFAULT_COMPANY,
  taxRate: 0.1,
};

const DEFAULT_META: Meta = {
  schemaVersion: 1,
  initializedAt: todayIso(),
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      meta: DEFAULT_META,
      initialized: false,
      setIndustry: (industry) =>
        set((s) => ({
          settings: { ...s.settings, industry },
          meta: { ...s.meta, currentSeedIndustry: industry },
        })),
      updateCompany: (patch) =>
        set((s) => ({
          settings: { ...s.settings, company: { ...s.settings.company, ...patch } },
        })),
      setLastResetAt: (industry) =>
        set((s) => ({
          meta: {
            ...s.meta,
            lastResetAt: todayIso(),
            currentSeedIndustry: industry,
          },
        })),
      markInitialized: () => set({ initialized: true }),
      resetMeta: () =>
        set({
          settings: DEFAULT_SETTINGS,
          meta: { ...DEFAULT_META, initializedAt: todayIso() },
          initialized: false,
        }),
    }),
    { name: "business-hub-settings-v1" },
  ),
);
