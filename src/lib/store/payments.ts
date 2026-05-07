import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Payment } from "@/lib/types/payment";
import { newId } from "@/lib/utils/id";
import { todayIso } from "@/lib/utils/date";

type PaymentsStore = {
  payments: Payment[];
  add: (input: Omit<Payment, "id" | "createdAt">) => Payment;
  remove: (id: string) => void;
  setAll: (payments: Payment[]) => void;
};

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    (set) => ({
      payments: [],
      add: (input) => {
        const payment: Payment = {
          ...input,
          id: newId("pay"),
          createdAt: todayIso(),
        };
        set((s) => ({ payments: [payment, ...s.payments] }));
        return payment;
      },
      remove: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
      setAll: (payments) => set({ payments }),
    }),
    { name: "business-hub-payments-v1" },
  ),
);
