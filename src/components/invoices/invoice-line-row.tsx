"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/utils/currency";
import type { InvoiceItem } from "@/lib/types/invoice";

type InvoiceLineRowProps = {
  item: InvoiceItem;
  onChange: (patch: Partial<InvoiceItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function InvoiceLineRow({
  item,
  onChange,
  onRemove,
  canRemove,
}: InvoiceLineRowProps) {
  const lineTotal = item.quantity * item.unitPrice;

  return (
    <tr className="border-b border-[var(--color-line)] last:border-b-0 align-top">
      <td className="p-2">
        <Input
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="品目"
          aria-label="品目"
          className="w-full"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            onChange({ quantity: Number(e.target.value) || 0 })
          }
          min={0}
          step="any"
          aria-label="数量"
          className="w-20 text-right tabular-nums"
        />
      </td>
      <td className="p-2">
        <Input
          value={item.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
          placeholder="式"
          aria-label="単位"
          className="w-16"
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={item.unitPrice}
          onChange={(e) =>
            onChange({ unitPrice: Number(e.target.value) || 0 })
          }
          min={0}
          step="any"
          aria-label="単価"
          className="w-28 text-right tabular-nums"
        />
      </td>
      <td className="p-2 text-right text-sm font-medium tabular-nums text-[var(--color-ink-950)]">
        {formatYen(lineTotal)}
      </td>
      <td className="p-2 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="行を削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
