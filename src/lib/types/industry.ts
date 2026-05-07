export type Industry = "it-services" | "wholesale" | "consulting";

export const INDUSTRY_LABELS: Record<Industry, string> = {
  "it-services": "IT受託・SaaS",
  wholesale: "卸売・小売",
  consulting: "コンサル・士業",
};

export const INDUSTRY_EMOJIS: Record<Industry, string> = {
  "it-services": "💻",
  wholesale: "📦",
  consulting: "💼",
};

export const INDUSTRIES: Industry[] = [
  "it-services",
  "wholesale",
  "consulting",
];
