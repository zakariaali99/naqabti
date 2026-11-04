// Nationality model and API types
export interface Nationality {
  id: number;
  name: string;
  name_ar?: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

export interface NationalityCreateInput {
  name: string;
  code?: string;
}

export interface NationalityUpdateInput extends Partial<NationalityCreateInput> {}

export interface NationalityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Nationality[];
}
