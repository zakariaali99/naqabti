import React from "react";
import { Pagination as HeroPagination } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showControls?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showControls = true,
  className = "",
}) => {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex justify-center items-center mt-6 ${className}`}>
      <div className="flex items-center gap-4">
        <HeroPagination
          classNames={{
            wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
            item: "w-8 h-8 text-small rounded-none bg-transparent",
            cursor:
              "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
          }}
          isDisabled={isLoading}
          page={currentPage}
          showControls={showControls}
          total={totalPages}
          onChange={onPageChange}
        />
        {totalPages > 1 && (
          <div className="text-sm text-gray-500">
            {t("common.pagination.pageOf", {
              current: currentPage,
              total: totalPages,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
