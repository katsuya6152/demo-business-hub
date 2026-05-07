"use client";

import { useMemo, useState } from "react";
import { Copy, Mail, RefreshCw } from "lucide-react";
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
import { useCustomersStore } from "@/lib/store/customers";
import { useSettingsStore } from "@/lib/store/settings";
import {
  buildDunningDraft,
  buildMailtoUrl,
  type DunningDraft,
} from "@/lib/ai/dunning";
import type { Customer } from "@/lib/types/customer";
import type { Invoice } from "@/lib/types/invoice";
import type { CompanyInfo } from "@/lib/types/settings";

type DunningEmailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
};

export function DunningEmailModal({
  open,
  onOpenChange,
  invoice,
}: DunningEmailModalProps) {
  const customers = useCustomersStore((s) => s.customers);
  const company = useSettingsStore((s) => s.settings.company);

  if (!invoice) return null;

  const customer = customers.find((c) => c.id === invoice.customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/*
          Re-mount on invoice id / open transition so the body & subject reset
          to a freshly generated draft each time the modal opens, without
          calling setState inside an effect.
        */}
        <DunningEmailContent
          key={`${invoice.id}-${open ? "open" : "closed"}`}
          invoice={invoice}
          customer={customer}
          company={company}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DunningEmailContent({
  invoice,
  customer,
  company,
  onClose,
}: {
  invoice: Invoice;
  customer: Customer | undefined;
  company: CompanyInfo;
  onClose: () => void;
}) {
  const baseDraft: DunningDraft = useMemo(
    () => buildDunningDraft({ invoice, customer, company }),
    [invoice, customer, company],
  );

  const [subject, setSubject] = useState(baseDraft.subject);
  const [body, setBody] = useState(baseDraft.body);

  const handleRegenerate = () => {
    setSubject(baseDraft.subject);
    setBody(baseDraft.body);
    toast.success("テンプレートを再生成しました");
  };

  const handleCopy = async () => {
    const text = `件名: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("クリップボードにコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const handleMailto = () => {
    const url = buildMailtoUrl({ ...baseDraft, subject, body });
    window.location.href = url;
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--color-accent-600)]" />
          督促メール下書き
        </DialogTitle>
        <DialogDescription>
          {invoice.number} ・ {customer?.name ?? "顧客未設定"} ・ 経過日数を踏まえた丁寧な日本語のメール下書きを自動生成しました。編集してご利用ください。
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dunning-to">宛先</Label>
          <Input
            id="dunning-to"
            value={baseDraft.to || "（顧客に email が登録されていません）"}
            readOnly
            className="bg-[var(--color-bg-soft)] text-[var(--color-ink-700)]"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dunning-subject">件名</Label>
          <Input
            id="dunning-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dunning-body">本文</Label>
          <Textarea
            id="dunning-body"
            rows={20}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="font-mono text-xs leading-relaxed"
          />
          <p className="text-[10px] text-[var(--color-ink-500)]">
            ※ 自動生成された下書きです。送信前に内容をご確認ください。
          </p>
        </div>
      </div>

      <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={handleRegenerate}
          className="sm:mr-auto"
        >
          <RefreshCw className="h-4 w-4" />
          テンプレ再生成
        </Button>
        <Button type="button" variant="outline" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          クリップボードにコピー
        </Button>
        <Button
          type="button"
          onClick={handleMailto}
          disabled={!baseDraft.to}
        >
          <Mail className="h-4 w-4" />
          メーラーで開く
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="sm:hidden"
        >
          閉じる
        </Button>
      </DialogFooter>
    </>
  );
}
