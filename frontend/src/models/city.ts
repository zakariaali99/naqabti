// City model and API types
export interface City {
  id: number;
  name: string;
  name_ar?: string;
  region?: string;
  prefix?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface CityCreateInput {
  name: string;
  region?: string;
  prefix?: string;
}

export interface CityUpdateInput extends Partial<CityCreateInput> {}

export interface CityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: City[];
}
