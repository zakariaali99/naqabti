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
  FiUser,
  FiMoreVertical,
  FiMail,
  FiCheck,
  FiX,
  FiBook,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import AuthAPI from "@/api/auth";
import citiesApi from "@/api/citiesApi";
import branchesApi from "@/api/branchesApi";
import { UserEntity } from "@/models/users";
import { PaginatedResponse } from "@/api/client";

const StudentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<UserEntity | null>(null);

  // Filters State
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<any>(new Set([]));
  const [selectedCities, setSelectedCities] = useState<any>(new Set([]));
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [ordering, setOrdering] = useState("-created_at");
  const [showFilters, setShowFilters] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isVerificationModalOpen,
    onOpen: onVerificationModalOpen,
    onClose: onVerificationModalClose,
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

  const fetchStudents = async (page = 1, search = "", branch = "", city = "", grad = "", ord = "-created_at") => {
    try {
      setLoading(true);
      const params = {
        page,
        search: search || undefined,
        user_type: "student", // Filter only students
        branch_ids: branch || undefined,
        city: city || undefined,
        graduation_year: grad || undefined,
        ordering: ord || undefined,
        page_size: 10,
      };

      const response = await usersApi.getAll(params);
      const data: PaginatedResponse<UserEntity> = response.data;

      setStudents(data.results);
      setTotalPages(data.last_page ?? Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(currentPage, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), graduationYear, ordering);
  }, [currentPage, ordering, selectedBranches, selectedCities]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStudents(1, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), graduationYear, ordering);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedBranches(new Set([]));
    setSelectedCities(new Set([]));
    setGraduationYear("");
    setOrdering("-created_at");
    setCurrentPage(1);
    fetchStudents(1, "", "", "", "", "-created_at");
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await usersApi.delete(selectedItem.id);
      fetchStudents(currentPage, searchTerm);
      onDeleteClose();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const openDeleteModal = (item: UserEntity) => {
    setSelectedItem(item);
    onDeleteOpen();
  };

  const handleResendVerification = async (student: UserEntity) => {
    onVerificationModalOpen();
    try {
      await AuthAPI.resendVerification({ user_id: student.id });
      onVerificationModalClose();
      toast.success(
        t("common.codeSent", "Verification code sent successfully"),
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      onVerificationModalClose();
      toast.error(
        t("common.resendFailed", "Failed to resend verification code"),
      );
    }
  };

  const handleManualVerification = async (student: UserEntity) => {
    try {
      await usersApi.verifyEmail(student.id);
      toast.success(
        t("common.verifiedSuccessfully", "Email verified successfully"),
      );
      fetchStudents(currentPage, searchTerm);
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    }
  };

  if (loading && students.length === 0) {
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
              {t("students.title")}
            </h1>
            <p className="text-default-500 mt-1">{t("students.subtitle")}</p>
          </div>
          <Button
            as={Link}
            className="w-full md:w-auto rounded-2xl font-medium"
            color="primary"
            size="lg"
            startContent={<FiPlus />}
            to="/students/add"
            variant="shadow"
          >
            {t("students.add")}
          </Button>
        </div>

        {/* Search Bar */}
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
                placeholder={t("students.search")}
                startContent={
                  <FiSearch className="text-default-400" size={20} />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchStudents(1, "", Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), graduationYear);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Select
                    label={t("students.filterBranch", "Branch")}
                    placeholder={t("students.selectBranch", "Select Branch")}
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
                    label={t("students.filterCity", "City")}
                    placeholder={t("students.selectCity", "Select City")}
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

                  <Input
                    label={t("students.filterGraduationYear", "Graduation Year")}
                    placeholder={t("students.enterGraduationYear", "Enter year")}
                    value={graduationYear}
                    onValueChange={setGraduationYear}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                    type="number"
                  />

                  <Select
                    label={t("common.sortBy", "Sort By")}
                    placeholder={t("common.sortBy", "Sort By")}
                    selectedKeys={[ordering]}
                    onSelectionChange={(keys) => {
                      setOrdering((Array.from(keys)[0] as string) || "-created_at");
                      setCurrentPage(1);
                    }}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                  >
                    <SelectItem key="-created_at">{t("users.sort.newest", "Newest Joined")}</SelectItem>
                    <SelectItem key="created_at">{t("users.sort.oldest", "Oldest Joined")}</SelectItem>
                    <SelectItem key="full_name">{t("users.sort.nameAsc", "Name (A-Z)")}</SelectItem>
                    <SelectItem key="-full_name">{t("users.sort.nameDesc", "Name (Z-A)")}</SelectItem>
                    <SelectItem key="graduation_year">{t("users.sort.gradAsc", "Graduation Year (Asc)")}</SelectItem>
                    <SelectItem key="-graduation_year">{t("users.sort.gradDesc", "Graduation Year (Desc)")}</SelectItem>
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

        {/* Students List */}
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="bg-content1 rounded-[32px] p-12 text-center border border-default-200 dashed">
              <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4 text-default-400">
                <FiSearch size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("students.noData")}
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
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`group relative flex flex-col md:flex-row items-center justify-between p-5 rounded-[24px] bg-content1 hover:bg-content2 transition-all duration-300 border border-transparent hover:border-default-200 hover:shadow-md ${!student.is_active ? "border-danger-200 bg-danger-50/10" : ""} cursor-pointer`}
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <Avatar
                      isBordered
                      className="w-16 h-16 text-large rounded-3xl shrink-0"
                      color={student.is_active ? "primary" : "danger"}
                      icon={<FiUser />}
                      src={student.profile_image}
                    />

                    <div className="flex-1 min-w-0 text-left rtl:text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                          {student.first_name_field && student.family_name
                            ? `${student.first_name_field} ${student.father_name || ""} ${student.grandfather_name || ""} ${student.family_name}`.trim()
                            : student.full_name || student.username}
                        </h3>
                      </div>

                      {/* English name if available */}
                      {student.first_name_en && student.family_name_en && (
                        <p className="text-sm text-default-400 mb-1">
                          {`${student.first_name_en} ${student.father_name_en || ""} ${student.grandfather_name_en || ""} ${student.family_name_en}`.trim()}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-default-500">
                        {(student.university_name ||
                          student.graduation_year) && (
                          <span className="flex items-center gap-1.5 font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-lg">
                            <FiBook size={14} />
                            {student.university_name}{" "}
                            {student.graduation_year
                              ? `(${student.graduation_year})`
                              : ""}
                          </span>
                        )}

                        {student.gender && (
                          <span className="flex items-center gap-1.5 font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-lg">
                            {student.gender === "male"
                              ? t("users.genders.male", "Male")
                              : t("users.genders.female", "Female")}
                          </span>
                        )}

                        {student.email && (
                          <>
                            <span className="hidden md:block w-1 h-1 rounded-full bg-default-300" />
                            <span className="flex items-center gap-1.5">
                              {student.email}
                              {student.email_verified ? (
                                <FiCheck className="text-success" size={14} />
                              ) : (
                                <FiX
                                  className="text-warning"
                                  size={14}
                                  title="Unverified"
                                />
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Branches display */}
                      {student.branches && student.branches.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {student.branches.map((branch) => (
                            <Chip
                              key={branch.id}
                              className="h-5 bg-default-100 text-xs"
                              size="sm"
                              variant="flat"
                            >
                              {branch.name}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end pl-0 md:pl-4 border-t md:border-t-0 border-default-100 pt-4 md:pt-0" onClick={(e) => e.stopPropagation()}>
                    <Chip
                      className="capitalize border-none gap-1 rounded-xl"
                      color={student.is_active ? "success" : "default"}
                      size="md"
                      variant="flat"
                    >
                      {student.is_active
                        ? t("common.active")
                        : t("common.inactive")}
                    </Chip>

                    <div className="flex items-center gap-1">
                      <Button
                        as={Link}
                        className="rounded-xl font-medium hidden sm:flex"
                        color="primary"
                        size="md"
                        to={`/students/${student.id}`}
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
                          aria-label="Student Actions"
                          variant="flat"
                        >
                          <DropdownItem
                            key="view"
                            className="sm:hidden"
                            startContent={<FiUser />}
                            onPress={() => navigate(`/students/${student.id}`)}
                          >
                            {t("common.view")}
                          </DropdownItem>

                          <DropdownItem
                            key="edit"
                            startContent={<FiEdit />}
                            onPress={() =>
                              navigate(`/students/${student.id}/edit`)
                            }
                          >
                            {t("common.edit")}
                          </DropdownItem>

                          {!student.email_verified ? (
                            <DropdownItem
                              key="resend-verification"
                              startContent={<FiMail />}
                              onPress={() => handleResendVerification(student)}
                            >
                              {t(
                                "common.resendVerification",
                                "Resend Verification",
                              )}
                            </DropdownItem>
                          ) : null}

                          {!student.email_verified ? (
                            <DropdownItem
                              key="verify-manual"
                              className="text-success"
                              color="success"
                              startContent={<FiCheck />}
                              onPress={() => handleManualVerification(student)}
                            >
                              {t("common.verifyManually", "Verify Manually")}
                            </DropdownItem>
                          ) : null}

                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<FiTrash2 />}
                            onPress={() => openDeleteModal(student)}
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
            <ModalHeader>{t("students.delete")}</ModalHeader>
            <ModalBody>
              <p>
                {t("students.deleteConfirm")}{" "}
                <strong>
                  {selectedItem?.full_name ||
                    selectedItem?.username ||
                    `Student ${selectedItem?.id}`}
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

        {/* Verification Modal */}
        <Modal
          hideCloseButton
          isDismissable={false}
          isOpen={isVerificationModalOpen}
        >
          <ModalContent>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-center">
                  {t(
                    "common.sendingVerification",
                    "Sending verification code...",
                  )}
                </p>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        <Toaster position="top-right" />
      </div>
    </DefaultLayout>
  );
};

export default StudentsPage;
