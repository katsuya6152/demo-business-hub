import { describe, it, expect } from "vitest";
import {
  exportCustomersToCSV,
  parseCustomersCSV,
  dedupAgainstExisting,
  buildCustomersCsvFilename,
  CSV_COLUMNS,
} from "../customers-csv";
import type { Customer } from "@/lib/types/customer";

function makeCustomer(over: Partial<Customer> = {}): Customer {
  return {
    id: "c-1",
    name: "サンプル株式会社",
    industry: "IT",
    contactPerson: "山田太郎",
    contactRole: "代表取締役",
    email: "yamada@example.com",
    phone: "03-1234-5678",
    postalCode: "100-0001",
    address: "東京都千代田区",
    status: "active",
    notes: "",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("exportCustomersToCSV", () => {
  it("BOM 付きで全カラムを含む", () => {
    const csv = exportCustomersToCSV([makeCustomer()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    for (const col of CSV_COLUMNS) {
      expect(csv).toContain(col);
    }
    expect(csv).toContain("サンプル株式会社");
    expect(csv).toContain("yamada@example.com");
  });

  it("ステータスを日本語表記でエクスポート", () => {
    const csv = exportCustomersToCSV([
      makeCustomer({ status: "active" }),
      makeCustomer({ id: "c-2", email: "p@example.com", status: "prospect" }),
      makeCustomer({ id: "c-3", email: "i@example.com", status: "inactive" }),
    ]);
    expect(csv).toContain("アクティブ");
    expect(csv).toContain("見込み");
    expect(csv).toContain("Inactive");
  });

  it("0件でもヘッダーは出力", () => {
    const csv = exportCustomersToCSV([]);
    expect(csv).toContain("顧客名");
    expect(csv).toContain("ステータス");
  });
});

describe("buildCustomersCsvFilename", () => {
  it("YYYYMMDD 形式のファイル名", () => {
    const name = buildCustomersCsvFilename(new Date("2026-05-07T12:00:00Z"));
    expect(name).toBe("customers_20260507.csv");
  });
});

describe("parseCustomersCSV — round-trip", () => {
  it("export → parse で同じ値が復元される", () => {
    const input = makeCustomer({ status: "prospect" });
    const csv = exportCustomersToCSV([input]);
    const out = parseCustomersCSV(csv);
    expect(out.errors).toEqual([]);
    expect(out.validRows).toHaveLength(1);
    const row = out.validRows[0];
    expect(row.name).toBe(input.name);
    expect(row.email).toBe(input.email);
    expect(row.status).toBe("prospect");
    expect(row.contactPerson).toBe(input.contactPerson);
    expect(row.industry).toBe(input.industry);
  });
});

describe("parseCustomersCSV — エラー検出", () => {
  it("ヘッダー不足を検出", () => {
    const csv = `顧客名,メール\nA社,a@example.com\n`;
    const out = parseCustomersCSV(csv);
    expect(out.validRows).toHaveLength(0);
    expect(out.errors.length).toBeGreaterThan(0);
    expect(out.errors[0].message).toContain("ヘッダー不足");
  });

  it("メール形式エラーを行単位で報告", () => {
    const header = CSV_COLUMNS.join(",");
    const goodRow = "A社,IT,山田,,a@example.com,,,,アクティブ,";
    const badRow = "B社,IT,佐藤,,not-an-email,,,,アクティブ,";
    const csv = `${header}\n${goodRow}\n${badRow}\n`;
    const out = parseCustomersCSV(csv);
    expect(out.validRows).toHaveLength(1);
    expect(out.validRows[0].name).toBe("A社");
    const emailErrors = out.errors.filter(
      (e) => e.row === 2 && e.field === "メール",
    );
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it("空行はスキップする", () => {
    const header = CSV_COLUMNS.join(",");
    const row = "A社,IT,山田,,a@example.com,,,,アクティブ,";
    const csv = `${header}\n${row}\n,,,,,,,,,\n`;
    const out = parseCustomersCSV(csv);
    expect(out.validRows).toHaveLength(1);
    expect(out.errors.filter((e) => e.row > 0)).toHaveLength(0);
  });

  it("ステータスは英語表記も受け入れる", () => {
    const header = CSV_COLUMNS.join(",");
    const row = "A社,IT,山田,,a@example.com,,,,prospect,";
    const csv = `${header}\n${row}\n`;
    const out = parseCustomersCSV(csv);
    expect(out.validRows).toHaveLength(1);
    expect(out.validRows[0].status).toBe("prospect");
  });
});

describe("dedupAgainstExisting", () => {
  it("既存メールと重複する行はスキップされる", () => {
    const existing = [makeCustomer({ email: "dup@example.com" })];
    const parsed = [
      {
        name: "新規",
        industry: "",
        contactPerson: "山田",
        contactRole: "",
        email: "new@example.com",
        phone: "",
        postalCode: "",
        address: "",
        status: "active" as const,
        notes: "",
      },
      {
        name: "重複",
        industry: "",
        contactPerson: "佐藤",
        contactRole: "",
        email: "dup@example.com",
        phone: "",
        postalCode: "",
        address: "",
        status: "active" as const,
        notes: "",
      },
    ];
    const res = dedupAgainstExisting(parsed, existing);
    expect(res.toInsert).toHaveLength(1);
    expect(res.toInsert[0].name).toBe("新規");
    expect(res.duplicates).toHaveLength(1);
    expect(res.duplicates[0].email).toBe("dup@example.com");
  });

  it("CSV 内の重複もスキップされる", () => {
    const parsed = [
      {
        name: "A",
        industry: "",
        contactPerson: "X",
        contactRole: "",
        email: "same@example.com",
        phone: "",
        postalCode: "",
        address: "",
        status: "active" as const,
        notes: "",
      },
      {
        name: "B",
        industry: "",
        contactPerson: "Y",
        contactRole: "",
        email: "same@example.com",
        phone: "",
        postalCode: "",
        address: "",
        status: "active" as const,
        notes: "",
      },
    ];
    const res = dedupAgainstExisting(parsed, []);
    expect(res.toInsert).toHaveLength(1);
    expect(res.duplicates).toHaveLength(1);
  });
});
