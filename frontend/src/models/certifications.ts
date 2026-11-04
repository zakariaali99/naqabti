import { CertificationType } from "./certificationTypes";
import { UserEntity } from "./users";

// Individual Certifications (issued to doctors)
export interface Certification {
  id: number;
  doctor?: UserEntity;
  doctor_id?: number;
  certification_type: CertificationType | number;
  issue_date: string;
  expiry_date?: string;
  issued_from?: string;
  document?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificationCreateInput {
  doctor_id: number;
  certification_type_id: number;
  issue_date: string;
  expiry_date?: string;
  issued_from?: string;
  document?: File | string;
}

export interface CertificationUpdateInput
  extends Partial<CertificationCreateInput> {}

// API Response Types
export interface CertificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Certification[];
}

export interface CertificationTypeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CertificationType[];
}

// Filter/Search Types
export interface CertificationFilters {
  search?: string;
  status?: string;
  certification_type?: number;
  doctor?: string;
  issue_date_from?: string;
  issue_date_to?: string;
  expiry_date_from?: string;
  expiry_date_to?: string;
  page?: number;
  page_size?: number;
}
