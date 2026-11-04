export interface Item {
  id: number;
  description: string;
  serial_number: string;
  item_type: number;
  item_type_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemCreateInput {
  description: string;
  serial_number: string;
  item_type: number;
  assigned_to?: number;
  is_active?: boolean;
}

export interface ItemUpdateInput extends Partial<ItemCreateInput> {}
