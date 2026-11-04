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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@heroui/react";
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import nationalitiesApi from "@/api/nationalitiesApi";
import { Nationality } from "@/models/nationality";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Pagination } from "@/components/Pagination";
import NationalityModal from "./NationalityModal";

export default function NationalitiesListPage() {
  const { t } = useTranslation();

  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nationalityToEdit, setNationalityToEdit] = useState<Nationality | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nationalityToDelete, setNationalityToDelete] = useState<Nationality | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  const fetchNationalities = async (page = 1) => {
    try {
      setLoading(true);
      const res = await nationalitiesApi.getAll({ page, page_size: pageSize, ordering });
      setNationalities(res.data.results || []);
      setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
    } catch (err) {
      console.error("Failed to fetch nationalities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNationalities(currentPage);
  }, [currentPage, ordering]);

  const handleAddClick = () => {
    setNationalityToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (nationality: Nationality) => {
    setNationalityToEdit(nationality);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchNationalities(currentPage);
  };

  const handleDeleteClick = (nationality: Nationality) => {
    setNationalityToDelete(nationality);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!nationalityToDelete) return;
    try {
      setDeleteLoading(true);
      await nationalitiesApi.delete(nationalityToDelete.id);
      setDeleteModalOpen(false);
      setNationalityToDelete(null);
      fetchNationalities(currentPage);
    } catch (err) {
      console.error("Failed to delete nationality", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t("nationalities.title", "Nationalities")}</h1>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              startContent={<FiPlus />}
              onPress={handleAddClick}
            >
              {t("nationalities.add", "Add Nationality")}
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
                  <TableColumn>{t("nationalities.table.name", "Name")}</TableColumn>
                  <TableColumn>{t("nationalities.table.code", "ISO Code")}</TableColumn>
                  <TableColumn>{t("nationalities.table.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t("nationalities.noRecords", "No nationalities found")}
                >
                  {nationalities.map((nationality) => (
                    <TableRow key={nationality.id}>
                      <TableCell>{nationality.name}</TableCell>
                      <TableCell>{nationality.code || "-"}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <FiMoreVertical />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key={`edit-${nationality.id}`}
                              startContent={<FiEdit />}
                              onPress={() => handleEditClick(nationality)}
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key={`delete-${nationality.id}`}
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(nationality)}
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

        <NationalityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          nationalityToEdit={nationalityToEdit}
        />

        <DeleteConfirmModal
          isLoading={deleteLoading}
          isOpen={deleteModalOpen}
          itemName={nationalityToDelete ? nationalityToDelete.name : ""}
          title={t("nationalities.delete", "Delete Nationality")}
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
