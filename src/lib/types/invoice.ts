import type { QuoteItem } from "./quote";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "下書き",
  sent: "送付済",
  paid: "入金済",
  overdue: "期限超過",
  cancelled: "取消",
};

export type InvoiceItem = QuoteItem;

export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  quoteId?: string;
  dealId?: string;
  title: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};
