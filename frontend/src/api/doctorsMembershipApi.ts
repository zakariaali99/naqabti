import { AxiosResponse } from "axios";
import { FileUploadApiClient } from "./client";

import { UserEntity } from "@/models/users";
import { Branch } from "@/models/branch";
import { MembershipTypeModel } from "@/models/membershipTypes";

export type DoctorsMembershipStatus =
  | "active"
  | "pending"
  | "canceled"
  | "expired";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "online"
  | "other";

export interface Payment {
  id: number;
  user: number;
  membership: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewHistory {
  id: number;
  membership: number;
  renew_date: string;
  previous_end_date?: string;
  new_end_date: string;
  amount: number;
  paid_amount?: number;
  payment_status?: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorsMembershipData {
  id?: number;
  doctor_id: number; // User ID (for write operations)
  doctor?: UserEntity; // Nested doctor object (from read operations)
  membership_type?: MembershipTypeModel; // Nested object (from read)
  membership_type_id: number; // MembershipType ID (for write)
  branch_id?: number; // Branch ID (for write operations)
  branch?: Branch; // Nested branch object (from read operations)
  membership_number?: string; // Auto-generated
  start_date: string;
  end_date?: string;
  status: DoctorsMembershipStatus;
  is_active: boolean;
  subscription_count?: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  remaining_amount?: number; // Computed property
  payments?: Payment[]; // Related payments
  has_renew_history?: boolean;
  renew_history?: RenewHistory[];
  created_at?: string;
  updated_at?: string;
}

export interface DoctorsMembershipCreateRequest extends Omit<DoctorsMembershipData, 'id' | 'membership_number' | 'doctor' | 'branch' | 'created_at' | 'updated_at' | 'membership_type'> {
  payment_method?: string;
  reference_number?: string;
  invoice_file?: File | null;
}
export interface DoctorsMembershipUpdateRequest extends Partial<DoctorsMembershipCreateRequest> {}

export interface PaymentRequest {
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  description?: string;
}

export interface PaymentResponse {
  membership: DoctorsMembershipData;
  payment: Payment;
  message: string;
}

export interface RenewRequest {
  membership: number;
  new_end_date: string;
  amount?: number;
  notes?: string;
}

export interface RenewHistoryResponse {
  id: number;
  membership: number;
  renew_date: string;
  previous_end_date?: string;
  new_end_date: string;
  amount: number;
  paid_amount: number;
  payment_status: string;
  notes?: string;
}

class DoctorsMembershipApi extends FileUploadApiClient<
  DoctorsMembershipData,
  DoctorsMembershipCreateRequest,
  DoctorsMembershipUpdateRequest
> {
  constructor() {
    super("memberships/");
  }

  async create(data: DoctorsMembershipCreateRequest): Promise<AxiosResponse<DoctorsMembershipData>> {
    if (data.invoice_file) {
      return super.create(data);
    }
    const { invoice_file, ...jsonData } = data;
    return this.client.post<DoctorsMembershipData>(this.endpoint, jsonData);
  }

  async addPayment(membershipId: number, paymentData: PaymentRequest & { upload_document?: File | null }) {
    if (paymentData.upload_document || paymentData.payment_method === 'bank_transfer') {
      const fd = new FormData();
      fd.append("amount", paymentData.amount.toString());
      fd.append("payment_method", paymentData.payment_method);
      if (paymentData.reference_number) {
        fd.append("reference_number", paymentData.reference_number);
      }
      if (paymentData.description) {
        fd.append("description", paymentData.description);
      }
      if (paymentData.upload_document) {
        fd.append("upload_document", paymentData.upload_document);
      }
      return this.client.post<PaymentResponse>(
        `${this.endpoint}${membershipId}/add_payment/`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    }
    return this.client.post<PaymentResponse>(
      `${this.endpoint}${membershipId}/add_payment/`,
      paymentData,
    );
  }

  async cancel(membershipId: number) {
    return this.client.post<DoctorsMembershipData>(
      `${this.endpoint}${membershipId}/cancel/`,
    );
  }

  async approve(membershipId: number) {
    return this.patch(membershipId, { status: "active" });
  }

  async reject(membershipId: number) {
    return this.patch(membershipId, { status: "canceled" });
  }

  async sendNotification(membershipId: number, data: {
    title: string;
    message: string;
    notification_type?: string;
  }) {
    return this.client.post(`${this.endpoint}${membershipId}/send_notification_action/`, data);
  }

  async renew(data: RenewRequest) {
    return this.client.post<RenewHistoryResponse>("/api/membership-renew-history/", data);
  }
}

export default new DoctorsMembershipApi();
