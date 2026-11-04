import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Spinner,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiAward,
  FiCreditCard,
  FiBell,
  FiUser,
  FiMail,
  FiPhone,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import toast from "react-hot-toast";

import DefaultLayout from "@/layouts/default";
import doctorsMembershipApi, {
  DoctorsMembershipData,
} from "@/api/doctorsMembershipApi";
import { paymentsApi } from "@/api/paymentsApi";
import { doctorsMembershipRenewHistoryApi } from "@/api/membershipRenewHistoryApi";
import { Payment } from "@/models/payments";
import { DoctorsMembershipRenewHistory } from "@/models/membershipRenewHistory";
import { formatDate } from "@/misc/formatDate";
import { formatCurrency } from "@/misc/formatCurrency";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { SendNotificationModal } from "@/components/modals";
import { PaymentModal, PaymentData } from "@/pages/payments/PaymentModal";
import { RenewMembershipModal, RenewMembershipData } from "./RenewMembershipModal";

export default function MembershipDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [membership, setMembership] = useState<DoctorsMembershipData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [renewHistory, setRenewHistory] = useState<DoctorsMembershipRenewHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [renewLoading, setRenewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();

  const {
    isOpen: isRenewModalOpen,
    onOpen: onRenewModalOpen,
    onClose: onRenewModalClose,
  } = useDisclosure();

  const fetchMembership = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await doctorsMembershipApi.getById(parseInt(id));
      setMembership(res.data);
    } catch {
      toast.error(t("common.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!id) return;
    try {
      setPaymentsLoading(true);
      const res = await paymentsApi.list({ membership_id: parseInt(id), page_size: 100 });
      setPayments(res.data.results || []);
    } catch {
      // silently ignore
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchRenewHistory = async () => {
    if (!id) return;
    try {
      const res = await doctorsMembershipRenewHistoryApi.getAll({ membership: id, page_size: 100 });
      setRenewHistory(res.data.results || []);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchMembership();
    fetchPayments();
    fetchRenewHistory();
  }, [id]);

  const handlePaymentSubmit = async (paymentData: PaymentData) => {
    if (!membership?.id) return;
    try {
      setPaymentLoading(true);
      await doctorsMembershipApi.addPayment(membership.id, paymentData);
      onPaymentModalClose();
      toast.success(t("payment.addSuccess", "Payment added successfully"));
      fetchMembership();
      fetchPayments();
    } catch {
      toast.error(t("payment.addError", "Failed to add payment"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRenewSubmit = async (data: RenewMembershipData) => {
    if (!membership?.id) return;
    try {
      setRenewLoading(true);
      await doctorsMembershipRenewHistoryApi.create({
        membership: membership.id,
        new_end_date: data.new_end_date,
        amount: data.amount,
        previous_end_date: membership.end_date,
        notes: data.notes,
      });
      onRenewModalClose();
      toast.success(t("membership.renewSuccess"));
      fetchMembership();
      fetchRenewHistory();
    } catch {
      toast.error(t("membership.renewError"));
    } finally {
      setRenewLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!membership?.id) return;
    try {
      setApproveLoading(true);
      await doctorsMembershipApi.approve(membership.id);
      toast.success(t("membership.approveSuccess"));
      fetchMembership();
    } catch {
      toast.error(t("membership.approveError"));
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!membership?.id) return;
    try {
      setRejectLoading(true);
      await doctorsMembershipApi.reject(membership.id);
      toast.success(t("membership.rejectSuccess"));
      fetchMembership();
    } catch {
      toast.error(t("membership.rejectError"));
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSendNotification = async (data: any) => {
    if (!membership?.id) return;
    await doctorsMembershipApi.sendNotification(membership.id, data);
    setNotificationModalOpen(false);
  };

  const handleDelete = async () => {
    if (!membership?.id) return;
    try {
      setDeleteLoading(true);
      await doctorsMembershipApi.delete(membership.id);
      toast.success(t("common.deleteSuccess", "Deleted successfully"));
      navigate("/memberships");
    } catch {
      toast.error(t("common.deleteError", "Failed to delete"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "expired": return "danger";
      case "pending": return "warning";
      case "canceled": return "default";
      default: return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "partial": return "warning";
      case "unpaid": return "danger";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!membership) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64 text-default-400">
          {t("common.notFound", "Not found")}
        </div>
      </DefaultLayout>
    );
  }

  const doctor = membership.doctor;

  return (
    <DefaultLayout>
      <div className="space-y-6 p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate("/memberships")}
            >
              <FiArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl font-bold text-foreground"
                  data-testid="membership-number"
                >
                  {membership.membership_number || t("membership.membershipDetails")}
                </h1>
                <Chip
                  color={getStatusColor(membership.status)}
                  size="sm"
                  variant="flat"
                  className="font-medium"
                  data-testid="membership-status"
                >
                  {t(`membership.${membership.status}`)}
                </Chip>
                <Chip
                  color={getPaymentStatusColor(membership.payment_status)}
                  size="sm"
                  variant="dot"
                  className="border-none bg-transparent pl-0"
                  data-testid="membership-payment-status"
                >
                  {membership.payment_status === "paid" && t("membership.paymentStatusPaid")}
                  {membership.payment_status === "partial" && t("membership.paymentStatusPartial")}
                  {membership.payment_status === "unpaid" && t("membership.paymentStatusUnpaid")}
                </Chip>
              </div>
              <p className="text-default-500 text-sm mt-1">
                {t("membership.membershipDetails")}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {membership.status === "pending" && (
              <>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<FiCheck size={14} />}
                  isLoading={approveLoading}
                  data-testid="approve-membership"
                  onPress={handleApprove}
                >
                  {t("membership.approve")}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<FiX size={14} />}
                  isLoading={rejectLoading}
                  data-testid="reject-membership"
                  onPress={handleReject}
                >
                  {t("membership.reject")}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="flat"
              startContent={<FiEdit size={14} />}
              onPress={() => navigate(`/memberships/${id}/edit`)}
            >
              {t("common.edit")}
            </Button>
            {membership.payment_status !== "paid" && (
              <Button
                size="sm"
                color="success"
                variant="flat"
                startContent={<GiTakeMyMoney size={14} />}
                onPress={onPaymentModalOpen}
              >
                {t("payment.addPayment")}
              </Button>
            )}
            <Button
              size="sm"
              variant="flat"
              startContent={<FiRefreshCw size={14} />}
              onPress={onRenewModalOpen}
            >
              {t("membership.renew")}
            </Button>
            <Button
              size="sm"
              variant="flat"
              startContent={<FiBell size={14} />}
              onPress={() => setNotificationModalOpen(true)}
            >
              {t("membership.actions.sendNotification")}
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              startContent={<FiTrash2 size={14} />}
              onPress={() => setDeleteModalOpen(true)}
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Doctor Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FiUser className="text-primary" size={16} />
                <h3 className="font-semibold text-base">{t("membership.memberName")}</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              {doctor ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <FiUser size={14} className="text-default-400 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      {doctor.full_name || doctor.username}
                    </span>
                  </div>
                  {doctor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiMail size={14} className="text-default-400 flex-shrink-0" />
                      <span className="text-default-700">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiPhone size={14} className="text-default-400 flex-shrink-0" />
                      <span className="text-default-700">{doctor.phone_number}</span>
                    </div>
                  )}
                  {doctor.specialty && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiAward size={14} className="text-default-400 flex-shrink-0" />
                      <span className="text-default-700">{doctor.specialty}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-default-400 text-sm">—</span>
              )}
            </CardBody>
          </Card>

          {/* Membership Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FiAward className="text-primary" size={16} />
                <h3 className="font-semibold text-base">{t("membership.subscriptionDetails")}</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              {membership.membership_type && (
                <div className="flex items-center gap-2 text-sm">
                  <FiCreditCard size={14} className="text-default-400 flex-shrink-0" />
                  <span className="text-default-500">{t("membership.membershipType")}:</span>
                  <span className="font-medium text-foreground">{membership.membership_type.name}</span>
                </div>
              )}
              {membership.branch && (
                <div className="flex items-center gap-2 text-sm">
                  <FiMapPin size={14} className="text-default-400 flex-shrink-0" />
                  <span className="text-default-500">{t("membership.branch")}:</span>
                  <span className="font-medium text-foreground">{membership.branch.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <FiCalendar size={14} className="text-default-400 flex-shrink-0" />
                <span className="text-default-500">{t("membership.startDate")}:</span>
                <span className="font-medium text-foreground">{formatDate(membership.start_date)}</span>
              </div>
              {membership.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar size={14} className="text-default-400 flex-shrink-0" />
                  <span className="text-default-500">{t("membership.endDate")}:</span>
                  <span className="font-medium text-foreground">{formatDate(membership.end_date)}</span>
                </div>
              )}
              {membership.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar size={14} className="text-default-400 flex-shrink-0" />
                  <span className="text-default-500">{t("common.createdAt", "Created")}:</span>
                  <span className="font-medium text-foreground">{formatDate(membership.created_at)}</span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="shadow-sm">
          <CardBody>
            <div className="grid grid-cols-3 divide-x divide-default-200 rtl:divide-x-reverse">
              <div className="px-6 first:pl-0 last:pr-0 text-center">
                <p className="text-xs uppercase text-default-400 font-bold tracking-wider mb-1">
                  {t("payment.totalAmount", "Total Amount")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(membership.total_amount, "ar-LY", "LYD")}
                </p>
              </div>
              <div className="px-6 text-center">
                <p className="text-xs uppercase text-default-400 font-bold tracking-wider mb-1">
                  {t("payment.paidAmount")}
                </p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(membership.paid_amount, "ar-LY", "LYD")}
                </p>
              </div>
              <div className="px-6 last:pr-0 text-center">
                <p className="text-xs uppercase text-default-400 font-bold tracking-wider mb-1">
                  {t("payment.remainingAmount")}
                </p>
                <p className="text-xl font-bold text-warning">
                  {formatCurrency(membership.remaining_amount || 0, "ar-LY", "LYD")}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs: Payments + Renew History */}
        <Tabs aria-label="Membership details tabs" variant="underlined" color="primary">
          <Tab
            key="payments"
            title={
              <span className="flex items-center gap-2">
                <GiTakeMyMoney size={16} />
                {t("payment.payments", "Payments")}
                {payments.length > 0 && (
                  <Chip size="sm" variant="flat" className="h-5 min-w-5 text-xs">
                    {payments.length}
                  </Chip>
                )}
              </span>
            }
          >
            <div className="pt-4">
              {paymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-10 text-default-400">
                  {t("payments.noPayments", "No payments yet")}
                </div>
              ) : (
                <Table removeWrapper aria-label="Payments table">
                  <TableHeader>
                    <TableColumn>{t("payments.form.paymentDate")}</TableColumn>
                    <TableColumn>{t("payments.form.amount")}</TableColumn>
                    <TableColumn>{t("payments.form.paymentMethod")}</TableColumn>
                    <TableColumn>{t("payments.form.referenceNumber")}</TableColumn>
                    <TableColumn>{t("payments.status.label", "Status")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-default-50"
                        onClick={() => navigate(`/payments/${p.id}/edit`)}
                      >
                        <TableCell>{formatDate(p.payment_date)}</TableCell>
                        <TableCell className="font-semibold text-success">
                          {formatCurrency(parseFloat(p.amount), "ar-LY", "LYD")}
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {t(`payments.methods.${p.payment_method}`, p.payment_method)}
                          </Chip>
                        </TableCell>
                        <TableCell>{p.reference_number || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              p.status === "approved"
                                ? "success"
                                : p.status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {t(`payments.status.${p.status}`, p.status)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tab>

          <Tab
            key="renew_history"
            title={
              <span className="flex items-center gap-2">
                <FiRefreshCw size={16} />
                {t("membership.renewHistory")}
                {renewHistory.length > 0 && (
                  <Chip size="sm" variant="flat" className="h-5 min-w-5 text-xs">
                    {renewHistory.length}
                  </Chip>
                )}
              </span>
            }
          >
            <div className="pt-4">
              {renewHistory.length === 0 ? (
                <div className="text-center py-10 text-default-400">
                  {t("membership.noRenewHistory", "No renewal history")}
                </div>
              ) : (
                <Table removeWrapper aria-label="Renew history table">
                  <TableHeader>
                    <TableColumn>{t("membership.renewHistory")}</TableColumn>
                    <TableColumn>{t("membership.endDate")}</TableColumn>
                    <TableColumn>{t("membership.newEndDate")}</TableColumn>
                    <TableColumn>{t("payments.form.amount")}</TableColumn>
                    <TableColumn>{t("membership.paymentStatus")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {renewHistory.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.renew_date)}</TableCell>
                        <TableCell>
                          {r.previous_end_date ? formatDate(r.previous_end_date) : "—"}
                        </TableCell>
                        <TableCell>{formatDate(r.new_end_date)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(r.amount, "ar-LY", "LYD")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getPaymentStatusColor(r.payment_status)}
                          >
                            {t(`membership.paymentStatus${r.payment_status.charAt(0).toUpperCase() + r.payment_status.slice(1)}`)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        isLoading={deleteLoading}
        title={t("membership.memberships")}
        itemName={membership.membership_number || ""}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        isLoading={paymentLoading}
        totalAmount={membership.total_amount}
        paidAmount={membership.paid_amount}
        remainingAmount={membership.remaining_amount || 0}
        onClose={onPaymentModalClose}
        onSubmit={handlePaymentSubmit}
      />

      <RenewMembershipModal
        isOpen={isRenewModalOpen}
        isLoading={renewLoading}
        membership={membership}
        onClose={onRenewModalClose}
        onSubmit={handleRenewSubmit}
      />

      <SendNotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onSend={handleSendNotification}
        title={t("membership.actions.sendNotification")}
        defaultTitle={t("membership.notificationDefaultTitle", "Membership Update")}
        defaultMessage=""
        showBroadcastOption={false}
      />
    </DefaultLayout>
  );
}
