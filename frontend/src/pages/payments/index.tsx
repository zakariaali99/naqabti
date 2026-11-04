import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Avatar,
} from "@heroui/react";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiHash,
  FiBell,
  FiCheck,
  FiEye,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";

import DefaultLayout from "@/layouts/default";
import { paymentsApi } from "@/api/paymentsApi";
import { DeleteConfirmModal, SendNotificationModal, DocumentPreviewModal } from "@/components/modals";
import { Pagination } from "@/components/Pagination";
import type { Payment, PaymentApprovalStatus } from "@/models/payments";
import { formatCurrency } from "@/misc/formatCurrency";
import { formatDate } from "@/misc/formatDate";
import { useUserStore } from "@/stores/userStore";

const PaymentsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const isManager = user?.is_staff || user?.user_type === "manager";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [paymentForNotification, setPaymentForNotification] = useState<any>(null);
  const [paymentDateFrom, setPaymentDateFrom] = useState("");
  const [paymentDateTo, setPaymentDateTo] = useState("");
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    payment: Payment | null;
  }>({ open: false, payment: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Slightly fewer for card view
  const [totalPages, setTotalPages] = useState(1);
  const isRtl = i18n.dir() === "rtl";

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {
        page,
        page_size: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(methodFilter && { payment_method: methodFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentDateFrom && { payment_date_from: paymentDateFrom }),
        ...(paymentDateTo && { payment_date_to: paymentDateTo }),
        ...(amountFrom && { amount_from: parseFloat(amountFrom) }),
        ...(amountTo && { amount_to: parseFloat(amountTo) }),
        ...(ordering && { ordering: ordering }),
      };
      const response = await paymentsApi.list(filters);

      setPayments(response.data.results);
      setTotalPages(Math.ceil(response.data.count / itemsPerPage));
    } catch (err) {
      setError(t("common.loadError"));
    } finally {
      setLoading(false);
    }
  };

  // Handle send notification
  const handleSendNotification = async (data: any) => {
    if (!paymentForNotification) return;
    await paymentsApi.sendNotification(paymentForNotification.id, data);
    setNotificationModalOpen(false);
  };

  const openNotificationModal = (payment: any) => {
    setPaymentForNotification(payment);
    setNotificationModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments(1);
  };

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, statusFilter, methodFilter, ordering]);

  const handleStatusChange = (keys: any) => {
    setStatusFilter((Array.from(keys)[0] as string) || "");
    setCurrentPage(1);
  };

  const handleMethodChange = (keys: any) => {
    setMethodFilter((Array.from(keys)[0] as string) || "");
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMethodFilter("");
    setStatusFilter("");
    setPaymentDateFrom("");
    setPaymentDateTo("");
    setAmountFrom("");
    setAmountTo("");
    setOrdering("-created_at");
    setShowAdvancedFilters(false);
    setCurrentPage(1);
    fetchPayments(1);
  };

  const handleApprove = async (payment: Payment) => {
    try {
      const response = await paymentsApi.approvePayment(payment.id);
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? response.data : p))
      );
    } catch {
      setError(t("payments.approveError"));
    }
  };

  const handleReject = async (payment: Payment) => {
    try {
      const response = await paymentsApi.rejectPayment(payment.id);
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? response.data : p))
      );
    } catch {
      setError(t("payments.rejectError"));
    }
  };

  const openDocumentPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleDeletePayment = async (payment: Payment) => {
    try {
      await paymentsApi.delete(payment.id);
      setDeleteModal({ open: false, payment: null });
      fetchPayments(currentPage);
    } catch (err) {
      setError(t("payments.deleteError"));
    }
  };

  const getMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: t("payments.methods.cash"),
      card: t("payments.methods.card"),
      bank_transfer: t("payments.methods.bankTransfer"),
      online: t("payments.methods.online"),
      check: t("payments.methods.check"),
    };

    return methods[method] || method;
  };

  const getStatusColor = (
    status: PaymentApprovalStatus,
  ): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
    const colors: Record<PaymentApprovalStatus, "success" | "warning" | "danger"> = {
      approved: "success",
      pending: "warning",
      rejected: "danger",
    };
    return colors[status] ?? "default";
  };

  const getStatusLabel = (status: PaymentApprovalStatus) =>
    t(`payments.status.${status}`, status);

  const getMethodColor = (method: string) => {
    const colors: Record<
      string,
      "default" | "primary" | "secondary" | "success" | "warning" | "danger"
    > = {
      cash: "success",
      card: "primary",
      bank_transfer: "secondary",
      online: "warning",
      check: "default",
    };

    return colors[method] || "default";
  };

  if (loading && payments.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-default-500 animate-pulse">
            {t("common.loading")}
          </p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div
        className="min-h-screen font-sans space-y-8 p-4 lg:p-8"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
              {t("payments.title")}
            </h1>
            <p className="text-default-500 font-medium mt-1">
              {t("payments.subtitle")}
            </p>
          </div>
          <Button
            className="font-semibold shadow-lg shadow-primary/20"
            color="primary"
            size="lg"
            startContent={<FiPlus size={20} />}
            variant="shadow"
            onPress={() => navigate("/payments/add")}
          >
            {t("payments.add")}
          </Button>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger p-4 rounded-2xl border border-danger-100 flex items-center justify-between">
            <span>{error}</span>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setError(null)}
            >
              <FiX />
            </Button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-content1 rounded-[32px] p-4 shadow-sm border border-default-200">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  classNames={{
                    inputWrapper:
                      "bg-default-100 hover:bg-default-200/70 group-data-[focus=true]:bg-default-100 rounded-2xl transition-colors",
                  }}
                  placeholder={t("payments.searchPlaceholder")}
                  size="lg"
                  startContent={
                    <FiSearch className="text-default-400" size={20} />
                  }
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                <Select
                  className="min-w-[160px]"
                  classNames={{
                    trigger:
                      "bg-default-100 hover:bg-default-200/70 rounded-2xl border-0",
                  }}
                  placeholder={t("payments.filters.status")}
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  size="lg"
                  onSelectionChange={handleStatusChange}
                >
                  <SelectItem key="pending">
                    {t("payments.status.pending")}
                  </SelectItem>
                  <SelectItem key="approved">
                    {t("payments.status.approved")}
                  </SelectItem>
                  <SelectItem key="rejected">
                    {t("payments.status.rejected")}
                  </SelectItem>
                </Select>

                <Select
                  className="min-w-[180px]"
                  classNames={{
                    trigger:
                      "bg-default-100 hover:bg-default-200/70 rounded-2xl border-0",
                  }}
                  placeholder={t("payments.form.paymentMethod")}
                  selectedKeys={methodFilter ? [methodFilter] : []}
                  size="lg"
                  startContent={<FiCreditCard className="text-default-400" />}
                  onSelectionChange={handleMethodChange}
                >
                  <SelectItem key="cash">
                    {t("payments.methods.cash")}
                  </SelectItem>
                  <SelectItem key="card">
                    {t("payments.methods.card")}
                  </SelectItem>
                  <SelectItem key="bank_transfer">
                    {t("payments.methods.bankTransfer")}
                  </SelectItem>
                  <SelectItem key="online">
                    {t("payments.methods.online")}
                  </SelectItem>
                </Select>

                <Select
                  className="min-w-[180px]"
                  classNames={{
                    trigger:
                      "bg-default-100 hover:bg-default-200/70 rounded-2xl border-0",
                  }}
                  placeholder={t("common.sortBy", "Sort By")}
                  selectedKeys={[ordering]}
                  size="lg"
                  onSelectionChange={(keys) => {
                    setOrdering((Array.from(keys)[0] as string) || "-created_at");
                    setCurrentPage(1);
                  }}
                >
                  <SelectItem key="-created_at">{t("payments.sort.newest", "Newest Payments")}</SelectItem>
                  <SelectItem key="created_at">{t("payments.sort.oldest", "Oldest Payments")}</SelectItem>
                  <SelectItem key="-amount">{t("payments.sort.amountDesc", "Highest Amount")}</SelectItem>
                  <SelectItem key="amount">{t("payments.sort.amountAsc", "Lowest Amount")}</SelectItem>
                  <SelectItem key="-payment_date">{t("payments.sort.dateDesc", "Payment Date (Newest)")}</SelectItem>
                  <SelectItem key="payment_date">{t("payments.sort.dateAsc", "Payment Date (Oldest)")}</SelectItem>
                </Select>

                <Button
                  className="min-w-fit rounded-2xl"
                  color={showAdvancedFilters ? "primary" : "default"}
                  isIconOnly={false}
                  size="lg"
                  startContent={<FiFilter />}
                  variant={showAdvancedFilters ? "solid" : "flat"}
                  onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {t("common.filters")}
                </Button>

                {(searchTerm || statusFilter || methodFilter || paymentDateFrom || paymentDateTo || amountFrom || amountTo) && (
                  <Button
                    className="min-w-fit rounded-2xl"
                    color="danger"
                    variant="flat"
                    size="lg"
                    startContent={<FiRefreshCw />}
                    onPress={clearFilters}
                  >
                    {t("common.reset", "Reset")}
                  </Button>
                )}

                <Button
                  className="rounded-2xl font-semibold shadow-md"
                  color="primary"
                  size="lg"
                  type="submit"
                >
                  {t("common.search")}
                </Button>
              </div>
            </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-default-100 animate-appearance-in">
                        <Input
                            type="date"
                            label={t('payments.paymentDateFrom')}
                            labelPlacement="outside"
                            value={paymentDateFrom}
                            onValueChange={setPaymentDateFrom}
                            variant="bordered"
                            classNames={{ inputWrapper: "rounded-xl border-default-200" }}
                        />
                         <Input
                            type="date"
                            label={t('payments.paymentDateTo')}
                            labelPlacement="outside"
                            value={paymentDateTo}
                            onValueChange={setPaymentDateTo}
                            variant="bordered"
                            classNames={{ inputWrapper: "rounded-xl border-default-200" }}
                        />
                            <Input
                            type="number"
                            label={t('payments.amountFrom')}
                            labelPlacement="outside"
                            value={amountFrom}
                            onValueChange={setAmountFrom}
                            startContent="LYD"
                            variant="bordered"
                            classNames={{ inputWrapper: "rounded-xl border-default-200" }}
                        />
                         <Input
                            type="number"
                            label={t('payments.amountTo')}
                            labelPlacement="outside"
                            value={amountTo}
                            onValueChange={setAmountTo}
                            startContent="LYD"
                            variant="bordered"
                            classNames={{ inputWrapper: "rounded-xl border-default-200" }}
                        />
                        
                        <div className="lg:col-span-4 flex justify-end">
                            <Button 
                                size="sm" 
                                color="danger" 
                                variant="light" 
                                startContent={<FiX />}
                                onPress={clearFilters}
                            >
                                {t('common.clearFilters')}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-content2/50 rounded-[24px] animate-pulse"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-content1 rounded-[40px] border border-dashed border-default-300">
            <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center text-default-300 mb-4">
              <GiTakeMyMoney size={48} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              {t("payments.noRecords")}
            </h3>
            <p className="text-default-500 mb-6">
              {t("payments.noRecordsDesc")}
            </p>
            <Button
              color="primary"
              startContent={<FiX />}
              variant="flat"
              onPress={clearFilters}
            >
              {t("common.clearFilters")}
            </Button>
          </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {payments.map((payment) => (
                    <div
                        key={payment.id}
                        className="group bg-content1 hover:bg-content2 transition-all duration-300 rounded-[24px] p-5 shadow-sm border border-default-100 hover:border-default-300 flex flex-col md:flex-row items-start md:items-center gap-6"
                        data-testid={`payment-row-${payment.id}`}
                    >
                        {/* Icon & Amount */}
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                                payment.amount ? 'bg-success-50 text-success' : 'bg-default-100 text-default-500'
                            }`}>
                                <GiTakeMyMoney />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground tracking-tight">
                                    {formatCurrency(parseFloat(payment.amount), i18n.language)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={getMethodColor(payment.payment_method)}
                                        className="h-5 text-[10px] font-medium"
                                    >
                                        {getMethodLabel(payment.payment_method)}
                                    </Chip>
                                    <Chip
                                        size="sm"
                                        variant="dot"
                                        color={getStatusColor(payment.status)}
                                        className="h-5 text-[10px] font-medium"
                                    >
                                        {getStatusLabel(payment.status)}
                                    </Chip>
                                </div>
                            </div>
                        </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 w-full border-t md:border-t-0 md:border-l border-default-100 md:pl-6 pt-4 md:pt-0">
                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="w-8 h-8 flex-shrink-0"
                      name={
                        payment.user_full_name || payment.user?.full_name || "#"
                      }
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground line-clamp-1">
                        {payment.user_full_name || payment.user?.full_name}
                      </p>
                      <p className="text-xs text-default-500 flex items-center gap-1">
                        <FiUser size={10} />{" "}
                        {payment.user_specialty || t("common.user")}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center text-default-500">
                      <FiCalendar size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(payment.payment_date)}
                      </p>
                      <p className="text-xs text-default-500">
                        {t("payments.form.paymentDate")}
                      </p>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-default-100 flex items-center justify-center text-default-500">
                      <FiHash size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {payment.reference_number || "N/A"}
                      </p>
                      <p className="text-xs text-default-500">
                        {t("payments.form.referenceNumber")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center ml-auto pl-4 flex-wrap justify-end">
                  {payment.transaction_document_url && (
                    <Button
                      isIconOnly
                      variant="light"
                      color="primary"
                      className="text-default-400 hover:text-primary"
                      title={t("payments.actions.viewDocument")}
                      onPress={() => openDocumentPreview(payment.transaction_document_url!)}
                    >
                      <FiEye size={18} />
                    </Button>
                  )}

                  {isManager && payment.status === "pending" && (
                    <>
                      <Button
                        isIconOnly
                        variant="light"
                        color="success"
                        className="text-default-400 hover:text-success"
                        title={t("payments.actions.approve")}
                        data-testid={`approve-payment-${payment.id}`}
                        onPress={() => handleApprove(payment)}
                      >
                        <FiCheck size={18} />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        color="danger"
                        className="text-default-400 hover:text-danger"
                        title={t("payments.actions.reject")}
                        data-testid={`reject-payment-${payment.id}`}
                        onPress={() => handleReject(payment)}
                      >
                        <FiX size={18} />
                      </Button>
                    </>
                  )}

                  <Button
                    isIconOnly
                    variant="light"
                    color="default"
                    className="text-default-400 hover:text-primary"
                    onPress={() => openNotificationModal(payment)}
                  >
                    <FiBell size={18} />
                  </Button>

                  <Button
                    isIconOnly
                    variant="light"
                    color="primary"
                    className="text-default-400 hover:text-primary"
                    title={t("payments.actions.downloadInvoice", "Download Invoice")}
                    onPress={async () => {
                      try {
                        const response = await paymentsApi.exportPdf(payment.id);
                        const blob = new Blob([response.data], { type: "application/pdf" });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", `invoice-PAY-${payment.id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (err) {
                        console.error("Failed to download invoice PDF:", err);
                      }
                    }}
                  >
                    <FiDownload size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    className="text-default-400 hover:text-primary"
                    color="default"
                    variant="light"
                    onPress={() => navigate(`/payments/${payment.id}/edit`)}
                  >
                    <FiEdit size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    className="text-default-400 hover:text-danger"
                    color="danger"
                    variant="light"
                    onPress={() => setDeleteModal({ open: true, payment })}
                  >
                    <FiTrash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, payment: null })}
        onConfirm={() => deleteModal.payment && handleDeletePayment(deleteModal.payment)}
        title={t('payments.delete')}
        message={t('common.confirmDeleteMessage')}
      />

      <SendNotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onSend={handleSendNotification}
        title={t("payments.actions.sendNotification", "Send Notification")}
        defaultTitle={t("payments.notificationDefaultTitle", "Payment Update")}
        defaultMessage=""
        showBroadcastOption={false}
      />

      <DocumentPreviewModal
        isOpen={previewOpen}
        url={previewUrl}
        title={t("payments.documentPreview")}
        onClose={() => setPreviewOpen(false)}
      />
    </DefaultLayout>
  );
};

export default PaymentsPage;
