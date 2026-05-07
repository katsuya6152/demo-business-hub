"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { DealForm, type DealFormValues } from "./deal-form";
import type { Deal } from "@/lib/types/deal";
import { toast } from "sonner";

type DealSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Deal;
  defaultCustomerId?: string;
  onSaved?: (deal: Deal) => void;
};

export function DealSheet({
  open,
  onOpenChange,
  initial,
  defaultCustomerId,
  onSaved,
}: DealSheetProps) {
  const customers = useCustomersStore((s) => s.customers);
  const add = useDealsStore((s) => s.add);
  const update = useDealsStore((s) => s.update);
  const isEdit = Boolean(initial);

  const handleSubmit = (values: DealFormValues) => {
    const expectedCloseDate = new Date(values.expectedCloseDate).toISOString();
    if (initial) {
      update(initial.id, {
        customerId: values.customerId,
        title: values.title,
        stage: values.stage,
        amount: values.amount,
        probability: values.probability,
        expectedCloseDate,
        nextAction: values.nextAction,
        notes: values.notes,
      });
      toast.success("案件を更新しました");
      const next: Deal = {
        ...initial,
        customerId: values.customerId,
        title: values.title,
        stage: values.stage,
        amount: values.amount,
        probability: values.probability,
        expectedCloseDate,
        nextAction: values.nextAction,
        notes: values.notes,
      };
      onSaved?.(next);
    } else {
      const created = add({
        customerId: values.customerId,
        title: values.title,
        stage: values.stage,
        amount: values.amount,
        probability: values.probability,
        expectedCloseDate,
        nextAction: values.nextAction,
        notes: values.notes,
      });
      toast.success("案件を作成しました");
      onSaved?.(created);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-3 sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "案件を編集" : "新規案件"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "案件情報を更新します"
              : "案件のタイトル・顧客・金額・確度などを入力してください"}
          </SheetDescription>
        </SheetHeader>
        <DealForm
          customers={customers}
          initial={initial}
          defaultValues={
            !initial && defaultCustomerId
              ? { customerId: defaultCustomerId }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={isEdit ? "更新する" : "作成する"}
        />
      </SheetContent>
    </Sheet>
  );
}
