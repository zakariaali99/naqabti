// Branch-level dynamic profile field types

export type DynamicFieldType = "text" | "boolean" | "select" | "file";

export interface DynamicFieldOption {
  value: string;
  label_ar: string;
  label_en?: string;
}

export interface BranchDynamicField {
  id: number;
  branch: number;
  label_ar: string;
  label_en?: string;
  placeholder_ar?: string;
  placeholder_en?: string;
  field_type: DynamicFieldType;
  options?: DynamicFieldOption[] | null;
  is_required: boolean;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BranchDynamicFieldCreateInput {
  branch: number;
  label_ar: string;
  label_en?: string;
  placeholder_ar?: string;
  placeholder_en?: string;
  field_type: DynamicFieldType;
  options?: DynamicFieldOption[] | null;
  is_required?: boolean;
  order?: number;
  is_active?: boolean;
}

export interface BranchDynamicFieldUpdateInput
  extends Partial<BranchDynamicFieldCreateInput> {}

export interface UserDynamicFieldValue {
  id: number;
  field_id: number;
  field_label_ar: string;
  field_label_en?: string;
  field_type: DynamicFieldType;
  value_text?: string | null;
  value_boolean?: boolean | null;
  value_file?: string | null;
}

// Shape sent on UserCreateInput/UserUpdateInput.dynamic_field_value_inputs
export interface DynamicFieldValueInput {
  field_id: number;
  value_text?: string;
  value_boolean?: boolean;
}
