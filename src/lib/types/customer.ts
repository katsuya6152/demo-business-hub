export type CustomerStatus = "active" | "prospect" | "inactive";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "アクティブ",
  prospect: "見込み",
  inactive: "Inactive",
};

export type Customer = {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  postalCode?: string;
  address?: string;
  status: CustomerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
