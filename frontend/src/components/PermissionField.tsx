import React, { ReactElement } from "react";
import { Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";

import {
  useFieldPermission,
  FieldPermissionConfig,
} from "@/hooks/useFieldPermission";

interface PermissionFieldProps extends FieldPermissionConfig {
  children: ReactElement;
  value?: any;
  label?: string;
  showViewOnlyChip?: boolean;
}

/**
 * Wrapper component for form fields that enforces permission-based access
 * - hidden: Field is not rendered
 * - view: Field is read-only (displayed as text or disabled input)
 * - edit: Field is fully editable
 */
export const PermissionField: React.FC<PermissionFieldProps> = ({
  field,
  viewPermission,
  editPermission,
  requireSuperuser,
  children,
  value,
  label,
  showViewOnlyChip = true,
}) => {
  const { t } = useTranslation();
  const permissionLevel = useFieldPermission({
    field,
    viewPermission,
    editPermission,
    requireSuperuser,
  });

  // Hidden: Don't render anything
  if (permissionLevel === "hidden") {
    return null;
  }

  // View-only: Render as read-only
  if (permissionLevel === "view") {
    return (
      <div className="space-y-1" data-testid="permission-field-view-only">
        {label && (
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-default-700">
              {label}
            </label>
            {showViewOnlyChip && (
              <Chip
                className="text-xs"
                color="default"
                data-testid="view-only-chip"
                size="sm"
                variant="flat"
              >
                {t("common.viewOnly", "View Only")}
              </Chip>
            )}
          </div>
        )}
        <div className="p-3 rounded-lg bg-default-100 text-default-600 min-h-10 flex items-center">
          {formatFieldValue(value)}
        </div>
      </div>
    );
  }

  // Edit: Render the original field
  return <>{children}</>;
};

/**
 * Format field value for display in view-only mode
 */
const formatFieldValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") {
    return <span className="italic text-default-400">Not set</span>;
  }

  // Handle boolean values
  if (typeof value === "boolean") {
    return value ? "✓ Yes" : "✗ No";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-default-400">None selected</span>;
    }

    return value.join(", ");
  }

  // Handle objects
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};
