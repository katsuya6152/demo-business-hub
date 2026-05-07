export type QuestionPatternId =
  | "Q01"
  | "Q02"
  | "Q03"
  | "Q04"
  | "Q05"
  | "Q06"
  | "Q07"
  | "Q08"
  | "Q09"
  | "Q10"
  | "Q11"
  | "Q12"
  | "Q13"
  | "Q14"
  | "Q15"
  | "Q16"
  | "Q17"
  | "Q18";

export type QuestionCategory =
  | "revenue"
  | "deals"
  | "customers";

export type QuestionPattern = {
  id: QuestionPatternId;
  triggers: string[];
  category: QuestionCategory;
  example: string;
  priority: number; // smaller = higher
  must: boolean;
};

export const PATTERNS: QuestionPattern[] = [
  {
    id: "Q01",
    triggers: ["今月", "売上", "入金"],
    category: "revenue",
    example: "今月の売上は？",
    priority: 10,
    must: true,
  },
  {
    id: "Q02",
    triggers: ["先月"],
    category: "revenue",
    example: "先月の売上は？",
    priority: 11,
    must: false,
  },
  {
    id: "Q03",
    triggers: ["未入金", "未収", "入金されて"],
    category: "revenue",
    example: "未入金の取引先一覧",
    priority: 5,
    must: true,
  },
  {
    id: "Q04",
    triggers: ["期限超過", "延滞", "オーバー", "支払い遅"],
    category: "revenue",
    example: "期限超過の請求書",
    priority: 5,
    must: true,
  },
  {
    id: "Q05",
    triggers: ["来月", "入金予定"],
    category: "revenue",
    example: "来月の入金予定",
    priority: 8,
    must: false,
  },
  {
    id: "Q06",
    triggers: ["推移", "月別", "トレンド"],
    category: "revenue",
    example: "売上推移",
    priority: 8,
    must: false,
  },
  {
    id: "Q07",
    triggers: ["商談", "パイプライン", "進行中"],
    category: "deals",
    example: "商談中の案件",
    priority: 7,
    must: true,
  },
  {
    id: "Q08",
    triggers: ["受注", "Won", "won", "クローズした"],
    category: "deals",
    example: "今月の受注",
    priority: 7,
    must: true,
  },
  {
    id: "Q09",
    triggers: ["失注", "Lost", "lost", "落ちた"],
    category: "deals",
    example: "失注した案件",
    priority: 6,
    must: false,
  },
  {
    id: "Q10",
    triggers: ["確度", "高い案件", "70%"],
    category: "deals",
    example: "確度が高い案件",
    priority: 8,
    must: false,
  },
  {
    id: "Q11",
    triggers: ["来月", "クローズ"],
    category: "deals",
    example: "来月クローズ予定",
    priority: 9,
    must: false,
  },
  {
    id: "Q12",
    triggers: ["最大", "一番大きい", "トップ案件"],
    category: "deals",
    example: "最大の案件",
    priority: 7,
    must: true,
  },
  {
    id: "Q13",
    triggers: ["TOP顧客", "上位", "ベスト顧客", "売上トップ", "トップ顧客"],
    category: "customers",
    example: "TOP顧客は？",
    priority: 6,
    must: true,
  },
  {
    id: "Q14",
    triggers: ["新規顧客", "新規", "増えた顧客"],
    category: "customers",
    example: "今月の新規顧客",
    priority: 7,
    must: true,
  },
  {
    id: "Q15",
    triggers: ["取引のない", "休眠", "アクティブでない"],
    category: "customers",
    example: "休眠顧客",
    priority: 7,
    must: false,
  },
  {
    id: "Q16",
    triggers: ["顧客数", "全顧客", "何社"],
    category: "customers",
    example: "顧客数を教えて",
    priority: 9,
    must: true,
  },
  {
    id: "Q17",
    triggers: ["平均", "案件金額", "平均単価"],
    category: "deals",
    example: "平均案件金額",
    priority: 8,
    must: false,
  },
  {
    id: "Q18",
    triggers: ["成約率", "受注率"],
    category: "deals",
    example: "成約率",
    priority: 6,
    must: true,
  },
];

export const QUICK_QUESTIONS: string[] = [
  "今月の売上は？",
  "未入金一覧",
  "商談中の案件",
  "TOP顧客は？",
  "新規顧客",
  "成約率",
];
