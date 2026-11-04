import React from "react";

import {
  usePermission,
  useAnyPermission,
  useAllPermissions,
} from "@/hooks/useFieldPermission";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const hasSinglePerm = usePermission(permission || "");
  const hasAnyPerms = useAnyPermission(permissions || []);
  const hasAllPerms = useAllPermissions(permissions || []);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasSinglePerm;
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPerms : hasAnyPerms;
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
