/**
 * Trigger a browser-side download for a Blob.
 *
 * Used by quote / invoice PDF download buttons.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Defer revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Build a safe filename from a base + customer name. Strips OS-forbidden
 * characters and collapses whitespace, but preserves hyphens
 * so document numbers like `EST-20260507-001` stay readable.
 *
 * Each part (prefix / number / customer) is cleaned independently and parts
 * that become empty after cleaning are dropped — that way input like
 * ("見積", "/:*", "?") yields "見積.pdf" rather than "見積__.pdf".
 */
export function buildPdfFilename(
  prefix: "見積" | "請求書",
  documentNumber: string,
  customerName: string | undefined,
): string {
  const clean = (s: string): string =>
    s
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .trim();

  const cleaned = [prefix, documentNumber, customerName ?? ""]
    .map(clean)
    .filter((s) => s.length > 0);
  const safe = cleaned.join("_") || prefix;
  return `${safe}.pdf`;
}
