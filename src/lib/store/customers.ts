import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "@/lib/types/customer";
import { newId } from "@/lib/utils/id";
import { todayIso } from "@/lib/utils/date";

type CustomersStore = {
  customers: Customer[];
  add: (
    input: Omit<Customer, "id" | "createdAt" | "updatedAt">,
  ) => Customer;
  update: (id: string, patch: Partial<Customer>) => void;
  remove: (id: string) => void;
  setAll: (customers: Customer[]) => void;
};

export const useCustomersStore = create<CustomersStore>()(
  persist(
    (set) => ({
      customers: [],
      add: (input) => {
        const customer: Customer = {
          ...input,
          id: newId("cus"),
          createdAt: todayIso(),
          updatedAt: todayIso(),
        };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },
      update: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: todayIso() } : c,
          ),
        })),
      remove: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),
      setAll: (customers) => set({ customers }),
    }),
    { name: "business-hub-customers-v1" },
  ),
);
