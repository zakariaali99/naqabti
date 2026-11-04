import { User } from "./auth";

export interface Ad {
  id: number;
  advertiser: number;
  advertiser_detail?: User;
  title: string;
  content: string;
  featured_image?: string | File | null;
  target_branches: number[];
  target_branches_detail?: any[];
  target_cities: number[];
  target_cities_detail?: any[];
  target_specialties: number[];
  target_specialties_detail?: any[];
  expected_audience_count: number;
  status: "draft" | "published" | "archived";
  status_display: string;
  published_at?: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdCreateInput {
  title: string;
  content: string;
  featured_image?: File | null;
  target_branches?: number[];
  target_cities?: number[];
  target_specialties?: number[];
  status?: "draft" | "published" | "archived";
}

export interface AdFilters {
  status?: string;
  search?: string;
}

export interface AdView {
  id: number;
  ad: number;
  user: User;
  viewed_at: string;
}
