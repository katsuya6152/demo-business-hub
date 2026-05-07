"use client";

import { Trash2 } from "lucide-react";
import type { Control, UseFormRegister } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatYen } from "@/lib/utils/currency";
import type { QuoteFormValues } from "./quote-editor";

type QuoteLineRowProps = {
  index: number;
  control: Control<QuoteFormValues>;
  register: UseFormRegister<QuoteFormValues>;
  onRemove: () => void;
  canRemove: boolean;
  errorMessage?: string;
};

export function QuoteLineRow({
  index,
  control,
  register,
  onRemove,
  canRemove,
  errorMessage,
}: QuoteLineRowProps) {
  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  const unitPrice = useWatch({ control, name: `items.${index}.unitPrice` });
  const lineTotal =
    (Number(quantity) || 0) * (Number(unitPrice) || 0);

  return (
    <tr className="border-b border-[var(--color-line)] align-top">
      <td className="p-1.5">
        <Input
          {...register(`items.${index}.description`)}
          placeholder="品目・サービス名"
          aria-invalid={errorMessage ? true : undefined}
        />
        {errorMessage ? (
          <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
        ) : null}
      </td>
      <td className="p-1.5 w-24">
        <Input
          type="number"
          step="0.1"
          min={0}
          className="text-right tabular-nums"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
      </td>
      <td className="p-1.5 w-20">
        <Input
          {...register(`items.${index}.unit`)}
          placeholder="式"
        />
      </td>
      <td className="p-1.5 w-32">
        <Input
          type="number"
          step="100"
          min={0}
          className="text-right tabular-nums"
          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
        />
      </td>
      <td className="p-1.5 w-32 text-right tabular-nums text-sm text-[var(--color-ink-950)]">
        {formatYen(lineTotal)}
      </td>
      <td className="p-1.5 w-12 text-right">
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
