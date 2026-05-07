"use client";

import { useMemo } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useCustomersStore } from "@/lib/store/customers";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useQuotesStore } from "@/lib/store/quotes";
import { useSettingsStore } from "@/lib/store/settings";
import { newId } from "@/lib/utils/id";
import { formatYen } from "@/lib/utils/currency";
import { nextInvoiceNumber } from "@/lib/utils/numbering";
import {
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/types/invoice";
import { InvoiceLineRow } from "./invoice-line-row";

const lineSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "品目を入力してください"),
  quantity: z.number().min(0),
  unit: z.string(),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "顧客を選択してください"),
  quoteId: z.string().optional(),
  dealId: z.string().optional(),
  title: z.string().min(1, "件名を入力してください"),
  issueDate: z.string().min(1, "発行日を入力してください"),
  dueDate: z.string().min(1, "支払期日を入力してください"),
  items: z.array(lineSchema).min(1, "少なくとも1行入力してください"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  notes: z.string(),
});

type FormValues = z.infer<typeof invoiceSchema>;

const STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

type InvoiceEditorProps = {
  invoice?: Invoice;
  initialValues?: Partial<FormValues>;
};

function blankItem() {
  return {
    id: newId("inv-item"),
    description: "",
    quantity: 1,
    unit: "式",
    unitPrice: 0,
  };
}

export function InvoiceEditor({ invoice, initialValues }: InvoiceEditorProps) {
  const router = useRouter();

  const customers = useCustomersStore((s) => s.customers);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const addInvoice = useInvoicesStore((s) => s.add);
  const updateInvoice = useInvoicesStore((s) => s.update);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultDue = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const defaultValues: FormValues = invoice
    ? {
        customerId: invoice.customerId,
        quoteId: invoice.quoteId,
        dealId: invoice.dealId,
        title: invoice.title,
        issueDate: invoice.issueDate.slice(0, 10),
        dueDate: invoice.dueDate.slice(0, 10),
        items: invoice.items,
        status: invoice.status,
        notes: invoice.notes ?? "",
      }
    : {
        customerId: initialValues?.customerId ?? "",
        quoteId: initialValues?.quoteId,
        dealId: initialValues?.dealId,
        title: initialValues?.title ?? "",
        issueDate: initialValues?.issueDate ?? today,
        dueDate: initialValues?.dueDate ?? defaultDue,
        items:
          initialValues?.items && initialValues.items.length > 0
            ? initialValues.items
            : [blankItem()],
        status: initialValues?.status ?? "draft",
        notes: initialValues?.notes ?? "",
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues,
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedQuoteId = useWatch({
    control: form.control,
    name: "quoteId",
  });

  const totals = useMemo(() => {
    const subtotal = (watchedItems ?? []).reduce(
      (sum, it) =>
        sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0,
    );
    const tax = Math.round(subtotal * taxRate);
    return { subtotal, tax, total: subtotal + tax };
  }, [watchedItems, taxRate]);

  const onSubmit = form.handleSubmit((values) => {
    const subtotal = values.items.reduce(
      (sum, it) =>
        sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0,
    );
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;

    if (invoice) {
      updateInvoice(invoice.id, {
        customerId: values.customerId,
        quoteId: values.quoteId || undefined,
        dealId: values.dealId || undefined,
        title: values.title,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        items: values.items,
        subtotal,
        tax,
        total,
        status: values.status,
        notes: values.notes,
      });
      toast.success("請求を更新しました");
      router.push(`/invoices/${invoice.id}`);
    } else {
      const number = nextInvoiceNumber(invoices);
      const created = addInvoice({
        number,
        customerId: values.customerId,
        quoteId: values.quoteId || undefined,
        dealId: values.dealId || undefined,
        title: values.title,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        items: values.items,
        subtotal,
        tax,
        total,
        status: values.status,
        notes: values.notes,
      });
      toast.success("請求を作成しました");
      router.push(`/invoices/${created.id}`);
    }
  });

  const linkedQuote = quotes.find((q) => q.id === watchedQuoteId);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-950)]">
          基本情報
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="invoice-customer">
              顧客 <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    if (v) field.onChange(v);
                  }}
                >
                  <SelectTrigger id="invoice-customer" className="w-full">
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.customerId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.customerId.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoice-status">ステータス</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v) field.onChange(v as InvoiceStatus);
                  }}
                >
                  <SelectTrigger id="invoice-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {INVOICE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="invoice-title">
              件名 <span className="text-destructive">*</span>
            </Label>
            <Input id="invoice-title" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoice-issue">
              発行日 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoice-issue"
              type="date"
              {...form.register("issueDate")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoice-due">
              支払期日 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoice-due"
              type="date"
              {...form.register("dueDate")}
            />
          </div>

          {linkedQuote ? (
            <div className="grid gap-2 md:col-span-2">
              <Label>関連見積</Label>
              <p className="text-sm text-[var(--color-ink-700)]">
                {linkedQuote.number} ・ {linkedQuote.title}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
            明細
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(blankItem())}
          >
            <Plus className="h-4 w-4" />
            行を追加
          </Button>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-500)]">
                <th className="p-2 font-medium">品目</th>
                <th className="p-2 font-medium">数量</th>
                <th className="p-2 font-medium">単位</th>
                <th className="p-2 font-medium">単価</th>
                <th className="p-2 text-right font-medium">金額</th>
                <th className="w-10 p-2" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <InvoiceLineRow
                  key={field.id}
                  item={watchedItems?.[index] ?? field}
                  onChange={(patch) =>
                    update(index, {
                      ...(watchedItems?.[index] ?? field),
                      ...patch,
                    })
                  }
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>
        {form.formState.errors.items ? (
          <p className="mt-2 text-xs text-destructive">
            {form.formState.errors.items.message ??
              "明細にエラーがあります"}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-ink-500)]">小計</dt>
              <dd className="tabular-nums text-[var(--color-ink-950)]">
                {formatYen(totals.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-ink-500)]">
                消費税（{Math.round(taxRate * 100)}%）
              </dt>
              <dd className="tabular-nums text-[var(--color-ink-950)]">
                {formatYen(totals.tax)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-base font-bold">
              <dt>合計</dt>
              <dd className="tabular-nums text-[var(--color-ink-950)]">
                {formatYen(totals.total)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
        <Label htmlFor="invoice-notes">備考</Label>
        <Textarea
          id="invoice-notes"
          rows={4}
          {...form.register("notes")}
          className="mt-2"
        />
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {invoice ? "更新する" : "作成する"}
        </Button>
      </div>
    </form>
  );
}
