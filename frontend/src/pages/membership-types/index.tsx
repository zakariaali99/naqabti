import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Spinner,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import { FiPlus, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import { membershipTypesApi } from "@/api/membershipTypesApi";
import { MembershipTypeModel } from "@/models/membershipTypes";
import { PaginatedResponse } from "@/api/client";

const MembershipTypesPage = () => {
  const { t } = useTranslation();
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeModel[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MembershipTypeModel | null>(
    null,
  );

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [ordering, setOrdering] = useState("name");

  const fetchMembershipTypes = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = {
        page,
        ordering,
        search: search || undefined,
        is_active: undefined, // Show all by default
      };

      const response = await membershipTypesApi.getAll(params);
      const data: PaginatedResponse<MembershipTypeModel> = response.data;

      setMembershipTypes(data.results);
      setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error("Error fetching membership types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipTypes(currentPage, searchTerm);
  }, [currentPage, ordering]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembershipTypes(1, searchTerm);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await membershipTypesApi.delete(selectedItem.id);
      fetchMembershipTypes(currentPage, searchTerm);
      onDeleteClose();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting membership type:", error);
    }
  };

  const openDeleteModal = (item: MembershipTypeModel) => {
    setSelectedItem(item);
    onDeleteOpen();
  };

  if (loading && membershipTypes.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner label={t("membershipTypes.ui.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {t("membershipTypes.title")}
              </h1>
              <p className="text-default-500">
                {t("membershipTypes.subtitle")}
              </p>
            </div>
            <Button
              as={Link}
              color="primary"
              startContent={<FiPlus />}
              to="/membership-types/add"
            >
              {t("membershipTypes.actions.add")}
            </Button>
          </CardHeader>

          <CardBody>
            <div className="flex gap-4 mb-6">
              <Input
                className="flex-1"
                placeholder={t("membershipTypes.search.placeholder")}
                startContent={<FiSearch />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              <Button color="primary" onPress={handleSearch}>
                {t("membershipTypes.actions.search")}
              </Button>
            </div>

            <Table aria-label="Membership types table">
              <TableHeader>
                <TableColumn>{t("membershipTypes.table.name")}</TableColumn>
                <TableColumn>
                  {t("membershipTypes.table.description")}
                </TableColumn>
                <TableColumn>{t("membershipTypes.table.duration")}</TableColumn>
                <TableColumn>{t("membershipTypes.table.price")}</TableColumn>
                <TableColumn>{t("membershipTypes.table.academicDegree")}</TableColumn>
                <TableColumn>{t("membershipTypes.table.status")}</TableColumn>
                <TableColumn>{t("membershipTypes.table.actions")}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={t("membershipTypes.table.empty")}>
                {membershipTypes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell>{item.duration_months}</TableCell>
                    <TableCell>
                      {parseFloat(item.price).toFixed(2)} LYD
                    </TableCell>
                    <TableCell>
                      {item.academic_degree_name || t("membershipTypes.allDegrees")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={item.is_active ? "success" : "default"}
                        variant="flat"
                      >
                        {item.is_active
                          ? t("membershipTypes.status.active")
                          : t("membershipTypes.status.inactive")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          as={Link}
                          color="primary"
                          size="sm"
                          startContent={<FiEdit />}
                          to={`/membership-types/${item.id}/edit`}
                          variant="light"
                        >
                          {t("membershipTypes.actions.edit")}
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          startContent={<FiTrash2 />}
                          variant="light"
                          onPress={() => openDeleteModal(item)}
                        >
                          {t("membershipTypes.actions.delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  showControls
                  page={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>{t("membershipTypes.delete.title")}</ModalHeader>
            <ModalBody>
              <p>
                {t("membershipTypes.delete.message")}{" "}
                <strong>{selectedItem?.name}</strong>?{" "}
                {t("membershipTypes.delete.warning")}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
                {t("membershipTypes.actions.cancel")}
              </Button>
              <Button color="danger" onPress={handleDelete}>
                {t("membershipTypes.actions.delete")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default MembershipTypesPage;
