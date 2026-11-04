import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Card,
  CardBody,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import certificationTypesApi from "@/api/certificationTypesApi";
import { CertificationType } from "@/models/certificationTypes";

export default function CertificationTypesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [certificationTypes, setCertificationTypes] = useState<
    CertificationType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificationTypeToDelete, setCertificationTypeToDelete] =
    useState<CertificationType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  // Helper function to get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return "default";

    const colors: Record<string, any> = {
      professional: "primary",
      academic: "secondary",
      technical: "success",
      safety: "warning",
      compliance: "danger",
      specialization: "default",
    };

    return colors[category.toLowerCase()] || "default";
  };

  // Fetch certification types data
  const fetchCertificationTypes = async () => {
    try {
      setLoading(true);
      const response = await certificationTypesApi.getAll({
        search: searchQuery,
        page: currentPage,
        page_size: pageSize,
        ordering: ordering,
      });

      setCertificationTypes(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch certification types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificationTypes();
  }, [currentPage, searchQuery, ordering]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle delete
  const handleDeleteClick = (certificationType: CertificationType) => {
    setCertificationTypeToDelete(certificationType);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!certificationTypeToDelete) return;

    try {
      setDeleteLoading(true);
      await certificationTypesApi.delete(certificationTypeToDelete.id);
      setDeleteModalOpen(false);
      setCertificationTypeToDelete(null);
      fetchCertificationTypes(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete certification type:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: "name", label: t("certificationTypes.table.name") },
    { key: "description", label: t("certificationTypes.table.description") },
    { key: "category", label: t("certificationTypes.table.category") },
    { key: "actions", label: t("certificationTypes.table.actions") },
  ];

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {t("certificationTypes.title")}
            </h1>
            <p className="text-default-600 mt-1">
              {t("common.totalRecords", { count: totalCount })}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/certification-types/add")}
          >
            {t("certificationTypes.add")}
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="max-w-sm"
                placeholder={t("certificationTypes.searchPlaceholder")}
                startContent={<FiSearch />}
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <Select
                label={t("common.sortBy", "Sort By")}
                labelPlacement="outside"
                selectedKeys={[ordering]}
                size="sm"
                className="w-40"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  if (key) setOrdering(key);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="name">{t("common.sortNameAsc", "Name (A-Z)")}</SelectItem>
                <SelectItem key="-name">{t("common.sortNameDesc", "Name (Z-A)")}</SelectItem>
                <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
                <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table aria-label="Certification types table">
                    <TableHeader>
                      {columns.map((column) => (
                        <TableColumn key={column.key}>
                          {column.label}
                        </TableColumn>
                      ))}
                    </TableHeader>
                    <TableBody emptyContent={t("certificationTypes.noRecords")}>
                      {certificationTypes.map((certificationType) => (
                        <TableRow key={certificationType.id}>
                          <TableCell>{certificationType.name}</TableCell>
                          <TableCell>
                            <div
                              className="max-w-xs truncate"
                              title={certificationType.description}
                            >
                              {certificationType.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            {certificationType.category && (
                              <Chip
                                color={getCategoryColor(
                                  certificationType.category,
                                )}
                                size="sm"
                                variant="flat"
                              >
                                {t(
                                  `certificationTypes.categories.${certificationType.category.toLowerCase()}`,
                                ) || certificationType.category}
                              </Chip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <FiMoreVertical />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="edit"
                                  startContent={<FiEdit />}
                                  onPress={() =>
                                    navigate(
                                      `/certification-types/${certificationType.id}/edit`,
                                    )
                                  }
                                >
                                  {t("common.edit")}
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<FiTrash2 />}
                                  onPress={() =>
                                    handleDeleteClick(certificationType)
                                  }
                                >
                                  {t("common.delete")}
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {certificationTypes.length === 0 ? (
                    <p className="text-center text-default-500 py-8">
                      {t("certificationTypes.noRecords")}
                    </p>
                  ) : (
                    certificationTypes.map((certificationType) => (
                      <Card key={certificationType.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">
                                {certificationType.name}
                              </h3>
                              <p className="text-sm text-default-600 mt-1">
                                {certificationType.description}
                              </p>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <FiMoreVertical />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="edit"
                                  startContent={<FiEdit />}
                                  onPress={() =>
                                    navigate(
                                      `/certification-types/${certificationType.id}/edit`,
                                    )
                                  }
                                >
                                  {t("common.edit")}
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<FiTrash2 />}
                                  onPress={() =>
                                    handleDeleteClick(certificationType)
                                  }
                                >
                                  {t("common.delete")}
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          {certificationType.category && (
                            <div>
                              <Chip
                                color={getCategoryColor(
                                  certificationType.category,
                                )}
                                size="sm"
                                variant="flat"
                              >
                                {t(
                                  `certificationTypes.categories.${certificationType.category.toLowerCase()}`,
                                ) || certificationType.category}
                              </Chip>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isLoading={deleteLoading}
        isOpen={deleteModalOpen}
        itemName={certificationTypeToDelete?.name || ""}
        title={t("certificationTypes.delete")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DefaultLayout>
  );
}
