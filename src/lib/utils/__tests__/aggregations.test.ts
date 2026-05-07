import { describe, it, expect } from "vitest";
import {
  totalRevenueThisMonth,
  totalRevenueLastMonth,
  monthlyRevenue,
  unpaidInvoices,
  overdueInvoices,
  dealsByStage,
  winRate,
  topCustomersByRevenue,
  newCustomersThisMonth,
  customerStatusBreakdown,
} from "../aggregations";
import type { Customer } from "@/lib/types/customer";
import type { Deal } from "@/lib/types/deal";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";

// Fixed reference date — middle of May 2026, mid-day UTC so timezone shifts
// don't push test dates into adjacent months.
const REF = new Date("2026-05-15T12:00:00Z");

// ---------- Factories ----------

function makePayment(over: Partial<Payment> = {}): Payment {
  return {
    id: "p-" + Math.random().toString(36).slice(2, 8),
    invoiceId: "inv-1",
    amount: 10_000,
    paidAt: "2026-05-10T12:00:00Z",
    method: "bank-transfer",
    notes: undefined,
    createdAt: "2026-05-10T12:00:00Z",
    ...over,
  };
}

function makeInvoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-" + Math.random().toString(36).slice(2, 8),
    number: "INV-0001",
    customerId: "c-1",
    title: "Test invoice",
    issueDate: "2026-05-01T00:00:00Z",
    dueDate: "2026-05-31T00:00:00Z",
    items: [],
    subtotal: 10_000,
    tax: 1_000,
    total: 11_000,
    status: "sent",
    notes: undefined,
    paidAt: undefined,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...over,
  };
}

function makeDeal(over: Partial<Deal> = {}): Deal {
  return {
    id: "d-" + Math.random().toString(36).slice(2, 8),
    customerId: "c-1",
    title: "Test deal",
    stage: "lead",
    amount: 100_000,
    probability: 50,
    expectedCloseDate: "2026-06-30T00:00:00Z",
    closedAt: undefined,
    notes: undefined,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...over,
  };
}

function makeCustomer(over: Partial<Customer> = {}): Customer {
  return {
    id: "c-" + Math.random().toString(36).slice(2, 8),
    name: "Acme Co.",
    industry: "manufacturing",
    contactPerson: "Taro",
    contactRole: "Manager",
    email: "taro@acme.test",
    phone: "000-0000-0000",
    status: "active",
    createdAt: "2026-05-10T12:00:00Z",
    updatedAt: "2026-05-10T12:00:00Z",
    ...over,
  };
}

// ---------- totalRevenueThisMonth ----------

describe("totalRevenueThisMonth", () => {
  it("returns 0 for an empty payment list", () => {
    expect(totalRevenueThisMonth([], REF)).toBe(0);
  });

  it("sums payments paid in the reference month", () => {
    const payments = [
      makePayment({ amount: 10_000, paidAt: "2026-05-02T12:00:00Z" }),
      makePayment({ amount: 25_000, paidAt: "2026-05-20T12:00:00Z" }),
    ];
    expect(totalRevenueThisMonth(payments, REF)).toBe(35_000);
  });

  it("excludes payments from previous and following months", () => {
    const payments = [
      makePayment({ amount: 10_000, paidAt: "2026-04-30T12:00:00Z" }),
      makePayment({ amount: 5_000, paidAt: "2026-05-15T12:00:00Z" }),
      makePayment({ amount: 7_000, paidAt: "2026-06-01T12:00:00Z" }),
    ];
    expect(totalRevenueThisMonth(payments, REF)).toBe(5_000);
  });

  it("only counts current-month items when last month also has payments", () => {
    const payments = [
      makePayment({ amount: 10_000, paidAt: "2026-04-15T12:00:00Z" }),
      makePayment({ amount: 20_000, paidAt: "2026-05-10T12:00:00Z" }),
    ];
    expect(totalRevenueThisMonth(payments, REF)).toBe(20_000);
    expect(totalRevenueLastMonth(payments, REF)).toBe(10_000);
  });
});

// ---------- unpaidInvoices ----------

describe("unpaidInvoices", () => {
  it("returns an empty array when no invoices are provided", () => {
    expect(unpaidInvoices([])).toEqual([]);
  });

  it("returns only sent and overdue invoices", () => {
    const invoices = [
      makeInvoice({ id: "i1", status: "sent" }),
      makeInvoice({ id: "i2", status: "overdue" }),
      makeInvoice({ id: "i3", status: "paid" }),
      makeInvoice({ id: "i4", status: "draft" }),
      makeInvoice({ id: "i5", status: "cancelled" }),
    ];
    const result = unpaidInvoices(invoices).map((i) => i.id);
    expect(result.sort()).toEqual(["i1", "i2"]);
  });

  it("returns empty when there are only paid/draft/cancelled invoices", () => {
    const invoices = [
      makeInvoice({ status: "paid" }),
      makeInvoice({ status: "draft" }),
      makeInvoice({ status: "cancelled" }),
    ];
    expect(unpaidInvoices(invoices)).toEqual([]);
  });

  it("preserves original order of unpaid invoices", () => {
    const invoices = [
      makeInvoice({ id: "a", status: "overdue" }),
      makeInvoice({ id: "b", status: "paid" }),
      makeInvoice({ id: "c", status: "sent" }),
    ];
    expect(unpaidInvoices(invoices).map((i) => i.id)).toEqual(["a", "c"]);
  });
});

// ---------- monthlyRevenue ----------

describe("monthlyRevenue", () => {
  it("returns 6 months by default ending at the reference month", () => {
    const result = monthlyRevenue([], 6, REF);
    expect(result).toHaveLength(6);
    expect(result.map((r) => r.month)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
    expect(result.every((r) => r.amount === 0)).toBe(true);
  });

  it("aggregates payments into the correct month buckets", () => {
    const payments = [
      makePayment({ amount: 1_000, paidAt: "2026-05-05T12:00:00Z" }),
      makePayment({ amount: 2_000, paidAt: "2026-05-25T12:00:00Z" }),
      makePayment({ amount: 4_000, paidAt: "2026-04-10T12:00:00Z" }),
      makePayment({ amount: 8_000, paidAt: "2026-01-15T12:00:00Z" }),
    ];
    const result = monthlyRevenue(payments, 6, REF);
    const map = Object.fromEntries(result.map((r) => [r.month, r.amount]));
    expect(map["2026-05"]).toBe(3_000);
    expect(map["2026-04"]).toBe(4_000);
    expect(map["2026-01"]).toBe(8_000);
    expect(map["2026-02"]).toBe(0);
  });

  it("ignores payments outside the requested window", () => {
    const payments = [
      makePayment({ amount: 50_000, paidAt: "2025-06-15T12:00:00Z" }),
      makePayment({ amount: 100, paidAt: "2026-05-01T12:00:00Z" }),
    ];
    const result = monthlyRevenue(payments, 6, REF);
    const total = result.reduce((s, r) => s + r.amount, 0);
    expect(total).toBe(100);
  });

  it("supports a custom number of months", () => {
    const result = monthlyRevenue([], 3, REF);
    expect(result.map((r) => r.month)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  it("returns months in chronological order (oldest first)", () => {
    const result = monthlyRevenue([], 4, REF);
    const months = result.map((r) => r.month);
    const sorted = [...months].sort();
    expect(months).toEqual(sorted);
  });
});

// ---------- dealsByStage ----------

describe("dealsByStage", () => {
  it("returns all six stages even with empty input", () => {
    const result = dealsByStage([]);
    expect(Object.keys(result).sort()).toEqual(
      ["lead", "qualified", "proposal-sent", "negotiation", "won", "lost"].sort(),
    );
    Object.values(result).forEach((arr) => expect(arr).toEqual([]));
  });

  it("places each deal under the correct stage", () => {
    const deals = [
      makeDeal({ id: "d1", stage: "lead" }),
      makeDeal({ id: "d2", stage: "won" }),
      makeDeal({ id: "d3", stage: "lost" }),
      makeDeal({ id: "d4", stage: "negotiation" }),
    ];
    const result = dealsByStage(deals);
    expect(result.lead.map((d) => d.id)).toEqual(["d1"]);
    expect(result.won.map((d) => d.id)).toEqual(["d2"]);
    expect(result.lost.map((d) => d.id)).toEqual(["d3"]);
    expect(result.negotiation.map((d) => d.id)).toEqual(["d4"]);
    expect(result.qualified).toEqual([]);
    expect(result["proposal-sent"]).toEqual([]);
  });

  it("groups multiple deals into the same stage", () => {
    const deals = [
      makeDeal({ id: "a", stage: "qualified" }),
      makeDeal({ id: "b", stage: "qualified" }),
      makeDeal({ id: "c", stage: "qualified" }),
    ];
    const result = dealsByStage(deals);
    expect(result.qualified.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("preserves input order within a stage", () => {
    const deals = [
      makeDeal({ id: "x", stage: "lead" }),
      makeDeal({ id: "y", stage: "won" }),
      makeDeal({ id: "z", stage: "lead" }),
    ];
    const result = dealsByStage(deals);
    expect(result.lead.map((d) => d.id)).toEqual(["x", "z"]);
  });
});

// ---------- topCustomersByRevenue ----------

describe("topCustomersByRevenue", () => {
  it("returns an empty array when there are no customers", () => {
    expect(topCustomersByRevenue([], [], [])).toEqual([]);
  });

  it("ranks customers by total payment amount, descending", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Alpha" }),
      makeCustomer({ id: "c2", name: "Bravo" }),
      makeCustomer({ id: "c3", name: "Charlie" }),
    ];
    const invoices = [
      makeInvoice({ id: "i1", customerId: "c1" }),
      makeInvoice({ id: "i2", customerId: "c2" }),
      makeInvoice({ id: "i3", customerId: "c3" }),
    ];
    const payments = [
      makePayment({ invoiceId: "i1", amount: 30_000 }),
      makePayment({ invoiceId: "i2", amount: 50_000 }),
      makePayment({ invoiceId: "i3", amount: 10_000 }),
      makePayment({ invoiceId: "i1", amount: 5_000 }),
    ];
    const result = topCustomersByRevenue(customers, payments, invoices);
    expect(result.map((r) => r.customer.id)).toEqual(["c2", "c1", "c3"]);
    expect(result.map((r) => r.revenue)).toEqual([50_000, 35_000, 10_000]);
  });

  it("excludes customers without any payments", () => {
    const customers = [
      makeCustomer({ id: "c1" }),
      makeCustomer({ id: "c2" }),
    ];
    const invoices = [
      makeInvoice({ id: "i1", customerId: "c1" }),
      makeInvoice({ id: "i2", customerId: "c2" }),
    ];
    const payments = [makePayment({ invoiceId: "i1", amount: 1_000 })];
    const result = topCustomersByRevenue(customers, payments, invoices);
    expect(result).toHaveLength(1);
    expect(result[0].customer.id).toBe("c1");
  });

  it("respects the limit parameter", () => {
    const customers = Array.from({ length: 8 }, (_, i) =>
      makeCustomer({ id: `c${i}` }),
    );
    const invoices = customers.map((c, i) =>
      makeInvoice({ id: `i${i}`, customerId: c.id }),
    );
    const payments = invoices.map((inv, i) =>
      makePayment({ invoiceId: inv.id, amount: (i + 1) * 1_000 }),
    );
    const result = topCustomersByRevenue(customers, payments, invoices, 3);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.revenue)).toEqual([8_000, 7_000, 6_000]);
  });

  it("ignores payments referencing invoices that don't exist", () => {
    const customers = [makeCustomer({ id: "c1" })];
    const invoices = [makeInvoice({ id: "i1", customerId: "c1" })];
    const payments = [
      makePayment({ invoiceId: "i1", amount: 1_000 }),
      makePayment({ invoiceId: "ghost", amount: 999_999 }),
    ];
    const result = topCustomersByRevenue(customers, payments, invoices);
    expect(result).toHaveLength(1);
    expect(result[0].revenue).toBe(1_000);
  });
});

// ---------- overdueInvoices ----------

describe("overdueInvoices", () => {
  it("returns an empty array when there are no invoices", () => {
    expect(overdueInvoices([], REF)).toEqual([]);
  });

  it("includes invoices whose due date has passed and are not paid/cancelled", () => {
    const invoices = [
      makeInvoice({ id: "past-sent", status: "sent", dueDate: "2026-04-01T00:00:00Z" }),
      makeInvoice({ id: "future-sent", status: "sent", dueDate: "2026-06-01T00:00:00Z" }),
    ];
    const ids = overdueInvoices(invoices, REF).map((i) => i.id);
    expect(ids).toEqual(["past-sent"]);
  });

  it("always includes invoices with status overdue regardless of date", () => {
    const invoices = [
      makeInvoice({ id: "ovd", status: "overdue", dueDate: "2027-01-01T00:00:00Z" }),
    ];
    expect(overdueInvoices(invoices, REF).map((i) => i.id)).toEqual(["ovd"]);
  });

  it("excludes paid and cancelled invoices even when overdue by date", () => {
    const invoices = [
      makeInvoice({ id: "paid", status: "paid", dueDate: "2026-01-01T00:00:00Z" }),
      makeInvoice({ id: "cnl", status: "cancelled", dueDate: "2026-01-01T00:00:00Z" }),
    ];
    expect(overdueInvoices(invoices, REF)).toEqual([]);
  });
});

// ---------- winRate ----------

describe("winRate", () => {
  it("returns zeros when there are no closed deals", () => {
    expect(winRate([])).toEqual({ rate: 0, won: 0, lost: 0, total: 0 });
  });

  it("computes the rate from won and lost deals only", () => {
    const deals = [
      makeDeal({ stage: "won" }),
      makeDeal({ stage: "won" }),
      makeDeal({ stage: "won" }),
      makeDeal({ stage: "lost" }),
      makeDeal({ stage: "lead" }), // ignored
      makeDeal({ stage: "negotiation" }), // ignored
    ];
    expect(winRate(deals)).toEqual({ rate: 75, won: 3, lost: 1, total: 4 });
  });

  it("returns rate=0 when only lost deals exist", () => {
    const deals = [makeDeal({ stage: "lost" }), makeDeal({ stage: "lost" })];
    expect(winRate(deals)).toEqual({ rate: 0, won: 0, lost: 2, total: 2 });
  });

  it("returns rate=100 when only won deals exist", () => {
    const deals = [makeDeal({ stage: "won" })];
    expect(winRate(deals)).toEqual({ rate: 100, won: 1, lost: 0, total: 1 });
  });
});

// ---------- customerStatusBreakdown ----------

describe("customerStatusBreakdown", () => {
  it("returns all statuses at zero for empty input", () => {
    expect(customerStatusBreakdown([])).toEqual({
      active: 0,
      prospect: 0,
      inactive: 0,
    });
  });

  it("counts customers by status", () => {
    const customers = [
      makeCustomer({ status: "active" }),
      makeCustomer({ status: "active" }),
      makeCustomer({ status: "prospect" }),
      makeCustomer({ status: "inactive" }),
      makeCustomer({ status: "inactive" }),
      makeCustomer({ status: "inactive" }),
    ];
    expect(customerStatusBreakdown(customers)).toEqual({
      active: 2,
      prospect: 1,
      inactive: 3,
    });
  });

  it("leaves untouched statuses at 0", () => {
    const customers = [makeCustomer({ status: "prospect" })];
    expect(customerStatusBreakdown(customers)).toEqual({
      active: 0,
      prospect: 1,
      inactive: 0,
    });
  });
});

// ---------- newCustomersThisMonth ----------

describe("newCustomersThisMonth", () => {
  it("returns an empty array when no customers were created in the reference month", () => {
    const customers = [
      makeCustomer({ createdAt: "2026-04-10T12:00:00Z" }),
      makeCustomer({ createdAt: "2026-06-10T12:00:00Z" }),
    ];
    expect(newCustomersThisMonth(customers, REF)).toEqual([]);
  });

  it("returns only customers created within the reference month", () => {
    const customers = [
      makeCustomer({ id: "old", createdAt: "2026-04-30T12:00:00Z" }),
      makeCustomer({ id: "new1", createdAt: "2026-05-01T12:00:00Z" }),
      makeCustomer({ id: "new2", createdAt: "2026-05-29T12:00:00Z" }),
      makeCustomer({ id: "future", createdAt: "2026-06-01T12:00:00Z" }),
    ];
    const ids = newCustomersThisMonth(customers, REF).map((c) => c.id);
    expect(ids.sort()).toEqual(["new1", "new2"]);
  });

  it("returns an empty array for empty input", () => {
    expect(newCustomersThisMonth([], REF)).toEqual([]);
  });
});
