export function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function formatYenShort(n: number): string {
  if (n >= 1_000_000) {
    return `¥${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `¥${(n / 1_000).toFixed(0)}K`;
  }
  return formatYen(n);
}
