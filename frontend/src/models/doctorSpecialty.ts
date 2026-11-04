export interface DoctorSpecialty {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorSpecialtyCreateInput {
  name: string;
  is_active?: boolean;
}

export interface DoctorSpecialtyUpdateInput extends Partial<DoctorSpecialtyCreateInput> {}

export interface DoctorSpecialtyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DoctorSpecialty[];
}
