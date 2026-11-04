export interface MembershipTypeModel {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  price: string; // Decimal field comes as string from API
  academic_degree: number | null;
  academic_degree_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  is_deleted: boolean;
}

export interface CreateMembershipTypeRequest {
  name: string;
  description?: string;
  duration_months: number;
  price: number | string;
  academic_degree?: number | null;
  is_active?: boolean;
}

export interface UpdateMembershipTypeRequest
  extends CreateMembershipTypeRequest {}
