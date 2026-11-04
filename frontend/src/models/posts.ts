// Post and News interfaces and types

import { UserEntity as User } from "./users";

export type PostType = "news" | "announcement" | "article";
export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  post_type: PostType;
  status: PostStatus;
  featured_image?: string;
  author: User;
  published_at?: string;
  views_count: number;
  is_featured: boolean;
  tags: string[];
  meta_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface PostCreateInput {
  title: string;
  content: string;
  excerpt?: string;
  post_type?: PostType;
  status?: PostStatus;
  featured_image?: File | string;
  author_id?: number;
  is_featured?: boolean;
  tags?: string[];
  meta_data?: Record<string, any>;
}

export interface PostUpdateInput extends Partial<PostCreateInput> {
  id: number;
}

export interface PostFilters {
  search?: string;
  post_type?: PostType;
  status?: PostStatus;
  is_featured?: boolean;
  author?: number;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface PostListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Post[];
}

export interface PostStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  featured: number;
  by_type: {
    news: number;
    announcement: number;
    article: number;
  };
}
