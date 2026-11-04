import { useUserStore } from "@/stores/userStore";

export type FieldPermissionLevel = "hidden" | "view" | "edit";

export interface FieldPermissionConfig {
  field: string;
  viewPermission?: string;
  editPermission?: string;
  requireSuperuser?: boolean;
}

/**
 * Hook to check field-level permissions
 * Returns the permission level for a specific field
 */
export const useFieldPermission = (
  config: FieldPermissionConfig,
): FieldPermissionLevel => {
  const user = useUserStore((state) => state.user);

  // If no user, hide the field
  if (!user) {
    return "hidden";
  }

  // Admin bypass (staff or institution)
  const isAdmin = user.is_staff || user.user_type === 'institution';

  if (config.requireSuperuser && !isAdmin) {
    return "hidden";
  }

  // If admin and not requiring specific check, grant edit
  if (isAdmin && !config.viewPermission && !config.editPermission) {
    return "edit";
  }

  const userPermissions = user.group_permissions || [];

  // Check edit permission first
  if (config.editPermission) {
    if (userPermissions.includes(config.editPermission) || isAdmin) {
      return "edit";
    }
  }

  // Check view permission
  if (config.viewPermission) {
    if (userPermissions.includes(config.viewPermission) || isAdmin) {
      return "view";
    }
  }

  // If no specific permissions defined but user is authenticated, default to edit
  if (!config.viewPermission && !config.editPermission) {
    return "edit";
  }

  // No permission grants, hide the field
  return "hidden";
};

/**
 * Hook to check if user has a specific permission
 */
export const usePermission = (permission: string): boolean => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return false;
  }

  const isAdmin = user.is_staff || user.user_type === 'institution';
  if (isAdmin) {
    return true;
  }

  const userPermissions = user.group_permissions || [];

  return userPermissions.includes(permission);
};

export const useAnyPermission = (permissions: string[]): boolean => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return false;
  }

  const isAdmin = user.is_staff || user.user_type === 'institution';
  if (isAdmin) {
    return true;
  }

  const userPermissions = user.group_permissions || [];

  return permissions.some((perm) => userPermissions.includes(perm));
};

export const useAllPermissions = (permissions: string[]): boolean => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return false;
  }

  const isAdmin = user.is_staff || user.user_type === 'institution';
  if (isAdmin) {
    return true;
  }

  const userPermissions = user.group_permissions || [];

  return permissions.every((perm) => userPermissions.includes(perm));
};

export const useUserRole = () => {
  const user = useUserStore((state) => state.user);

  return {
    isSuperuser: user?.is_superuser || false,
    isStaff: user?.is_staff || false,
    userType: user?.user_type,
    groups: user?.group_names || [],
    permissions: user?.group_permissions || [],
  };
};
