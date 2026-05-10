/**
 * Quote PDF document — render with `pdf(<QuotePdf ... />).toBlob()`.
 */
import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { Quote } from "@/lib/types/quote";
import type { Customer } from "@/lib/types/customer";
import type { CompanyInfo } from "@/lib/types/settings";
import { fmtDate } from "@/lib/utils/date";
import { formatYen } from "@/lib/utils/currency";

import { pdfStyles } from "./styles";

type QuotePdfProps = {
  quote: Quote;
  customer: Customer | undefined;
  company: CompanyInfo;
};

export function QuotePdf({ quote, customer, company }: QuotePdfProps) {
  return (
    <Document
      title={`見積_${quote.number}`}
      author={company.name}
      subject={quote.title}
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        {/* Header */}
        <View style={pdfStyles.docHeader}>
          <Text style={pdfStyles.docTitle}>御 見 積 書</Text>
          <Text style={pdfStyles.docNumber}>No. {quote.number}</Text>
        </View>

        {/* Customer / Company columns */}
        <View style={pdfStyles.metaRow}>
          <View style={pdfStyles.metaCol}>
            <Text style={pdfStyles.customerName}>
              {customer ? `${customer.name} 御中` : "顧客未設定 御中"}
            </Text>
            {customer?.postalCode || customer?.address ? (
              <Text style={pdfStyles.small}>
                {customer.postalCode ? `〒${customer.postalCode} ` : ""}
                {customer.address ?? ""}
              </Text>
            ) : null}
            {customer?.contactPerson ? (
              <Text style={pdfStyles.small}>
                {customer.contactPerson}
                {customer.contactRole ? ` ${customer.contactRole}` : ""}
              </Text>
            ) : null}
            <View style={{ marginTop: 8 }}>
              <Text style={pdfStyles.smallText}>
                発行日：{fmtDate(quote.issueDate)}
              </Text>
              <Text style={pdfStyles.smallText}>
                有効期限：{fmtDate(quote.validUntil)}
              </Text>
              {quote.paymentTerms ? (
                <Text style={pdfStyles.smallText}>
                  支払条件：{quote.paymentTerms}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={pdfStyles.metaColRight}>
            <Text style={pdfStyles.companyName}>{company.name}</Text>
            {company.postalCode ? (
              <Text style={pdfStyles.small}>〒{company.postalCode}</Text>
            ) : null}
            {company.address ? (
              <Text style={pdfStyles.small}>{company.address}</Text>
            ) : null}
            {company.phone ? (
              <Text style={pdfStyles.small}>TEL: {company.phone}</Text>
            ) : null}
            {company.email ? (
              <Text style={pdfStyles.small}>{company.email}</Text>
            ) : null}
            {company.invoiceRegistrationNumber ? (
              <Text style={pdfStyles.small}>
                登録番号：{company.invoiceRegistrationNumber}
              </Text>
            ) : null}
            <View style={pdfStyles.stamp}>
              <Text style={pdfStyles.stampText}>印</Text>
            </View>
          </View>
        </View>

        {/* Subject */}
        <View style={pdfStyles.subjectSection}>
          <Text style={pdfStyles.subjectLabel}>件名</Text>
          <Text style={pdfStyles.subjectTitle}>{quote.title || "—"}</Text>
        </View>

        {/* Total banner */}
        <Text style={pdfStyles.amountBanner}>
          御見積金額　{formatYen(quote.total)}
        </Text>

        {/* Items table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.th, pdfStyles.colDescription]}>品目</Text>
            <Text style={[pdfStyles.th, pdfStyles.colQty]}>数量</Text>
            <Text style={[pdfStyles.th, pdfStyles.colUnit]}>単位</Text>
            <Text style={[pdfStyles.th, pdfStyles.colUnitPrice]}>単価</Text>
            <Text style={[pdfStyles.th, pdfStyles.colAmount]}>金額</Text>
          </View>
          {quote.items.map((item) => (
            <View key={item.id} style={pdfStyles.tableRow} wrap={false}>
              <Text style={[pdfStyles.td, pdfStyles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.colQty]}>
                {String(item.quantity)}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.colUnit]}>{item.unit}</Text>
              <Text style={[pdfStyles.td, pdfStyles.colUnitPrice]}>
                {formatYen(item.unitPrice)}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.colAmount]}>
                {formatYen(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={pdfStyles.totalsWrap}>
          <View style={pdfStyles.totalsBox}>
            <View style={pdfStyles.totalsRow}>
              <Text style={pdfStyles.totalsLabel}>小計</Text>
              <Text style={pdfStyles.totalsValue}>
                {formatYen(quote.subtotal)}
              </Text>
            </View>
            <View style={pdfStyles.totalsRow}>
              <Text style={pdfStyles.totalsLabel}>消費税 (10%)</Text>
              <Text style={pdfStyles.totalsValue}>{formatYen(quote.tax)}</Text>
            </View>
            <View style={[pdfStyles.totalsRow, pdfStyles.totalsRowDivider]}>
              <Text style={pdfStyles.totalsGrandLabel}>合計</Text>
              <Text style={pdfStyles.totalsGrandValue}>
                {formatYen(quote.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionLabel}>備考</Text>
            <Text style={pdfStyles.sectionBody}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Bank info */}
        {company.bankInfo ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionLabel}>お振込先</Text>
            <Text style={pdfStyles.sectionBody}>{company.bankInfo}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
