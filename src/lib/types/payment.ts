export type PaymentMethod =
  | "bank-transfer"
  | "credit-card"
  | "cash"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  "bank-transfer": "銀行振込",
  "credit-card": "クレジット",
  cash: "現金",
  other: "その他",
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  notes?: string;
  createdAt: string;
};
