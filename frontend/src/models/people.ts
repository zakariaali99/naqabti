export interface Person {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  national_id?: string;
  rank?: string;
  unit?: string;
  position?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PersonCreateInput {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  national_id?: string;
  rank?: string;
  unit?: string;
  position?: string | null;
}

export interface PersonUpdateInput extends Partial<PersonCreateInput> {}
