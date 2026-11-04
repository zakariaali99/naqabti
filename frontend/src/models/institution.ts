import { City } from "./city";

export interface Institution {
  id: number;
  name: string;
  account?: number;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  logo?: string;
  is_active: boolean;
  city?: City;
  city_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionInput {
  name: string;
  account?: number | null;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  logo?: File | string | null;
  is_active?: boolean;
  city_id?: number | null;
}
