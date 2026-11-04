import React from "react";
import { Button, ButtonProps, Tooltip } from "@heroui/react";
import { useTranslation } from "react-i18next";

import { usePermission } from "@/hooks/useFieldPermission";

interface ActionButtonProps extends Omit<ButtonProps, "isDisabled"> {
  permission?: string;
  hideIfNoPermission?: boolean;
  showTooltip?: boolean;
}

/**
 * Button that checks permissions before allowing action
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  permission,
  hideIfNoPermission = false,
  showTooltip = true,
  children,
  ...buttonProps
}) => {
  const { t } = useTranslation();
  const hasPermission = usePermission(permission || "");

  // Hide button if no permission and hideIfNoPermission is true
  if (!hasPermission && hideIfNoPermission && permission) {
    return null;
  }

  // Disable button if no permission
  const isDisabled = permission ? !hasPermission : false;

  const button = (
    <Button {...buttonProps} isDisabled={isDisabled || buttonProps.isLoading}>
      {children}
    </Button>
  );

  // Show tooltip explaining why disabled
  if (isDisabled && showTooltip && permission) {
    return (
      <Tooltip
        content={t(
          "common.noPermission",
          "You do not have permission for this action",
        )}
      >
        {button}
      </Tooltip>
    );
  }

  return button;
};
