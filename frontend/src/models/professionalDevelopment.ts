import { UserEntity } from "./users";
import { Payment } from "./payments";

export interface ProfessionalDevelopmentType {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessionalDevelopmentCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessionalDevelopment {
  id: number;
  title: string;
  type: number;
  type_details?: ProfessionalDevelopmentType;
  category: number;
  category_details?: ProfessionalDevelopmentCategory;
  content: string;
  date_from: string;
  date_to: string;
  status: "active" | "inactive";
  can_register: boolean;
  price: number;
  image?: string;
  is_registered?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessionalDevelopmentRegistration {
    id: number;
    doctor: number;
    doctor_details?: UserEntity;
    professional_development: number;
    professional_development_details?: ProfessionalDevelopment;
    registration_date: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    payment_status: 'pending' | 'paid';
    paid_amount: number;
    payment_records: Payment[];
    created_at?: string;
    updated_at?: string;
}
