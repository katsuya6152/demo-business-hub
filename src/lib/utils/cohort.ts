import { format, parseISO, differenceInCalendarMonths, startOfMonth, subMonths } from "date-fns";
import type { Customer } from "@/lib/types/customer";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";

export type CohortRow = {
  /** "yyyy-MM" of customer acquisition month */
  cohort: string;
  /** Number of customers in this cohort */
  size: number;
  /** Cumulative revenue at month offset N (0 = acquisition month) */
  values: number[];
};

export type CohortDataset = {
  cohorts: CohortRow[];
  monthOffsets: number[];
};

/**
 * Build a cohort retention-style dataset where rows are customer acquisition
 * months and columns are months elapsed since acquisition. Values are the
 * cumulative paid amount per cohort.
 */
export function buildCohortRevenue(
  customers: Customer[],
  invoices: Invoice[],
  payments: Payment[],
  options: { monthsBack?: number; offsetSpan?: number; ref?: Date } = {},
): CohortDataset {
  const ref = options.ref ?? new Date();
  const monthsBack = options.monthsBack ?? 6;
  const offsetSpan = options.offsetSpan ?? 6;

  const invoiceCustomerMap = new Map(invoices.map((i) => [i.id, i.customerId]));

  const earliest = startOfMonth(subMonths(ref, monthsBack - 1));
  const cohortMap = new Map<string, Customer[]>();
  customers.forEach((c) => {
    const created = parseISO(c.createdAt);
    if (created < earliest) return;
    const key = format(startOfMonth(created), "yyyy-MM");
    const list = cohortMap.get(key) ?? [];
    list.push(c);
    cohortMap.set(key, list);
  });

  const sortedKeys = Array.from(cohortMap.keys()).sort();
  const monthOffsets = Array.from({ length: offsetSpan }, (_, i) => i);

  const cohorts: CohortRow[] = sortedKeys.map((key) => {
    const cohortCustomers = cohortMap.get(key) ?? [];
    const customerIds = new Set(cohortCustomers.map((c) => c.id));
    const cohortStart = parseISO(`${key}-01T00:00:00.000Z`);

    const values = monthOffsets.map(() => 0);
    payments.forEach((p) => {
      const cid = invoiceCustomerMap.get(p.invoiceId);
      if (!cid || !customerIds.has(cid)) return;
      const paidAt = parseISO(p.paidAt);
      const offset = differenceInCalendarMonths(paidAt, cohortStart);
      if (offset < 0 || offset >= offsetSpan) return;
      values[offset] += p.amount;
    });
    // accumulate so column N is cumulative through that month
    for (let i = 1; i < values.length; i++) {
      values[i] += values[i - 1];
    }

    return { cohort: key, size: cohortCustomers.length, values };
  });

  return { cohorts, monthOffsets };
}
