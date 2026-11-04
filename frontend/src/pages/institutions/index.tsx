import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Chip,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiHome,
  FiMoreVertical,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import institutionsApi from "@/api/institutionsApi";
import citiesApi from "@/api/citiesApi";
import branchesApi from "@/api/branchesApi";
import { Institution } from "@/models/institution";
import { PaginatedResponse } from "@/api/client";

const InstitutionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Institution | null>(null);

  // Filters State
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<any>(new Set([]));
  const [selectedCities, setSelectedCities] = useState<any>(new Set([]));
  const [ordering, setOrdering] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const branchRes = await branchesApi.getAll({ page_size: 100 });
        setBranches(branchRes.data.results || []);
        
        const cityRes = await citiesApi.getAll({ page_size: 100 });
        setCities(cityRes.data.results || []);
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      }
    };
    fetchFilterData();
  }, []);

  const fetchItems = async (page = 1, search = "", branch = "", city = "", ord = "name") => {
    try {
      setLoading(true);
      const params = {
        page,
        search: search || undefined,
        branch_ids: branch || undefined,
        city: city || undefined,
        ordering: ord || undefined,
        page_size: 10,
      };

      const response = await institutionsApi.getAll(params);
      const data: PaginatedResponse<Institution> = response.data;

      setItems(data.results);
      setTotalPages(data.last_page ?? Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), ordering);
  }, [currentPage, ordering, selectedBranches, selectedCities]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems(1, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), ordering);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedBranches(new Set([]));
    setSelectedCities(new Set([]));
    setOrdering("name");
    setCurrentPage(1);
    fetchItems(1, "", "", "", "name");
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await institutionsApi.delete(selectedItem.id);
      fetchItems(currentPage, searchTerm);
      onDeleteClose();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting institution:", error);
    }
  };

  const openDeleteModal = (item: Institution) => {
    setSelectedItem(item);
    onDeleteOpen();
  };

  if (loading && items.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner color="primary" label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen font-sans space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("institutions.title")}
            </h1>
            <p className="text-default-500 mt-1">
              {t("institutions.subtitle")}
            </p>
          </div>
          <Button
            as={Link}
            className="w-full md:w-auto rounded-2xl font-medium"
            color="primary"
            size="lg"
            startContent={<FiPlus />}
            to="/institutions/add"
            variant="shadow"
          >
            {t("institutions.add")}
          </Button>
        </div>

        {/* Search */}
        <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200">
          <div className="w-full">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="flex-1"
                classNames={{
                  inputWrapper:
                    "bg-default-100 hover:bg-default-200 focus-within:!bg-default-100 rounded-2xl h-12 shadow-none",
                  input: "text-base",
                }}
                placeholder={t("institutions.search")}
                startContent={
                  <FiSearch className="text-default-400" size={20} />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchItems(1, "", Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","));
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="flex gap-2">
                <Button
                  className="w-full md:w-auto h-12 rounded-2xl px-6 font-medium border border-default-200"
                  variant="flat"
                  startContent={<FiFilter />}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  {t("common.filters", "Filters")}
                </Button>
                <Button
                  className="w-full md:w-auto h-12 rounded-2xl px-8 font-medium shadow-md"
                  color="primary"
                  onPress={handleSearch}
                >
                  {t("common.search")}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-default-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t("institutions.filterBranch", "Branch")}
                    placeholder={t("institutions.selectBranch", "Select Branch")}
                    selectionMode="multiple"
                    selectedKeys={selectedBranches}
                    onSelectionChange={setSelectedBranches}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                  >
                    {branches.map((b) => (
                      <SelectItem key={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label={t("institutions.filterCity", "City")}
                    placeholder={t("institutions.selectCity", "Select City")}
                    selectionMode="multiple"
                    selectedKeys={selectedCities}
                    onSelectionChange={setSelectedCities}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                  >
                    {cities.map((c) => (
                      <SelectItem key={c.name}>{c.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label={t("common.sortBy", "Sort By")}
                    placeholder={t("common.sortBy", "Sort By")}
                    selectedKeys={[ordering]}
                    onSelectionChange={(keys) => {
                      setOrdering((Array.from(keys)[0] as string) || "name");
                      setCurrentPage(1);
                    }}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                  >
                    <SelectItem key="name">{t("institutions.sort.nameAsc", "Name (A-Z)")}</SelectItem>
                    <SelectItem key="-name">{t("institutions.sort.nameDesc", "Name (Z-A)")}</SelectItem>
                    <SelectItem key="created_at">{t("institutions.sort.oldest", "Oldest Added")}</SelectItem>
                    <SelectItem key="-created_at">{t("institutions.sort.newest", "Newest Added")}</SelectItem>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<FiRefreshCw />}
                    onPress={handleClearFilters}
                  >
                    {t("common.reset", "Reset")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-content1 rounded-[32px] p-12 text-center border border-default-200 dashed">
              <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4 text-default-400">
                <FiSearch size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("institutions.noData")}
              </h3>
              <p className="text-default-500">
                {t(
                  "common.tryAdjustingSearch",
                  "Try adjusting your search criteria",
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col md:flex-row items-center justify-between p-5 rounded-[24px] bg-content1 hover:bg-content2 transition-all duration-300 border border-transparent hover:border-default-200 hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/institutions/${item.id}`)}
                >
                  {/* Institution Info */}
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <Avatar
                      isBordered
                      className="w-16 h-16 text-large rounded-3xl shrink-0"
                      color={item.is_active ? "primary" : "default"}
                      icon={<FiHome />}
                      src={item.logo}
                    />

                    <div className="flex-1 min-w-0 text-left rtl:text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                          {item.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-default-500">
                        {item.email && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-default-300" />
                            {item.email}
                          </span>
                        )}
                        {item.phone && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-default-300" />
                            {item.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end pl-0 md:pl-4 border-t md:border-t-0 border-default-100 pt-4 md:pt-0" onClick={(e) => e.stopPropagation()}>
                    <Chip
                      className="capitalize border-none gap-1 rounded-xl"
                      color={item.is_active ? "success" : "default"}
                      size="md"
                      variant="flat"
                    >
                      {item.is_active
                        ? t("common.active")
                        : t("common.inactive")}
                    </Chip>

                    <div className="flex items-center gap-1">
                      <Button
                        as={Link}
                        className="rounded-xl font-medium hidden sm:flex"
                        color="primary"
                        size="md"
                        to={`/institutions/${item.id}`}
                        variant="light"
                      >
                        {t("common.view")}
                      </Button>

                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            className="rounded-xl text-default-400 data-[hover=true]:text-foreground"
                            variant="light"
                          >
                            <FiMoreVertical size={20} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Institution Actions"
                          variant="flat"
                        >
                          <DropdownItem
                            key="view"
                            className="sm:hidden"
                            startContent={<FiHome />}
                            onPress={() =>
                              window.location.assign(`/institutions/${item.id}`)
                            }
                          >
                            {t("common.view")}
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<FiEdit />}
                            onPress={() =>
                              window.location.assign(
                                `/institutions/${item.id}/edit`,
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
                            onPress={() => openDeleteModal(item)}
                          >
                            {t("common.delete")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center p-4">
            <Pagination
              showControls
              classNames={{
                wrapper: "gap-2 shadow-sm bg-content1 rounded-[20px] p-2",
                item: "w-10 h-10 text-small rounded-xl bg-transparent",
                cursor:
                  "bg-primary shadow-lg from-primary to-primary-600 rounded-xl font-bold",
              }}
              page={currentPage}
              radius="full"
              size="lg"
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}

        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>{t("institutions.delete")}</ModalHeader>
            <ModalBody>
              <p>
                {t("institutions.deleteConfirm")}{" "}
                <strong>
                  {selectedItem?.name || `Institution ${selectedItem?.id}`}
                </strong>
                ? {t("common.deleteWarning")}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
                {t("common.cancel")}
              </Button>
              <Button color="danger" onPress={handleDelete}>
                {t("common.delete")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default InstitutionsPage;
