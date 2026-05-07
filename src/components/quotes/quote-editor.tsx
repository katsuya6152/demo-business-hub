"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Save, X } from "lucide-react";
import { format } from "date-fns";

import type { Quote } from "@/lib/types/quote";
import { QUOTE_STATUS_LABELS } from "@/lib/types/quote";
import { useQuotesStore } from "@/lib/store/quotes";
import { useCustomersStore } from "@/lib/store/customers";
import { newId } from "@/lib/utils/id";
import { nextQuoteNumber } from "@/lib/utils/numbering";
import { formatYen } from "@/lib/utils/currency";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { QuoteLineRow } from "./quote-line-row";

const QUOTE_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

const lineSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "品目を入力してください"),
  quantity: z.number({ error: "数量を入力してください" }).min(0),
  unit: z.string().min(1, "単位を入力してください"),
  unitPrice: z.number({ error: "単価を入力してください" }).min(0),
});

const schema = z.object({
  customerId: z.string().min(1, "顧客を選択してください"),
  dealId: z.string().optional(),
  title: z.string().min(1, "件名を入力してください"),
  issueDate: z.string().min(1, "発行日を入力してください"),
  validUntil: z.string().min(1, "有効期限を入力してください"),
  items: z.array(lineSchema).min(1, "明細を1行以上追加してください"),
  status: z.enum(QUOTE_STATUSES),
  notes: z.string(),
  paymentTerms: z.string(),
});

export type QuoteFormValues = z.output<typeof schema>;

type QuoteEditorProps = {
  quote?: Quote;
  defaultDealId?: string;
};

function todayYmd(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function plusDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}

function buildDefaults(
  quote: Quote | undefined,
  defaultDealId: string | undefined,
): QuoteFormValues {
  if (quote) {
    return {
      customerId: quote.customerId,
      dealId: quote.dealId ?? "",
      title: quote.title,
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      items: quote.items.map((it) => ({ ...it })),
      status: quote.status,
      notes: quote.notes ?? "",
      paymentTerms: quote.paymentTerms ?? "",
    };
  }
  return {
    customerId: "",
    dealId: defaultDealId ?? "",
    title: "",
    issueDate: todayYmd(),
    validUntil: plusDaysYmd(30),
    items: [
      {
        id: newId("ql"),
        description: "",
        quantity: 1,
        unit: "式",
        unitPrice: 0,
      },
    ],
    status: "draft",
    notes: "",
    paymentTerms: "",
  };
}

export function QuoteEditor({ quote, defaultDealId }: QuoteEditorProps) {
  const router = useRouter();
  const allQuotes = useQuotesStore((s) => s.quotes);
  const customers = useCustomersStore((s) => s.customers);
  const addQuote = useQuotesStore((s) => s.add);
  const updateQuote = useQuotesStore((s) => s.update);

  const number = useMemo(
    () => quote?.number ?? nextQuoteNumber(allQuotes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quote?.number],
  );

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(quote, defaultDealId),
    mode: "onSubmit",
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const fieldArray = useFieldArray({ control, name: "items" });

  const items = useWatch({ control, name: "items" });
  const subtotal = (items ?? []).reduce((acc, it) => {
    const q = Number(it?.quantity) || 0;
    const p = Number(it?.unitPrice) || 0;
    return acc + q * p;
  }, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const onSubmit = handleSubmit((values) => {
    const normalizedItems = values.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: Number(it.quantity) || 0,
      unit: it.unit || "式",
      unitPrice: Number(it.unitPrice) || 0,
    }));
    const itemsSubtotal = normalizedItems.reduce(
      (acc, it) => acc + it.quantity * it.unitPrice,
      0,
    );
    const itemsTax = Math.round(itemsSubtotal * 0.1);
    const itemsTotal = itemsSubtotal + itemsTax;

    if (quote) {
      updateQuote(quote.id, {
        customerId: values.customerId,
        dealId: values.dealId || undefined,
        title: values.title,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        items: normalizedItems,
        subtotal: itemsSubtotal,
        tax: itemsTax,
        total: itemsTotal,
        status: values.status,
        notes: values.notes ?? "",
        paymentTerms: values.paymentTerms ?? "",
      });
      toast.success("見積を更新しました");
      router.refresh();
    } else {
      const created = addQuote({
        number,
        customerId: values.customerId,
        dealId: values.dealId || undefined,
        title: values.title,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        items: normalizedItems,
        subtotal: itemsSubtotal,
        tax: itemsTax,
        total: itemsTotal,
        status: values.status,
        notes: values.notes ?? "",
        paymentTerms: values.paymentTerms ?? "",
      });
      toast.success("見積を作成しました");
      router.push(`/quotes/${created.id}`);
    }
  });

  const itemsError = errors.items?.message ?? errors.items?.root?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quote-number">見積番号</Label>
            <Input id="quote-number" value={number} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-customer">
              顧客 <span className="text-red-600">*</span>
            </Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger
                    id="quote-customer"
                    className="w-full"
                    aria-invalid={errors.customerId ? true : undefined}
                  >
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[var(--color-ink-500)]">
                        顧客が登録されていません
                      </div>
                    ) : null}
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId ? (
              <p className="text-xs text-red-600">
                {errors.customerId.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="quote-title">
              件名 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="quote-title"
              placeholder="例：基幹システム改修支援 第1期"
              aria-invalid={errors.title ? true : undefined}
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-issue-date">
              発行日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="quote-issue-date"
              type="date"
              aria-invalid={errors.issueDate ? true : undefined}
              {...register("issueDate")}
            />
            {errors.issueDate ? (
              <p className="text-xs text-red-600">
                {errors.issueDate.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-valid-until">
              有効期限 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="quote-valid-until"
              type="date"
              aria-invalid={errors.validUntil ? true : undefined}
              {...register("validUntil")}
            />
            {errors.validUntil ? (
              <p className="text-xs text-red-600">
                {errors.validUntil.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="quote-payment-terms">支払条件</Label>
            <Input
              id="quote-payment-terms"
              placeholder="例：月末締め翌月末払い"
              {...register("paymentTerms")}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
            明細
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              fieldArray.append({
                id: newId("ql"),
                description: "",
                quantity: 1,
                unit: "式",
                unitPrice: 0,
              })
            }
          >
            <Plus className="h-4 w-4" />
            行追加
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-500)]">
                <th className="px-1.5 py-2 font-medium">品目</th>
                <th className="px-1.5 py-2 font-medium w-24 text-right">
                  数量
                </th>
                <th className="px-1.5 py-2 font-medium w-20">単位</th>
                <th className="px-1.5 py-2 font-medium w-32 text-right">
                  単価
                </th>
                <th className="px-1.5 py-2 font-medium w-32 text-right">
                  金額
                </th>
                <th className="px-1.5 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {fieldArray.fields.map((f, idx) => (
                <QuoteLineRow
                  key={f.id}
                  index={idx}
                  control={control}
                  register={register}
                  onRemove={() => fieldArray.remove(idx)}
                  canRemove={fieldArray.fields.length > 1}
                  errorMessage={
                    errors.items?.[idx]?.description?.message
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        {typeof itemsError === "string" ? (
          <p className="mt-2 text-xs text-red-600">{itemsError}</p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-500)]">小計</span>
              <span className="tabular-nums">{formatYen(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-500)]">消費税 (10%)</span>
              <span className="tabular-nums">{formatYen(tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2 font-semibold text-[var(--color-ink-950)]">
              <span>合計</span>
              <span className="tabular-nums">{formatYen(total)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quote-status">ステータス</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger id="quote-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {QUOTE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="quote-notes">備考</Label>
            <Textarea
              id="quote-notes"
              rows={4}
              placeholder="備考・特記事項を入力"
              {...register("notes")}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/quotes")}
        >
          <X className="h-4 w-4" />
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {quote ? "保存" : "作成"}
        </Button>
      </div>
    </form>
  );
}
