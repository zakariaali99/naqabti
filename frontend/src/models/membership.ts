import { City } from "./city";

import { Payment } from "@/api/doctorsMembershipApi";

// Membership Types
export interface MembershipType {
  id: number;
  name: string;
  description: string;
  durationMonths: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipTypeCreateInput {
  name: string;
  description: string;
  durationMonths: number;
  price: number;
}

// Doctor's Membership
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

export interface DoctorsMembership {
  id: number;
  doctor_id: number;
  membership_type_id: number;
  city_id?: number;
  membership_number?: string;
  start_date: string;
  end_date?: string;
  status: DoctorsMembershipStatus;
  is_active: boolean;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  remaining_amount?: number;
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export interface DoctorsMembershipCreateInput
  extends Omit<
    DoctorsMembership,
    "id" | "membership_number" | "created_at" | "updated_at"
  > {}
export interface DoctorsMembershipUpdateInput
  extends Partial<DoctorsMembershipCreateInput> {}

// Memberships (keeping legacy interface for backward compatibility)
export interface Membership {
  id: number;
  member_name: string;
  member_email: string;
  member_phone: string;
  membership_type: MembershipType;
  city?: City;
  membership_number?: string;
  start_date: string;
  expiration_date: string;
  status: "active" | "expired" | "pending" | "canceled";
  created_at: string;
  updated_at: string;
}

export interface MembershipCreateInput {
  member_name: string;
  member_email: string;
  member_phone: string;
  membership_type_id: number;
  city_id?: number;
  start_date: string;
}

export interface MembershipUpdateInput extends Partial<MembershipCreateInput> {}

// API Response Types
export interface MembershipResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Membership[];
}

export interface MembershipTypeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MembershipType[];
}

// Filter/Search Types
export interface MembershipFilters {
  search?: string;
  status?: string;
  membership_type?: number;
  page?: number;
  page_size?: number;
}

export interface MembershipTypeFilters {
  search?: string;
  page?: number;
  page_size?: number;
}
