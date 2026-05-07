import type { Industry } from "@/lib/types/industry";
import type { Seed } from "@/lib/seeds";
import { loadSeed } from "@/lib/seeds";
import { useCustomersStore } from "./customers";
import { useDealsStore } from "./deals";
import { useQuotesStore } from "./quotes";
import { useInvoicesStore } from "./invoices";
import { usePaymentsStore } from "./payments";
import { useSettingsStore } from "./settings";

export {
  useCustomersStore,
  useDealsStore,
  useQuotesStore,
  useInvoicesStore,
  usePaymentsStore,
  useSettingsStore,
};

export function applySeed(seed: Seed) {
  useCustomersStore.getState().setAll(seed.customers);
  useDealsStore.getState().setAll(seed.deals);
  useQuotesStore.getState().setAll(seed.quotes);
  useInvoicesStore.getState().setAll(seed.invoices);
  usePaymentsStore.getState().setAll(seed.payments);
}

export function resetAllData(industry: Industry) {
  const seed = loadSeed(industry);
  applySeed(seed);
  useSettingsStore.getState().setIndustry(industry);
  useSettingsStore.getState().setLastResetAt(industry);
  useSettingsStore.getState().markInitialized();
}

export function clearAllData() {
  useCustomersStore.getState().setAll([]);
  useDealsStore.getState().setAll([]);
  useQuotesStore.getState().setAll([]);
  useInvoicesStore.getState().setAll([]);
  usePaymentsStore.getState().setAll([]);
  useSettingsStore.getState().resetMeta();
}

export function snapshotAllData() {
  return {
    customers: useCustomersStore.getState().customers,
    deals: useDealsStore.getState().deals,
    quotes: useQuotesStore.getState().quotes,
    invoices: useInvoicesStore.getState().invoices,
    payments: usePaymentsStore.getState().payments,
    settings: useSettingsStore.getState().settings,
  };
}
