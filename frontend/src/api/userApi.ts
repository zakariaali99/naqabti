import { BaseApiClient } from "./client";

import { User, ChangePasswordRequest } from "@/models/auth";

export class UserApiClient extends BaseApiClient<User, never, never> {
  constructor() {
    super("auth/");
  }

  // Get current user profile
  async getProfile() {
    return this.client.get<{ user: User }>(`${this.endpoint}profile/`);
  }

  // Change password
  async changePassword(data: ChangePasswordRequest) {
    return this.client.post(`${this.endpoint}change-password/`, data);
  }

  // Update user with optional password
  async updateUser(
    id: number,
    data: Partial<User> & { password?: string; confirm_password?: string },
  ) {
    return this.client.patch(`users/${id}/`, data);
  }

  // Logout
  async logout(refreshToken: string) {
    return this.client.post(`${this.endpoint}logout/`, {
      refresh_token: refreshToken,
    });
  }
}

export const userApi = new UserApiClient();
