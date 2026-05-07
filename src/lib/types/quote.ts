export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "下書き",
  sent: "送付済",
  accepted: "承認",
  rejected: "却下",
  expired: "期限切れ",
};

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type Quote = {
  id: string;
  number: string;
  customerId: string;
  dealId?: string;
  title: string;
  issueDate: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
};
