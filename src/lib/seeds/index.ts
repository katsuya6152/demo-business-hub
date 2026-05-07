import type { Customer } from "@/lib/types/customer";
import type { Deal } from "@/lib/types/deal";
import type { Quote } from "@/lib/types/quote";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";
import type { Industry } from "@/lib/types/industry";
import { itServicesSeed } from "./it-services";
import { wholesaleSeed } from "./wholesale";
import { consultingSeed } from "./consulting";

export type Seed = {
  customers: Customer[];
  deals: Deal[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
};

const SEEDS: Record<Industry, Seed> = {
  "it-services": itServicesSeed,
  wholesale: wholesaleSeed,
  consulting: consultingSeed,
};

export function loadSeed(industry: Industry): Seed {
  return SEEDS[industry];
}
