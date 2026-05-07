import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateResponse, type AiContext } from "../responder";
import type { Customer } from "@/lib/types/customer";
import type { Deal } from "@/lib/types/deal";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";
import { formatYen } from "@/lib/utils/currency";

// vi.useFakeTimers + setSystemTime で 2026-05-15 を「今」と固定。
// responder の "今月" 判定は new Date() 起点なので、ここを固定すれば
// paidAt / createdAt の "2026-05-*" を当月扱いにできる。
const NOW = new Date("2026-05-15T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ----- factory helpers (全フィールドを必ず埋める) -----

function makeCustomer(over: Partial<Customer> = {}): Customer {
  return {
    id: "c-1",
    name: "Acme Corp",
    industry: "IT",
    contactPerson: "Tanaka",
    contactRole: "Manager",
    email: "tanaka@acme.example",
    phone: "03-0000-0000",
    postalCode: "100-0001",
    address: "東京都千代田区",
    status: "active",
    notes: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function makeInvoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    number: "INV-0001",
    customerId: "c-1",
    quoteId: undefined,
    dealId: undefined,
    title: "コンサルティング",
    issueDate: "2026-04-01T00:00:00.000Z",
    dueDate: "2026-04-30T00:00:00.000Z",
    items: [],
    subtotal: 100000,
    tax: 10000,
    total: 110000,
    status: "sent",
    notes: undefined,
    paidAt: undefined,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...over,
  };
}

function makePayment(over: Partial<Payment> = {}): Payment {
  return {
    id: "p-1",
    invoiceId: "inv-1",
    amount: 100000,
    paidAt: "2026-05-10T12:00:00.000Z",
    method: "bank-transfer",
    notes: undefined,
    createdAt: "2026-05-10T12:00:00.000Z",
    ...over,
  };
}

function makeDeal(over: Partial<Deal> = {}): Deal {
  return {
    id: "d-1",
    customerId: "c-1",
    title: "Project A",
    stage: "qualified",
    amount: 500000,
    probability: 50,
    expectedCloseDate: "2026-06-30T00:00:00.000Z",
    closedAt: undefined,
    nextAction: undefined,
    lostReason: undefined,
    notes: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function emptyCtx(): AiContext {
  return { customers: [], deals: [], invoices: [], payments: [] };
}

// =====================================================
// Q01「今月の売上」
// =====================================================
describe("Q01: 今月の売上", () => {
  it("当月入金合計と前月比テキストを返す", () => {
    const ctx: AiContext = {
      customers: [makeCustomer()],
      deals: [],
      invoices: [],
      payments: [
        // 当月（2026-05）3件 = 600,000
        makePayment({
          id: "p1",
          paidAt: "2026-05-03T12:00:00.000Z",
          amount: 100000,
        }),
        makePayment({
          id: "p2",
          paidAt: "2026-05-12T12:00:00.000Z",
          amount: 200000,
        }),
        makePayment({
          id: "p3",
          paidAt: "2026-05-20T12:00:00.000Z",
          amount: 300000,
        }),
        // 先月（2026-04）2件 = 300,000
        makePayment({
          id: "p4",
          paidAt: "2026-04-10T12:00:00.000Z",
          amount: 100000,
        }),
        makePayment({
          id: "p5",
          paidAt: "2026-04-25T12:00:00.000Z",
          amount: 200000,
        }),
      ],
    };

    const res = generateResponse("今月の売上は？", ctx);

    expect(res.matched).toBe("Q01");
    // 当月合計
    expect(res.text).toContain(formatYen(600000));
    // 前月比テキスト（先月金額も含む）
    expect(res.text).toContain("前月比");
    expect(res.text).toContain(formatYen(300000));
  });

  it("当月の入金が0件のとき fallback メッセージを返す", () => {
    const ctx: AiContext = {
      ...emptyCtx(),
      payments: [
        // 先月のみ
        makePayment({
          id: "p1",
          paidAt: "2026-04-10T12:00:00.000Z",
          amount: 100000,
        }),
      ],
    };

    const res = generateResponse("今月の売上は？", ctx);

    expect(res.matched).toBe("Q01");
    expect(res.text).toContain("今月の入金データがまだありません");
  });
});

// =====================================================
// Q03「未入金一覧」
// =====================================================
describe("Q03: 未入金一覧", () => {
  it("未入金合計件数とトップ顧客名を返す", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Big Customer" }),
      makeCustomer({ id: "c2", name: "Small Customer" }),
    ];
    const invoices = [
      // sent 3件
      makeInvoice({
        id: "i1",
        customerId: "c1",
        status: "sent",
        total: 1_000_000,
      }),
      makeInvoice({
        id: "i2",
        customerId: "c2",
        status: "sent",
        total: 100_000,
      }),
      makeInvoice({
        id: "i3",
        customerId: "c2",
        status: "sent",
        total: 80_000,
      }),
      // overdue 1件
      makeInvoice({
        id: "i4",
        customerId: "c2",
        status: "overdue",
        total: 50_000,
      }),
      // paid 1件（未入金集計には含まれない）
      makeInvoice({
        id: "i5",
        customerId: "c2",
        status: "paid",
        total: 200_000,
        paidAt: "2026-05-01T00:00:00.000Z",
      }),
    ];
    const ctx: AiContext = {
      customers,
      invoices,
      deals: [],
      payments: [],
    };

    const res = generateResponse("未入金一覧を教えて", ctx);

    expect(res.matched).toBe("Q03");
    // 件数（sent 3 + overdue 1 = 4）
    expect(res.text).toContain("4件");
    // 合計
    expect(res.text).toContain(formatYen(1_230_000));
    // トップ顧客名（金額最大の Big Customer が上位）
    expect(res.text).toContain("Big Customer");
  });

  it("全件 paid のときは『すべての請求書が入金済み』", () => {
    const ctx: AiContext = {
      customers: [makeCustomer()],
      invoices: [
        makeInvoice({
          status: "paid",
          paidAt: "2026-05-01T00:00:00.000Z",
        }),
      ],
      deals: [],
      payments: [],
    };

    const res = generateResponse("未入金一覧を教えて", ctx);

    expect(res.matched).toBe("Q03");
    expect(res.text).toContain("すべての請求書が入金済み");
  });
});

// =====================================================
// Q13「TOP顧客」
// =====================================================
describe("Q13: TOP顧客", () => {
  it("1位顧客名と金額を含むテキストを返す", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Alpha Corp" }),
      makeCustomer({ id: "c2", name: "Bravo Inc" }),
      makeCustomer({ id: "c3", name: "Charlie LLC" }),
    ];
    const invoices = [
      makeInvoice({ id: "i1", customerId: "c1" }),
      makeInvoice({ id: "i2", customerId: "c2" }),
      makeInvoice({ id: "i3", customerId: "c3" }),
    ];
    const payments = [
      makePayment({ id: "p1", invoiceId: "i1", amount: 1_000_000 }),
      makePayment({ id: "p2", invoiceId: "i2", amount: 500_000 }),
      makePayment({ id: "p3", invoiceId: "i3", amount: 200_000 }),
    ];
    const ctx: AiContext = { customers, invoices, payments, deals: [] };

    const res = generateResponse("TOP顧客は？", ctx);

    expect(res.matched).toBe("Q13");
    // 1位
    expect(res.text).toContain("Alpha Corp");
    expect(res.text).toContain(formatYen(1_000_000));
    // 順位プレフィックス（responder は "1. ..." の形式で出す）
    expect(res.text).toMatch(/1\.\s*\*\*Alpha Corp\*\*/);
  });

  it("入金実績ゼロのとき fallback メッセージを返す", () => {
    const ctx: AiContext = {
      customers: [makeCustomer()],
      invoices: [],
      payments: [],
      deals: [],
    };

    const res = generateResponse("TOP顧客は？", ctx);

    expect(res.matched).toBe("Q13");
    expect(res.text).toContain("顧客の入金実績がまだありません");
  });
});

// =====================================================
// Q08「今月の受注」
// =====================================================
describe("Q08: 今月の受注", () => {
  it("当月クローズの won 案件のみ集計される", () => {
    const customers = [makeCustomer({ id: "c1", name: "WonCo" })];
    const deals: Deal[] = [
      // 当月 won
      makeDeal({
        id: "d1",
        customerId: "c1",
        stage: "won",
        amount: 700_000,
        closedAt: "2026-05-09T12:00:00.000Z",
        title: "Big Win",
      }),
      // 先月 won（除外）
      makeDeal({
        id: "d2",
        customerId: "c1",
        stage: "won",
        amount: 300_000,
        closedAt: "2026-04-30T12:00:00.000Z",
        title: "Last Month",
      }),
      // 当月だが受注前（除外）
      makeDeal({
        id: "d3",
        customerId: "c1",
        stage: "negotiation",
        amount: 999_000,
        title: "Pending",
      }),
    ];
    const ctx: AiContext = {
      customers,
      deals,
      invoices: [],
      payments: [],
    };

    const res = generateResponse("今月の受注", ctx);

    expect(res.matched).toBe("Q08");
    expect(res.text).toContain("1件");
    expect(res.text).toContain(formatYen(700_000));
    expect(res.text).toContain("Big Win");
    expect(res.text).not.toContain("Last Month");
  });
});

// =====================================================
// Q14「新規顧客」
// =====================================================
describe("Q14: 新規顧客", () => {
  it("当月作成の顧客のみ列挙される", () => {
    const customers = [
      makeCustomer({
        id: "c1",
        name: "New Co",
        createdAt: "2026-05-02T12:00:00.000Z",
      }),
      makeCustomer({
        id: "c2",
        name: "Old Co",
        createdAt: "2026-01-02T12:00:00.000Z",
      }),
    ];
    const ctx: AiContext = {
      customers,
      deals: [],
      invoices: [],
      payments: [],
    };

    const res = generateResponse("新規顧客", ctx);

    expect(res.matched).toBe("Q14");
    expect(res.text).toContain("1社");
    expect(res.text).toContain("New Co");
    expect(res.text).not.toContain("Old Co");
  });
});

// =====================================================
// フォールバック
// =====================================================
describe("フォールバック（パターン未マッチ）", () => {
  it("無関係な質問は matched: null と FALLBACK テキスト", () => {
    const res = generateResponse("今日の天気はどうですか？", emptyCtx());

    expect(res.matched).toBeNull();
    expect(res.text).toContain("対応していません");
  });

  it("空文字も matched: null", () => {
    const res = generateResponse("", emptyCtx());
    expect(res.matched).toBeNull();
  });
});
