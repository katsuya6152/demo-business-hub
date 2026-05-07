"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import {
  CUSTOMER_STATUS_LABELS,
  type Customer,
  type CustomerStatus,
} from "@/lib/types/customer";

const schema = z.object({
  name: z.string().min(1, "顧客名を入力してください"),
  industry: z.string(),
  contactPerson: z.string().min(1, "担当者を入力してください"),
  contactRole: z.string(),
  email: z.string().email("メール形式が不正です"),
  phone: z.string(),
  postalCode: z.string(),
  address: z.string(),
  status: z.enum(["active", "prospect", "inactive"]),
  notes: z.string(),
});

type FormValues = z.output<typeof schema>;

const STATUS_OPTIONS: CustomerStatus[] = ["active", "prospect", "inactive"];

type CustomerFormProps = {
  customer?: Customer;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
};

export function CustomerForm({
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const add = useCustomersStore((s) => s.add);
  const update = useCustomersStore((s) => s.update);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: customer
      ? {
          name: customer.name,
          industry: customer.industry ?? "",
          contactPerson: customer.contactPerson,
          contactRole: customer.contactRole ?? "",
          email: customer.email,
          phone: customer.phone ?? "",
          postalCode: customer.postalCode ?? "",
          address: customer.address ?? "",
          status: customer.status,
          notes: customer.notes ?? "",
        }
      : {
          name: "",
          industry: "",
          contactPerson: "",
          contactRole: "",
          email: "",
          phone: "",
          postalCode: "",
          address: "",
          status: "active",
          notes: "",
        },
  });

  const onSubmit = handleSubmit((values) => {
    if (customer) {
      update(customer.id, values);
      const fresh = useCustomersStore
        .getState()
        .customers.find((c) => c.id === customer.id);
      toast.success("保存しました");
      onSuccess?.(fresh ?? { ...customer, ...values });
    } else {
      const created = add(values);
      toast.success("保存しました");
      onSuccess?.(created);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="customer-name">
          顧客名 <span className="text-destructive">*</span>
        </Label>
        <Input id="customer-name" {...register("name")} />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="customer-industry">業種</Label>
          <Input id="customer-industry" {...register("industry")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customer-status">ステータス</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  if (v) field.onChange(v as CustomerStatus);
                }}
              >
                <SelectTrigger id="customer-status" className="w-full">
                  <SelectValue>
                    {CUSTOMER_STATUS_LABELS[field.value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CUSTOMER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="customer-contact-person">
            担当者 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-contact-person"
            {...register("contactPerson")}
          />
          {errors.contactPerson ? (
            <p className="text-xs text-destructive">
              {errors.contactPerson.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customer-contact-role">役職</Label>
          <Input id="customer-contact-role" {...register("contactRole")} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="customer-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-email"
            type="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customer-phone">電話</Label>
          <Input id="customer-phone" {...register("phone")} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="customer-postal">郵便番号</Label>
          <Input id="customer-postal" {...register("postalCode")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customer-address">住所</Label>
          <Input id="customer-address" {...register("address")} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="customer-notes">メモ</Label>
        <Textarea
          id="customer-notes"
          rows={4}
          {...register("notes")}
        />
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {customer ? "更新する" : "作成する"}
        </Button>
      </div>
    </form>
  );
}
