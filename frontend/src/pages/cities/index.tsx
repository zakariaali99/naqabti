import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import citiesApi from "@/api/citiesApi";
import { City } from "@/models/city";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Pagination } from "@/components/Pagination";

export default function CitiesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  const fetchCities = async (page = 1) => {
    try {
      setLoading(true);
      const res = await citiesApi.getAll({ page, page_size: pageSize, ordering });

      setCities(res.data.results);
      setTotalPages(Math.ceil(res.data.count / pageSize));
    } catch (err) {
      console.error("Failed to fetch cities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities(currentPage);
  }, [currentPage, ordering]);

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cityToDelete) return;
    try {
      setDeleteLoading(true);
      await citiesApi.delete(cityToDelete.id);
      setDeleteModalOpen(false);
      setCityToDelete(null);
      fetchCities();
    } catch (err) {
      console.error("Failed to delete city", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{t("cities.title", "Cities")}</h1>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              startContent={<FiPlus />}
              onPress={() => navigate("/cities/add")}
            >
              {t("cities.add", "Add City")}
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
                  <TableColumn>{t("cities.table.name", "Name")}</TableColumn>
                  <TableColumn>
                    {t("cities.table.region", "Region")}
                  </TableColumn>
                  <TableColumn>
                    {t("cities.table.prefix", "Prefix")}
                  </TableColumn>
                  <TableColumn>
                    {t("cities.table.actions", "Actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t("cities.noRecords", "No cities found")}
                >
                  {cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell>{city.name}</TableCell>
                      <TableCell>{city.region}</TableCell>
                      <TableCell>{city.prefix}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <FiMoreVertical />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key={`edit-${city.id}`}
                              startContent={<FiEdit />}
                              onPress={() =>
                                navigate(`/cities/${city.id}/edit`)
                              }
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key={`delete-${city.id}`}
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(city)}
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

        <DeleteConfirmModal
          isLoading={deleteLoading}
          isOpen={deleteModalOpen}
          itemName={cityToDelete ? cityToDelete.name : ""}
          title={t("cities.delete", "Delete City")}
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
