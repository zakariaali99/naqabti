// Branch model and API types
import { BranchDynamicField } from "./dynamicField";

export interface UserMinimal {
  id: number;
  username: string;
  full_name: string;
  profile_image?: string;
}

export interface BranchMinimal {
  id: number;
  name: string;
  prefix: string;
}

export interface Branch {
  id: number;
  name: string;
  prefix: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: number;
  manager_details?: UserMinimal;
  parent?: number;
  parent_details?: BranchMinimal;
  children_count?: number;
  dynamic_fields?: BranchDynamicField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Client-side computed fields for tree rendering
  level?: number;
  children?: Branch[];
}

export interface BranchCreateInput {
  name: string;
  prefix: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: number;
  parent_id?: number;
  is_active?: boolean;
}

export interface BranchUpdateInput extends Partial<BranchCreateInput> {}

export interface BranchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Branch[];
}
