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
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
  Avatar,
  Pagination,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiEye,
  FiAward,
  FiCalendar,
  FiFilter,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import certificationsApi from "@/api/certificationsApi";
import certificationTypesApi from "@/api/certificationTypesApi";
import { Certification, CertificationType } from "@/models";

export default function CertificationsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certificationTypes, setCertificationTypes] = useState<
    CertificationType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState("-created_at");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificationToDelete, setCertificationToDelete] =
    useState<Certification | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  // Generate dropdown menu items
  const getDropdownItems = (certification: Certification) => {
    return [
      {
        key: "view",
        label: t("certifications.viewCertificate"),
        startContent: <FiEye />,
        onPress: () => navigate(`/certifications/${certification.id}`),
      },
      {
        key: "edit",
        label: t("certifications.editCertification"),
        startContent: <FiEdit />,
        onPress: () => navigate(`/certifications/${certification.id}/edit`),
      },
      {
        key: "delete",
        label: t("common.delete"),
        startContent: <FiTrash2 />,
        onPress: () => handleDeleteClick(certification),
      },
    ];
  };

  // Fetch certifications data
  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await certificationsApi.getAll({
        search: searchQuery,
        certification_type: typeFilter ? parseInt(typeFilter) : undefined,
        page: currentPage,
        page_size: pageSize,
        ordering: ordering,
      });

      setCertifications(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch certifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch certification types for filter
  const fetchCertificationTypes = async () => {
    try {
      const response = await certificationTypesApi.getAll({ page_size: 100 });

      setCertificationTypes(response.data.results);
    } catch (error) {
      console.error("Failed to fetch certification types:", error);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, [currentPage, searchQuery, typeFilter, ordering]);

  useEffect(() => {
    fetchCertificationTypes();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  // Handle delete
  const handleDeleteClick = (certification: Certification) => {
    setCertificationToDelete(certification);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!certificationToDelete) return;

    try {
      setDeleteLoading(true);
      await certificationsApi.delete(certificationToDelete.id);
      setDeleteModalOpen(false);
      setCertificationToDelete(null);
      fetchCertifications();
    } catch (error) {
      console.error("Failed to delete certification:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Get certification type name
  const getCertificationTypeName = (
    certificationType: CertificationType | number,
  ): string => {
    if (typeof certificationType === "number") {
      return "Unknown";
    }

    return certificationType.name;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      i18n.language === "ar" ? "ar-LY" : "en-US",
    );
  };

  // Check if certification is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const timeDiff = expiry.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff <= 30 && daysDiff > 0;
  };

  // Table columns
  const columns = [
    { key: "doctor", label: t("certifications.table.doctor") },
    { key: "certification", label: t("certifications.table.certification") },
    { key: "dates", label: t("common.date") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("certifications.table.actions") },
  ];

  return (
    <DefaultLayout>
      <div className="min-h-screen font-sans max-w-[1600px] mx-auto p-4 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
              {t("certifications.certifications")}
            </h1>
            <p className="text-default-500 font-medium mt-1">
              {t("common.totalRecords", { count: totalCount })}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              className="bg-content1 font-medium"
              color="primary"
              startContent={<FiPlus />}
              variant="bordered"
              onPress={() => navigate("/certification-types")}
            >
              {t("certificationTypes.add")}
            </Button>
            <Button
              className="font-bold shadow-lg shadow-primary/20"
              color="primary"
              startContent={<FiPlus />}
              variant="shadow"
              onPress={() => navigate("/certifications/add")}
            >
              {t("certifications.addCertification")}
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-content1 rounded-[24px] p-4 shadow-sm border border-default-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              isClearable
              classNames={{
                inputWrapper:
                  "bg-default-50 hover:bg-default-100 transition-colors border-default-200 rounded-xl",
              }}
              placeholder={t("certifications.searchCertifications")}
              startContent={<FiSearch className="text-default-400" />}
              value={searchQuery}
              variant="bordered"
              onValueChange={handleSearch}
            />
          </div>
          <div className="w-full md:w-72">
            <Select
              classNames={{
                trigger:
                  "bg-default-50 hover:bg-default-100 transition-colors border-default-200 rounded-xl",
              }}
              placeholder={t("certifications.selectCertificationType")}
              startContent={<FiFilter className="text-default-400" />}
              value={typeFilter}
              variant="bordered"
              onSelectionChange={(keys) =>
                handleTypeFilterChange(Array.from(keys)[0] as string)
              }
            >
              {certificationTypes.map((type) => (
                <SelectItem key={type.id.toString()}>{type.name}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-64">
            <Select
              classNames={{
                trigger:
                  "bg-default-50 hover:bg-default-100 transition-colors border-default-200 rounded-xl",
              }}
              placeholder={t("common.sortBy", "Sort By")}
              selectedKeys={[ordering]}
              variant="bordered"
              onSelectionChange={(keys) => {
                setOrdering((Array.from(keys)[0] as string) || "-created_at");
                setCurrentPage(1);
              }}
            >
              <SelectItem key="-created_at">{t("certifications.sort.newest", "Newest Created")}</SelectItem>
              <SelectItem key="created_at">{t("certifications.sort.oldest", "Oldest Created")}</SelectItem>
              <SelectItem key="-issue_date">{t("certifications.sort.issueNewest", "Issue Date (Newest)")}</SelectItem>
              <SelectItem key="issue_date">{t("certifications.sort.issueOldest", "Issue Date (Oldest)")}</SelectItem>
              <SelectItem key="-expiry_date">{t("certifications.sort.expiryNewest", "Expiry Date (Newest)")}</SelectItem>
              <SelectItem key="expiry_date">{t("certifications.sort.expiryOldest", "Expiry Date (Oldest)")}</SelectItem>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-content1 rounded-[32px] shadow-sm border border-default-200 overflow-hidden min-h-[500px] relative">
          {loading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-content1/50 z-10 backdrop-blur-sm">
              <Spinner color="primary" size="lg" />
            </div>
          ) : null}

          {/* Desktop Table View */}
          <div className="hidden md:block p-6">
            {certifications.length > 0 ? (
              <Table
                removeWrapper
                aria-label="Certifications table"
                classNames={{
                  th: "bg-default-50 text-default-500 font-semibold h-12",
                  td: "py-4 border-b border-default-100 group-last:border-none",
                }}
              >
                <TableHeader>
                  {columns.map((column) => (
                    <TableColumn
                      key={column.key}
                      className={column.key === "actions" ? "text-end" : ""}
                    >
                      {column.label}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody>
                  {certifications.map((certification) => (
                    <TableRow
                      key={certification.id}
                      className="hover:bg-default-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/certifications/${certification.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar
                            isBordered
                            className="w-10 h-10 text-lg rounded-xl"
                            name={
                              certification.doctor?.full_name ||
                              certification.doctor?.username ||
                              "?"
                            }
                            src={
                              certification.doctor?.profile_image ?? undefined
                            }
                          />
                          <div>
                            <div className="font-bold text-foreground">
                              {certification.doctor?.full_name ||
                                certification.doctor?.username ||
                                "N/A"}
                            </div>
                            <div className="text-xs text-default-500">
                              {certification.doctor?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary-50 text-primary">
                            <FiAward size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {getCertificationTypeName(
                                certification.certification_type,
                              )}
                            </div>
                            {certification.issued_from && (
                              <div className="text-xs text-default-500">
                                {t("certifications.issuedFrom")}:{" "}
                                {certification.issued_from}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-default-600">
                            <FiCalendar className="text-default-400" />
                            <span>
                              {t("certifications.issueDate")}:{" "}
                              <span className="font-medium text-foreground">
                                {formatDate(certification.issue_date)}
                              </span>
                            </span>
                          </div>
                          {certification.expiry_date && (
                            <div className="flex items-center gap-2 text-xs text-default-600">
                              <FiCalendar className="text-default-400" />
                              <span>
                                {t("certifications.expiryDate")}:{" "}
                                <span className="font-medium text-foreground">
                                  {formatDate(certification.expiry_date)}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {certification.expiry_date ? (
                          isExpiringSoon(certification.expiry_date) ? (
                            <Chip
                              color="warning"
                              size="sm"
                              startContent={
                                <span className="w-1 h-1 rounded-full bg-warning mx-1" />
                              }
                              variant="flat"
                            >
                              Expiring Soon
                            </Chip>
                          ) : (
                            <Chip
                              color="success"
                              size="sm"
                              startContent={
                                <span className="w-1 h-1 rounded-full bg-success mx-1" />
                              }
                              variant="flat"
                            >
                              Valid
                            </Chip>
                          )
                        ) : (
                          <Chip color="default" size="sm" variant="flat">
                            Permanent
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                radius="full"
                                size="sm"
                                variant="light"
                              >
                                <FiMoreVertical size={18} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              {getDropdownItems(certification).map((item) => (
                                <DropdownItem
                                  key={item.key}
                                  className={
                                    item.key === "delete" ? "text-danger" : ""
                                  }
                                  color={
                                    item.key === "delete" ? "danger" : "default"
                                  }
                                  startContent={item.startContent}
                                  onPress={item.onPress}
                                >
                                  {item.label}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-3xl bg-default-100 flex items-center justify-center mb-4 text-default-400">
                  <FiAward size={32} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("certifications.noCertifications")}
                </h3>
                <p className="text-default-500 max-w-xs mt-1">
                  {t(
                    "common.noDataDesc",
                    "No records found matching your criteria.",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 grid gap-4">
            {certifications.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4 text-default-400">
                  <FiAward size={24} />
                </div>
                <p className="text-default-500">
                  {t("certifications.noCertifications")}
                </p>
              </div>
            )}
            {certifications.map((certification) => (
              <div
                key={certification.id}
                className="bg-content2 rounded-3xl p-5 relative border border-default-200"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/certifications/${certification.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/certifications/${certification.id}`);
                  }
                }}
              >
                {/* Header with Avatar and Menu */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      isBordered
                      className="w-12 h-12 rounded-xl"
                      name={
                        certification.doctor?.full_name ||
                        certification.doctor?.username ||
                        "?"
                      }
                      src={certification.doctor?.profile_image ?? undefined}
                    />
                    <div>
                      <p className="font-bold text-foreground text-lg">
                        {certification.doctor?.full_name ||
                          certification.doctor?.username}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-default-500">
                        <FiAward size={12} />
                        {getCertificationTypeName(
                          certification.certification_type,
                        )}
                      </div>
                    </div>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        className="-mr-2 -mt-2"
                        radius="full"
                        size="sm"
                        variant="light"
                      >
                        <FiMoreVertical />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {getDropdownItems(certification).map((item) => (
                        <DropdownItem
                          key={item.key}
                          className={item.key === "delete" ? "text-danger" : ""}
                          color={item.key === "delete" ? "danger" : "default"}
                          startContent={item.startContent}
                          onPress={item.onPress}
                        >
                          {item.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-content1">
                    <p className="text-[10px] text-default-500 uppercase font-semibold mb-1">
                      {t("certifications.issueDate")}
                    </p>
                    <p className="font-medium text-sm">
                      {formatDate(certification.issue_date)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-content1">
                    <p className="text-[10px] text-default-500 uppercase font-semibold mb-1">
                      {t("certifications.expiryDate")}
                    </p>
                    <p className="font-medium text-sm">
                      {certification.expiry_date
                        ? formatDate(certification.expiry_date)
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {certification.expiry_date ? (
                    isExpiringSoon(certification.expiry_date) ? (
                      <Chip
                        className="w-full justify-center"
                        color="warning"
                        size="sm"
                        variant="flat"
                      >
                        Expiring Soon
                      </Chip>
                    ) : (
                      <Chip
                        className="w-full justify-center"
                        color="success"
                        size="sm"
                        variant="flat"
                      >
                        Valid
                      </Chip>
                    )
                  ) : (
                    <Chip
                      className="w-full justify-center"
                      color="default"
                      size="sm"
                      variant="flat"
                    >
                      Permanent
                    </Chip>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-default-100 flex justify-center">
              <Pagination
                showControls
                classNames={{
                  cursor: "bg-primary text-white font-bold",
                }}
                page={currentPage}
                total={totalPages}
                variant="light"
                onChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isLoading={deleteLoading}
        isOpen={deleteModalOpen}
        itemName={
          certificationToDelete
            ? `${certificationToDelete.doctor?.full_name || certificationToDelete.doctor?.username || "N/A"} - ${getCertificationTypeName(certificationToDelete.certification_type)}`
            : ""
        }
        title={t("certifications.certifications")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DefaultLayout>
  );
}
