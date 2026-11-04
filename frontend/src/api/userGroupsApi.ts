import type {
  UserGroup,
  UserGroupCreate,
  UserGroupUpdate,
  UserGroupMember,
} from "@/models/userGroups";

import { BaseApiClient } from "./client";

class UserGroupsApiClient extends BaseApiClient<
  UserGroup,
  UserGroupCreate,
  UserGroupUpdate
> {
  constructor() {
    super("user-groups/");
  }

  // Get active user groups
  async getActive() {
    return this.getAll({ is_active: true });
  }

  // Get inactive user groups
  async getInactive() {
    return this.getAll({ is_active: false });
  }

  // Search user groups by name or description
  async search(query: string) {
    return this.getAll({ search: query });
  }

  // Get user groups with specific permission
  async getByPermission(permission: string) {
    return this.getAll({ has_permissions: permission });
  }

  // Get user groups ordered by name
  async getOrderedByName(ascending: boolean = true) {
    return this.getAll({ ordering: ascending ? "name" : "-name" });
  }

  // Get user groups ordered by member count
  async getOrderedByMemberCount(ascending: boolean = false) {
    return this.getAll({
      ordering: ascending ? "member_count" : "-member_count",
    });
  }

  // Add user to group
  async addUser(groupId: number, userId: number) {
    return this.action(groupId, "add_user", { user_id: userId });
  }

  // Remove user from group
  async removeUser(groupId: number, userId: number) {
    return this.action(groupId, "remove_user", { user_id: userId });
  }

  // Get group members
  async getMembers(groupId: number) {
    return this.client.get<UserGroupMember[]>(
      `${this.endpoint}${groupId}/members/`,
    );
  }

  // Add multiple users to group
  async addMultipleUsers(groupId: number, userIds: number[]) {
    return this.action(groupId, "add_multiple_users", { user_ids: userIds });
  }

  // Remove multiple users from group
  async removeMultipleUsers(groupId: number, userIds: number[]) {
    return this.action(groupId, "remove_multiple_users", { user_ids: userIds });
  }

  // Toggle group active status
  async toggleActive(groupId: number) {
    return this.action(groupId, "toggle_active", {});
  }

  // Get group statistics
  async getStats() {
    return this.collectionAction("stats");
  }

  // Duplicate user group
  async duplicate(groupId: number, newName: string) {
    return this.action(groupId, "duplicate", { name: newName });
  }
}

export default new UserGroupsApiClient();
