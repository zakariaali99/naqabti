import { UserEntity as User } from "./users";

export type EventStatus = "draft" | "published" | "archived";

export interface Event {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  event_date: string;
  location?: string;
  max_attendees?: number;
  status: EventStatus;
  author: User;
  published_at?: string;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface EventCreateInput {
  title: string;
  content?: string;
  excerpt?: string;
  featured_image?: File | string;
  event_date: string;
  location?: string;
  max_attendees?: number;
  status?: EventStatus;
  is_featured?: boolean;
}

export interface EventUpdateInput extends Partial<EventCreateInput> {}
