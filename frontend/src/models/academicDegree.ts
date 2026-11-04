// AcademicDegree model and API types
export interface AcademicDegree {
  id: number;
  name: string;
  allows_multiple_subscriptions: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicDegreeCreateInput {
  name: string;
  allows_multiple_subscriptions?: boolean;
}

export interface AcademicDegreeUpdateInput extends Partial<AcademicDegreeCreateInput> {}

export interface AcademicDegreeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicDegree[];
}
