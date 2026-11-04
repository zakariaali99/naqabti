import type { Notification, NotificationCreateInput } from "@/models";

import { BaseApiClient } from "./client";

class NotificationsApi extends BaseApiClient<
  Notification,
  NotificationCreateInput,
  NotificationCreateInput
> {
  constructor() {
    super("notifications/");
  }

  // Send single notification
  async sendSingle(data: {
    user_id: number;
    title: string;
    message: string;
    notification_type?: string;
    content_type?: string;
    object_id?: number;
  }) {
    return this.collectionAction("send_single", data);
  }

  // Send bulk notification
  async sendBulk(data: {
    user_ids?: number[];
    title: string;
    message: string;
    notification_type?: string;
    content_type?: string;
    object_id?: number;
    send_to_all_devices?: boolean;
    // Filter params (backend queries matching users directly)
    branch_ids?: string;
    user_type?: string;
    gender?: string;
    city?: string;
    nationality?: string;
    graduation_year_after?: string;
    graduation_year_before?: string;
    current_degree?: string;
    email_verified?: string;
    birthdate_after?: string;
    birthdate_before?: string;
  }) {
    return this.collectionAction("send_bulk", data);
  }

  // Get aggregated notifications grouped by batch
  async getAggregated(params?: Record<string, any>) {
    return this.client.get(`${this.endpoint}aggregated/`, { params });
  }

  // Get notification statistics
  async getStats() {
    return this.collectionAction("stats");
  }

  // Mark notification as seen
  async markAsSeen(id: number) {
    return this.action(id, "mark_as_seen", {});
  }

  // Mark notification as read
  async markAsRead(id: number) {
    return this.action(id, "mark_as_read", {});
  }

  // Mark all notifications as read
  async markAllAsRead() {
    return this.collectionAction("mark_all_as_read", {});
  }

  // Get unread count
  async getUnreadCount() {
    return this.client.get<{ unread_count: number }>(`${this.endpoint}unread_count/`);
  }

  // Resend notification
  async resend(id: number) {
    return this.action(id, "resend", {});
  }

  // Cancel notification
  async cancel(id: number) {
    return this.action(id, "cancel", {});
  }

  // Get notification delivery status
  async getDeliveryStatus(id: number) {
    return this.action(id, "delivery_status");
  }

  // Get recipients for bulk notification
  async getRecipients(recipientType: string, ids?: number[]) {
    const params = new URLSearchParams();

    params.append("recipient_type", recipientType);

    if (ids && ids.length > 0) {
      ids.forEach((id) => params.append("ids", String(id)));
    }

    return this.client.get(`${this.endpoint}recipients/?${params.toString()}`);
  }

  // Get available departments (cross-resource call)
  async getDepartments() {
    return this.client.get("/api/departments/");
  }

  // Get available roles (cross-resource call)
  async getRoles() {
    return this.client.get("/api/roles/");
  }
}

export default new NotificationsApi();
