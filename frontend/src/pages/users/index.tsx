import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
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
  Modal,
  ModalContent,
  ModalBody,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiFilter,
  FiUser,
  FiUserCheck,
  FiEye,
  FiMail,
  FiCheck,
  FiX,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import usersApi from "@/api/usersApi";
import AuthAPI from "@/api/auth";
import { UserEntity } from "@/models/users";
import { formatDate } from "@/misc/formatDate";

export default function UsersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserEntity | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  // pending filter selections (applied when user clicks Apply)
  const [pendingStatus, setPendingStatus] = useState("all");
  const [pendingRole, setPendingRole] = useState("all");
  // date joined filters (applied)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // pending date selections
  const [pendingFromDate, setPendingFromDate] = useState("");
  const [pendingToDate, setPendingToDate] = useState("");

  const pageSize = 10;
  const [ordering, setOrdering] = useState("-created_at");

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery,
        page: currentPage,
        page_size: pageSize,
        ordering: ordering,
      };

      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;

      if (
        ["doctor", "manager", "student", "institution"].includes(roleFilter)
      ) {
        params.user_type = roleFilter;
      }

      // date joined filters
      if (fromDate) params.date_joined_after = fromDate;
      if (toDate) params.date_joined_before = toDate;

      const response = await usersApi.getAll(params);

      setUsers(response.data.results);
      setTotalCount(response.data.count);
      // prefer backend-provided last_page if available
      setTotalPages(
        response.data.last_page ?? Math.ceil(response.data.count / pageSize),
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [
    currentPage,
    searchQuery,
    statusFilter,
    roleFilter,
    fromDate,
    toDate,
    ordering,
  ]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle delete
  const handleDeleteClick = (user: UserEntity) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      await usersApi.delete(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (user: UserEntity) => {
    try {
      setToggleLoadingId(user.id);
      await usersApi.toggleActive(user.id);
      // refresh list after toggle
      await fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter("");
    setRoleFilter("");
    setPendingStatus("all");
    setPendingRole("all");
    setFromDate("");
    setToDate("");
    setPendingFromDate("");
    setPendingToDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Get role display
  const getUserRole = (user: UserEntity) => {
    switch (user.user_type) {
      case "doctor":
        return t("users.userTypes.doctor");
      case "student":
        return t("users.userTypes.student", "Student");
      case "institution":
        return t("users.userTypes.institution", "Institution");
      case "manager":
        return t("users.userTypes.manager");
      default:
        return user.is_staff
          ? t("users.userTypes.staff")
          : t("users.userTypes.user");
    }
  };

  // Get role color
  const getRoleColor = (user: UserEntity) => {
    switch (user.user_type) {
      case "manager":
        return "warning";
      case "doctor":
        return "primary";
      case "student":
        return "secondary";
      case "institution":
        return "success";
      default:
        return user.is_staff ? "warning" : "default";
    }
  };

  // using shared formatDate from src/misc/formatDate

  const handleResendVerification = async (user: UserEntity) => {
    setVerificationModalOpen(true);
    try {
      await AuthAPI.resendVerification({ user_id: user.id });
      setVerificationModalOpen(false);
      toast.success(
        t("common.codeSent", "Verification code sent successfully"),
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      setVerificationModalOpen(false);
      toast.error(
        t("common.resendFailed", "Failed to resend verification code"),
      );
    }
  };

  const handleManualVerification = async (user: UserEntity) => {
    try {
      await usersApi.verifyEmail(user.id);
      toast.success(
        t("common.verifiedSuccessfully", "Email verified successfully"),
      );
      fetchUsers();
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("users.title")}</h1>
            <p className="text-default-600 mt-1">
              {t("common.totalRecords", { count: totalCount })}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/users/add")}
          >
            {t("users.add")}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="max-w-sm"
                label={t("users.searchPlaceholder")}
                labelPlacement="outside"
                placeholder={t("users.searchPlaceholder")}
                startContent={<FiSearch />}
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <Select
                className="max-w-xs"
                label={t("users.filters.status")}
                labelPlacement="outside"
                placeholder={t("users.filters.all")}
                value={pendingStatus}
                onSelectionChange={(keys) =>
                  setPendingStatus((Array.from(keys)[0] as string) || "all")
                }
              >
                <SelectItem key="all">{t("users.filters.all")}</SelectItem>
                <SelectItem key="active">
                  {t("users.filters.active")}
                </SelectItem>
                <SelectItem key="inactive">
                  {t("users.filters.inactive")}
                </SelectItem>
              </Select>
              <Select
                className="max-w-xs"
                label={t("users.filters.byRole")}
                labelPlacement="outside"
                placeholder={t("users.filters.all")}
                value={pendingRole}
                onSelectionChange={(keys) =>
                  setPendingRole((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="all">{t("users.filters.all")}</SelectItem>
                <SelectItem key="doctor">
                  {t("users.filters.doctors")}
                </SelectItem>
                <SelectItem key="student">
                  {t("users.filters.students")}
                </SelectItem>
                <SelectItem key="institution">
                  {t("users.filters.institutions")}
                </SelectItem>
                <SelectItem key="manager">
                  {t("users.filters.managers")}
                </SelectItem>
                <SelectItem key="viewer">
                  {t("users.filters.viewers", "Viewers")}
                </SelectItem>
                <SelectItem key="advertiser">
                  {t("users.filters.advertisers", "Advertisers")}
                </SelectItem>
              </Select>

              <Select
                className="max-w-xs"
                label={t("common.sortBy", "Sort By")}
                labelPlacement="outside"
                selectedKeys={[ordering]}
                onSelectionChange={(keys) => {
                  setOrdering((Array.from(keys)[0] as string) || "-created_at");
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="-created_at">
                  {t("users.sort.newest", "Newest Joined")}
                </SelectItem>
                <SelectItem key="created_at">
                  {t("users.sort.oldest", "Oldest Joined")}
                </SelectItem>
                <SelectItem key="full_name">
                  {t("users.sort.nameAsc", "Name (A-Z)")}
                </SelectItem>
                <SelectItem key="-full_name">
                  {t("users.sort.nameDesc", "Name (Z-A)")}
                </SelectItem>
                <SelectItem key="graduation_year">
                  {t("users.sort.gradAsc", "Graduation Year (Asc)")}
                </SelectItem>
                <SelectItem key="-graduation_year">
                  {t("users.sort.gradDesc", "Graduation Year (Desc)")}
                </SelectItem>
              </Select>
              <div className="flex items-end gap-2">
                <Input
                  className="max-w-xs"
                  label={t("users.filters.joinedFrom")}
                  labelPlacement="outside"
                  type="date"
                  value={pendingFromDate}
                  onValueChange={setPendingFromDate}
                />
                <Input
                  className="max-w-xs"
                  label={t("users.filters.joinedTo")}
                  labelPlacement="outside"
                  type="date"
                  value={pendingToDate}
                  onValueChange={setPendingToDate}
                />
                <Button
                  color="primary"
                  onPress={() => {
                    // Map 'all' to empty applied filter
                    setStatusFilter(
                      pendingStatus === "all" ? "" : pendingStatus,
                    );
                    setRoleFilter(pendingRole === "all" ? "" : pendingRole);
                    setFromDate(pendingFromDate);
                    setToDate(pendingToDate);
                    setCurrentPage(1);
                  }}
                >
                  {t("common.search")}
                </Button>
              </div>
              {(statusFilter || roleFilter || searchQuery) && (
                <Button
                  startContent={<FiFilter />}
                  variant="light"
                  onPress={clearFilters}
                >
                  {t("common.clearFilters")}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Cards */}
        <Card>
          <CardBody className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    {t("users.noRecords")}
                  </p>
                ) : (
                  users.map((user) => (
                    <Card
                      key={user.id}
                      isPressable
                      className={`w-full border hover:border-default-400 cursor-pointer transition-colors ${user.is_active ? "border-default-100" : "border-danger-200 bg-danger-50/10"}`}
                      shadow="sm"
                      onPress={() => navigate(`/users/${user.id}`)}
                    >
                      <CardBody className="p-3 w-full">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            <FiUser className="text-primary-600 dark:text-primary-400" />
                          </div>

                          {/* User info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-default-900 truncate">
                                {user.full_name}
                              </h3>
                              <Chip
                                className="h-5"
                                color={getRoleColor(user)}
                                size="sm"
                                variant="flat"
                              >
                                {getUserRole(user)}
                              </Chip>
                              <Chip
                                className="h-5"
                                color={user.is_active ? "success" : "danger"}
                                size="sm"
                                variant="flat"
                              >
                                {user.is_active
                                  ? t("users.filters.active")
                                  : t("users.filters.inactive")}
                              </Chip>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-default-600 mb-2">
                              <span className="truncate">{user.username}</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={
                                    user.email_verified
                                      ? "text-success"
                                      : "text-warning"
                                  }
                                >
                                  {user.email_verified ? <FiCheck /> : <FiX />}
                                </span>
                                <span className="truncate">{user.email}</span>
                              </div>
                              <span className="text-default-500">•</span>
                              <span className="whitespace-nowrap">
                                {formatDate(user.date_joined)}
                              </span>
                            </div>
                            {/* Branches display */}
                            {user.branches && user.branches.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-default-500 font-medium">
                                  {t("users.branches", "Branches")}:
                                </span>
                                {user.branches.map((branch) => (
                                  <Chip
                                    key={branch.id}
                                    className="h-5"
                                    size="sm"
                                    variant="bordered"
                                  >
                                    {branch.name} ({branch.prefix})
                                  </Chip>
                                ))}
                              </div>
                            )}
                            {user.is_staff && (
                              <Chip
                                className="h-5"
                                color="primary"
                                size="sm"
                                variant="flat"
                              >
                                {t("users.userTypes.staff", "Staff")}
                              </Chip>
                            )}
                            {(user.managed_branches?.length ?? 0) > 0 && (
                              <Chip
                                className="h-5"
                                color="secondary"
                                size="sm"
                                variant="flat"
                              >
                                {t("users.managedBranches", "Branch Manager")}
                              </Chip>
                            )}
                          </div>

                          {/* Actions */}
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiMoreVertical />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="view"
                                startContent={<FiEye />}
                                onPress={() => navigate(`/users/${user.id}`)}
                              >
                                {t("common.view", "View")}
                              </DropdownItem>
                              <DropdownItem
                                key="edit"
                                startContent={<FiEdit />}
                                onPress={() =>
                                  navigate(`/users/${user.id}/edit`)
                                }
                              >
                                {t("common.edit")}
                              </DropdownItem>
                              <DropdownItem
                                key="toggle"
                                isDisabled={toggleLoadingId === user.id}
                                startContent={
                                  toggleLoadingId === user.id ? (
                                    <Spinner size="sm" />
                                  ) : user.is_active ? (
                                    <FiUserCheck />
                                  ) : (
                                    <FiUser />
                                  )
                                }
                                onPress={() => handleToggleActive(user)}
                              >
                                {user.is_active
                                  ? t("users.actions.deactivate")
                                  : t("users.actions.activate")}
                              </DropdownItem>
                              <DropdownItem
                                key="resend-verification"
                                startContent={<FiMail />}
                                onPress={() => handleResendVerification(user)}
                              >
                                {t("users.actions.resendVerification")}
                              </DropdownItem>

                              {!user.email_verified ? (
                                <DropdownItem
                                  key="verify-manual"
                                  className="text-success"
                                  color="success"
                                  startContent={<FiCheck />}
                                  onPress={() => handleManualVerification(user)}
                                >
                                  {t("users.actions.verifyManually")}
                                </DropdownItem>
                              ) : null}

                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<FiTrash2 />}
                                onPress={() => handleDeleteClick(user)}
                              >
                                {t("common.delete")}
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
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
        itemName={userToDelete ? userToDelete.full_name : ""}
        title={t("users.delete")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Verification Modal */}
      <Modal
        hideCloseButton
        isDismissable={false}
        isOpen={verificationModalOpen}
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
    </DefaultLayout>
  );
}
