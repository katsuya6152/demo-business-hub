/**
 * Shared @react-pdf/renderer styles + font registration.
 *
 * Imported once (transitively) by quote-pdf.tsx / invoice-pdf.tsx.
 * Font.register is idempotent so re-import is safe.
 */
import { Font, StyleSheet } from "@react-pdf/renderer";

// Register Noto Sans JP for Japanese text.
// Files are bundled under /public/fonts and served from the same origin
// to avoid third-party CDN URL drift (Google Fonts subset hashes change).
// In the browser, @react-pdf/renderer fetches `src` via fetch() so a
// relative path resolves against window.location.
function fontUrl(file: string): string {
  if (typeof window !== "undefined") {
    return new URL(file, window.location.origin).toString();
  }
  return file;
}

Font.register({
  family: "Noto Sans JP",
  fonts: [
    { src: fontUrl("/fonts/NotoSansJP-Regular.woff2"), fontWeight: 400 },
    { src: fontUrl("/fonts/NotoSansJP-Bold.woff2"), fontWeight: 700 },
  ],
});

// Disable automatic word-break hyphenation so Japanese stays intact.
Font.registerHyphenationCallback((word) => [word]);

export const PDF_COLORS = {
  text: "#0f172a",
  muted: "#475569",
  line: "#cbd5e1",
  black: "#000000",
  white: "#ffffff",
  bgSoft: "#f1f5f9",
};

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans JP",
    fontSize: 9,
    padding: 30,
    color: PDF_COLORS.text,
  },
  // Header banner with document title (centered)
  docHeader: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.black,
    paddingBottom: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 6,
  },
  docNumber: {
    fontSize: 9,
    marginTop: 4,
    color: PDF_COLORS.muted,
  },
  // Two-column meta (customer / company)
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  customerName: {
    fontSize: 13,
    fontWeight: 700,
  },
  small: {
    fontSize: 8,
    marginTop: 2,
    color: PDF_COLORS.muted,
  },
  smallText: {
    fontSize: 8,
    marginTop: 2,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
  },
  // Stamp circle
  stamp: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: PDF_COLORS.black,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  stampText: {
    fontSize: 8,
  },
  // Title section
  subjectSection: {
    marginVertical: 10,
    alignItems: "center",
  },
  subjectLabel: {
    fontSize: 7,
    color: PDF_COLORS.muted,
  },
  subjectTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 2,
  },
  // Total amount banner
  amountBanner: {
    backgroundColor: PDF_COLORS.black,
    color: PDF_COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 14,
    fontSize: 12,
    fontWeight: 700,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  // Table
  table: {
    borderTopWidth: 1.5,
    borderTopColor: PDF_COLORS.black,
    borderBottomWidth: 1.5,
    borderBottomColor: PDF_COLORS.black,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.bgSoft,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.black,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.line,
  },
  th: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: 700,
  },
  td: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colUnit: { width: 40 },
  colUnitPrice: { width: 75, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  // Totals
  totalsWrap: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 200,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalsRowDivider: {
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.black,
  },
  totalsLabel: {
    fontSize: 9,
    color: PDF_COLORS.muted,
  },
  totalsValue: {
    fontSize: 9,
  },
  totalsGrandLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  totalsGrandValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  // Notes / bank
  section: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.line,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Footer (stamp / signature row)
  footerRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
