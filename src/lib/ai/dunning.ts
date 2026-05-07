import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { Customer } from "@/lib/types/customer";
import type { Invoice } from "@/lib/types/invoice";
import type { CompanyInfo } from "@/lib/types/settings";
import { formatYen } from "@/lib/utils/currency";
import { daysBetween } from "@/lib/utils/date";

export type DunningDraft = {
  subject: string;
  body: string;
  to: string;
};

function fmt(iso: string): string {
  return format(parseISO(iso), "yyyy年M月d日", { locale: ja });
}

function severityLabel(daysOverdue: number): string {
  if (daysOverdue >= 30) return "重要なお知らせ・最終のご案内";
  if (daysOverdue >= 14) return "再度のご案内";
  return "ご確認のお願い";
}

function severityIntro(daysOverdue: number, customerName: string): string {
  if (daysOverdue >= 30) {
    return `${customerName} 御中\n\n平素より格別のお引き立てを賜り、誠にありがとうございます。\n大変恐縮ですが、下記の請求書につきまして、お支払期日を ${daysOverdue} 日経過しても入金確認ができておりません。\n本件、複数回ご案内を差し上げておりますので、お振込みの状況を至急ご確認のうえ、対応をお願い申し上げます。`;
  }
  if (daysOverdue >= 14) {
    return `${customerName} 御中\n\nいつもお世話になっております。\n先日ご案内差し上げました請求書につきまして、お支払期日を ${daysOverdue} 日経過しておりますが、まだ入金確認ができておりません。\n行き違いの場合はご容赦くださいませ。お手数ですが、お振込状況をご確認いただけますでしょうか。`;
  }
  return `${customerName} 御中\n\nいつもお世話になっております。\n下記の請求書につきまして、お支払期日が ${daysOverdue} 日経過しておりますが、現時点で入金の確認ができておりません。\n行き違いの場合はご容赦ください。お振込状況のご確認をお願いできますでしょうか。`;
}

export function buildDunningDraft({
  invoice,
  customer,
  company,
  today = new Date().toISOString(),
}: {
  invoice: Invoice;
  customer?: Customer;
  company: CompanyInfo;
  today?: string;
}): DunningDraft {
  const customerName = customer?.name ?? "ご担当者";
  const days = Math.max(1, daysBetween(invoice.dueDate, today));
  const subject = `【${severityLabel(days)}】請求書 ${invoice.number} のお支払いについて`;

  const intro = severityIntro(days, customerName);

  const body = [
    intro,
    "",
    "■ 対象の請求書",
    `・請求番号: ${invoice.number}`,
    `・件名: ${invoice.title}`,
    `・請求金額: ${formatYen(invoice.total)}（税込）`,
    `・発行日: ${fmt(invoice.issueDate)}`,
    `・お支払期日: ${fmt(invoice.dueDate)}`,
    `・経過日数: ${days} 日`,
    "",
    "■ お振込先",
    company.bankInfo || "（振込先情報は設定画面でご登録ください）",
    "",
    "万一すでにお振込済みの場合は、本メールを行き違いにてご容赦ください。",
    "ご不明な点やお支払いに関するご相談がございましたら、お気軽にご連絡くださいませ。",
    "",
    "ご対応のほど、何卒よろしくお願い申し上げます。",
    "",
    "----------------------------------------",
    company.name,
    company.address ? `${company.postalCode ? `〒${company.postalCode} ` : ""}${company.address}` : "",
    company.phone ? `TEL: ${company.phone}` : "",
    company.email,
    "----------------------------------------",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return {
    subject,
    body,
    to: customer?.email ?? "",
  };
}

export function buildMailtoUrl(draft: DunningDraft): string {
  const params = new URLSearchParams();
  params.set("subject", draft.subject);
  params.set("body", draft.body);
  const to = encodeURIComponent(draft.to ?? "");
  // URLSearchParams uses '+' for space; mail clients prefer %20 in body, but
  // most clients handle both. We keep the standard URLSearchParams encoding.
  return `mailto:${to}?${params.toString()}`;
}
