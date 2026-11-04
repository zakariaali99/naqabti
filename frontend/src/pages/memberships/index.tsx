import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Card,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
  FiBell,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import { useDisclosure } from "@heroui/react";

import {
  RenewMembershipModal,
  RenewMembershipData,
} from "./RenewMembershipModal";

import toast from "react-hot-toast";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { PaymentModal, PaymentData } from "@/pages/payments/PaymentModal";
import { formatCurrency } from "@/misc/formatCurrency";
import { formatDate } from "@/misc/formatDate";
import doctorsMembershipApi, {
  DoctorsMembershipData,
} from "@/api/doctorsMembershipApi";
import { membershipTypesApi } from "@/api";
import { MembershipTypeModel } from "@/models";
import { doctorsMembershipRenewHistoryApi } from "@/api/membershipRenewHistoryApi";
import { SendNotificationModal } from "@/components/modals";

export default function MembershipListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [memberships, setMemberships] = useState<DoctorsMembershipData[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeModel[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");
  const [endDateFrom, setEndDateFrom] = useState<string>("");
  const [endDateTo, setEndDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [membershipToDelete, setMembershipToDelete] =
    useState<DoctorsMembershipData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const [membershipToPay, setMembershipToPay] =
    useState<DoctorsMembershipData | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [membershipForNotification, setMembershipForNotification] = useState<DoctorsMembershipData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const {
    isOpen: isRenewModalOpen,
    onOpen: onRenewModalOpen,
    onClose: onRenewModalClose,
  } = useDisclosure();
  const [membershipToRenew, setMembershipToRenew] =
    useState<DoctorsMembershipData | null>(null);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("-created_at");

  // Fetch memberships data
  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await doctorsMembershipApi.getAll({
        search: searchQuery,
        status: statusFilter || undefined,
        membership_type: typeFilter ? parseInt(typeFilter) : undefined,
        start_date_from: startDateFrom || undefined,
        start_date_to: startDateTo || undefined,
        end_date_from: endDateFrom || undefined,
        end_date_to: endDateTo || undefined,
        ordering: ordering,
        page: currentPage,
        page_size: pageSize,
      });

      setMemberships(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch memberships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (membership: DoctorsMembershipData) => {
    if (!membership.id) return;
    try {
      await doctorsMembershipApi.approve(membership.id);
      toast.success(t("membership.approveSuccess"));
      fetchMemberships();
    } catch {
      toast.error(t("membership.approveError"));
    }
  };

  const handleReject = async (membership: DoctorsMembershipData) => {
    if (!membership.id) return;
    try {
      await doctorsMembershipApi.reject(membership.id);
      toast.success(t("membership.rejectSuccess"));
      fetchMemberships();
    } catch {
      toast.error(t("membership.rejectError"));
    }
  };

  // Handle send notification
  const handleSendNotification = async (data: any) => {
    if (!membershipForNotification) return;
    await doctorsMembershipApi.sendNotification(membershipForNotification.id as number, data);
    setNotificationModalOpen(false);
    setMembershipForNotification(null);
  };

  const openNotificationModal = (membership: DoctorsMembershipData) => {
    setMembershipForNotification(membership);
    setNotificationModalOpen(true);
  };

  // Fetch membership types for filter
  const fetchMembershipTypes = async () => {
    try {
      const response = await membershipTypesApi.getAll({ page_size: 100 });

      setMembershipTypes(response.data.results);
    } catch (error) {
      console.error("Failed to fetch membership types:", error);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [
    currentPage,
    statusFilter,
    typeFilter,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    ordering,
  ]);

  useEffect(() => {
    fetchMembershipTypes();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    fetchMemberships();
  };

  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStartDateFromChange = (value: string) => {
    setStartDateFrom(value);
    setCurrentPage(1);
  };

  const handleStartDateToChange = (value: string) => {
    setStartDateTo(value);
    setCurrentPage(1);
  };

  const handleEndDateFromChange = (value: string) => {
    setEndDateFrom(value);
    setCurrentPage(1);
  };

  const handleEndDateToChange = (value: string) => {
    setEndDateTo(value);
    setCurrentPage(1);
  };

  // Handle delete
  const handleDeleteClick = (membership: DoctorsMembershipData) => {
    setMembershipToDelete(membership);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!membershipToDelete || !membershipToDelete.id) return;

    try {
      setDeleteLoading(true);
      await doctorsMembershipApi.delete(membershipToDelete.id);
      setDeleteModalOpen(false);
      setMembershipToDelete(null);
      fetchMemberships();
    } catch (error) {
      console.error("Failed to delete membership:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle renewal
  const handleRenewClick = (membership: DoctorsMembershipData) => {
    setMembershipToRenew(membership);
    onRenewModalOpen();
  };

  const handleRenewSubmit = async (data: RenewMembershipData) => {
    if (!membershipToRenew || !membershipToRenew.id) return;

    try {
      setRenewLoading(membershipToRenew.id);

      await doctorsMembershipRenewHistoryApi.create({
        membership: membershipToRenew.id,
        new_end_date: data.new_end_date,
        amount: data.amount,
        previous_end_date: membershipToRenew.end_date,
        notes: data.notes,
      });

      onRenewModalClose();
      setMembershipToRenew(null);
      fetchMemberships(); // Refresh the list
    } catch (error) {
      console.error("Failed to renew membership:", error);
    } finally {
      setRenewLoading(null);
    }
  };

  // Handle payment
  const handlePaymentClick = (membership: DoctorsMembershipData) => {
    setMembershipToPay(membership);
    onPaymentModalOpen();
  };

  const handlePaymentSubmit = async (paymentData: PaymentData) => {
    if (!membershipToPay || !membershipToPay.id) return;

    try {
      setPaymentLoading(true);
      await doctorsMembershipApi.addPayment(membershipToPay.id, paymentData);
      onPaymentModalClose();
      setMembershipToPay(null);
      fetchMemberships(); // Refresh the list
    } catch (error) {
      console.error("Failed to add payment:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "expired":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // using shared formatDate utility

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-background font-sans space-y-8 p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-navy-500 rounded-2xl text-white shadow-lg">
              <FiUsers size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {t("membership.memberships")}
              </h1>
              <p className="text-default-500 mt-1 font-medium">
                {t("common.totalRecords", { count: totalCount })}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="rounded-full px-6 font-medium"
              color="primary"
              startContent={<FiPlus />}
              variant="shadow"
              onPress={() => navigate("/memberships/add")}
            >
              {t("membership.addMembership")}
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200 transition-all hover:shadow-md">
          {/* Always Visible: Search + Button + Toggle Advanced */}
          <form
            className="flex w-full items-center gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                <FiSearch className="text-default-400" />
              </div>
              <Input
                isClearable
                classNames={{
                  inputWrapper:
                    "bg-content2 h-12 rounded-2xl hover:bg-content3 transition-colors pl-10",
                  input: "text-base",
                }}
                placeholder={t("common.search")}
                value={searchQuery}
                onValueChange={handleSearch}
              />
            </div>

            <Select
              className="w-40"
              label={t("common.sortBy", "Sort By")}
              labelPlacement="outside"
              selectedKeys={[ordering]}
              size="sm"
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                if (key) setOrdering(key);
                setCurrentPage(1);
              }}
            >
              <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
              <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
            </Select>
            <Button
              className="h-12 rounded-2xl px-8 font-medium shadow-md"
              color="primary"
              type="submit"
            >
              {t("common.search")}
            </Button>
            <Button
              isIconOnly
              className="h-12 w-12 rounded-2xl bg-content2 text-default-500 hover:text-primary transition-colors"
              variant="flat"
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? (
                <FiChevronUp size={22} />
              ) : (
                <FiChevronDown size={22} />
              )}
            </Button>
          </form>

          {/* Collapsible Advanced Filters */}
          {showAdvancedFilters && (
            <div className="flex flex-col gap-6 pt-6 border-t border-dashed border-default-200 mt-4 animate-appearance-in">
              {/* Second Row: Status + Membership Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  classNames={{
                    trigger:
                      "bg-content2 h-12 rounded-2xl data-[hover=true]:bg-content3",
                  }}
                  label={t("membership.status")}
                  labelPlacement="outside"
                  placeholder={t("common.selectOption")}
                  value={statusFilter}
                  onSelectionChange={(keys) =>
                    handleStatusFilterChange(Array.from(keys)[0] as string)
                  }
                >
                  <SelectItem key="active">{t("membership.active")}</SelectItem>
                  <SelectItem key="pending">
                    {t("membership.pending", "Pending")}
                  </SelectItem>
                  <SelectItem key="canceled">
                    {t("membership.canceled", "Canceled")}
                  </SelectItem>
                  <SelectItem key="expired">
                    {t("membership.expired")}
                  </SelectItem>
                </Select>

                <Select
                  classNames={{
                    trigger:
                      "bg-content2 h-12 rounded-2xl data-[hover=true]:bg-content3",
                  }}
                  label={t("membership.selectMembershipType")}
                  labelPlacement="outside"
                  placeholder={t("common.selectOption")}
                  value={typeFilter}
                  onSelectionChange={(keys) =>
                    handleTypeFilterChange(Array.from(keys)[0] as string)
                  }
                >
                  {membershipTypes.map((type) => (
                    <SelectItem key={type.id.toString()}>
                      {type.academic_degree_name
                        ? `${type.name} (${type.academic_degree_name})`
                        : type.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Third Row: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    classNames={{
                      inputWrapper: "bg-content2 h-12 rounded-2xl",
                    }}
                    label={t("membership.startDate") + " - " + t("common.from")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="date"
                    value={startDateFrom}
                    onValueChange={handleStartDateFromChange}
                  />
                  <Input
                    classNames={{
                      inputWrapper: "bg-content2 h-12 rounded-2xl",
                    }}
                    label={t("membership.startDate") + " - " + t("common.to")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="date"
                    value={startDateTo}
                    onValueChange={handleStartDateToChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    classNames={{
                      inputWrapper: "bg-content2 h-12 rounded-2xl",
                    }}
                    label={t("membership.endDate") + " - " + t("common.from")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="date"
                    value={endDateFrom}
                    onValueChange={handleEndDateFromChange}
                  />
                  <Input
                    classNames={{
                      inputWrapper: "bg-content2 h-12 rounded-2xl",
                    }}
                    label={t("membership.endDate") + " - " + t("common.to")}
                    labelPlacement="outside"
                    placeholder=" "
                    type="date"
                    value={endDateTo}
                    onValueChange={handleEndDateToChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Desktop Cards (compact) */}
            <div className="hidden md:block space-y-4">
              {memberships.length === 0 ? (
                <div className="bg-content1 rounded-[32px] p-12 text-center border dashed border-default-300">
                  <p className="text-default-500 font-medium text-lg">
                    {t("membership.noMemberships")}
                  </p>
                </div>
              ) : (
                memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="bg-content1 rounded-[24px] p-5 shadow-sm border border-default-200 transition-all hover:-translate-y-1 hover:shadow-md group cursor-pointer"
                    onClick={() => navigate(`/memberships/${membership.id}`)}
                  >
                    <div className="flex items-center gap-6">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-default-100 rounded-lg font-mono text-xs text-default-600 font-bold tracking-wider">
                            {membership.membership_number || "---"}
                          </span>
                          <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                            {membership.doctor?.full_name ||
                              membership.doctor?.username ||
                              "-"}
                          </h3>
                          <div className="flex gap-2">
                            <Chip
                              className="rounded-lg font-medium px-1"
                              color={getStatusColor(membership.status)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`membership.${membership.status}`)}
                            </Chip>
                            <Chip
                              className="border-none bg-transparent pl-0"
                              color={
                                membership.payment_status === "paid"
                                  ? "success"
                                  : membership.payment_status === "partial"
                                    ? "warning"
                                    : "danger"
                              }
                              size="sm"
                              variant="dot"
                            >
                              {membership.payment_status === "paid" &&
                                t("membership.paymentStatusPaid")}
                              {membership.payment_status === "partial" &&
                                t("membership.paymentStatusPartial")}
                              {membership.payment_status === "unpaid" &&
                                t("membership.paymentStatusUnpaid")}
                            </Chip>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-default-500">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-default-400">
                              {t("membership.type")}:
                            </span>
                            <span className="text-foreground">
                              {membership.membership_type?.name || "-"}
                            </span>
                            {membership.membership_type?.academic_degree_name && (
                              <Chip
                                className="rounded-lg"
                                color="secondary"
                                size="sm"
                                variant="flat"
                              >
                                {membership.membership_type.academic_degree_name}
                              </Chip>
                            )}
                            {membership.subscription_count &&
                              membership.subscription_count > 1 && (
                                <Chip
                                  className="rounded-lg"
                                  color="primary"
                                  size="sm"
                                  variant="flat"
                                >
                                  {t("membership.subscriptionCount")}:{" "}
                                  {membership.subscription_count}
                                </Chip>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-default-400">
                              {t("users.form.specialty")}:
                            </span>
                            <span className="text-foreground">
                              {membership.doctor?.specialty || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-default-400">
                              {t("common.email")}:
                            </span>
                            <span className="text-foreground">
                              {membership.doctor?.email || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-default-400">
                              {t("membership.branch", "Branch")}:
                            </span>
                            <span className="text-foreground">
                              {membership.branch?.name || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-default-50 rounded-lg">
                            <span className="font-medium text-default-400">
                              {t("membership.period")}:
                            </span>
                            <span className="font-semibold text-default-700">
                              {formatDate(membership.start_date)}
                            </span>
                            <span className="text-default-300">→</span>
                            <span className="font-semibold text-default-700">
                              {membership.end_date
                                ? formatDate(membership.end_date)
                                : "-"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-dashed border-default-200">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-default-400 font-bold tracking-wider mb-0.5">
                              {t("payment.paidAmount")}
                            </span>
                            <span className="font-bold text-success text-base">
                              {formatCurrency(
                                membership.paid_amount,
                                "ar-LY",
                                "LYD",
                              )}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-default-200" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-default-400 font-bold tracking-wider mb-0.5">
                              {t("payment.remainingAmount")}
                            </span>
                            <span className="font-bold text-warning text-base">
                              {formatCurrency(
                                membership.remaining_amount || 0,
                                "ar-LY",
                                "LYD",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex self-start" onClick={(e) => e.stopPropagation()}>
                        <Dropdown placement="bottom-end">
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              className="text-default-400 hover:text-default-600 rounded-full w-10 h-10"
                              variant="light"
                            >
                              <FiMoreVertical size={20} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Membership Actions"
                            className="p-1 gap-1"
                          >
                            <DropdownItem
                              key="edit"
                              startContent={<FiEdit />}
                              onPress={() =>
                                navigate(`/memberships/${membership.id}/edit`)
                              }
                            >
                              {t("membership.editMembership")}
                            </DropdownItem>
                            {membership.status === "pending" ? (
                              <DropdownItem
                                key="approve"
                                className="text-success"
                                startContent={<FiCheck />}
                                onPress={() => handleApprove(membership)}
                              >
                                {t("membership.approve")}
                              </DropdownItem>
                            ) : null}
                            {membership.status === "pending" ? (
                              <DropdownItem
                                key="reject"
                                className="text-danger"
                                color="danger"
                                startContent={<FiX />}
                                onPress={() => handleReject(membership)}
                              >
                                {t("membership.reject")}
                              </DropdownItem>
                            ) : null}
                            {membership.payment_status !== "paid" ? (
                              <DropdownItem
                                key="pay"
                                className="text-success"
                                startContent={<GiTakeMyMoney />}
                                onPress={() => handlePaymentClick(membership)}
                              >
                                {t("payment.addPayment")}
                              </DropdownItem>
                            ) : null}
                            <DropdownItem
                              key="renew"
                              isDisabled={renewLoading === membership.id}
                              startContent={<FiRefreshCw />}
                              onPress={() => handleRenewClick(membership)}
                            >
                              {t("membership.renew")}
                            </DropdownItem>
                                  <DropdownItem
                                    key="send_notification"
                                    startContent={<FiBell />}
                                    onPress={() => openNotificationModal(membership)}
                                  >
                                    {t('membership.actions.sendNotification')}
                                  </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(membership)}
                            >
                              {t("common.delete")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {memberships.length === 0 ? (
                <p className="text-center text-default-500 py-8">
                  {t("membership.noMemberships")}
                </p>
              ) : (
                memberships.map((membership) => (
                  <Card
                    key={membership.id}
                    className="p-4 cursor-pointer"
                    isPressable
                    onPress={() => navigate(`/memberships/${membership.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {membership.membership_number && (
                            <p className="text-xs text-default-500 mb-1">
                              <span className="font-semibold">
                                {t("membership.membershipNumber")}:
                              </span>{" "}
                              <span className="font-mono">
                                {membership.membership_number}
                              </span>
                            </p>
                          )}
                          <div className="mb-1">
                            <span className="text-xs text-default-500">
                              {t("membership.doctor")}:
                            </span>
                            <h3 className="font-semibold inline ml-1">
                              {membership.doctor?.full_name ||
                                membership.doctor?.username ||
                                "-"}
                            </h3>
                          </div>
                          <p className="text-sm text-default-600">
                            <span className="text-xs text-default-500">
                              {t("common.email")}:
                            </span>{" "}
                            {membership.doctor?.email || "-"}
                          </p>
                          {membership.doctor?.specialty && (
                            <p className="text-sm text-default-600">
                              <span className="text-xs text-default-500">
                                {t("user.specialty")}:
                              </span>{" "}
                              {membership.doctor.specialty}
                            </p>
                          )}
                          {membership.branch && (
                            <p className="text-sm text-default-500 mt-1">
                              <span className="text-xs text-default-500">
                                {t("membership.branch", "Branch")}:
                              </span>{" "}
                              {membership.branch.name}
                            </p>
                          )}
                          {membership.membership_type && (
                            <p className="text-sm text-default-600 mt-1 flex flex-wrap items-center gap-1">
                              <span className="text-xs text-default-500">
                                {t("membership.type")}:
                              </span>{" "}
                              {membership.membership_type.name}
                              {membership.membership_type.academic_degree_name && (
                                <Chip
                                  className="rounded-lg"
                                  color="secondary"
                                  size="sm"
                                  variant="flat"
                                >
                                  {membership.membership_type.academic_degree_name}
                                </Chip>
                              )}
                              {membership.subscription_count &&
                                membership.subscription_count > 1 && (
                                  <Chip
                                    className="rounded-lg"
                                    color="primary"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {t("membership.subscriptionCount")}:{" "}
                                    {membership.subscription_count}
                                  </Chip>
                                )}
                            </p>
                          )}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              className="-mr-2"
                              size="sm"
                              variant="light"
                            >
                              <FiMoreVertical size={20} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<FiEdit />}
                              onPress={() =>
                                navigate(`/memberships/${membership.id}/edit`)
                              }
                            >
                              {t("membership.editMembership")}
                            </DropdownItem>
                            {membership.status === "pending" ? (
                              <DropdownItem
                                key="approve"
                                className="text-success"
                                startContent={<FiCheck />}
                                onPress={() => handleApprove(membership)}
                              >
                                {t("membership.approve")}
                              </DropdownItem>
                            ) : null}
                            {membership.status === "pending" ? (
                              <DropdownItem
                                key="reject"
                                className="text-danger"
                                color="danger"
                                startContent={<FiX />}
                                onPress={() => handleReject(membership)}
                              >
                                {t("membership.reject")}
                              </DropdownItem>
                            ) : null}
                            {membership.payment_status !== "paid" ? (
                              <DropdownItem
                                key="pay"
                                className="text-success"
                                startContent={<GiTakeMyMoney />}
                                onPress={() => handlePaymentClick(membership)}
                              >
                                {t("payment.addPayment")}
                              </DropdownItem>
                            ) : null}
                            <DropdownItem
                              key="renew"
                              isDisabled={renewLoading === membership.id}
                              startContent={<FiRefreshCw />}
                              onPress={() => handleRenewClick(membership)}
                            >
                              {t("membership.renew")}
                            </DropdownItem>
                                <DropdownItem
                                  key="send_notification"
                                  startContent={<FiBell />}
                                  onPress={() => openNotificationModal(membership)}
                                >
                                  {t('membership.actions.sendNotification')}
                                </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(membership)}
                            >
                              {t("common.delete")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          color={getStatusColor(membership.status)}
                          size="sm"
                        >
                          {t(`membership.${membership.status}`)}
                        </Chip>
                        <Chip
                          color={
                            membership.payment_status === "paid"
                              ? "success"
                              : membership.payment_status === "partial"
                                ? "warning"
                                : "danger"
                          }
                          size="sm"
                        >
                          {membership.payment_status === "paid" &&
                            t("membership.paymentStatusPaid")}
                          {membership.payment_status === "partial" &&
                            t("membership.paymentStatusPartial")}
                          {membership.payment_status === "unpaid" &&
                            t("membership.paymentStatusUnpaid")}
                        </Chip>
                      </div>
                      <div className="bg-default-50 rounded-2xl p-4 text-sm text-default-600 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-default-500 font-medium">
                            {t("membership.startDate")}:
                          </span>{" "}
                          <span className="font-semibold text-foreground">
                            {formatDate(membership.start_date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-500 font-medium">
                            {t("membership.endDate")}:
                          </span>{" "}
                          <span className="font-semibold text-foreground">
                            {membership.end_date
                              ? formatDate(membership.end_date)
                              : "-"}
                          </span>
                        </div>
                        <div className="border-t border-dashed border-default-200 pt-3 flex justify-between">
                          <span className="text-default-500 font-medium">
                            {t("payment.paidAmount")}:
                          </span>{" "}
                          <span className="text-success font-bold font-mono text-base">
                            {formatCurrency(
                              membership.paid_amount,
                              "ar-LY",
                              "LYD",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-500 font-medium">
                            {t("payment.remainingAmount")}:
                          </span>{" "}
                          <span className="text-warning font-bold font-mono text-base">
                            {formatCurrency(
                              membership.remaining_amount || 0,
                              "ar-LY",
                              "LYD",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

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
        itemName={
          membershipToDelete
            ? membershipToDelete.doctor?.full_name ||
              membershipToDelete.doctor?.username ||
              ""
            : ""
        }
        title={t("membership.memberships")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Payment Modal */}
      {membershipToPay && (
        <PaymentModal
          isLoading={paymentLoading}
          isOpen={isPaymentModalOpen}
          paidAmount={membershipToPay.paid_amount}
          remainingAmount={membershipToPay.remaining_amount || 0}
          totalAmount={membershipToPay.total_amount}
          onClose={onPaymentModalClose}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {/* Renew Modal */}
      {membershipToRenew && (
        <RenewMembershipModal
          isLoading={renewLoading === membershipToRenew.id}
          isOpen={isRenewModalOpen}
          membership={membershipToRenew}
          onClose={onRenewModalClose}
          onSubmit={handleRenewSubmit}
        />
      )}

      <SendNotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onSend={handleSendNotification}
        title={t('membership.actions.sendNotification')}
        defaultTitle={t('membership.notificationDefaultTitle', 'Membership Update')}
        defaultMessage=""
        showBroadcastOption={false}
      />
    </DefaultLayout>
  );
}
