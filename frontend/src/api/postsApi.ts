import type {
  Post,
  PostCreateInput,
  PostUpdateInput,
  PostStats,
} from "@/models";

import { BaseApiClient } from "./client";

class PostsApi extends BaseApiClient<Post, PostCreateInput, PostUpdateInput> {
  constructor() {
    super("posts/");
  }

  // Publish a post
  async publish(id: number) {
    return this.action(id, "publish", {});
  }

  // Unpublish a post (set to draft)
  async unpublish(id: number) {
    return this.action(id, "unpublish", {});
  }

  // Archive a post
  async archive(id: number) {
    return this.action(id, "archive", {});
  }

  // Increment view count
  async incrementViews(id: number) {
    return this.action(id, "increment_views", {});
  }

  // Toggle featured status
  async toggleFeatured(id: number) {
    return this.action(id, "toggle_featured", {});
  }

  // Get featured posts
  async getFeatured(params?: Record<string, any>) {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";

    return this.client.get(`${this.endpoint}featured/${queryString}`);
  }

  // Get posts by type
  async getByType(type: string, params?: Record<string, any>) {
    const allParams = { ...params, type };
    const queryString = `?${new URLSearchParams(allParams).toString()}`;

    return this.client.get(`${this.endpoint}by_type/${queryString}`);
  }

  // Get post statistics
  async getStats(): Promise<PostStats> {
    const response = await this.collectionAction("stats");

    return response.data;
  }

  // Upload featured image
  async uploadFeaturedImage(id: number, file: File) {
    const formData = new FormData();

    formData.append("featured_image", file);

    return this.client.patch(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Create post with image
  async createWithImage(data: PostCreateInput & { featured_image?: File }) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "tags" || key === "meta_data") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "featured_image" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return this.client.post(this.endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Update post with image
  async updateWithImage(
    id: number,
    data: Partial<PostCreateInput> & { featured_image?: File },
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "tags" || key === "meta_data") {
          formData.append(key, JSON.stringify(value));
        } else if (key === "featured_image" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return this.client.patch(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Send custom notification about this post
  async sendNotification(id: number, data: {
    title: string;
    message: string;
    notification_type?: string;
    user_ids?: number[];
    send_to_all_devices?: boolean;
  }) {
    return this.action(id, 'send_notification_action', data);
  }
}

export default new PostsApi();
