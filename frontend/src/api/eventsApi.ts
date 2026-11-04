import { BaseApiClient } from "./client";
import { Event, EventCreateInput, EventUpdateInput } from "@/models/event";

class EventsApi extends BaseApiClient<Event, EventCreateInput, EventUpdateInput> {
  constructor() {
    super("events/");
  }

  async publish(id: number) {
    return this.client.post<Event>(`${this.endpoint}${id}/publish/`);
  }

  async unpublish(id: number) {
    return this.client.post<Event>(`${this.endpoint}${id}/unpublish/`);
  }

  async archive(id: number) {
    return this.client.post<Event>(`${this.endpoint}${id}/archive/`);
  }

  async incrementViews(id: number) {
    return this.client.post<{ views_count: number }>(
      `${this.endpoint}${id}/increment_views/`,
    );
  }

  async toggleFeatured(id: number) {
    return this.client.post<Event>(`${this.endpoint}${id}/toggle_featured/`);
  }

  async getFeatured() {
    return this.client.get<Event[]>(`${this.endpoint}featured/`);
  }

  async getStats() {
    return this.client.get<{
      total: number;
      published: number;
      draft: number;
      archived: number;
      featured: number;
    }>(`${this.endpoint}stats/`);
  }

  async sendNotification(
    id: number,
    data: {
      title: string;
      message: string;
      notification_type?: string;
    },
  ) {
    return this.client.post(
      `${this.endpoint}${id}/send_notification_action/`,
      data,
    );
  }
}

export default new EventsApi();
