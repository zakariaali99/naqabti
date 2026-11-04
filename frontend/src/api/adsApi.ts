import { FileUploadApiClient } from "./client";
import { Ad, AdCreateInput } from "@/models/ad";

export class AdsApiClient extends FileUploadApiClient<Ad, AdCreateInput> {
  constructor() {
    super("ads/");
  }

  async publish(id: number) {
    return this.action(id, "publish");
  }

  async unpublish(id: number) {
    return this.action(id, "unpublish");
  }

  async archive(id: number) {
    return this.action(id, "archive");
  }

  async recordView(id: number) {
    return this.action(id, "record_view");
  }

  async calculateAudience(params: {
    branch_ids?: string;
    city_ids?: string;
    specialty_ids?: string;
  }) {
    return this.client.get<{
      count: number;
      breakdown: {
        by_branch: Array<{ name: string; count: number }>;
        by_city: Array<{ name: string; count: number }>;
      };
    }>(`${this.endpoint}calculate_audience/`, { params });
  }

  async getStats(id: number) {
    return this.client.get<{
      views_count: number;
      breakdown: {
        by_branch: Array<{ name: string; count: number }>;
        by_city: Array<{ name: string; count: number }>;
      };
      viewers: Array<{
        user_id: number;
        username: string;
        full_name: string;
        viewed_at: string;
      }>;
    }>(`${this.endpoint}${id}/stats/`);
  }
}

export const adsApi = new AdsApiClient();
export default adsApi;
