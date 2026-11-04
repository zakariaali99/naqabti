import { UserEntity, UserCreateInput, UserUpdateInput } from "../models/users";

import { BaseApiClient } from "./client";

class UsersApiClient extends BaseApiClient<
  UserEntity,
  UserCreateInput,
  UserUpdateInput
> {
  constructor() {
    super("users/");
  }

  // Additional methods specific to users can be added here
  async searchByGroup(groupId: number) {
    return this.getAll({ groups: groupId });
  }

  async getActiveUsers() {
    return this.getAll({ is_active: true });
  }

  async getStaffUsers() {
    return this.getAll({ is_staff: true });
  }

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    return this.action(id, "change_password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  async toggleActive(id: number) {
    return this.action(id, "toggle_active", {});
  }

  async verifyEmail(id: number) {
    return this.action(id, "verify_email", {});
  }

  async approveDoctor(id: number) {
    return this.action(id, "approve", {});
  }

  async rejectDoctor(id: number) {
    return this.action(id, "reject", {});
  }

  async setPendingDoctor(id: number) {
    return this.action(id, "set-pending", {});
  }

  async uploadImage(id: number, imageFile: File) {
    const formData = new FormData();

    formData.append("profile_image", imageFile);

    return this.client.patch(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async uploadPassportImage(id: number, passportFile: File) {
    const formData = new FormData();

    formData.append("passport_image", passportFile);

    return this.client.patch(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async uploadDynamicFieldFile(userId: number, fieldId: number, file: File) {
    const formData = new FormData();

    formData.append("value_file", file);

    return this.client.post(
      `${this.endpoint}${userId}/dynamic-field-value/${fieldId}/upload/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  }

  // Create user (supports `branch_ids` in payload)
  async create(data: UserCreateInput) {
    return this.client.post(this.endpoint, data);
  }

  // Update user (supports `branch_ids` in payload)
  async update(id: number, data: UserUpdateInput) {
    return this.client.patch(`${this.endpoint}${id}/`, data);
  }

  // Soft-delete current user
  async deleteMe() {
    return this.client.delete(`${this.endpoint}me/`);
  }
}

export default new UsersApiClient();
