import {
  format,
  parseISO,
  startOfMonth,
  subMonths,
  isAfter,
  isBefore,
} from "date-fns";
import type { Customer, CustomerStatus } from "@/lib/types/customer";
import type { Deal, DealStage } from "@/lib/types/deal";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";
import { daysBetween, isThisMonth, isLastMonth, isNextMonth } from "./date";

export function totalRevenueThisMonth(
  payments: Payment[],
  ref: Date = new Date(),
): number {
  return payments
    .filter((p) => isThisMonth(p.paidAt, ref))
    .reduce((sum, p) => sum + p.amount, 0);
}

export function totalRevenueLastMonth(
  payments: Payment[],
  ref: Date = new Date(),
): number {
  return payments
    .filter((p) => isLastMonth(p.paidAt, ref))
    .reduce((sum, p) => sum + p.amount, 0);
}

export function monthlyRevenue(
  payments: Payment[],
  months = 6,
  ref: Date = new Date(),
): Array<{ month: string; amount: number }> {
  const result: Array<{ month: string; amount: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const target = subMonths(ref, i);
    const monthKey = format(target, "yyyy-MM");
    const amount = payments
      .filter((p) => format(parseISO(p.paidAt), "yyyy-MM") === monthKey)
      .reduce((sum, p) => sum + p.amount, 0);
    result.push({ month: monthKey, amount });
  }
  return result;
}

export function unpaidInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "overdue",
  );
}

export function overdueInvoices(
  invoices: Invoice[],
  ref: Date = new Date(),
): Invoice[] {
  return invoices.filter((inv) => {
    if (inv.status === "paid" || inv.status === "cancelled") return false;
    if (inv.status === "overdue") return true;
    return isBefore(parseISO(inv.dueDate), ref);
  });
}

export function upcomingInvoices(
  invoices: Invoice[],
  ref: Date = new Date(),
): Invoice[] {
  return invoices.filter(
    (inv) => inv.status !== "paid" && isNextMonth(inv.dueDate, ref),
  );
}

export function paidInvoiceTotal(invoices: Invoice[]): number {
  return invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
}

export function unpaidInvoiceTotal(invoices: Invoice[]): number {
  return unpaidInvoices(invoices).reduce((sum, inv) => sum + inv.total, 0);
}

export function overdueInvoiceTotal(
  invoices: Invoice[],
  ref: Date = new Date(),
): number {
  return overdueInvoices(invoices, ref).reduce(
    (sum, inv) => sum + inv.total,
    0,
  );
}

export function dealsByStage(
  deals: Deal[],
): Record<DealStage, Deal[]> {
  const init: Record<DealStage, Deal[]> = {
    lead: [],
    qualified: [],
    "proposal-sent": [],
    negotiation: [],
    won: [],
    lost: [],
  };
  return deals.reduce((acc, deal) => {
    acc[deal.stage].push(deal);
    return acc;
  }, init);
}

export function activePipeline(deals: Deal[]): Deal[] {
  const active: DealStage[] = ["qualified", "proposal-sent", "negotiation"];
  return deals.filter((d) => active.includes(d.stage));
}

export function pipelineTotal(deals: Deal[]): number {
  return activePipeline(deals).reduce((sum, d) => sum + d.amount, 0);
}

export function avgPipelineProbability(deals: Deal[]): number {
  const items = activePipeline(deals);
  if (items.length === 0) return 0;
  return Math.round(
    items.reduce((s, d) => s + d.probability, 0) / items.length,
  );
}

export function wonDealsThisMonth(
  deals: Deal[],
  ref: Date = new Date(),
): Deal[] {
  return deals.filter(
    (d) => d.stage === "won" && d.closedAt && isThisMonth(d.closedAt, ref),
  );
}

export function lostDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => d.stage === "lost");
}

export function highProbabilityDeals(deals: Deal[], threshold = 70): Deal[] {
  return deals
    .filter(
      (d) =>
        d.probability >= threshold && d.stage !== "won" && d.stage !== "lost",
    )
    .sort((a, b) => b.probability - a.probability);
}

export function dealsClosingSoon(deals: Deal[], days = 14): Deal[] {
  const today = new Date().toISOString();
  return deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .filter((d) => {
      const diff = daysBetween(today, d.expectedCloseDate);
      return diff >= 0 && diff <= days;
    });
}

export function dealsClosingNextMonth(
  deals: Deal[],
  ref: Date = new Date(),
): Deal[] {
  return deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .filter((d) => isNextMonth(d.expectedCloseDate, ref));
}

export function largestDeal(deals: Deal[]): Deal | null {
  const candidates = deals.filter((d) => d.stage !== "lost");
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => b.amount - a.amount)[0];
}

export function avgDealAmount(deals: Deal[]): {
  all: number;
  won: number;
} {
  const all =
    deals.length === 0
      ? 0
      : Math.round(
          deals.reduce((s, d) => s + d.amount, 0) / deals.length,
        );
  const wonDeals = deals.filter((d) => d.stage === "won");
  const won =
    wonDeals.length === 0
      ? 0
      : Math.round(
          wonDeals.reduce((s, d) => s + d.amount, 0) / wonDeals.length,
        );
  return { all, won };
}

export function winRate(deals: Deal[]): {
  rate: number;
  won: number;
  lost: number;
  total: number;
} {
  const won = deals.filter((d) => d.stage === "won").length;
  const lost = deals.filter((d) => d.stage === "lost").length;
  const total = won + lost;
  const rate = total === 0 ? 0 : Math.round((won / total) * 100);
  return { rate, won, lost, total };
}

export function topCustomersByRevenue(
  customers: Customer[],
  payments: Payment[],
  invoices: Invoice[],
  limit = 5,
): Array<{ customer: Customer; revenue: number }> {
  const invoiceCustomerMap = new Map<string, string>();
  invoices.forEach((inv) => {
    invoiceCustomerMap.set(inv.id, inv.customerId);
  });

  const totals = new Map<string, number>();
  payments.forEach((p) => {
    const cid = invoiceCustomerMap.get(p.invoiceId);
    if (!cid) return;
    totals.set(cid, (totals.get(cid) ?? 0) + p.amount);
  });

  return customers
    .map((customer) => ({ customer, revenue: totals.get(customer.id) ?? 0 }))
    .filter((row) => row.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function newCustomersThisMonth(
  customers: Customer[],
  ref: Date = new Date(),
): Customer[] {
  return customers.filter((c) => isThisMonth(c.createdAt, ref));
}

export function customerStatusBreakdown(
  customers: Customer[],
): Record<CustomerStatus, number> {
  const init: Record<CustomerStatus, number> = {
    active: 0,
    prospect: 0,
    inactive: 0,
  };
  return customers.reduce((acc, c) => {
    acc[c.status] += 1;
    return acc;
  }, init);
}

export function dormantCustomers(
  customers: Customer[],
  invoices: Invoice[],
  monthsAgo = 6,
  ref: Date = new Date(),
): Customer[] {
  const cutoff = startOfMonth(subMonths(ref, monthsAgo));
  return customers.filter((c) => {
    const recent = invoices
      .filter((inv) => inv.customerId === c.id)
      .some((inv) => isAfter(parseISO(inv.issueDate), cutoff));
    return !recent;
  });
}

export function customerRevenue(
  customerId: string,
  payments: Payment[],
  invoices: Invoice[],
): number {
  const invoiceIds = new Set(
    invoices.filter((i) => i.customerId === customerId).map((i) => i.id),
  );
  return payments
    .filter((p) => invoiceIds.has(p.invoiceId))
    .reduce((sum, p) => sum + p.amount, 0);
}
