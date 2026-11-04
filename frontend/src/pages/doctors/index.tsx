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
  Tooltip,
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
  FiX, FiSend,
  FiFilter,
  FiRefreshCw,
  FiRotateCcw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import AuthAPI from "@/api/auth";
import citiesApi from "@/api/citiesApi";
import branchesApi from "@/api/branchesApi";
import { UserEntity } from "@/models/users";
import { PaginatedResponse } from "@/api/client";
import {
  calculateProfileCompletion,
  profileCompletionValuesFromUser,
} from "@/utils/profileCompletion";

const getCompletionColor = (percentage: number) =>
  percentage >= 80 ? "success" : percentage >= 50 ? "warning" : "danger";

/** Status-filter value that lists accounts waiting for staff to erase them. */
const DELETION_FILTER = "deletion_requested";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const daysUntilDeletion = (doctor: UserEntity) =>
  doctor.deletion_due_at
    ? Math.ceil((new Date(doctor.deletion_due_at).getTime() - Date.now()) / MS_PER_DAY)
    : 0;

const isDeletionDue = (doctor: UserEntity) => daysUntilDeletion(doctor) <= 0;

const DeletionChip = ({ doctor }: { doctor: UserEntity }) => {
  const { t } = useTranslation();
  const due = isDeletionDue(doctor);

  return (
    <Chip
      className="border-none gap-1 rounded-xl"
      color={due ? "danger" : "warning"}
      size="md"
      variant="flat"
    >
      {due
        ? t("doctors.deletion.due")
        : t("doctors.deletion.daysLeft", { count: daysUntilDeletion(doctor) })}
    </Chip>
  );
};

const DoctorsPage = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<UserEntity | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Filters State
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<any>(new Set([]));
  const [selectedCities, setSelectedCities] = useState<any>(new Set([]));
  const [specialty, setSpecialty] = useState<string>("");
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

  const fetchDoctors = async (
    page = 1,
    search = "",
    branch = "",
    city = "",
    spec = "",
    grad = "",
    ord = "-created_at",
    approvalStatus = statusFilter,
  ) => {
    try {
      setLoading(true);
      const params = {
        page,
        search: search || undefined,
        user_type: "doctor", // Filter only doctors
        branch_ids: branch || undefined,
        city: city || undefined,
        specialty: spec || undefined,
        graduation_year: grad || undefined,
        ordering: ord || undefined,
        // "deletion_requested" is a pseudo status: accounts awaiting erasure
        approval_status:
          approvalStatus && approvalStatus !== DELETION_FILTER
            ? approvalStatus
            : undefined,
        deletion_requested:
          approvalStatus === DELETION_FILTER ? true : undefined,
        page_size: 10,
      };

      const response = await usersApi.getAll(params);
      const data: PaginatedResponse<UserEntity> = response.data;

      setDoctors(data.results);
      setTotalPages(data.last_page ?? Math.ceil(data.count / 10)); // 10 items per page
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(currentPage, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), specialty, graduationYear, ordering);
  }, [currentPage, ordering, selectedBranches, selectedCities]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDoctors(1, searchTerm, Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), specialty, graduationYear, ordering);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedBranches(new Set([]));
    setSelectedCities(new Set([]));
    setSpecialty("");
    setGraduationYear("");
    setOrdering("-created_at");
    setStatusFilter("");
    setCurrentPage(1);
    fetchDoctors(1, "", "", "", "", "", "-created_at", "");
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchDoctors(
      1,
      searchTerm,
      Array.from(selectedBranches).join(","),
      Array.from(selectedCities).join(","),
      specialty,
      graduationYear,
      ordering,
      value,
    );
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await usersApi.delete(selectedItem.id);
      fetchDoctors(currentPage, searchTerm);
      onDeleteClose();
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  };

  const handleCancelDeletion = async (doctor: UserEntity) => {
    try {
      await usersApi.cancelDeletion(doctor.id);
      toast.success(t("doctors.deletion.cancelSuccess"));
      fetchDoctors(currentPage, searchTerm);
    } catch (error) {
      console.error("Error cancelling deletion request:", error);
      toast.error(t("doctors.deletion.cancelError"));
    }
  };

  const openDeleteModal = (item: UserEntity) => {
    setSelectedItem(item);
    onDeleteOpen();
  };

  const handleResendVerification = async (doctor: UserEntity) => {
    onVerificationModalOpen();
    try {
      await AuthAPI.resendVerification({ user_id: doctor.id });
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

  const handleManualVerification = async (doctor: UserEntity) => {
    try {
      await usersApi.verifyEmail(doctor.id);
      toast.success(
        t("common.verifiedSuccessfully", "Email verified successfully"),
      );
      fetchDoctors(currentPage, searchTerm);
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    }
  };

  const handleApprove = async (doctor: UserEntity) => {
    setApprovingId(doctor.id);
    try {
      await usersApi.approveDoctor(doctor.id);
      toast.success(t("doctors.approveSuccess"));
      fetchDoctors(currentPage, searchTerm);
    } catch (error: any) {
      console.error("Error approving doctor:", error);
      toast.error(error?.response?.data?.detail || t("doctors.approveError"));
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (doctor: UserEntity) => {
    setRejectingId(doctor.id);
    try {
      await usersApi.rejectDoctor(doctor.id);
      toast.success(t("doctors.rejectSuccess"));
      fetchDoctors(currentPage, searchTerm);
    } catch (error: any) {
      console.error("Error rejecting doctor:", error);
      toast.error(error?.response?.data?.detail || t("doctors.rejectError"));
    } finally {
      setRejectingId(null);
    }
  };

  if (loading && doctors.length === 0) {
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
              {t("doctors.title")}
            </h1>
            <p className="text-default-500 mt-1">{t("doctors.subtitle")}</p>
          </div>
          <Button
            as={Link}
            className="w-full md:w-auto rounded-2xl font-medium"
            color="primary"
            size="lg"
            startContent={<FiPlus />}
            to="/doctors/add"
            variant="shadow"
          >
            {t("doctors.add")}
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
                placeholder={t("doctors.search")}
                data-testid="doctors-search"
                startContent={
                  <FiSearch className="text-default-400" size={20} />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchDoctors(1, "", Array.from(selectedBranches).join(","), Array.from(selectedCities).join(","), specialty, graduationYear);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Select
                className="w-full md:w-56"
                classNames={{
                  trigger: "bg-default-100 rounded-2xl h-12 shadow-none",
                }}
                placeholder={t("doctors.approvalStatus")}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <SelectItem key="">{t("common.all", "All")}</SelectItem>
                <SelectItem key="pending">{t("doctors.status.pending")}</SelectItem>
                <SelectItem key="approved">{t("doctors.status.approved")}</SelectItem>
                <SelectItem key="rejected">{t("doctors.status.rejected")}</SelectItem>
                <SelectItem key={DELETION_FILTER}>{t("doctors.deletion.filter")}</SelectItem>
              </Select>
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
                  data-testid="doctors-search-submit"
                  onPress={handleSearch}
                >
                  {t("common.search")}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-default-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Select
                    label={t("doctors.filterBranch", "Branch")}
                    placeholder={t("doctors.selectBranch", "Select Branch")}
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
                    label={t("doctors.filterCity", "City")}
                    placeholder={t("doctors.selectCity", "Select City")}
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
                    label={t("doctors.filterSpecialty", "Specialty")}
                    placeholder={t("doctors.enterSpecialty", "Enter specialty")}
                    value={specialty}
                    onValueChange={setSpecialty}
                    size="sm"
                    variant="flat"
                    className="rounded-xl"
                  />

                  <Input
                    label={t("doctors.filterGraduationYear", "Graduation Year")}
                    placeholder={t("doctors.enterGraduationYear", "Enter year")}
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

        {/* Doctors List */}
        <div className="space-y-4">
          {doctors.length === 0 ? (
            <div className="bg-content1 rounded-[32px] p-12 text-center border border-default-200 dashed">
              <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4 text-default-400">
                <FiSearch size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("doctors.noData")}
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
              {doctors.map((doctor) => {
                const completion = calculateProfileCompletion(
                  profileCompletionValuesFromUser(doctor),
                  doctor.user_type === "doctor",
                );

                return (
                <div
                  key={doctor.id}
                  className={`group relative flex flex-col md:flex-row items-center justify-between p-5 rounded-[24px] bg-content1 hover:bg-content2 transition-all duration-300 border ${!doctor.is_active ? "border-danger-200 bg-danger-50/30" : "border-transparent"} hover:border-default-200 hover:shadow-md cursor-pointer`}
                  data-testid={`doctor-row-${doctor.id}`}
                  onClick={() => (window.location.href = `/doctors/${doctor.id}`)}
                >
                  {/* Doctor Info */}
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <Avatar
                      isBordered
                      className="w-16 h-16 text-large rounded-3xl shrink-0"
                      color={doctor.is_active ? "primary" : "danger"}
                      icon={<FiUser />}
                      src={doctor.profile_image}
                    />

                    <div className="flex-1 min-w-0 text-left rtl:text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                          {doctor.first_name_field && doctor.family_name
                            ? `${doctor.first_name_field} ${doctor.father_name || ""} ${doctor.grandfather_name || ""} ${doctor.family_name}`.trim()
                            : doctor.full_name || doctor.username}
                        </h3>
                        {doctor.full_doctor_number && (
                          <Chip className="h-5" size="sm" variant="flat">
                            {doctor.full_doctor_number}
                          </Chip>
                        )}
                      </div>

                      {/* English name if available */}
                      {doctor.first_name_en && doctor.family_name_en && (
                        <p className="text-sm text-default-400 mb-1">
                          {`${doctor.first_name_en} ${doctor.father_name_en || ""} ${doctor.grandfather_name_en || ""} ${doctor.family_name_en}`.trim()}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-default-500">
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                          {doctor.specialty}
                        </span>
                        {doctor.gender && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-default-300" />
                            <span>
                              {doctor.gender === "male"
                                ? t("users.genders.male", "Male")
                                : t("users.genders.female", "Female")}
                            </span>
                          </>
                        )}
                        {doctor.email && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-default-300" />
                            <span className="flex items-center gap-1.5">
                              {doctor.email}
                              {doctor.email_verified ? (
                                <FiCheck className="text-success" />
                              ) : (
                                <FiX
                                  className="text-warning"
                                  title="Unverified"
                                />
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Branches display */}
                      {doctor.branches && doctor.branches.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {doctor.branches.map((branch) => (
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
                    <div className="flex items-center gap-2">
                      <Tooltip content={t("member.profileCompletion")}>
                        <Chip
                          className="border-none gap-1 rounded-xl font-semibold"
                          color={getCompletionColor(completion.percentage)}
                          size="md"
                          variant="flat"
                        >
                          {completion.percentage}%
                        </Chip>
                      </Tooltip>
                      {doctor.deletion_requested_at && (
                        <DeletionChip doctor={doctor} />
                      )}
                      {doctor.approval_status && doctor.approval_status !== "approved" && (
                        <Chip
                          className="capitalize border-none gap-1 rounded-xl"
                          color={doctor.approval_status === "pending" ? "warning" : "danger"}
                          size="md"
                          variant="flat"
                        >
                          {t(`doctors.status.${doctor.approval_status}`)}
                        </Chip>
                      )}
                      <Chip
                        className="capitalize border-none gap-1 rounded-xl"
                        color={doctor.is_active ? "success" : "danger"}
                        size="md"
                        variant="flat"
                      >
                        {doctor.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </Chip>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        as={Link}
                        className="rounded-xl font-medium hidden sm:flex"
                        color="primary"
                        size="md"
                        to={`/doctors/${doctor.id}`}
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
                          aria-label="Doctor Actions"
                          variant="flat"
                        >
                          <DropdownItem
                            key="view"
                            className="sm:hidden"
                            startContent={<FiUser />}
                            onPress={() =>
                              window.location.assign(`/doctors/${doctor.id}`)
                            }
                          >
                            {t("common.view")}
                          </DropdownItem>

                          <DropdownItem
                            key="edit"
                            startContent={<FiEdit />}
                            onPress={() =>
                              window.location.assign(
                                `/doctors/${doctor.id}/edit`,
                              )
                            }
                          >
                            {t("common.edit")}
                          </DropdownItem>
                                        
                                        <DropdownItem
                                            key="send-notification"
                                            startContent={<FiSend className="text-primary" />}
                                            onPress={() => window.location.assign(`/notifications/send?userId=${doctor.id}`)}
                                        >
                                            {t('notifications.sendSingle', 'Send Notification')}
                                        </DropdownItem>

                          {!doctor.email_verified ? (
                            <DropdownItem
                              key="resend-verification"
                              startContent={<FiMail />}
                              onPress={() => handleResendVerification(doctor)}
                            >
                              {t(
                                "common.resendVerification",
                                "Resend Verification",
                              )}
                            </DropdownItem>
                          ) : null}

                          {!doctor.email_verified ? (
                            <DropdownItem
                              key="verify-manual"
                              className="text-success"
                              color="success"
                              startContent={<FiCheck />}
                              onPress={() => handleManualVerification(doctor)}
                            >
                              {t("common.verifyManually", "Verify Manually")}
                            </DropdownItem>
                          ) : null}

                          {doctor.approval_status === "pending" ? (
                            <DropdownItem
                              key="approve"
                              className="text-success"
                              color="success"
                              isDisabled={approvingId === doctor.id || !doctor.branches?.length}
                              startContent={<FiCheck />}
                              onPress={() => handleApprove(doctor)}
                            >
                              {t("doctors.approveDoctor")}
                            </DropdownItem>
                          ) : null}

                          {doctor.approval_status === "pending" ? (
                            <DropdownItem
                              key="reject"
                              className="text-danger"
                              color="danger"
                              isDisabled={rejectingId === doctor.id}
                              startContent={<FiX />}
                              onPress={() => handleReject(doctor)}
                            >
                              {t("doctors.rejectDoctor")}
                            </DropdownItem>
                          ) : null}

                          {doctor.deletion_requested_at ? (
                            <DropdownItem
                              key="cancel-deletion"
                              startContent={<FiRotateCcw />}
                              onPress={() => handleCancelDeletion(doctor)}
                            >
                              {t("doctors.deletion.cancel")}
                            </DropdownItem>
                          ) : null}

                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<FiTrash2 />}
                            onPress={() => openDeleteModal(doctor)}
                          >
                            {doctor.deletion_requested_at
                              ? t("doctors.deletion.finalDelete")
                              : t("common.delete")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
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

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            <ModalHeader>{t("doctors.delete")}</ModalHeader>
            <ModalBody>
              <p>
                {t("doctors.deleteConfirm")}{" "}
                <strong>
                  {selectedItem?.full_name ||
                    selectedItem?.username ||
                    `Doctor ${selectedItem?.id}`}
                </strong>
                ? {t("common.deleteWarning")}
              </p>
              <p className="text-sm text-default-500">
                {t("doctors.deletion.finalDeleteWarning")}
              </p>
              {selectedItem?.deletion_requested_at &&
                !isDeletionDue(selectedItem) && (
                  <p className="text-sm text-warning-600">
                    {t("doctors.deletion.earlyWarning")}
                  </p>
                )}
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

export default DoctorsPage;
