import { BaseApiClient } from "./client";

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
  content_type_name: string;
}

export interface GroupedPermissions {
  model: string;
  app_label: string;
  model_name: string;
  permissions: Permission[];
}

class PermissionsApiClient extends BaseApiClient<Permission, any, any> {
  constructor() {
    super("permissions/");
  }

  /**
   * Get permissions grouped by model
   */
  async getGrouped() {
    return this.client.get<{ [key: string]: GroupedPermissions }>(
      `${this.endpoint}grouped/`,
    );
  }

  /**
   * Search permissions
   */
  async search(query: string) {
    return this.getAll({ search: query });
  }
}

export default new PermissionsApiClient();
