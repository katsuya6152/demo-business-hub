"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_ORDER,
  type Deal,
} from "@/lib/types/deal";
import type { Customer } from "@/lib/types/customer";
import { fmtDate } from "@/lib/utils/date";

export const dealFormSchema = z.object({
  customerId: z.string().min(1, "顧客を選択してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  stage: z.enum([
    "lead",
    "qualified",
    "proposal-sent",
    "negotiation",
    "won",
    "lost",
  ]),
  amount: z.coerce.number().min(0, "0以上で入力してください"),
  probability: z.coerce
    .number()
    .min(0, "0以上で入力してください")
    .max(100, "100以下で入力してください"),
  expectedCloseDate: z.string().min(1, "期待クローズ日を入力してください"),
  nextAction: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type DealFormInput = z.input<typeof dealFormSchema>;
export type DealFormValues = z.output<typeof dealFormSchema>;

type DealFormProps = {
  customers: Customer[];
  defaultValues?: Partial<DealFormValues>;
  initial?: Deal;
  onSubmit: (values: DealFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

function buildDefaults(
  initial: Deal | undefined,
  defaults: Partial<DealFormValues> | undefined,
): DealFormInput {
  if (initial) {
    return {
      customerId: initial.customerId,
      title: initial.title,
      stage: initial.stage,
      amount: initial.amount,
      probability: initial.probability,
      expectedCloseDate: fmtDate(initial.expectedCloseDate),
      nextAction: initial.nextAction ?? "",
      notes: initial.notes ?? "",
    };
  }
  const today = new Date();
  const inOneMonth = new Date(today);
  inOneMonth.setMonth(inOneMonth.getMonth() + 1);
  const iso = inOneMonth.toISOString().slice(0, 10);

  return {
    customerId: defaults?.customerId ?? "",
    title: defaults?.title ?? "",
    stage: defaults?.stage ?? "lead",
    amount: defaults?.amount ?? 0,
    probability: defaults?.probability ?? 20,
    expectedCloseDate: defaults?.expectedCloseDate ?? iso,
    nextAction: defaults?.nextAction ?? "",
    notes: defaults?.notes ?? "",
  };
}

export function DealForm({
  customers,
  defaultValues,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "保存",
}: DealFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: buildDefaults(initial, defaultValues),
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" placeholder="例：新システム導入" {...register("title")} />
        {errors.title ? (
          <p className="text-xs text-red-600">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label>顧客</Label>
        <Controller
          control={control}
          name="customerId"
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={(v) => field.onChange(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="顧客を選択" />
              </SelectTrigger>
              <SelectContent>
                {customers.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-[var(--color-ink-500)]">
                    顧客が登録されていません
                  </div>
                ) : (
                  customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.customerId ? (
          <p className="text-xs text-red-600">{errors.customerId.message}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label>ステージ</Label>
        <Controller
          control={control}
          name="stage"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => field.onChange(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {DEAL_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="amount">金額（税抜・円）</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={1000}
            {...register("amount")}
          />
          {errors.amount ? (
            <p className="text-xs text-red-600">{errors.amount.message}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="probability">確度（%）</Label>
          <Input
            id="probability"
            type="number"
            min={0}
            max={100}
            step={5}
            {...register("probability")}
          />
          {errors.probability ? (
            <p className="text-xs text-red-600">
              {errors.probability.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="expectedCloseDate">期待クローズ日</Label>
        <Input
          id="expectedCloseDate"
          type="date"
          {...register("expectedCloseDate")}
        />
        {errors.expectedCloseDate ? (
          <p className="text-xs text-red-600">
            {errors.expectedCloseDate.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="nextAction">次アクション</Label>
        <Input
          id="nextAction"
          placeholder="例：来週月曜にデモ"
          {...register("nextAction")}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">メモ</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
