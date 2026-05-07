"use client";

import type { Quote } from "@/lib/types/quote";
import type { Customer } from "@/lib/types/customer";
import type { CompanyInfo } from "@/lib/types/settings";
import { fmtDate } from "@/lib/utils/date";
import { formatYen } from "@/lib/utils/currency";

type QuotePrintProps = {
  quote: Quote;
  customer: Customer | undefined;
  company: CompanyInfo;
};

export function QuotePrint({ quote, customer, company }: QuotePrintProps) {
  return (
    <article className="print-page print-only">
      <header className="mb-8 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-widest">御 見 積 書</h1>
        <p className="mt-2 text-xs">No. {quote.number}</p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm">
            <strong className="mr-2 text-base">
              {customer ? customer.name : "顧客未設定"}
            </strong>
            <span>御中</span>
          </p>
          {customer?.address ? (
            <p className="mt-1 text-xs">
              {customer.postalCode ? `〒${customer.postalCode}　` : ""}
              {customer.address}
            </p>
          ) : null}
          {customer?.contactPerson ? (
            <p className="mt-1 text-xs">
              {customer.contactPerson}
              {customer.contactRole ? ` ${customer.contactRole}` : ""}
            </p>
          ) : null}
          <div className="mt-4 space-y-1 text-xs">
            <p>件名：{quote.title}</p>
            <p>発行日：{fmtDate(quote.issueDate)}</p>
            <p>有効期限：{fmtDate(quote.validUntil)}</p>
            {quote.paymentTerms ? <p>支払条件：{quote.paymentTerms}</p> : null}
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="text-sm font-bold">{company.name}</p>
          <p className="mt-1">
            {company.postalCode ? `〒${company.postalCode}` : ""}
          </p>
          <p>{company.address}</p>
          <p>TEL: {company.phone}</p>
          <p>{company.email}</p>
          {company.invoiceRegistrationNumber ? (
            <p className="mt-1">
              登録番号：{company.invoiceRegistrationNumber}
            </p>
          ) : null}
          <div className="mt-4 inline-flex h-16 w-16 items-center justify-center border border-black text-[10pt]">
            印
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 inline-block bg-black px-3 py-1 text-sm font-bold text-white">
          御見積金額　{formatYen(quote.total)}
        </div>
      </section>

      <section className="mb-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="border-x border-black px-2 py-1.5 text-left">
                品目
              </th>
              <th className="border-x border-black px-2 py-1.5 text-right w-20">
                数量
              </th>
              <th className="border-x border-black px-2 py-1.5 text-left w-16">
                単位
              </th>
              <th className="border-x border-black px-2 py-1.5 text-right w-28">
                単価
              </th>
              <th className="border-x border-black px-2 py-1.5 text-right w-28">
                金額
              </th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((it) => (
              <tr key={it.id} className="border-b border-black">
                <td className="border-x border-black px-2 py-1.5">
                  {it.description}
                </td>
                <td className="border-x border-black px-2 py-1.5 text-right tabular-nums">
                  {it.quantity}
                </td>
                <td className="border-x border-black px-2 py-1.5">
                  {it.unit}
                </td>
                <td className="border-x border-black px-2 py-1.5 text-right tabular-nums">
                  {formatYen(it.unitPrice)}
                </td>
                <td className="border-x border-black px-2 py-1.5 text-right tabular-nums">
                  {formatYen(it.quantity * it.unitPrice)}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - quote.items.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black">
                  <td className="border-x border-black px-2 py-1.5">&nbsp;</td>
                  <td className="border-x border-black px-2 py-1.5" />
                  <td className="border-x border-black px-2 py-1.5" />
                  <td className="border-x border-black px-2 py-1.5" />
                  <td className="border-x border-black px-2 py-1.5" />
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-6 flex justify-end">
        <table className="text-xs">
          <tbody>
            <tr>
              <td className="border-y border-l border-black px-3 py-1.5 text-right w-32">
                小計
              </td>
              <td className="border border-black px-3 py-1.5 text-right tabular-nums w-32">
                {formatYen(quote.subtotal)}
              </td>
            </tr>
            <tr>
              <td className="border-b border-l border-black px-3 py-1.5 text-right">
                消費税 (10%)
              </td>
              <td className="border-b border-x border-black px-3 py-1.5 text-right tabular-nums">
                {formatYen(quote.tax)}
              </td>
            </tr>
            <tr>
              <td className="border-b border-l border-black bg-black px-3 py-1.5 text-right font-bold text-white">
                合計
              </td>
              <td className="border-b border-x border-black bg-black px-3 py-1.5 text-right font-bold text-white tabular-nums">
                {formatYen(quote.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {quote.notes ? (
        <section className="mb-6 border-t border-black pt-3">
          <p className="mb-1 text-xs font-bold">備考</p>
          <p className="whitespace-pre-wrap text-xs leading-relaxed">
            {quote.notes}
          </p>
        </section>
      ) : null}

      {company.bankInfo ? (
        <section className="mb-2 text-xs">
          <p className="font-bold">お振込先</p>
          <p>{company.bankInfo}</p>
        </section>
      ) : null}
    </article>
  );
}
