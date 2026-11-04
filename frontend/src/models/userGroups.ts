export interface UserGroup {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
  member_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface UserGroupCreate {
  name: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export interface UserGroupUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

export interface UserGroupFilters {
  search?: string;
  is_active?: boolean;
  has_permissions?: string;
  ordering?: string;
  page?: number;
}

export interface UserGroupMember {
  id: number;
  user_id: number;
  group_id: number;
  user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  joined_at: string;
}
