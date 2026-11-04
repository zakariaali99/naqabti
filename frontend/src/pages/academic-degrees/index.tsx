import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@heroui/react";
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import academicDegreesApi from "@/api/academicDegreesApi";
import { AcademicDegree } from "@/models/academicDegree";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Pagination } from "@/components/Pagination";
import AcademicDegreeModal from "./AcademicDegreeModal";

export default function AcademicDegreesListPage() {
  const { t } = useTranslation();

  const [academicDegrees, setAcademicDegrees] = useState<AcademicDegree[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [academicDegreeToEdit, setAcademicDegreeToEdit] = useState<AcademicDegree | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [academicDegreeToDelete, setAcademicDegreeToDelete] = useState<AcademicDegree | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  const fetchAcademicDegrees = async (page = 1) => {
    try {
      setLoading(true);
      const res = await academicDegreesApi.getAll({ page, page_size: pageSize, ordering });
      setAcademicDegrees(res.data.results || []);
      setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
    } catch (err) {
      console.error("Failed to fetch academic degrees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicDegrees(currentPage);
  }, [currentPage, ordering]);

  const handleAddClick = () => {
    setAcademicDegreeToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (academicDegree: AcademicDegree) => {
    setAcademicDegreeToEdit(academicDegree);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchAcademicDegrees(currentPage);
  };

  const handleDeleteClick = (academicDegree: AcademicDegree) => {
    setAcademicDegreeToDelete(academicDegree);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!academicDegreeToDelete) return;
    try {
      setDeleteLoading(true);
      await academicDegreesApi.delete(academicDegreeToDelete.id);
      setDeleteModalOpen(false);
      setAcademicDegreeToDelete(null);
      fetchAcademicDegrees(currentPage);
    } catch (err) {
      console.error("Failed to delete academic degree", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t("academicDegrees.title", "Academic Degrees")}</h1>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              startContent={<FiPlus />}
              onPress={handleAddClick}
            >
              {t("academicDegrees.add", "Add Academic Degree")}
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
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

        <Card>
          <CardBody>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table shadow="none">
                <TableHeader>
                  <TableColumn>{t("academicDegrees.table.name", "Name")}</TableColumn>
                  <TableColumn>{t("academicDegrees.table.allowsMultipleSubscriptions", "Multiple Subscriptions")}</TableColumn>
                  <TableColumn>{t("academicDegrees.table.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t("academicDegrees.noRecords", "No academic degrees found")}
                >
                  {academicDegrees.map((academicDegree) => (
                    <TableRow key={academicDegree.id}>
                      <TableCell>{academicDegree.name}</TableCell>
                      <TableCell>
                        <Chip
                          color={academicDegree.allows_multiple_subscriptions ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {academicDegree.allows_multiple_subscriptions
                            ? t("common.yes", "Yes")
                            : t("common.no", "No")}
                        </Chip>
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
                              key={`edit-${academicDegree.id}`}
                              startContent={<FiEdit />}
                              onPress={() => handleEditClick(academicDegree)}
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key={`delete-${academicDegree.id}`}
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(academicDegree)}
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
            )}
          </CardBody>
        </Card>

        <AcademicDegreeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          academicDegreeToEdit={academicDegreeToEdit}
        />

        <DeleteConfirmModal
          isLoading={deleteLoading}
          isOpen={deleteModalOpen}
          itemName={academicDegreeToDelete ? academicDegreeToDelete.name : ""}
          title={t("academicDegrees.delete", "Delete Academic Degree")}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />

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
    </DefaultLayout>
  );
}
