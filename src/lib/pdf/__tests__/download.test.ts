import { describe, expect, it } from "vitest";
import { buildPdfFilename } from "../download";

describe("buildPdfFilename", () => {
  it("ハイフンを保持する（番号の視認性）", () => {
    expect(
      buildPdfFilename("見積", "EST-20260507-001", "株式会社サンプル"),
    ).toBe("見積_EST-20260507-001_株式会社サンプル.pdf");
  });

  it("OS 禁止文字 (\\/:*?\"<>|) を除去する", () => {
    expect(buildPdfFilename("請求書", "INV/001", 'A:Co"<>')).toBe(
      "請求書_INV001_ACo.pdf",
    );
  });

  it("顧客名なしでも動作する", () => {
    expect(buildPdfFilename("見積", "EST-001", undefined)).toBe(
      "見積_EST-001.pdf",
    );
  });

  it("空白を _ に collapse する", () => {
    expect(buildPdfFilename("見積", "EST 001", "山田 太郎")).toBe(
      "見積_EST_001_山田_太郎.pdf",
    );
  });

  it("禁止文字のみ・全部除去された場合は prefix だけ残す", () => {
    expect(buildPdfFilename("見積", "/:*", "?")).toBe("見積.pdf");
  });

  it("請求書 prefix も同様に動作する", () => {
    expect(
      buildPdfFilename("請求書", "INV-20260507-001", "テスト商事"),
    ).toBe("請求書_INV-20260507-001_テスト商事.pdf");
  });
});
