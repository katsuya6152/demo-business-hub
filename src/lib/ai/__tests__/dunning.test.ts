import { describe, it, expect } from "vitest";
import { buildDunningDraft, buildMailtoUrl } from "../dunning";
import type { Customer } from "@/lib/types/customer";
import type { Invoice } from "@/lib/types/invoice";
import { DEFAULT_COMPANY } from "@/lib/types/settings";

const customer: Customer = {
  id: "cus-1",
  name: "株式会社サンプル",
  industry: "IT",
  contactPerson: "田中太郎",
  contactRole: "経理",
  email: "tanaka@example.com",
  phone: "03-0000-0000",
  status: "active",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

function makeInvoice(daysOverdue: number): Invoice {
  const now = new Date("2026-05-07T00:00:00.000Z");
  const due = new Date(now);
  due.setDate(now.getDate() - daysOverdue);
  return {
    id: "inv-1",
    number: "INV-20260301-001",
    customerId: customer.id,
    title: "Web 開発業務委託料",
    issueDate: "2026-03-01",
    dueDate: due.toISOString().slice(0, 10),
    items: [],
    subtotal: 100000,
    tax: 10000,
    total: 110000,
    status: "overdue",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  };
}

describe("buildDunningDraft", () => {
  it("含むべき情報を本文に埋め込む", () => {
    const draft = buildDunningDraft({
      invoice: makeInvoice(7),
      customer,
      company: DEFAULT_COMPANY,
      today: "2026-05-07T00:00:00.000Z",
    });
    expect(draft.subject).toContain("INV-20260301-001");
    expect(draft.body).toContain(customer.name);
    expect(draft.body).toContain("INV-20260301-001");
    expect(draft.body).toContain("¥110,000");
    expect(draft.to).toBe(customer.email);
  });

  it("経過日数で深刻度を切り替える（7日 → ご確認のお願い）", () => {
    const draft = buildDunningDraft({
      invoice: makeInvoice(7),
      customer,
      company: DEFAULT_COMPANY,
      today: "2026-05-07T00:00:00.000Z",
    });
    expect(draft.subject).toContain("ご確認のお願い");
  });

  it("経過日数で深刻度を切り替える（30日 → 最終のご案内）", () => {
    const draft = buildDunningDraft({
      invoice: makeInvoice(35),
      customer,
      company: DEFAULT_COMPANY,
      today: "2026-05-07T00:00:00.000Z",
    });
    expect(draft.subject).toContain("最終のご案内");
  });

  it("顧客未設定でもクラッシュしない", () => {
    const draft = buildDunningDraft({
      invoice: makeInvoice(5),
      customer: undefined,
      company: DEFAULT_COMPANY,
      today: "2026-05-07T00:00:00.000Z",
    });
    expect(draft.body).toContain("ご担当者");
    expect(draft.to).toBe("");
  });
});

describe("buildMailtoUrl", () => {
  it("subject / body をクエリにエンコードする", () => {
    const url = buildMailtoUrl({
      subject: "件名テスト",
      body: "本文\n2行目",
      to: "tanaka@example.com",
    });
    expect(url.startsWith("mailto:")).toBe(true);
    expect(url).toContain("subject=");
    expect(url).toContain("body=");
    expect(url).toContain(encodeURIComponent("件名テスト"));
  });
});
