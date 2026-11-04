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
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import { DoctorSpecialty } from "@/models/doctorSpecialty";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Pagination } from "@/components/Pagination";
import DoctorSpecialtyModal from "./DoctorSpecialtyModal";

export default function DoctorSpecialtiesListPage() {
  const { t } = useTranslation();

  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<DoctorSpecialty | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<DoctorSpecialty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  const fetchSpecialties = async (page = 1) => {
    try {
      setLoading(true);
      const res = await doctorSpecialtyApi.getAll({ page, page_size: pageSize, ordering });
      setSpecialties(res.data.results || []);
      setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
    } catch (err) {
      console.error("Failed to fetch specialties", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties(currentPage);
  }, [currentPage, ordering]);

  const handleAddClick = () => {
    setSpecialtyToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (specialty: DoctorSpecialty) => {
    setSpecialtyToEdit(specialty);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchSpecialties(currentPage);
  };

  const handleDeleteClick = (specialty: DoctorSpecialty) => {
    setSpecialtyToDelete(specialty);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!specialtyToDelete) return;
    try {
      setDeleteLoading(true);
      await doctorSpecialtyApi.delete(specialtyToDelete.id);
      setDeleteModalOpen(false);
      setSpecialtyToDelete(null);
      fetchSpecialties(currentPage);
    } catch (err) {
      console.error("Failed to delete specialty", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t("doctorSpecialties.title", "Doctor Specialties")}</h1>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              startContent={<FiPlus />}
              onPress={handleAddClick}
            >
              {t("doctorSpecialties.add", "Add Specialty")}
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
                  <TableColumn>{t("doctorSpecialties.table.name", "Name")}</TableColumn>
                  <TableColumn>{t("doctorSpecialties.table.status", "Status")}</TableColumn>
                  <TableColumn>{t("doctorSpecialties.table.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t("doctorSpecialties.noRecords", "No specialties found")}
                >
                  {specialties.map((specialty) => (
                    <TableRow key={specialty.id}>
                      <TableCell>{specialty.name}</TableCell>
                      <TableCell>
                        <Chip
                          color={specialty.is_active ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {specialty.is_active
                            ? t("common.active", "Active")
                            : t("common.inactive", "Inactive")}
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
                              key={`edit-${specialty.id}`}
                              startContent={<FiEdit />}
                              onPress={() => handleEditClick(specialty)}
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key={`delete-${specialty.id}`}
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(specialty)}
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

        <DoctorSpecialtyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          specialtyToEdit={specialtyToEdit}
        />

        <DeleteConfirmModal
          isLoading={deleteLoading}
          isOpen={deleteModalOpen}
          itemName={specialtyToDelete ? specialtyToDelete.name : ""}
          title={t("doctorSpecialties.delete", "Delete Specialty")}
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
