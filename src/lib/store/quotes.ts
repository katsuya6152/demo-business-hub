import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Quote } from "@/lib/types/quote";
import { newId } from "@/lib/utils/id";
import { todayIso } from "@/lib/utils/date";

type QuotesStore = {
  quotes: Quote[];
  add: (input: Omit<Quote, "id" | "createdAt" | "updatedAt">) => Quote;
  update: (id: string, patch: Partial<Quote>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Quote | null;
  setAll: (quotes: Quote[]) => void;
};

export const useQuotesStore = create<QuotesStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      add: (input) => {
        const quote: Quote = {
          ...input,
          id: newId("quote"),
          createdAt: todayIso(),
          updatedAt: todayIso(),
        };
        set((s) => ({ quotes: [quote, ...s.quotes] }));
        return quote;
      },
      update: (id, patch) =>
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === id ? { ...q, ...patch, updatedAt: todayIso() } : q,
          ),
        })),
      remove: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
      duplicate: (id) => {
        const original = get().quotes.find((q) => q.id === id);
        if (!original) return null;
        const copy: Quote = {
          ...original,
          id: newId("quote"),
          number: `${original.number}-copy`,
          status: "draft",
          createdAt: todayIso(),
          updatedAt: todayIso(),
        };
        set((s) => ({ quotes: [copy, ...s.quotes] }));
        return copy;
      },
      setAll: (quotes) => set({ quotes }),
    }),
    { name: "business-hub-quotes-v1" },
  ),
);
