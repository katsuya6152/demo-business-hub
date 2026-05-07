import Papa from "papaparse";
import { z } from "zod";
import type { Customer, CustomerStatus } from "@/lib/types/customer";
import { format } from "@/lib/utils/date";

/* ---------------------------------------------------------------- *
 * CSV カラム定義（日本語ヘッダ）                                    *
 * ---------------------------------------------------------------- */

export const CSV_COLUMNS = [
  "顧客名",
  "業種",
  "担当者",
  "役職",
  "メール",
  "電話",
  "郵便番号",
  "住所",
  "ステータス",
  "メモ",
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];

export type CustomerCsvRow = Record<CsvColumn, string>;

/* ---------------------------------------------------------------- *
 * ステータス変換                                                    *
 * ---------------------------------------------------------------- */

const STATUS_TO_CSV: Record<CustomerStatus, string> = {
  active: "アクティブ",
  prospect: "見込み",
  inactive: "Inactive",
};

const CSV_TO_STATUS: Record<string, CustomerStatus> = {
  "アクティブ": "active",
  "見込み": "prospect",
  "Inactive": "inactive",
  active: "active",
  prospect: "prospect",
  inactive: "inactive",
};

/* ---------------------------------------------------------------- *
 * Zod スキーマ — CSV 1 行ぶん                                       *
 * ---------------------------------------------------------------- */

export const customerCsvSchema = z.object({
  顧客名: z.string().min(1, "顧客名は必須です"),
  業種: z.string().default(""),
  担当者: z.string().min(1, "担当者は必須です"),
  役職: z.string().default(""),
  メール: z.string().email("メール形式が不正です"),
  電話: z.string().default(""),
  郵便番号: z.string().default(""),
  住所: z.string().default(""),
  ステータス: z
    .enum([
      "アクティブ",
      "見込み",
      "Inactive",
      "active",
      "prospect",
      "inactive",
    ])
    .default("active"),
  メモ: z.string().default(""),
});

export type CustomerCsvInput = z.infer<typeof customerCsvSchema>;

/* ---------------------------------------------------------------- *
 * エクスポート                                                      *
 * ---------------------------------------------------------------- */

function customerToCsvRow(c: Customer): CustomerCsvRow {
  return {
    顧客名: c.name,
    業種: c.industry ?? "",
    担当者: c.contactPerson,
    役職: c.contactRole ?? "",
    メール: c.email,
    電話: c.phone ?? "",
    郵便番号: c.postalCode ?? "",
    住所: c.address ?? "",
    ステータス: STATUS_TO_CSV[c.status],
    メモ: c.notes ?? "",
  };
}

export function exportCustomersToCSV(customers: Customer[]): string {
  const rows = customers.map(customerToCsvRow);
  // BOM 付き UTF-8 で Excel 文字化け回避
  const BOM = "﻿";
  // 0件のときは papaparse がヘッダーすら出さないので、ヘッダー行を明示する
  const csv =
    rows.length === 0
      ? Papa.unparse({ fields: [...CSV_COLUMNS], data: [] }, {
          quotes: true,
          newline: "\r\n",
        })
      : Papa.unparse(rows, {
          columns: [...CSV_COLUMNS],
          quotes: true,
          newline: "\r\n",
        });
  return BOM + csv;
}

export function buildCustomersCsvFilename(date: Date = new Date()): string {
  return `customers_${format(date, "yyyyMMdd")}.csv`;
}

export function downloadCustomersCSV(
  customers: Customer[],
  filename: string = buildCustomersCsvFilename(),
): void {
  if (typeof window === "undefined") return;
  const csv = exportCustomersToCSV(customers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 解放はブラウザに委ねるためマイクロタスクで遅延
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ---------------------------------------------------------------- *
 * インポート — パース + 検証                                        *
 * ---------------------------------------------------------------- */

export type CsvRowError = {
  row: number; // 1-origin (ヘッダー除いたデータ行番号)
  field?: string;
  message: string;
};

export type CsvParsedCustomer = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt"
>;

export type CsvParseOutcome = {
  /** 検証成功した行（add() に渡せる形） */
  validRows: CsvParsedCustomer[];
  /** 検証失敗した行のエラー */
  errors: CsvRowError[];
  /** 解析できた総データ行数（成功 + 失敗） */
  totalRows: number;
};

/**
 * CSV テキストをパースしてバリデーション。
 * ヘッダ行は日本語カラム必須（`CSV_COLUMNS`）。
 */
export function parseCustomersCSV(csvText: string): CsvParseOutcome {
  // BOM が含まれていたら除去
  const cleaned = csvText.replace(/^﻿/, "");

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: CsvRowError[] = [];
  const validRows: CsvParsedCustomer[] = [];

  // 必須ヘッダー検証
  const headers = parsed.meta?.fields ?? [];
  const missing = CSV_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    errors.push({
      row: 0,
      message: `ヘッダー不足: ${missing.join(", ")}`,
    });
    return { validRows, errors, totalRows: 0 };
  }

  // papaparse 自身のパースエラー
  for (const e of parsed.errors) {
    errors.push({
      row: typeof e.row === "number" ? e.row + 1 : 0,
      message: e.message,
    });
  }

  parsed.data.forEach((raw, idx) => {
    const rowNum = idx + 1;
    // 空行スキップ
    const allEmpty = CSV_COLUMNS.every(
      (col) => !((raw[col] ?? "").trim().length > 0),
    );
    if (allEmpty) return;

    // trim
    const trimmed: Record<string, string> = {};
    for (const col of CSV_COLUMNS) {
      trimmed[col] = (raw[col] ?? "").trim();
    }

    const result = customerCsvSchema.safeParse(trimmed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          row: rowNum,
          field: issue.path.join(".") || undefined,
          message: issue.message,
        });
      }
      return;
    }

    const v = result.data;
    validRows.push({
      name: v.顧客名,
      industry: v.業種,
      contactPerson: v.担当者,
      contactRole: v.役職,
      email: v.メール,
      phone: v.電話,
      postalCode: v.郵便番号,
      address: v.住所,
      status: CSV_TO_STATUS[v.ステータス] ?? "active",
      notes: v.メモ,
    });
  });

  const totalRows = validRows.length + countRowErrorRows(errors);
  return { validRows, errors, totalRows };
}

function countRowErrorRows(errors: CsvRowError[]): number {
  const rows = new Set<number>();
  for (const e of errors) {
    if (e.row > 0) rows.add(e.row);
  }
  return rows.size;
}

/* ---------------------------------------------------------------- *
 * 重複判定                                                          *
 * ---------------------------------------------------------------- */

export type DedupResult = {
  toInsert: CsvParsedCustomer[];
  duplicates: Array<{ row: number; reason: "email"; email: string }>;
};

/**
 * 既存顧客との重複（メール）を判定して、追加対象とスキップ対象に分ける。
 */
export function dedupAgainstExisting(
  parsed: CsvParsedCustomer[],
  existing: Customer[],
): DedupResult {
  const existingEmails = new Set(
    existing.map((c) => c.email.toLowerCase()),
  );
  const seenEmails = new Set<string>();
  const toInsert: CsvParsedCustomer[] = [];
  const duplicates: DedupResult["duplicates"] = [];

  parsed.forEach((p, idx) => {
    const email = p.email.toLowerCase();
    if (existingEmails.has(email) || seenEmails.has(email)) {
      duplicates.push({ row: idx + 1, reason: "email", email: p.email });
      return;
    }
    seenEmails.add(email);
    toInsert.push(p);
  });

  return { toInsert, duplicates };
}
