import { useState, useEffect, useRef, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Spinner,
  Progress,
  Tab,
  Tabs,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Avatar,
  Card,
  CardHeader,
  CardBody,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiEdit,
  FiUser,
  FiTrash2,
  FiRefreshCw,
  FiMoreVertical,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiCheck,
  FiAlertCircle,
  FiPhone,
  FiCalendar,
  FiGlobe,
  FiMapPin,
  FiInfo,
  FiSend,
  FiUpload,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { GiTakeMyMoney } from "react-icons/gi";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import membershipApi, {
  DoctorsMembershipData,
} from "@/api/doctorsMembershipApi";
import certificationsApi from "@/api/certificationsApi";
import { paymentsApi } from "@/api/paymentsApi";
import { UserEntity } from "@/models/users";
import { Certification } from "@/models/certifications";
import { Payment } from "@/models/payments";
import { formatDate } from "@/misc/formatDate";
import { formatCurrency } from "@/misc/formatCurrency";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { PaymentModal, PaymentData } from "@/pages/payments/PaymentModal";
import {
  calculateProfileCompletion,
  profileCompletionValuesFromUser,
  PROFILE_FIELD_LABEL_KEYS,
} from "@/utils/profileCompletion";
import DoctorStatusSwitcher from "@/pages/doctors/components/DoctorStatusSwitcher";

const DetailRow = ({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 py-4 first:pt-0 last:pb-0">
    <p className="w-full sm:w-64 shrink-0 text-sm text-default-500 flex items-center gap-1.5 sm:pt-0.5">
      {icon}
      {label}
    </p>
    <div className="flex-1 min-w-0 text-start">{children}</div>
  </div>
);

export default function DoctorDetailPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [doctor, setDoctor] = useState<UserEntity | null>(null);
  const [memberships, setMemberships] = useState<DoctorsMembershipData[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Loading states
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [certificationsLoading, setCertificationsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [membershipToDelete, setMembershipToDelete] =
    useState<DoctorsMembershipData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState<number | null>(null);
  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const {
    isOpen: isPassportModalOpen,
    onOpen: onPassportModalOpen,
    onClose: onPassportModalClose,
  } = useDisclosure();
  const {
    isOpen: isToggleActiveModalOpen,
    onOpen: onToggleActiveModalOpen,
    onClose: onToggleActiveModalClose,
  } = useDisclosure();
  const [membershipToPay, setMembershipToPay] =
    useState<DoctorsMembershipData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toggleActiveLoading, setToggleActiveLoading] = useState(false);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const passportUploadRef = useRef<HTMLInputElement>(null);

  // Fetch doctor details
  useEffect(() => {
    if (!id) return;

    const fetchDoctor = async () => {
      try {
        setDoctorLoading(true);
        const response = await usersApi.getById(parseInt(id));

        setDoctor(response.data);
      } catch (error) {
        console.error("Failed to fetch doctor:", error);
      } finally {
        setDoctorLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  // Fetch doctor memberships
  useEffect(() => {
    if (!id) return;

    const fetchMemberships = async () => {
      try {
        setMembershipsLoading(true);
        const response = await membershipApi.getAll({
          doctor_id: parseInt(id),
          page_size: 100,
        });

        setMemberships(response.data.results);
      } catch (error) {
        console.error("Failed to fetch memberships:", error);
      } finally {
        setMembershipsLoading(false);
      }
    };

    fetchMemberships();
  }, [id]);

  // Fetch doctor certifications
  useEffect(() => {
    if (!id) return;

    const fetchCertifications = async () => {
      try {
        setCertificationsLoading(true);
        const response = await certificationsApi.getAll({
          doctor_id: parseInt(id),
          page_size: 100,
        });

        setCertifications(response.data.results);
      } catch (error) {
        console.error("Failed to fetch certifications:", error);
      } finally {
        setCertificationsLoading(false);
      }
    };

    fetchCertifications();
  }, [id]);

  // Fetch doctor payments
  useEffect(() => {
    if (!id) return;

    const fetchPayments = async () => {
      try {
        setPaymentsLoading(true);
        const response = await paymentsApi.list({
          doctor_id: parseInt(id),
          page_size: 100,
        });

        setPayments(response.data.results);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchPayments();
  }, [id]);

  // Handle delete
  const handleDeleteClick = (membership: DoctorsMembershipData) => {
    setMembershipToDelete(membership);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!membershipToDelete || !membershipToDelete.id) return;

    try {
      setDeleteLoading(true);
      await membershipApi.delete(membershipToDelete.id);
      setDeleteModalOpen(false);
      setMembershipToDelete(null);
      // Refresh memberships
      const response = await membershipApi.getAll({
        doctor_id: parseInt(id!),
        page_size: 100,
      });

      setMemberships(response.data.results);
    } catch (error) {
      console.error("Failed to delete membership:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle renewal
  const handleRenew = async (membership: DoctorsMembershipData) => {
    if (!membership.id) return;

    const defaultEnd = membership.end_date
      ? new Date(new Date(membership.end_date).setFullYear(new Date(membership.end_date).getFullYear() + 1))
          .toISOString()
          .split("T")[0]
      : "";

    const newEndDate = window.prompt(t("membership.renewPrompt", "Enter new end date (YYYY-MM-DD):"), defaultEnd);
    if (!newEndDate) return;

    const amountStr = window.prompt(
      t("membership.renewAmountPrompt", "Enter renewal amount:"),
      membership.total_amount?.toString() || "",
    );
    if (!amountStr) return;

    try {
      setRenewLoading(membership.id);
      await membershipApi.renew({
        membership: membership.id,
        new_end_date: newEndDate,
        amount: parseFloat(amountStr),
      });
      toast.success(t("membership.renewSuccess", "Membership renewed successfully"));
      const response = await membershipApi.getAll({
        doctor_id: parseInt(id!),
        page_size: 100,
      });

      setMemberships(response.data.results);
    } catch (error) {
      console.error("Failed to renew membership:", error);
      toast.error(t("membership.renewFailed", "Failed to renew membership"));
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
      await membershipApi.addPayment(membershipToPay.id, paymentData);
      onPaymentModalClose();
      setMembershipToPay(null);
      // Refresh memberships and payments
      const response = await membershipApi.getAll({
        doctor_id: parseInt(id!),
        page_size: 100,
      });

      setMemberships(response.data.results);
      // Refresh payments too
      const paymentsResponse = await paymentsApi.list({
        doctor_id: parseInt(id!),
        page_size: 100,
      });

      setPayments(paymentsResponse.data.results);
    } catch (error) {
      console.error("Failed to add payment:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleToggleActive = () => {
    onToggleActiveModalOpen();
  };

  const handleConfirmToggleActive = async () => {
    if (!doctor) return;

    try {
      setToggleActiveLoading(true);
      await usersApi.toggleActive(doctor.id);

      // Refresh doctor details
      const response = await usersApi.getById(doctor.id);

      setDoctor(response.data);

      onToggleActiveModalClose();
    } catch (error) {
      console.error("Failed to toggle active status:", error);
    } finally {
      setToggleActiveLoading(false);
    }
  };

  const handleManualVerification = async () => {
    if (!doctor) return;
    try {
      setVerifyingLoading(true);
      await usersApi.verifyEmail(doctor.id);
      // Refresh doctor details
      const response = await usersApi.getById(doctor.id);

      setDoctor(response.data);
      toast.success(
        t("common.verifiedSuccessfully", "Email verified successfully"),
      );
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctor) return;
    try {
      setUploadingPassport(true);
      await usersApi.uploadPassportImage(doctor.id, file);
      const response = await usersApi.getById(doctor.id);
      setDoctor(response.data);
      toast.success(t("doctors.passportUploaded", "Document uploaded successfully"));
    } catch {
      toast.error(t("doctors.passportUploadFailed", "Failed to upload document"));
    } finally {
      setUploadingPassport(false);
      if (passportUploadRef.current) passportUploadRef.current.value = "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "warning";
      case "expired":
      case "failed":
      case "canceled":
        return "danger";
      default:
        return "default";
    }
  };

  if (doctorLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner color="primary" label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!doctor) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-default-500">
          {t("common.notFound")}
        </div>
      </DefaultLayout>
    );
  }

  const completion = calculateProfileCompletion(
    profileCompletionValuesFromUser(doctor),
    doctor.user_type === "doctor",
  );
  const completionColor =
    completion.percentage >= 80
      ? "success"
      : completion.percentage >= 50
        ? "warning"
        : "danger";

  const hasProfessionalDetails = Boolean(
    doctor.branches?.length ||
      doctor.full_doctor_number ||
      doctor.doctor_number ||
      doctor.membership_number ||
      doctor.bio ||
      doctor.institutions?.length ||
      doctor.managed_branches?.length ||
      doctor.dynamic_field_values?.length,
  );

  return (
    <DefaultLayout>
      <div className="min-h-screen font-sans space-y-6 pb-10">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <Button
            className="font-medium text-default-600 hover:text-foreground"
            startContent={
              <FiArrowLeft className={isRtl ? "rotate-180" : ""} />
            }
            variant="light"
            onPress={() => navigate("/doctors")}
          >
            {t("common.back")}
          </Button>

          <div className="flex items-center gap-2">
            <DoctorStatusSwitcher doctor={doctor} onUpdated={setDoctor} />

            {/* Primary actions — visible on sm+ screens */}
            <div className="hidden sm:flex flex-wrap gap-2">
              {!doctor.email_verified && (
                <Button
                  color="success"
                  isLoading={verifyingLoading}
                  startContent={<FiCheck />}
                  variant="flat"
                  onPress={handleManualVerification}
                >
                  {t("common.verifyManually", "Verify Manually")}
                </Button>
              )}
              <Button
                color="primary"
                variant="shadow"
                startContent={<FiEdit />}
                onPress={() => navigate(`/doctors/${id}/edit`)}
              >
                {t("common.edit")}
              </Button>
            </div>

            {/* Secondary actions menu (all actions on mobile) */}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly color="primary" variant="flat">
                  <FiMoreVertical size={20} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                {!doctor.email_verified ? (
                  <DropdownItem
                    key="verify"
                    className="sm:hidden"
                    startContent={<FiCheck className="text-success" />}
                    onPress={handleManualVerification}
                  >
                    {t("common.verifyManually", "Verify Manually")}
                  </DropdownItem>
                ) : null}
                <DropdownItem
                  key="edit"
                  className="sm:hidden"
                  startContent={<FiEdit />}
                  onPress={() => navigate(`/doctors/${id}/edit`)}
                >
                  {t("common.edit")}
                </DropdownItem>
                {doctor.passport_image ? (
                  <DropdownItem
                    key="passport"
                    startContent={<FiFileText />}
                    onPress={onPassportModalOpen}
                  >
                    {t("doctors.viewPassport", "View Passport")}
                  </DropdownItem>
                ) : null}
                <DropdownItem
                  key="upload-passport"
                  isDisabled={uploadingPassport}
                  startContent={<FiUpload />}
                  onPress={() => passportUploadRef.current?.click()}
                >
                  {doctor.passport_image
                    ? t("doctors.updatePassport", "Update Document")
                    : t("doctors.uploadPassport", "Upload Document")}
                </DropdownItem>
                <DropdownItem
                  key="send-notification"
                  startContent={<FiSend className="text-primary" />}
                  onPress={() => navigate(`/notifications/send?userId=${id}`)}
                >
                  {t("notifications.sendSingle", "Send Notification")}
                </DropdownItem>
                <DropdownItem
                  key="status"
                  className={doctor.is_active ? "text-danger" : "text-success"}
                  startContent={
                    doctor.is_active ? (
                      <FiXCircle className="text-danger" />
                    ) : (
                      <FiCheckCircle className="text-success" />
                    )
                  }
                  onPress={handleToggleActive}
                >
                  {doctor.is_active
                    ? t("common.deactivate")
                    : t("common.activate")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Doctor Details Profile Card */}
        <div className="bg-content1 rounded-[32px] overflow-hidden shadow-sm border border-default-200">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Profile Image & Main Info */}
            <div className="lg:w-80 shrink-0 bg-default-50/50 border-b lg:border-b-0 lg:border-e border-default-200 p-8 flex flex-col items-center justify-center text-center">
              <Avatar
                isBordered
                className="w-32 h-32 text-4xl mb-4"
                color={doctor.is_active ? "primary" : "default"}
                fallback={<FiUser className="text-4xl" />}
                imgProps={{ className: "object-cover" }}
                src={doctor.profile_image}
              />
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {doctor.first_name_field && doctor.family_name
                  ? `${doctor.first_name_field} ${doctor.father_name || ""} ${doctor.grandfather_name || ""} ${doctor.family_name}`.trim()
                  : doctor.full_name || doctor.username}
              </h2>
              {/* English name if available */}
              {(doctor.first_name_en || doctor.family_name_en) && (
                <p className="text-default-400 mb-1">
                  {`${doctor.first_name_en} ${doctor.father_name_en || ""} ${doctor.grandfather_name_en || ""} ${doctor.family_name_en}`.trim()}
                </p>
              )}
              <p className="text-default-500 mb-4">{doctor.email}</p>

              <div className="flex flex-wrap justify-center gap-2">
                {doctor.approval_status && doctor.approval_status !== "approved" && (
                  <Chip
                    className="border-none"
                    color={doctor.approval_status === "pending" ? "warning" : "danger"}
                    size="sm"
                    variant="flat"
                  >
                    {t(`doctors.status.${doctor.approval_status}`)}
                  </Chip>
                )}
                <Chip
                  className="border-none"
                  color={doctor.email_verified ? "success" : "warning"}
                  size="sm"
                  startContent={
                    doctor.email_verified ? (
                      <FiCheck size={12} />
                    ) : (
                      <FiAlertCircle size={12} />
                    )
                  }
                  variant="flat"
                >
                  {doctor.email_verified
                    ? t("common.verified", "Verified")
                    : t("common.unverified", "Unverified")}
                </Chip>
                <Chip
                  className="border-none"
                  color={doctor.is_active ? "success" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {doctor.is_active ? t("common.active") : t("common.inactive")}
                </Chip>
                {!doctor.passport_image && (
                  <Chip
                    className="border-none"
                    color="danger"
                    size="sm"
                    startContent={<FiAlertCircle size={12} />}
                    variant="flat"
                  >
                    {t("doctors.noDocument", "Document Missing")}
                  </Chip>
                )}
              </div>

              {/* Profile Completion */}
              <div className="mt-5 w-full text-start">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-default-600 flex items-center gap-1">
                    <FiTrendingUp size={13} />
                    {t("member.profileCompletion")}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      completionColor === "success"
                        ? "text-success"
                        : completionColor === "warning"
                          ? "text-warning"
                          : "text-danger"
                    }`}
                  >
                    {completion.percentage}%
                  </span>
                </div>
                <Progress
                  aria-label={t("member.profileCompletion")}
                  color={completionColor}
                  radius="full"
                  size="sm"
                  value={completion.percentage}
                />
                {completion.missingFields.length > 0 && (
                  <p className="text-tiny text-default-400 mt-2 leading-relaxed">
                    {completion.missingFields
                      .map((field) => t(PROFILE_FIELD_LABEL_KEYS[field]))
                      .join(" · ")}
                  </p>
                )}
              </div>

              {!doctor.passport_image && (
                <div className="mt-4 w-full p-3 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-2">
                  <FiAlertCircle className="text-warning-600 mt-0.5 shrink-0" size={16} />
                  <div className="text-start">
                    <p className="text-xs font-semibold text-warning-700">
                      {t("doctors.noDocumentTitle", "Verification Document Missing")}
                    </p>
                    <p className="text-xs text-warning-600 mt-0.5">
                      {t("doctors.noDocumentDesc", "Upload a passport or national ID to verify this doctor's identity.")}
                    </p>
                    <button
                      className="mt-2 text-xs font-semibold text-warning-700 underline underline-offset-2 hover:text-warning-800"
                      type="button"
                      onClick={() => passportUploadRef.current?.click()}
                    >
                      {t("doctors.uploadPassport", "Upload Document")}{" "}
                      {isRtl ? "←" : "→"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Detailed Info Grid */}
            <div className="flex-1 p-8">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FiInfo className="text-primary" />{" "}
                {t("common.information", "Basic Information")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-y-6 gap-x-8">
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiUser size={14} /> {t("users.form.username")}
                  </p>
                  <p className="font-medium text-base">{doctor.username}</p>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiUser size={14} /> {t("users.form.userType")}
                  </p>
                  <p className="font-medium text-base">
                    {t(`users.userTypes.${doctor.user_type}`, doctor.user_type)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiPhone size={14} /> {t("users.form.phone")}
                  </p>
                  <p className="font-medium text-base">
                    <span dir="ltr">{doctor.phone_number || "-"}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiGlobe size={14} /> {t("users.form.language")}
                  </p>
                  <p className="font-medium text-base">
                    {doctor.language === "ar"
                      ? t("users.languages.ar")
                      : t("users.languages.en")}
                  </p>
                </div>

                {doctor.gender && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiUser size={14} /> {t("users.form.gender", "Gender")}
                    </p>
                    <p className="font-medium text-base">
                      {doctor.gender === "male"
                        ? t("users.genders.male", "Male")
                        : t("users.genders.female", "Female")}
                    </p>
                  </div>
                )}

                {doctor.nationality && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiGlobe size={14} /> {t("users.form.nationality")}
                    </p>
                    <p className="font-medium text-base">
                      {t(
                        `nationalities.list.${doctor.nationality}`,
                        doctor.nationality,
                      )}
                    </p>
                  </div>
                )}

                {doctor.birthdate && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiCalendar size={14} /> {t("auth.birthdate")}
                    </p>
                    <p className="font-medium text-base">
                      {formatDate(doctor.birthdate)}
                    </p>
                  </div>
                )}

                {(doctor.city_detail || doctor.city) && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiMapPin size={14} /> {t("auth.city")}
                    </p>
                    <p className="font-medium text-base">
                      {doctor.city_detail?.name || doctor.city}
                    </p>
                  </div>
                )}

                {doctor.address && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiMapPin size={14} /> {t("auth.address")}
                    </p>
                    <p className="font-medium text-base break-words">
                      <bdi>{doctor.address}</bdi>
                    </p>
                  </div>
                )}

                {doctor.university_name && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiFileText size={14} /> {t("auth.university")}
                    </p>
                    <p className="font-medium text-base break-words">
                      <bdi>{doctor.university_name}</bdi>
                    </p>
                  </div>
                )}

                {doctor.current_degree && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiCheckCircle size={14} /> {t("auth.degree")}
                    </p>
                    <p className="font-medium text-base">
                      {doctor.current_degree}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiCalendar size={14} /> {t("users.table.dateJoined")}
                  </p>
                  <p className="font-medium text-base">
                    {formatDate(doctor.date_joined)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiCheckCircle size={14} /> {t("users.form.isStaff")}
                  </p>
                  <Chip
                    color={doctor.is_staff ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {doctor.is_staff ? t("common.yes") : t("common.no")}
                  </Chip>
                </div>

                {doctor.specialty && (
                  <div className="col-span-full">
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiCheckCircle size={14} /> {t("users.form.specialty")}
                    </p>
                    <Chip color="primary" size="lg" variant="flat">
                      {doctor.specialty}
                    </Chip>
                  </div>
                )}
              </div>

              {doctor.group_names && doctor.group_names.length > 0 && (
                <>
                  <Divider className="my-6" />
                  <div>
                    <p className="text-sm text-default-500 mb-2">
                      {t("users.form.groups")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.group_names.map((group, i) => (
                        <Chip
                          key={i}
                          className="bg-default-100"
                          size="sm"
                          variant="flat"
                        >
                          {group}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Professional Details + Memberships */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {hasProfessionalDetails && (
          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader className="px-8 pt-6 pb-4 border-b border-default-100">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiFileText className="text-primary" />
                {doctor.branches?.length
                  ? t("doctors.form.branchRequirementsTitle", { branchName: doctor.branches[0].name })
                  : t("doctors.form.professionalDetails")}
              </h3>
            </CardHeader>
            <CardBody className="px-8 py-6">
              <div className="divide-y divide-default-100">
                {(doctor.full_doctor_number || doctor.doctor_number) && (
                  <DetailRow
                    icon={<FiFileText size={14} />}
                    label={t("doctors.licenseNumberLabel")}
                  >
                    <p className="font-medium text-base font-mono break-all">
                      <span dir="ltr">
                        {doctor.full_doctor_number || doctor.doctor_number}
                      </span>
                    </p>
                  </DetailRow>
                )}

                {doctor.membership_number && (
                  <DetailRow
                    icon={<FiCreditCard size={14} />}
                    label={t("auth.membershipNumber")}
                  >
                    <p className="font-medium text-base font-mono break-all">
                      <span dir="ltr">{doctor.membership_number}</span>
                    </p>
                  </DetailRow>
                )}

                {(doctor.dynamic_field_values || []).map((value) => {
                  const label = isRtl
                    ? value.field_label_ar
                    : value.field_label_en || value.field_label_ar;

                  const fieldDef = (doctor.branches || [])
                    .flatMap((b) => b.dynamic_fields || [])
                    .find((f) => f.id === value.field_id);
                  const selectedOption = fieldDef?.options?.find(
                    (o) => o.value === value.value_text,
                  );
                  const textDisplay = selectedOption
                    ? isRtl
                      ? selectedOption.label_ar
                      : selectedOption.label_en || selectedOption.label_ar
                    : value.value_text;

                  return (
                    <DetailRow key={value.id} label={<bdi>{label}</bdi>}>
                      {value.field_type === "boolean" ? (
                        <Chip
                          color={value.value_boolean ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {value.value_boolean
                            ? t("common.yes")
                            : t("common.no")}
                        </Chip>
                      ) : value.field_type === "file" ? (
                        value.value_file ? (
                          <a
                            className="font-medium text-base text-primary underline underline-offset-2"
                            href={value.value_file}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t("common.fileUploaded")}
                          </a>
                        ) : (
                          <p className="font-medium text-base text-default-400">
                            —
                          </p>
                        )
                      ) : (
                        <p className="font-medium text-base break-words">
                          <bdi>{textDisplay || "—"}</bdi>
                        </p>
                      )}
                    </DetailRow>
                  );
                })}

                {doctor.branches && doctor.branches.length > 0 && (
                  <DetailRow
                    icon={<FiMapPin size={14} />}
                    label={t("doctors.form.branches")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {doctor.branches.map((branch) => (
                        <Chip
                          key={branch.id}
                          className="bg-secondary-50 text-secondary-600"
                          color="secondary"
                          size="sm"
                          variant="flat"
                        >
                          {branch.name} ({branch.prefix})
                        </Chip>
                      ))}
                    </div>
                  </DetailRow>
                )}

                {doctor.managed_branches && doctor.managed_branches.length > 0 && (
                  <DetailRow
                    icon={<FiMapPin size={14} />}
                    label={t("users.form.managedBranches")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {doctor.managed_branches.map((branch) => (
                        <Chip
                          key={branch.id}
                          color="warning"
                          size="sm"
                          variant="flat"
                        >
                          {branch.name} {branch.prefix ? `(${branch.prefix})` : ""}
                        </Chip>
                      ))}
                    </div>
                  </DetailRow>
                )}

                {doctor.institutions && doctor.institutions.length > 0 && (
                  <DetailRow
                    icon={<FiMapPin size={14} />}
                    label={t("doctors.form.institutions")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {doctor.institutions.map((inst) => (
                        <Chip
                          key={inst.id}
                          className="bg-secondary-50 text-secondary-600"
                          color="secondary"
                          size="sm"
                          variant="flat"
                        >
                          {inst.name}
                        </Chip>
                      ))}
                    </div>
                  </DetailRow>
                )}

                {doctor.bio && (
                  <DetailRow
                    icon={<FiFileText size={14} />}
                    label={t("doctors.form.cvLabel")}
                  >
                    <p className="text-default-700 leading-relaxed whitespace-pre-line">
                      {doctor.bio}
                    </p>
                  </DetailRow>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Memberships Card */}
        <Card
          classNames={{
            base: `rounded-[32px] shadow-sm border border-default-200 ${
              hasProfessionalDetails ? "" : "xl:col-span-2"
            }`,
          }}
        >
          <CardHeader className="px-8 pt-6 pb-4 border-b border-default-100">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiCreditCard className="text-primary" />
              {t("membership.memberships")}
              {!membershipsLoading && (
                <Chip color="primary" size="sm" variant="flat">
                  {memberships.length}
                </Chip>
              )}
            </h3>
          </CardHeader>
          <CardBody className="px-4 py-4">
            {membershipsLoading ? (
              <div className="flex justify-center p-10">
                <Spinner />
              </div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiFileText className="text-default-400 text-2xl" />
                </div>
                <p className="text-default-500">
                  {t("membership.noMemberships")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  removeWrapper
                  aria-label="Doctor memberships"
                  color="primary"
                  selectionMode="none"
                >
                  <TableHeader>
                    <TableColumn>
                      {t("membership.membershipNumber")}
                    </TableColumn>
                    <TableColumn>{t("membership.type")}</TableColumn>
                    <TableColumn>{t("membership.startDate")}</TableColumn>
                    <TableColumn>{t("membership.endDate")}</TableColumn>
                    <TableColumn>{t("payments.table.amount")}</TableColumn>
                    <TableColumn>{t("payments.totalPayments")}</TableColumn>
                    <TableColumn>{t("membership.status")}</TableColumn>
                    <TableColumn>{t("membership.paymentStatus")}</TableColumn>
                    <TableColumn>{t("common.actions")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((membership) => (
                      <TableRow key={membership.id}>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold text-default-700">
                            {membership.membership_number || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {typeof membership.membership_type === "object"
                            ? membership.membership_type.name
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(membership.start_date)}
                        </TableCell>
                        <TableCell>
                          {membership.end_date
                            ? formatDate(membership.end_date)
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            parseFloat(
                              membership.total_amount.toString() || "0",
                            ),
                            "ar-LY",
                            "LYD",
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            parseFloat(
                              membership.paid_amount.toString() || "0",
                            ),
                            "ar-LY",
                            "LYD",
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(membership.status)}
                            size="sm"
                            variant="flat"
                          >
                            {t(`membership.${membership.status}`)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              membership.payment_status === "paid"
                                ? "success"
                                : membership.payment_status === "partial"
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {t(
                              `membership.paymentStatus${membership.payment_status.charAt(0).toUpperCase() + membership.payment_status.slice(1)}`,
                            )}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <FiMoreVertical />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                startContent={<FiEdit />}
                                onPress={() =>
                                  navigate(
                                    `/memberships/${membership.id}/edit`,
                                  )
                                }
                              >
                                {t("membership.editMembership")}
                              </DropdownItem>
                              {membership.payment_status !== "paid" ? (
                                <DropdownItem
                                  key="pay"
                                  className="text-success"
                                  startContent={<GiTakeMyMoney />}
                                  onPress={() =>
                                    handlePaymentClick(membership)
                                  }
                                >
                                  {t("payment.addPayment")}
                                </DropdownItem>
                              ) : null}
                              {membership.status === "expired" ? (
                                <DropdownItem
                                  key="renew"
                                  isDisabled={renewLoading === membership.id}
                                  startContent={<FiRefreshCw />}
                                  onPress={() => handleRenew(membership)}
                                >
                                  {t("membership.renew")}
                                </DropdownItem>
                              ) : null}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
        </div>

        {/* Tabs Section */}
        <div className="bg-content1 rounded-[32px] shadow-sm border border-default-200 min-h-[500px]">
          <Tabs
            aria-label="Doctor details"
            classNames={{
              base: "px-6 pt-6",
              tabList: "bg-default-100 rounded-full p-1.5 gap-1",
              cursor: "rounded-full shadow-sm",
              tab: "px-5 h-9",
              tabContent:
                "font-medium text-base group-data-[selected=true]:text-primary-foreground",
            }}
            color="primary"
            radius="full"
            variant="solid"
          >
            {/* Certifications Tab */}
            <Tab
              key="certifications"
              title={
                <div className="flex items-center gap-2">
                  <span>{t("certifications.certifications")}</span>
                  {!certificationsLoading && (
                    <Chip color="secondary" size="sm" variant="flat">
                      {certifications.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="p-6">
                {certificationsLoading ? (
                  <div className="flex justify-center p-10">
                    <Spinner />
                  </div>
                ) : certifications.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FiCheckCircle className="text-default-400 text-2xl" />
                    </div>
                    <p className="text-default-500">
                      {t("certifications.noCertifications")}
                    </p>
                  </div>
                ) : (
                  <Table removeWrapper aria-label="Doctor certifications">
                    <TableHeader>
                      <TableColumn>
                        {t("certifications.certificationType")}
                      </TableColumn>
                      <TableColumn>{t("certifications.issueDate")}</TableColumn>
                      <TableColumn>
                        {t("certifications.expiryDate")}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {certifications.map((certification) => (
                        <TableRow key={certification.id}>
                          <TableCell className="font-medium">
                            {typeof certification.certification_type ===
                              "object" &&
                            certification.certification_type !== null
                              ? certification.certification_type.name
                              : t("common.notSpecified")}
                          </TableCell>
                          <TableCell>
                            {formatDate(certification.issue_date)}
                          </TableCell>
                          <TableCell>
                            {certification.expiry_date
                              ? formatDate(certification.expiry_date)
                              : t("certifications.noExpiry")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Tab>

            {/* Payment History Tab */}
            <Tab
              key="payments"
              title={
                <div className="flex items-center gap-2">
                  <span>{t("payments.paymentHistory")}</span>
                  {!paymentsLoading && (
                    <Chip color="warning" size="sm" variant="flat">
                      {payments.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="p-6">
                {paymentsLoading ? (
                  <div className="flex justify-center p-10">
                    <Spinner />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <GiTakeMyMoney className="text-default-400 text-2xl" />
                    </div>
                    <p className="text-default-500">
                      {t("payments.noRecords")}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-default-50 p-6 rounded-2xl border border-default-200">
                        <p className="text-sm text-default-500">
                          {t("payments.totalPayments")}
                        </p>
                        <p className="text-3xl font-bold text-success mt-2">
                          {formatCurrency(
                            payments.reduce(
                              (sum, p) => sum + parseFloat(p.amount || "0"),
                              0,
                            ),
                            "ar-LY",
                            "LYD",
                          )}
                        </p>
                      </div>
                      <div className="bg-default-50 p-6 rounded-2xl border border-default-200">
                        <p className="text-sm text-default-500">
                          {t("payments.totalTransactions")}
                        </p>
                        <p className="text-3xl font-bold text-primary mt-2">
                          {payments.length}
                        </p>
                      </div>
                      <div className="bg-default-50 p-6 rounded-2xl border border-default-200">
                        <p className="text-sm text-default-500">
                          {t("payments.averagePayment")}
                        </p>
                        <p className="text-3xl font-bold text-foreground mt-2">
                          {payments.length > 0
                            ? formatCurrency(
                                payments.reduce(
                                  (sum, p) => sum + parseFloat(p.amount || "0"),
                                  0,
                                ) / payments.length,
                                "ar-LY",
                                "LYD",
                              )
                            : formatCurrency(0, "ar-LY", "LYD")}
                        </p>
                      </div>
                    </div>

                    {/* Payment Table */}
                    <Table removeWrapper aria-label="Payment history">
                      <TableHeader>
                        <TableColumn>
                          {t("payments.referenceNumber")}
                        </TableColumn>
                        <TableColumn>{t("payments.table.amount")}</TableColumn>
                        <TableColumn>{t("payments.table.method")}</TableColumn>
                        <TableColumn>
                          {t("payments.table.paymentDate")}
                        </TableColumn>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-sm">
                              {payment.reference_number || `#${payment.id}`}
                            </TableCell>
                            <TableCell className="font-semibold text-success">
                              {formatCurrency(
                                parseFloat(payment.amount || "0"),
                                "ar-LY",
                                "LYD",
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip size="sm" variant="flat">
                                {payment.payment_method ||
                                  t("common.notSpecified")}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              {formatDate(payment.payment_date || "")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      <Toaster position="top-right" />

      {/* Hidden passport upload input */}
      <input
        ref={passportUploadRef}
        accept="image/*,application/pdf"
        className="hidden"
        type="file"
        onChange={handlePassportUpload}
      />

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

      {/* Passport Modal */}
      <Modal
        isOpen={isPassportModalOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={onPassportModalClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("doctors.fields.passportImage")}
              </ModalHeader>
              <ModalBody>
                {doctor.passport_image ? (
                  <div className="flex justify-center pb-6">
                    <img
                      alt="Passport"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      src={doctor.passport_image}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-default-500">{t("common.notFound")}</p>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Toggle Active Confirmation Modal */}
      <Modal
        isOpen={isToggleActiveModalOpen}
        onClose={onToggleActiveModalClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {doctor?.is_active
                  ? t("doctors.deactivateAccount")
                  : t("doctors.activateAccount")}
              </ModalHeader>
              <ModalBody>
                <p>
                  {doctor?.is_active
                    ? t("doctors.deactivateConfirm")
                    : t("doctors.activateConfirm")}
                </p>
              </ModalBody>
              <div className="flex justify-end gap-2 p-4">
                <Button variant="light" onPress={onToggleActiveModalClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color={doctor?.is_active ? "danger" : "success"}
                  isLoading={toggleActiveLoading}
                  onPress={handleConfirmToggleActive}
                >
                  {doctor?.is_active
                    ? t("common.deactivate")
                    : t("common.activate")}
                </Button>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
