// Notification interfaces and types

import { UserEntity as User } from "./users";

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export type RecipientType =
  | "individual"
  | "allUsers"
  | "userGroup"
  | "department"
  | "role";
export type NotificationStatus = "draft" | "sent" | "scheduled" | "failed";
export type NotificationType = "single" | "bulk" | "system" | "announcement";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationRecipient {
  id: number;
  user: User;
  notification: number;
  read_at?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: "info" | "warning" | "error" | "success";
  user: User; // The recipient
  is_read: boolean;
  read_at?: string;
  send_to_all_devices?: boolean;
  batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AggregatedNotification {
  id: number;
  batch_id: string | null;
  title: string;
  message: string;
  notification_type: string;
  send_to_all_devices: boolean;
  recipient_count: number;
  seen_count: number;
  created_at: string;
  created_by_name: string | null;
  source?: 'system' | 'manual';
}

export interface NotificationCreateInput {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  recipient_type: RecipientType;
  recipient_ids?: number[];
  group_ids?: number[];
  department_ids?: number[];
  role_ids?: number[];
  scheduled_for?: string;
  send_now?: boolean;
}

export interface BulkNotificationInput {
  title: string;
  message: string;
  priority?: NotificationPriority;
  recipient_type: RecipientType;
  recipient_ids?: number[];
  group_ids?: number[];
  department_ids?: number[];
  role_ids?: number[];
  scheduled_for?: string;
  send_now?: boolean;
  send_to_all_devices?: boolean;
}

export interface NotificationFilters {
  search?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  recipient_type?: RecipientType;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface NotificationListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Notification[];
}

// Statistics interface for dashboard
export interface NotificationStats {
  total_sent: number;
  total_pending: number;
  total_failed: number;
  delivery_rate: number;
  recent_notifications: Notification[];
}
