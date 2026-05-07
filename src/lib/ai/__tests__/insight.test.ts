import { describe, it, expect } from "vitest";
import { buildInsights, pickHeadline } from "../insight";
import type { AiContext } from "../responder";

const emptyCtx: AiContext = {
  customers: [],
  deals: [],
  invoices: [],
  payments: [],
};

describe("buildInsights", () => {
  it("データが空ならプレースホルダを返す", () => {
    const insights = buildInsights(emptyCtx);
    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe("empty");
  });

  it("overdue があれば warning が含まれる", () => {
    const ctx: AiContext = {
      ...emptyCtx,
      invoices: [
        {
          id: "inv-1",
          number: "INV-20260101-001",
          customerId: "cus-1",
          title: "Test",
          issueDate: "2025-12-01",
          dueDate: "2025-12-31",
          items: [],
          subtotal: 100000,
          tax: 10000,
          total: 110000,
          status: "overdue",
          createdAt: "2025-12-01T00:00:00.000Z",
          updatedAt: "2025-12-01T00:00:00.000Z",
        },
      ],
    };
    const insights = buildInsights(ctx);
    expect(insights.some((i) => i.id === "overdue" && i.tone === "warning"))
      .toBe(true);
  });
});

describe("pickHeadline", () => {
  it("warning を最優先で選ぶ", () => {
    const headline = pickHeadline([
      { id: "a", tone: "neutral", text: "n" },
      { id: "b", tone: "warning", text: "w" },
      { id: "c", tone: "positive", text: "p" },
    ]);
    expect(headline.id).toBe("b");
  });

  it("warning が無ければ positive を選ぶ", () => {
    const headline = pickHeadline([
      { id: "a", tone: "neutral", text: "n" },
      { id: "b", tone: "positive", text: "p" },
    ]);
    expect(headline.id).toBe("b");
  });

  it("どれもなければ先頭を返す", () => {
    const headline = pickHeadline([
      { id: "a", tone: "neutral", text: "n1" },
      { id: "b", tone: "neutral", text: "n2" },
    ]);
    expect(headline.id).toBe("a");
  });
});
