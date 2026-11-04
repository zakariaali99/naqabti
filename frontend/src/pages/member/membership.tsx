import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiRefreshCw,
  FiAlertTriangle,
  FiArrowRight,
  FiMessageSquare,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiMapPin,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { Pagination } from "@/components/Pagination";
import { useUserStore } from "@/stores/userStore";
import doctorsMembershipApi, {
  DoctorsMembershipData,
} from "@/api/doctorsMembershipApi";
import membershipTypesApi from "@/api/membershipTypesApi";
import { MembershipTypeModel } from "@/models/membershipTypes";
import notificationsApi from "@/api/notificationsApi";
import { paymentsApi } from "@/api/paymentsApi";
import usersApi from "@/api/usersApi";

type MembershipView = "loading" | "apply" | "pending" | "active" | "expired" | "student";

interface PaymentHistory {
  id: number;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: "completed" | "pending" | "failed";
  invoiceNumber: string;
  paymentMethod: string;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const m = d.getMonth() + months;
  d.setFullYear(d.getFullYear() + Math.floor(m / 12));
  d.setMonth(m % 12);
  return d;
}

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "online", "other"] as const;

export default function MembershipStatusPage() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);

  const [view, setView] = useState<MembershipView>("loading");
  const [currentMembership, setCurrentMembership] = useState<DoctorsMembershipData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  // State A — apply form data
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeModel[]>([]);
  const [submittingTypeId, setSubmittingTypeId] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Doctors register under their own assigned branch — no manual picker.
  const doctorBranch = user?.branches?.[0];

  // State B — pending data shown after apply
  const [pendingMembership, setPendingMembership] = useState<DoctorsMembershipData | null>(null);
  const [whatHappensNextOpen, setWhatHappensNextOpen] = useState(false);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelingMembership, setCancelingMembership] = useState(false);

  // State C/D pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Payment modal state
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>("cash");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const paymentFileRef = useRef<HTMLInputElement>(null);

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        setView("loading");
        if (!user) return;

        if (user.user_type === "student") {
          setView("student");
          return;
        }

        const response = await doctorsMembershipApi.getAll({ page_size: 5 });
        const memberships = response.data?.results || [];
        const count = response.data?.count ?? 0;

        if (count === 0) {
          const typesRes = await membershipTypesApi.getAll();

          setMembershipTypes(typesRes.data.results || []);
          setView("apply");
        } else {
          const m = memberships[0];
          setCurrentMembership(m);

          const mappedPayments: PaymentHistory[] = (m.payments || []).map(
            (p: any) => ({
              id: p.id,
              date: p.payment_date,
              amount: p.amount,
              currency: "LYD",
              description: p.description || "-",
              status: p.payment_method === "failed" ? "failed" : "completed",
              invoiceNumber: p.reference_number || `PAY-${p.id}`,
              paymentMethod: p.payment_method,
            }),
          );
          setPaymentHistory(mappedPayments);

          // Pre-fill payment amount with remaining balance
          const remaining =
            m.remaining_amount != null
              ? Number(m.remaining_amount)
              : Number(m.total_amount ?? 0) - Number(m.paid_amount ?? 0);
          setPaymentAmount(String(remaining > 0 ? remaining : Number(m.total_amount ?? 0)));

          const apiStatus = m.status || "pending";
          if (apiStatus === "canceled" || apiStatus === "expired") {
            setView("expired");
          } else {
            setView(apiStatus as MembershipView);
          }
        }
      } catch (error) {
        console.error("Failed to fetch membership:", error);
        setView("apply");
      }
    };

    fetchMembership();
  }, [user]);

  const handleApply = async (type: MembershipTypeModel) => {
    if (!user) return;
    if (!doctorBranch) {
      setApplyError(t("member.noBranchAssigned"));
      return;
    }
    setSubmittingTypeId(type.id);
    setApplyError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await doctorsMembershipApi.create({
        doctor_id: user.id,
        membership_type_id: type.id,
        branch_id: doctorBranch.id,
        start_date: today,
        status: "pending",
        is_active: false,
        total_amount: Number(type.price),
        paid_amount: 0,
        payment_status: "unpaid",
      });
      setPendingMembership(res.data);
      setView("pending");
      try {
        await notificationsApi.sendSingle({
          user_id: user.id,
          title: t("member.notifSubmittedTitle"),
          message: t("member.notifSubmittedBody", { number: res.data.membership_number }),
          notification_type: "success",
          content_type: "membership",
          object_id: res.data.id,
        });
      } catch {
        // notification failure should not block the success flow
      }
    } catch (err) {
      console.error("Failed to apply for membership:", err);
      setApplyError(t("member.applyError"));
    } finally {
      setSubmittingTypeId(null);
    }
  };

  const handleCancelMembership = async () => {
    const displayed = pendingMembership || currentMembership;
    if (!displayed?.id) return;
    setCancelingMembership(true);
    try {
      await doctorsMembershipApi.cancel(displayed.id);
      setCancelConfirming(false);
      setPendingMembership(null);
      setCurrentMembership(null);
      const typesRes = await membershipTypesApi.getAll();

      setMembershipTypes(typesRes.data.results || []);
      setView("apply");
    } catch (err) {
      console.error("Failed to cancel membership:", err);
    } finally {
      setCancelingMembership(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!currentMembership?.id || !user) return;
    setSubmittingPayment(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await paymentsApi.create({
        user_id: user.id,
        membership_id: currentMembership.id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: today,
        upload_document: paymentFile || undefined,
      });
      setPaymentSubmitted(true);
      onPaymentClose();
      // Refresh membership to reflect any status changes
      const refreshed = await doctorsMembershipApi.getAll({ page_size: 5 });
      const memberships = refreshed.data?.results || [];
      if (memberships.length > 0) setCurrentMembership(memberships[0]);
    } catch (err) {
      console.error("Failed to submit payment:", err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!user) return;
    setUploadingDoc(true);
    try {
      await usersApi.uploadPassportImage(user.id, file);
      await fetchUserProfile();
      setDocUploaded(true);
    } catch (err) {
      console.error("Failed to upload document:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "expired":
      case "canceled":
        return "danger";
      case "suspended":
        return "default";
      case "completed":
        return "success";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return <FiCheck />;
      case "pending":
      default:
        return <FiClock />;
    }
  };

  const getRenewalUrgencyColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 30) return "danger";
    if (daysUntilExpiry <= 60) return "warning";
    return "success";
  };

  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);
  const paginatedHistory = paymentHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (view === "loading") {
    return (
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[40vh]">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  // ── Student ──────────────────────────────────────────────────────────────
  if (view === "student") {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center py-16">
        <FiUser className="mx-auto text-default-400 mb-4" size={48} />
        <h2 className="text-xl font-semibold mb-2">
          {t("member.noStudentMembership")}
        </h2>
        <p className="text-default-500">{t("member.membershipHelp")}</p>
      </div>
    );
  }

  // ── State A — Apply ──────────────────────────────────────────────────────
  if (view === "apply") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t("member.applyTitle")}
          </h1>
          <p className="text-default-500">{t("member.applySubtitle")}</p>
        </div>

        {applyError && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 flex items-center gap-3">
            <FiAlertTriangle className="text-danger shrink-0" />
            <span className="text-danger text-sm font-medium">{applyError}</span>
          </div>
        )}

        {doctorBranch ? (
          <div className="flex items-center gap-2 text-sm text-default-600 bg-default-50 rounded-2xl px-4 py-3 w-fit">
            <FiMapPin className="text-default-400" />
            <span className="text-default-500">{t("member.branch")}:</span>
            <span className="font-semibold text-foreground">
              {doctorBranch.name}
            </span>
          </div>
        ) : (
          <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex items-center gap-3">
            <FiAlertTriangle className="text-warning-600 shrink-0" />
            <span className="text-warning-700 text-sm font-medium">
              {t("member.noBranchAssigned")}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {membershipTypes.map((type) => (
            <Card
              key={type.id}
              className="rounded-[32px] border-none shadow-sm bg-content1 p-2"
              data-testid={`membership-type-card-${type.id}`}
            >
              <CardHeader className="px-6 pt-6 pb-2">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {type.name}
                  </h3>
                  {type.description && (
                    <p className="text-sm text-default-500">
                      {type.description}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardBody className="px-6 pb-6 space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary">
                    {Number(type.price).toLocaleString()}
                  </span>
                  <span className="text-default-500 font-medium">LYD</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-default-600">
                  <FiCalendar className="shrink-0" />
                  <span>{type.duration_months} {t("common.months", "months")}</span>
                </div>
                <Button
                  color="primary"
                  radius="full"
                  className="w-full font-bold"
                  isLoading={submittingTypeId === type.id}
                  isDisabled={submittingTypeId !== null || !doctorBranch}
                  startContent={submittingTypeId !== type.id ? <FiArrowRight /> : undefined}
                  data-testid={`apply-membership-${type.id}`}
                  onPress={() => handleApply(type)}
                >
                  {submittingTypeId === type.id
                    ? t("member.applying")
                    : t("member.applyNow")}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── State B — Pending ────────────────────────────────────────────────────
  if (view === "pending") {
    const displayed = pendingMembership || currentMembership;

    const timelineSteps = [
      { key: "stepSubmitted", done: true },
      { key: "stepReview", done: false, current: true },
      { key: "stepApproval", done: false },
      { key: "stepPayment", done: false },
      { key: "stepActive", done: false },
    ];

    const whatHappensSteps = [
      { titleKey: "member.stepTitle1", bodyKey: "member.step1" },
      { titleKey: "member.stepTitle2", bodyKey: "member.step2" },
      { titleKey: "member.stepTitle3", bodyKey: "member.step3" },
      { titleKey: "member.stepTitle4", bodyKey: "member.step4" },
    ];

    return (
      <div
        className="max-w-2xl mx-auto p-6 space-y-6"
        data-testid="membership-application-pending"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center shrink-0">
            <FiClock className="text-warning text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">
              {t("member.applicationPending")}
            </h2>
            <p className="text-default-500 text-sm">
              {t("member.estimatedReview")}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <Card className="rounded-[24px] border-none shadow-sm bg-content1 p-4">
          <CardBody className="p-2">
            <div className="flex items-center justify-between">
              {timelineSteps.map((step, idx) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      step.done
                        ? "bg-success text-white"
                        : step.current
                          ? "bg-warning text-white"
                          : "bg-default-100 text-default-400"
                    }`}>
                      {step.done ? <FiCheck size={14} /> : step.current ? <FiClock size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] text-center leading-tight max-w-[60px] ${
                      step.done ? "text-success font-medium" : step.current ? "text-warning font-bold" : "text-default-400"
                    }`}>
                      {t(`member.${step.key}`)}
                    </span>
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1 ${step.done ? "bg-success" : "bg-default-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Application Summary */}
        {displayed && (
          <Card className="rounded-[24px] border-none shadow-sm bg-content1">
            <CardBody className="p-5 space-y-3">
              <h3 className="font-bold text-foreground text-base">{t("member.applicationSummary")}</h3>
              <div className="space-y-2 text-sm">
                {displayed.membership_number && (
                  <div className="flex items-center justify-between py-2 border-b border-divider/50">
                    <span className="text-default-500">{t("member.applicationNumber")}</span>
                    <span
                      className="font-mono font-bold text-primary"
                      data-testid="application-number"
                    >
                      {displayed.membership_number}
                    </span>
                  </div>
                )}
                {displayed.membership_type && (
                  <div className="flex items-center justify-between py-2 border-b border-divider/50">
                    <span className="text-default-500">{t("member.membershipType")}</span>
                    <span className="font-bold">{displayed.membership_type.name}</span>
                  </div>
                )}
                {displayed.membership_type?.price !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-divider/50">
                    <span className="text-default-500">{t("member.price")}</span>
                    <span className="font-bold">{displayed.membership_type.price} LYD</span>
                  </div>
                )}
                {displayed.membership_type?.duration_months && (
                  <div className="flex items-center justify-between py-2 border-b border-divider/50">
                    <span className="text-default-500">{t("member.duration")}</span>
                    <span className="font-bold">{displayed.membership_type.duration_months} {t("common.month")}</span>
                  </div>
                )}
                {displayed.branch?.name && (
                  <div className="flex items-center justify-between py-2 border-b border-divider/50">
                    <span className="text-default-500 flex items-center gap-1"><FiMapPin size={12} />{t("member.branch")}</span>
                    <span className="font-bold">{displayed.branch.name}</span>
                  </div>
                )}
                {displayed.created_at && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-default-500">{t("member.submittedOn")}</span>
                    <span className="font-bold">{new Date(displayed.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* What Happens Next */}
        <Card className="rounded-[24px] border-none shadow-sm bg-content1">
          <CardBody className="p-5">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setWhatHappensNextOpen((o) => !o)}
            >
              <span className="font-bold text-foreground">{t("member.whatHappensNext")}</span>
              {whatHappensNextOpen ? <FiChevronUp className="text-default-400" /> : <FiChevronDown className="text-default-400" />}
            </button>
            {whatHappensNextOpen && (
              <ol className="mt-4 space-y-4">
                {whatHappensSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t(step.titleKey)}</p>
                      <p className="text-xs text-default-500 mt-0.5">{t(step.bodyKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            as={Link}
            to="/complaints"
            color="primary"
            variant="flat"
            startContent={<FiMessageSquare />}
            className="flex-1 font-bold rounded-2xl"
          >
            {t("member.contactAdmin")}
          </Button>
          {!cancelConfirming ? (
            <Button
              color="danger"
              variant="light"
              startContent={<FiX />}
              className="flex-1 font-bold rounded-2xl"
              data-testid="cancel-application"
              onPress={() => setCancelConfirming(true)}
            >
              {t("member.cancelApplication")}
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              <Button
                color="danger"
                className="flex-1 font-bold rounded-2xl"
                isLoading={cancelingMembership}
                data-testid="cancel-application-confirm"
                onPress={handleCancelMembership}
              >
                {t("member.cancelConfirm")}
              </Button>
              <Button
                variant="flat"
                className="font-bold rounded-2xl"
                onPress={() => setCancelConfirming(false)}
              >
                {t("common.back", "رجوع")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── State C — Active / State D — Expired ─────────────────────────────────
  if (!currentMembership) return null;

  // Compute end_date: use API value or derive from start_date + duration_months
  const computedEndDate = (() => {
    if (currentMembership.end_date) return new Date(currentMembership.end_date);
    if (currentMembership.start_date && currentMembership.membership_type?.duration_months) {
      return addMonths(
        new Date(currentMembership.start_date),
        currentMembership.membership_type.duration_months,
      );
    }
    return null;
  })();

  const daysUntilExpiry = computedEndDate
    ? Math.max(
        0,
        Math.ceil((computedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : null;

  const remaining =
    currentMembership.remaining_amount != null
      ? Number(currentMembership.remaining_amount)
      : Number(currentMembership.total_amount ?? 0) - Number(currentMembership.paid_amount ?? 0);

  const isUnpaid = currentMembership.payment_status === "unpaid" || currentMembership.payment_status === "partial";
  const needsDocUpload = !user?.passport_image && !docUploaded;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" data-testid="membership-status-view">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("member.membershipStatus")}
        </h1>
        <p className="text-default-600">{t("member.membershipDescription")}</p>
      </div>

      {/* State D — expired banner */}
      {view === "expired" && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertTriangle className="text-danger text-xl shrink-0" />
          <span className="font-bold text-danger">
            {t("member.expiredBanner")}
          </span>
        </div>
      )}

      {/* ── Visual Membership Card ──────────────────────────────────────────── */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 to-primary-400 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-primary-100 text-xs font-semibold uppercase tracking-widest">
                {t("member.membershipCardTitle")}
              </p>
              <p className="text-2xl font-extrabold">
                {user?.full_name}
              </p>
              <p className="text-primary-100 text-sm">
                {currentMembership.membership_type?.name || "-"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Chip
                color={getStatusColor(currentMembership.status) as any}
                variant="solid"
                className="font-bold"
                data-testid="membership-status"
              >
                {t(`member.status.${currentMembership.status}`)}
              </Chip>
              {isUnpaid && !paymentSubmitted && (
                <Chip color="warning" variant="flat" className="font-bold bg-white/20 text-white border-white/30">
                  {t("member.paymentPendingReview")}
                </Chip>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-primary-200 text-xs">{t("member.memberNumber")}</p>
              <p className="font-mono font-bold" data-testid="member-number">
                {currentMembership.membership_number || "-"}
              </p>
            </div>
            {currentMembership.branch?.name && (
              <div>
                <p className="text-primary-200 text-xs">{t("member.branch")}</p>
                <p className="font-bold">{currentMembership.branch.name}</p>
              </div>
            )}
            <div>
              <p className="text-primary-200 text-xs">{t("member.startDate")}</p>
              <p className="font-bold">
                {new Date(currentMembership.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">
                {currentMembership.end_date ? t("member.expiryDate") : t("member.computedEndDate")}
              </p>
              <p className="font-bold">
                {computedEndDate ? computedEndDate.toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Payment Section ─────────────────────────────────────────────────── */}
      {isUnpaid && !paymentSubmitted && (
        <Card className="rounded-[32px] border-none shadow-sm bg-warning-50 border border-warning-200">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-warning-100 rounded-2xl shrink-0">
                  <FiAlertCircle className="text-warning-700 text-2xl" />
                </div>
                <div>
                  <p className="font-bold text-warning-800 text-lg">
                    {t("member.paymentRequiredTitle")}
                  </p>
                  <p className="text-sm text-warning-600 mt-0.5">
                    {t("member.paymentRequiredDesc")}
                  </p>
                  <p className="mt-2 text-warning-800 font-black text-2xl">
                    {remaining.toFixed(2)} <span className="text-base font-bold">LYD</span>
                  </p>
                  <p className="text-xs text-warning-500 mt-0.5">
                    {t("member.amountDue")}
                  </p>
                </div>
              </div>
              <Button
                color="warning"
                radius="full"
                className="font-bold shadow-lg shadow-warning/20 shrink-0"
                startContent={<FiCreditCard />}
                data-testid="pay-now"
                onPress={onPaymentOpen}
              >
                {t("member.payNow")}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment submitted success banner */}
      {paymentSubmitted && (
        <div
          className="bg-success-50 border border-success-200 rounded-2xl p-4 flex items-center gap-3"
          data-testid="payment-submitted-banner"
        >
          <FiCheckCircle className="text-success text-xl shrink-0" />
          <span className="font-bold text-success-700">
            {t("member.paymentSubmittedSuccess")}
          </span>
        </div>
      )}

      {/* ── Document Upload Section ─────────────────────────────────────────── */}
      {needsDocUpload && (
        <Card className="rounded-[32px] border-none shadow-sm bg-content1">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-50 rounded-2xl shrink-0">
                  <FiFileText className="text-primary text-2xl" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-base">
                    {t("member.docUploadTitle")}
                  </p>
                  <p className="text-sm text-default-500 mt-0.5">
                    {t("member.docUploadDesc")}
                  </p>
                  <p className="text-xs text-default-400 mt-1">
                    {t("member.docUploadFormats")}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <input
                  ref={docFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocUpload(file);
                  }}
                />
                <Button
                  color="primary"
                  radius="full"
                  className="font-bold"
                  startContent={uploadingDoc ? undefined : <FiUpload />}
                  isLoading={uploadingDoc}
                  onPress={() => docFileRef.current?.click()}
                >
                  {uploadingDoc ? t("member.uploadingDoc") : t("member.uploadDoc")}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Document upload success */}
      {docUploaded && (
        <div className="bg-success-50 border border-success-200 rounded-2xl p-4 flex items-center gap-3">
          <FiCheckCircle className="text-success text-xl shrink-0" />
          <span className="font-bold text-success-700">
            {t("member.docUploadSuccess")}
          </span>
        </div>
      )}

      {/* ── Membership details grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm bg-content1">
          <CardHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <FiUser size={20} />
              <h3 className="text-lg font-semibold">
                {t("member.membershipDetails")}
              </h3>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-default-600">
                  {t("member.memberNumber")}
                </p>
                <p className="font-mono font-medium">
                  {currentMembership.membership_number || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-600">
                  {t("member.membershipType")}
                </p>
                <p className="font-medium">
                  {currentMembership.membership_type?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-600">{t("member.status")}</p>
                <Chip
                  color={getStatusColor(currentMembership.status) as any}
                  startContent={getStatusIcon(currentMembership.status)}
                  variant="flat"
                >
                  {t(`member.status.${currentMembership.status}`)}
                </Chip>
              </div>
              <div>
                <p className="text-sm text-default-600">
                  {t("member.renewalFee")}
                </p>
                <p className="font-medium">
                  {currentMembership.total_amount} LYD
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-default-600">
                  {t("member.startDate")}
                </p>
                <div className="flex items-center gap-1">
                  <FiCalendar size={14} />
                  <span>
                    {new Date(currentMembership.start_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-default-600">
                  {currentMembership.end_date ? t("member.expiryDate") : t("member.computedEndDate")}
                </p>
                <div className="flex items-center gap-1">
                  <FiCalendar size={14} />
                  <span>
                    {computedEndDate ? computedEndDate.toLocaleDateString() : "-"}
                  </span>
                </div>
              </div>
            </div>

            {computedEndDate && daysUntilExpiry !== null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-default-600">
                    {t("member.timeUntilExpiry")}
                  </p>
                  <p
                    className={`font-medium ${
                      daysUntilExpiry <= 30
                        ? "text-danger"
                        : daysUntilExpiry <= 60
                          ? "text-warning"
                          : "text-success"
                    }`}
                  >
                    {daysUntilExpiry} {t("common.days")}
                  </p>
                </div>
                <Progress
                  className="max-w-full"
                  color={getRenewalUrgencyColor(daysUntilExpiry) as any}
                  value={Math.max(0, ((365 - daysUntilExpiry) / 365) * 100)}
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Renewal action card — only shown within 60 days of expiry */}
        {computedEndDate && daysUntilExpiry !== null && daysUntilExpiry < 60 && (
          <Card className="rounded-[32px] border-none shadow-sm bg-content1">
            <CardHeader className="px-6 pt-6 pb-2">
              <h3 className="text-lg font-semibold">
                {t("member.renewalAction")}
              </h3>
            </CardHeader>
            <CardBody className="px-6 pb-6 space-y-4">
              <div className="text-center">
                <FiCreditCard className="mx-auto text-primary mb-4" size={48} />
                <p className="text-sm text-default-600 mb-4">
                  {t("member.renewalNeeded")}
                </p>
                <Button
                  as={Link}
                  className="w-full"
                  color="primary"
                  size="lg"
                  startContent={<FiRefreshCw />}
                  to="/member/membership/renew"
                >
                  {t("member.renewNow")}
                </Button>
              </div>
              <div className="text-center pt-4 border-t border-divider">
                <p className="text-2xl font-bold text-primary">
                  {currentMembership.total_amount} LYD
                </p>
                <p className="text-sm text-default-600">
                  {t("member.renewalAmount")}
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* ── Payment history (always shown) ──────────────────────────────────── */}
      <Card className="rounded-[32px] border-none shadow-sm bg-content1">
        <CardHeader className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">
              {t("member.paymentHistory")}
            </h3>
            <Chip color="primary" variant="flat">
              {paymentHistory.length} {t("member.totalPayments")}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          {paymentHistory.length === 0 ? (
            <div className="text-center py-10 text-default-400">
              <FiDollarSign className="mx-auto mb-3" size={36} />
              <p className="text-sm">{t("member.noRecentActivity")}</p>
            </div>
          ) : (
            <>
              <Table aria-label="Payment history table">
                <TableHeader>
                  <TableColumn>{t("member.date")}</TableColumn>
                  <TableColumn>{t("member.description")}</TableColumn>
                  <TableColumn>{t("member.amount")}</TableColumn>
                  <TableColumn>{t("member.paymentMethod")}</TableColumn>
                  <TableColumn>{t("member.status")}</TableColumn>
                  <TableColumn>{t("common.actions")}</TableColumn>
                </TableHeader>
                <TableBody items={paginatedHistory}>
                  {(payment: PaymentHistory) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FiCalendar size={14} />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-default-500">
                            {payment.invoiceNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FiDollarSign size={14} />
                          <span className="font-medium">
                            {payment.amount} {payment.currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(payment.status) as any}
                          size="sm"
                          startContent={getStatusIcon(payment.status)}
                          variant="flat"
                        >
                          {t(`member.paymentStatus.${payment.status}`)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {payment.status === "completed" && (
                          <Button
                            color="primary"
                            size="sm"
                            startContent={<FiDownload size={14} />}
                            variant="light"
                            onPress={async () => {
                              try {
                                const response = await paymentsApi.exportPdf(payment.id);
                                const blob = new Blob([response.data], { type: "application/pdf" });
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", `invoice-${payment.invoiceNumber}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                              } catch (err) {
                                console.error("Failed to download invoice PDF:", err);
                                toast.error(t("common.downloadFailed", "Failed to download invoice"));
                              }
                            }}
                          >
                            {t("member.downloadInvoice")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* ── Payment Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="md" radius="lg">
        <ModalContent>
          <ModalHeader className="font-bold text-lg">
            {t("member.paymentModalTitle")}
          </ModalHeader>
          <ModalBody className="space-y-4 pb-2">
            <div className="bg-warning-50 rounded-2xl p-4 flex items-center gap-3">
              <FiAlertCircle className="text-warning shrink-0" />
              <div>
                <p className="font-bold text-warning-800 text-sm">
                  {t("member.amountDue")}: {remaining.toFixed(2)} LYD
                </p>
                <p className="text-xs text-warning-600">
                  {currentMembership.membership_type?.name}
                </p>
              </div>
            </div>

            <Input
              label={t("member.paymentAmount")}
              type="number"
              min={0}
              value={paymentAmount}
              onValueChange={setPaymentAmount}
              endContent={<span className="text-default-400 text-sm">LYD</span>}
              radius="lg"
              data-testid="payment-amount"
            />

            <Select
              label={t("member.paymentMethodLabel")}
              data-testid="payment-method"
              selectedKeys={[paymentMethod]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as typeof PAYMENT_METHODS[number];
                if (val) setPaymentMethod(val);
              }}
              radius="lg"
            >
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m}>{t(`member.payMethod.${m}`)}</SelectItem>
              ))}
            </Select>

            <div>
              <p className="text-sm text-default-600 mb-2">{t("member.paymentReceipt")}</p>
              <input
                ref={paymentFileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                data-testid="payment-receipt-input"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              />
              <Button
                variant="flat"
                className="w-full rounded-xl"
                startContent={<FiUpload />}
                onPress={() => paymentFileRef.current?.click()}
              >
                {paymentFile ? paymentFile.name : t("member.uploadDoc")}
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPaymentClose} className="font-medium">
              {t("common.cancel", "إلغاء")}
            </Button>
            <Button
              color="primary"
              radius="full"
              className="font-bold"
              isLoading={submittingPayment}
              isDisabled={!paymentAmount || Number(paymentAmount) <= 0}
              data-testid="submit-payment"
              onPress={handlePaymentSubmit}
            >
              {submittingPayment ? t("member.submittingPayment") : t("member.submitPayment")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
