import { Branch } from "./branch";
import { Institution } from "./institution";
import { City } from "./city";
import { DynamicFieldValueInput, UserDynamicFieldValue } from "./dynamicField";

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  approval_status?: "pending" | "approved" | "rejected";
  full_name: string;
  // Arabic name fields
  first_name_field?: string;
  father_name?: string;
  grandfather_name?: string;
  family_name?: string;
  // English name fields
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  phone_number?: string;
  profile_image?: string;
  birthdate?: string;
  city?: string;
  city_detail?: City;
  address?: string;
  nationality?: string;
  passport_image?: string;
  language: "ar" | "en";
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  user_type: "doctor" | "manager" | "institution" | "student";
  specialty?: string;
  bio?: string;
  doctor_number?: string;
  full_doctor_number?: string;
  university_name?: string;
  current_degree?: string;
  current_degree_detail?: {
    id: number;
    name: string;
    allows_multiple_subscriptions: boolean;
  } | null;
  graduation_year?: number;
  membership_number?: string;
  groups: number[];
  group_names?: string[];
  group_permissions: string[];
  last_login?: string;
  gender?: "male" | "female" | "";
  branch_ids?: number[];
  branches?: Array<Branch>;
  managed_branches?: Array<{ id: number; name: string; prefix?: string }>;
  managed_branch_ids?: number[];
  institution_ids?: number[];
  institutions?: Array<Institution>;
  dynamic_field_values?: UserDynamicFieldValue[];
}

export interface UserCreateInput {
  username: string;
  email: string;
  full_name: string;
  first_name_field?: string;
  father_name?: string;
  grandfather_name?: string;
  family_name?: string;
  first_name_en?: string;
  father_name_en?: string;
  grandfather_name_en?: string;
  family_name_en?: string;
  phone_number?: string;
  profile_image?: File | string;
  birthdate?: string;
  city?: string;
  address?: string;
  nationality?: string;
  passport_image?: File | string;
  language: "ar" | "en";
  password: string;
  confirm_password?: string;
  is_active: boolean;
  is_staff?: boolean;
  user_type: "doctor" | "manager" | "institution" | "student";
  specialty?: string;
  bio?: string;
  doctor_number?: string;
  university_name?: string;
  current_degree?: string;
  graduation_year?: number;
  membership_number?: string;
  groups: number[];
  branch_ids?: number[];
  managed_branch_ids?: number[];
  institution_ids?: number[];
  gender?: "male" | "female" | "";
  dynamic_field_value_inputs?: DynamicFieldValueInput[];
}

export interface UserUpdateInput
  extends Partial<Omit<UserCreateInput, "password">> {
  password?: string;
}
