export interface CertificationType {
  id: number;
  name: string;
  description?: string;
  category?: string;
  requirements?: string;
  validity_period_months?: number;
  is_renewable?: boolean;
  prerequisites?: number[]; // IDs of other certification types required
  certificate_template?: string; // URL to certificate template
  fees?: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationTypeCreate {
  name: string;
  description?: string;
  category?: string;
  requirements?: string;
  validity_period_months?: number;
  is_renewable?: boolean;
  prerequisites?: number[];
  certificate_template?: string;
  fees?: number;
}

export interface CertificationTypeUpdate
  extends Partial<CertificationTypeCreate> {
  id: number;
}

export interface CertificationTypeFilters {
  search?: string;
  is_renewable?: boolean;
  has_prerequisites?: boolean;
  ordering?: string;
  page?: number;
}
