import { Spinner as HeroSpinner } from "@heroui/react";
import React from "react";

export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className,
}) => (
  <HeroSpinner
    className={className}
    size={size === 48 ? "lg" : size === 32 ? "md" : "sm"}
  />
);
