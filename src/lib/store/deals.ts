import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Deal, DealStage } from "@/lib/types/deal";
import { newId } from "@/lib/utils/id";
import { todayIso } from "@/lib/utils/date";

type DealsStore = {
  deals: Deal[];
  add: (input: Omit<Deal, "id" | "createdAt" | "updatedAt">) => Deal;
  update: (id: string, patch: Partial<Deal>) => void;
  changeStage: (id: string, stage: DealStage, lostReason?: string) => void;
  remove: (id: string) => void;
  setAll: (deals: Deal[]) => void;
};

export const useDealsStore = create<DealsStore>()(
  persist(
    (set) => ({
      deals: [],
      add: (input) => {
        const deal: Deal = {
          ...input,
          id: newId("deal"),
          createdAt: todayIso(),
          updatedAt: todayIso(),
        };
        set((s) => ({ deals: [deal, ...s.deals] }));
        return deal;
      },
      update: (id, patch) =>
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: todayIso() } : d,
          ),
        })),
      changeStage: (id, stage, lostReason) =>
        set((s) => ({
          deals: s.deals.map((d) => {
            if (d.id !== id) return d;
            const next: Deal = {
              ...d,
              stage,
              updatedAt: todayIso(),
            };
            if (stage === "won" || stage === "lost") {
              next.closedAt = todayIso();
            }
            if (stage === "lost" && lostReason) {
              next.lostReason = lostReason;
            }
            return next;
          }),
        })),
      remove: (id) =>
        set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),
      setAll: (deals) => set({ deals }),
    }),
    { name: "business-hub-deals-v1" },
  ),
);
