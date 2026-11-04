import { User } from "./auth";

export type PaymentApprovalStatus = "pending" | "approved" | "rejected";

export interface Payment {
  id: number;
  user: User;
  user_full_name: string;
  user_phone: string | null;
  user_specialty: string;
  membership: number;
  membership_id?: number;
  amount: string;
  payment_method:
    | "cash"
    | "card"
    | "bank_transfer"
    | "online"
    | "other";
  payment_date: string;
  reference_number?: string;
  description?: string;
  transaction_document_url?: string | null;
  status: PaymentApprovalStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  user_id: number;
  membership_id: number;
  amount: string;
  payment_method:
    | "cash"
    | "card"
    | "bank_transfer"
    | "online"
    | "other";
  payment_date: string;
  reference_number?: string;
  description?: string;
  upload_document?: File;
}

export interface PaymentUpdate extends Partial<PaymentCreate> {
  id: number;
}

export interface PaymentFilters {
  status?: PaymentApprovalStatus | string;
  payment_method?: string;
  member_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}
