"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/types/payment";
import { formatYen } from "@/lib/utils/currency";
import type { Invoice } from "@/lib/types/invoice";

const paymentSchema = z.object({
  amount: z.number().min(1, "金額を入力してください"),
  paidAt: z.string().min(1, "入金日を入力してください"),
  method: z.enum(["bank-transfer", "credit-card", "cash", "other"]),
  notes: z.string(),
});

type FormValues = z.infer<typeof paymentSchema>;

const METHOD_OPTIONS: PaymentMethod[] = [
  "bank-transfer",
  "credit-card",
  "cash",
  "other",
];

type PaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
};

export function PaymentModal({
  open,
  onOpenChange,
  invoice,
}: PaymentModalProps) {
  const markPaid = useInvoicesStore((s) => s.markPaid);
  const addPayment = usePaymentsStore((s) => s.add);

  const form = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice?.total ?? 0,
      paidAt: new Date().toISOString().slice(0, 10),
      method: "bank-transfer",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && invoice) {
      form.reset({
        amount: invoice.total,
        paidAt: new Date().toISOString().slice(0, 10),
        method: "bank-transfer",
        notes: "",
      });
    }
  }, [open, invoice, form]);

  if (!invoice) return null;

  const onSubmit = form.handleSubmit((values) => {
    addPayment({
      invoiceId: invoice.id,
      amount: values.amount,
      paidAt: values.paidAt,
      method: values.method,
      notes: values.notes,
    });
    markPaid(invoice.id, values.paidAt);
    toast.success("入金を記録しました");
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>入金記録</DialogTitle>
          <DialogDescription>
            {invoice.number} の入金情報を記録します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="rounded-md bg-[var(--color-bg-soft)] px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-ink-500)]">請求金額</span>
              <span className="font-semibold tabular-nums text-[var(--color-ink-950)]">
                {formatYen(invoice.total)}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-amount">
              入金額 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payment-amount"
              type="number"
              min={0}
              step="any"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.amount.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-paid-at">
              入金日 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="payment-paid-at"
              type="date"
              {...form.register("paidAt")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-method">支払方法</Label>
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v) field.onChange(v as PaymentMethod);
                  }}
                >
                  <SelectTrigger id="payment-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-notes">メモ</Label>
            <Textarea
              id="payment-notes"
              rows={3}
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              入金を記録
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
