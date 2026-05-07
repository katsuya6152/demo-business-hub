import type { Industry } from "./industry";

export type CompanyInfo = {
  name: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  invoiceRegistrationNumber: string;
  bankInfo: string;
};

export type Settings = {
  industry: Industry;
  company: CompanyInfo;
  taxRate: number;
};

export type Meta = {
  schemaVersion: 1;
  initializedAt: string;
  lastResetAt?: string;
  currentSeedIndustry?: Industry;
};

export const DEFAULT_COMPANY: CompanyInfo = {
  name: "サンプル株式会社",
  postalCode: "150-0001",
  address: "東京都渋谷区神宮前1-1-1",
  phone: "03-0000-0000",
  email: "info@example.com",
  invoiceRegistrationNumber: "T1234567890123",
  bankInfo: "みずほ銀行 渋谷支店 普通 1234567 サンプル(カ",
};
