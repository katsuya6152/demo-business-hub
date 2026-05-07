import { describe, it, expect } from "vitest";
import { matchPattern } from "../matcher";

describe("matchPattern", () => {
  describe("基本的なマッチング", () => {
    it.each<[string, string]>([
      // 1. 完全一致：「今月の売上は？」→ Q01（今月+売上 で 2 マッチ）
      ["今月の売上は？", "Q01"],
      // 2. 部分マッチ：「未入金一覧」→ Q03（未入金 と 入金 が衝突するが priority 5 < 10）
      ["未入金一覧", "Q03"],
      // 3. 複数マッチ + マッチ数優先：「来月の入金予定」→ Q05（来月+入金予定=2）
      //    Q01 (入金=1) や Q11 (来月=1) より勝つ
      ["来月の入金予定", "Q05"],
      // 4. priority 同点解決：「未入金」→ Q01(入金=1) と Q03(未入金=1) のタイ。
      //    priority 5 < 10 なので Q03。
      ["未入金", "Q03"],
      // 5. 大文字パターンの素直なマッチ
      ["TOP顧客", "Q13"],
      // 5b. 小文字での問い合わせも matcher が toLowerCase 比較するので Q13 にマッチ
      ["top顧客", "Q13"],
      // 9. 曖昧入力：「売上」だけで Q01 にマッチ
      ["売上", "Q01"],
      // 10. 失注：「失注した案件」→ Q09
      ["失注した案件", "Q09"],
      // 11. 成約率：「成約率は？」→ Q18
      ["成約率は？", "Q18"],
      // 12. 顧客数：「何社いますか」→ Q16
      ["何社いますか", "Q16"],
    ])("input=%s → %s", (input, expected) => {
      expect(matchPattern(input)?.id).toBe(expected);
    });
  });

  describe("MUST の代表的な質問例が確実にマッチする (Top10)", () => {
    it.each<[string, string]>([
      ["今月の売上は？", "Q01"],
      ["未入金の取引先一覧", "Q03"],
      ["期限超過の請求書", "Q04"],
      ["商談中の案件", "Q07"],
      ["今月の受注", "Q08"],
      ["最大の案件", "Q12"],
      ["TOP顧客は？", "Q13"],
      ["今月の新規顧客", "Q14"],
      ["顧客数を教えて", "Q16"],
      ["成約率", "Q18"],
    ])("MUST example: %s → %s", (input, expected) => {
      const result = matchPattern(input);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(expected);
      expect(result?.must).toBe(true);
    });
  });

  describe("マッチ数 vs priority の優先順位", () => {
    it("マッチ数が多い方が優先される（来月+入金予定 が 来月単独・入金単独より勝つ）", () => {
      const result = matchPattern("来月の入金予定");
      expect(result?.id).toBe("Q05");
    });

    it("マッチ数が同点なら priority が小さい方が勝つ（未入金=1 vs 入金=1 → Q03）", () => {
      const result = matchPattern("未入金");
      expect(result?.id).toBe("Q03");
    });

    it("「今月の受注」は Q01(今月=1) と Q08(受注=1) のタイで Q08(priority=7) が勝つ", () => {
      const result = matchPattern("今月の受注");
      expect(result?.id).toBe("Q08");
    });

    it("「来月クローズ」は Q05(来月=1) と Q11(来月+クローズ=2) で Q11 が勝つ", () => {
      const result = matchPattern("来月クローズ予定");
      expect(result?.id).toBe("Q11");
    });
  });

  describe("大文字・小文字の正規化", () => {
    it("「TOP顧客」「top顧客」「Top顧客」のいずれも Q13 にマッチする", () => {
      expect(matchPattern("TOP顧客")?.id).toBe("Q13");
      expect(matchPattern("top顧客")?.id).toBe("Q13");
      expect(matchPattern("Top顧客")?.id).toBe("Q13");
    });

    it("英語トリガー Won/won/Lost/lost も大小区別なし", () => {
      expect(matchPattern("WON した案件")?.id).toBe("Q08");
      expect(matchPattern("LOST 案件")?.id).toBe("Q09");
    });
  });

  describe("空入力 / マッチ無し", () => {
    it("空文字は null を返す", () => {
      expect(matchPattern("")).toBeNull();
    });

    it("空白のみは null を返す", () => {
      expect(matchPattern("   ")).toBeNull();
      expect(matchPattern("\t\n")).toBeNull();
    });

    it("トリガーを含まない問い合わせは null", () => {
      expect(matchPattern("天気は？")).toBeNull();
      expect(matchPattern("こんにちは")).toBeNull();
    });
  });
});
