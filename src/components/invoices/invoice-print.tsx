"use client";

import { useCustomersStore } from "@/lib/store/customers";
import { useSettingsStore } from "@/lib/store/settings";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";
import type { Invoice } from "@/lib/types/invoice";

type InvoicePrintProps = {
  invoice: Invoice;
};

export function InvoicePrint({ invoice }: InvoicePrintProps) {
  const customers = useCustomersStore((s) => s.customers);
  const settings = useSettingsStore((s) => s.settings);
  const customer = customers.find((c) => c.id === invoice.customerId);
  const company = settings.company;

  return (
    <article className="print-page print-only mx-auto max-w-[210mm] bg-white p-10 text-[10pt] text-black print:p-0">
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider">請求書</h1>
          <p className="mt-2 text-sm">No. {invoice.number}</p>
        </div>
        <div className="text-right text-xs">
          <p>発行日: {fmtDate(invoice.issueDate)}</p>
          <p>支払期日: {fmtDate(invoice.dueDate)}</p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs">宛先</p>
          <p className="mt-1 text-base font-bold">
            {customer?.name ?? "—"} 御中
          </p>
          {customer?.contactPerson ? (
            <p className="text-xs">
              {customer.contactPerson}
              {customer.contactRole ? ` (${customer.contactRole})` : ""}
            </p>
          ) : null}
          {customer?.address ? (
            <p className="mt-1 text-xs">
              {customer.postalCode ? `〒${customer.postalCode} ` : ""}
              {customer.address}
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs">
          <p className="text-sm font-bold">{company.name}</p>
          {company.postalCode ? <p>〒{company.postalCode}</p> : null}
          {company.address ? <p>{company.address}</p> : null}
          {company.phone ? <p>TEL: {company.phone}</p> : null}
          {company.email ? <p>{company.email}</p> : null}
          {company.invoiceRegistrationNumber ? (
            <p className="mt-1">
              登録番号: {company.invoiceRegistrationNumber}
            </p>
          ) : null}
          <div className="ml-auto mt-3 flex h-12 w-12 items-center justify-center border border-black text-[8pt]">
            印
          </div>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-xs">件名</p>
        <p className="mt-1 text-base font-semibold">{invoice.title}</p>
      </section>

      <section className="mt-4 rounded border border-black/40 p-3 text-center">
        <p className="text-xs">ご請求金額</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {formatYen(invoice.total)}
        </p>
      </section>

      <section className="mt-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-y border-black bg-black/5">
              <th className="p-2 text-left font-semibold">品目</th>
              <th className="p-2 text-right font-semibold">数量</th>
              <th className="p-2 text-left font-semibold">単位</th>
              <th className="p-2 text-right font-semibold">単価</th>
              <th className="p-2 text-right font-semibold">金額</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-black/20 align-top"
              >
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-right tabular-nums">{item.quantity}</td>
                <td className="p-2">{item.unit}</td>
                <td className="p-2 text-right tabular-nums">
                  {formatYen(item.unitPrice)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {formatYen(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} />
              <td className="p-2 text-right">小計</td>
              <td className="p-2 text-right tabular-nums">
                {formatYen(invoice.subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} />
              <td className="p-2 text-right">消費税</td>
              <td className="p-2 text-right tabular-nums">
                {formatYen(invoice.tax)}
              </td>
            </tr>
            <tr className="border-t border-black font-bold">
              <td colSpan={3} />
              <td className="p-2 text-right">合計</td>
              <td className="p-2 text-right tabular-nums">
                {formatYen(invoice.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {invoice.notes ? (
        <section className="mt-6">
          <p className="text-xs font-semibold">備考</p>
          <p className="mt-1 whitespace-pre-wrap text-xs">{invoice.notes}</p>
        </section>
      ) : null}

      <section className="mt-6 rounded border border-black/40 p-3 text-xs">
        <p className="font-semibold">お振込先</p>
        <p className="mt-1">{company.bankInfo || "—"}</p>
      </section>
    </article>
  );
}
