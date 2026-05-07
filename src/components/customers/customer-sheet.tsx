"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCustomersStore } from "@/lib/store/customers";
import { CustomerForm } from "./customer-form";

type CustomerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
};

export function CustomerSheet({
  open,
  onOpenChange,
  customerId,
}: CustomerSheetProps) {
  const customers = useCustomersStore((s) => s.customers);
  const customer = customerId
    ? customers.find((c) => c.id === customerId)
    : undefined;
  const isEdit = Boolean(customer);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b border-[var(--color-line)]">
          <SheetTitle>
            {isEdit ? "顧客を編集" : "新規顧客"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "顧客情報を編集して保存してください。"
              : "新しい顧客を登録します。必須項目を入力してください。"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-4">
          <CustomerForm
            customer={customer}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
