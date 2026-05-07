import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Invoice } from "@/lib/types/invoice";
import { newId } from "@/lib/utils/id";
import { todayIso } from "@/lib/utils/date";

type InvoicesStore = {
  invoices: Invoice[];
  add: (input: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => Invoice;
  update: (id: string, patch: Partial<Invoice>) => void;
  markPaid: (id: string, paidAt?: string) => void;
  remove: (id: string) => void;
  setAll: (invoices: Invoice[]) => void;
};

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set) => ({
      invoices: [],
      add: (input) => {
        const invoice: Invoice = {
          ...input,
          id: newId("inv"),
          createdAt: todayIso(),
          updatedAt: todayIso(),
        };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        return invoice;
      },
      update: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, ...patch, updatedAt: todayIso() }
              : inv,
          ),
        })),
      markPaid: (id, paidAt) =>
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  status: "paid",
                  paidAt: paidAt ?? todayIso(),
                  updatedAt: todayIso(),
                }
              : inv,
          ),
        })),
      remove: (id) =>
        set((s) => ({
          invoices: s.invoices.filter((inv) => inv.id !== id),
        })),
      setAll: (invoices) => set({ invoices }),
    }),
    { name: "business-hub-invoices-v1" },
  ),
);
