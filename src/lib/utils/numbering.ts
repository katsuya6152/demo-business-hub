import { format } from "date-fns";
import type { Quote } from "@/lib/types/quote";
import type { Invoice } from "@/lib/types/invoice";

function nextNumber(
  prefix: string,
  existingNumbers: string[],
  date: Date = new Date(),
): string {
  const ymd = format(date, "yyyyMMdd");
  const todayCount =
    existingNumbers.filter((n) => n.includes(ymd)).length + 1;
  return `${prefix}-${ymd}-${String(todayCount).padStart(3, "0")}`;
}

export function nextQuoteNumber(quotes: Quote[], date?: Date): string {
  return nextNumber(
    "EST",
    quotes.map((q) => q.number),
    date,
  );
}

export function nextInvoiceNumber(invoices: Invoice[], date?: Date): string {
  return nextNumber(
    "INV",
    invoices.map((i) => i.number),
    date,
  );
}
