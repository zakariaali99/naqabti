import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Spinner,
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
  Avatar,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  FiEdit,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiCheck,
  FiAlertCircle,
  FiPhone,
  FiCalendar,
  FiGlobe,
  FiMapPin,
  FiInfo,
  FiAward,
  FiCreditCard,
  FiUpload,
  FiTrendingUp,
  FiAlertTriangle,
  FiTrash2,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import toast from "react-hot-toast";

import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";
import certificationsApi from "@/api/certificationsApi";
import { paymentsApi } from "@/api/paymentsApi";
import usersApi from "@/api/usersApi";
import { Certification } from "@/models/certifications";
import { Payment } from "@/models/payments";
import { formatDate } from "@/misc/formatDate";
import { formatCurrency } from "@/misc/formatCurrency";
import { calculateProfileCompletion } from "@/utils/profileCompletion";

export default function MemberProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);
  const logout = useUserStore((state) => state.logout);
  const { isRTL } = useLanguageStore();

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [certificationsLoading, setCertificationsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const docUploadRef = useRef<HTMLInputElement>(null);

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    try {
      setDeletingAccount(true);
      await usersApi.deleteMe();
      toast.success(t("member.deleteSuccess", "Your account has been deleted successfully"));
      await logout();
      navigate("/login");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          t("member.deleteError", "Failed to delete account. Please try again later."),
      );
    } finally {
      setDeletingAccount(false);
      setIsDeleteOpen(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingDoc(true);
      await usersApi.uploadPassportImage(user.id, file);
      await fetchUserProfile();
      toast.success(t("member.docUploadSuccess"));
    } catch {
      toast.error(t("common.saveError", "Failed to upload document"));
    } finally {
      setUploadingDoc(false);
      if (docUploadRef.current) docUploadRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchCertifications = async () => {
      try {
        setCertificationsLoading(true);
        const response = await certificationsApi.getAll({
          doctor_id: user.id,
          page_size: 100,
        });
        setCertifications(response.data.results || []);
      } catch {
        toast.error(t("common.loadError", "Failed to load certifications"));
      } finally {
        setCertificationsLoading(false);
      }
    };

    const fetchPayments = async () => {
      try {
        setPaymentsLoading(true);
        const response = await paymentsApi.list({
          doctor_id: user.id,
          page_size: 100,
        });
        setPayments(response.data.results || []);
      } catch {
        toast.error(t("common.loadError", "Failed to load payments"));
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchCertifications();
    fetchPayments();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const isDoctor = user.user_type === "doctor";
  const { percentage: completionPercentage } = calculateProfileCompletion(
    user,
    isDoctor,
  );

  const fullNameAr = [
    user.first_name_field,
    user.father_name,
    user.grandfather_name,
    user.family_name,
  ]
    .filter(Boolean)
    .join(" ");

  const fullNameEn = [
    user.first_name_en,
    user.father_name_en,
    user.grandfather_name_en,
    user.family_name_en,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="min-h-screen font-sans space-y-6 pb-10 max-w-7xl mx-auto p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold">{t("member.myProfile", "My Profile")}</h1>
          <p className="text-default-500 text-sm mt-1">
            {t("member.myProfileDesc", "View and manage your personal information")}
          </p>
        </div>
        <Button
          color="primary"
          startContent={<FiEdit />}
          variant="shadow"
          onPress={() => navigate("/member/profile/edit")}
        >
          {t("member.editProfile", "Edit Profile")}
        </Button>
      </div>

      {isDoctor && (
        <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <FiTrendingUp size={18} />
              </div>
              <span className="font-bold text-foreground">
                {t("member.profileCompletion")}
              </span>
            </div>
            <span
              className={`font-black text-lg ${isRTL ? "font-arabic-numerals" : ""}`}
            >
              {completionPercentage}%
            </span>
          </div>
          <Progress
            color="primary"
            value={completionPercentage}
            className="w-full"
            size="md"
            radius="full"
          />
          {completionPercentage < 100 && (
            <div className="flex justify-end mt-3">
              <Button
                as={Link}
                color="primary"
                size="sm"
                to="/member/profile/edit"
                variant="light"
              >
                {t("member.editProfile", "Edit Profile")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-content1 rounded-[32px] overflow-hidden shadow-sm border border-default-200">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Avatar & Main Info */}
          <div className="lg:w-80 bg-default-50/50 border-b lg:border-b-0 lg:border-r border-default-200 p-8 flex flex-col items-center justify-center text-center">
            <Avatar
              isBordered
              className="w-32 h-32 text-4xl mb-4"
              color={user.is_active ? "primary" : "default"}
              fallback={<FiUser className="text-4xl" />}
              imgProps={{ className: "object-cover" }}
              src={user.profile_image}
            />
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {fullNameAr || user.full_name || user.username}
            </h2>
            {fullNameEn && (
              <p className="text-default-400 mb-1">{fullNameEn}</p>
            )}
            <p className="text-default-500 mb-4">{user.email}</p>

            <div className="flex flex-wrap justify-center gap-2">
              <Chip
                className="border-none"
                color={user.email_verified ? "success" : "warning"}
                size="sm"
                startContent={
                  user.email_verified ? (
                    <FiCheck size={12} />
                  ) : (
                    <FiAlertCircle size={12} />
                  )
                }
                variant="flat"
              >
                {user.email_verified
                  ? t("common.verified", "Verified")
                  : t("common.unverified", "Unverified")}
              </Chip>
              <Chip
                className="border-none"
                color={user.is_active ? "success" : "default"}
                size="sm"
                variant="flat"
              >
                {user.is_active ? t("common.active") : t("common.inactive")}
              </Chip>
              {!user.passport_image && (
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

            {/* Missing document warning */}
            {!user.passport_image && (
              <div className="mt-4 w-full p-3 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-2">
                <FiAlertCircle className="text-warning-600 mt-0.5 shrink-0" size={16} />
                <div className="text-start">
                  <p className="text-xs font-semibold text-warning-700">
                    {t("doctors.noDocumentTitle", "Verification Document Missing")}
                  </p>
                  <p className="text-xs text-warning-600 mt-0.5">
                    {t("member.docUploadDesc")}
                  </p>
                  <Button
                    className="mt-2 h-7 text-xs font-semibold"
                    color="warning"
                    isLoading={uploadingDoc}
                    size="sm"
                    startContent={!uploadingDoc && <FiUpload size={12} />}
                    variant="flat"
                    onPress={() => docUploadRef.current?.click()}
                  >
                    {t("member.uploadDoc")}
                  </Button>
                </div>
              </div>
            )}

            {/* Passport image preview */}
            {user.passport_image && (
              <div className="mt-6 w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-default-400">
                    {t("doctors.fields.passportImage", "Passport / ID")}
                  </p>
                  <Button
                    className="h-6 text-xs"
                    isLoading={uploadingDoc}
                    size="sm"
                    startContent={!uploadingDoc && <FiUpload size={11} />}
                    variant="light"
                    onPress={() => docUploadRef.current?.click()}
                  >
                    {t("doctors.updatePassport", "Update")}
                  </Button>
                </div>
                <img
                  alt="Passport"
                  className="w-full max-h-40 object-contain rounded-xl border border-default-200"
                  src={user.passport_image}
                />
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={docUploadRef}
              accept="image/*,application/pdf"
              className="hidden"
              type="file"
              onChange={handleDocUpload}
            />
          </div>

          {/* Right: Detailed Info Grid */}
          <div className="flex-1 p-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FiInfo className="text-primary" />
              {t("common.information", "Basic Information")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                  <FiUser size={14} /> {t("users.form.username")}
                </p>
                <p className="font-medium text-base">{user.username}</p>
              </div>

              {user.full_doctor_number && (
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiFileText size={14} /> {t("doctors.doctorNumber", "Doctor Number")}
                  </p>
                  <p className="font-medium text-base font-mono">
                    {user.full_doctor_number}
                  </p>
                </div>
              )}

              {user.phone_number && (
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiPhone size={14} /> {t("users.form.phone")}
                  </p>
                  <p className="font-medium text-base" dir="ltr">
                    {user.phone_number}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                  <FiGlobe size={14} /> {t("users.form.language")}
                </p>
                <p className="font-medium text-base">
                  {user.language === "ar"
                    ? t("users.languages.ar")
                    : t("users.languages.en")}
                </p>
              </div>

              <div>
                <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                  <FiCalendar size={14} /> {t("users.table.dateJoined")}
                </p>
                <p className="font-medium text-base">{formatDate(user.date_joined)}</p>
              </div>

              {user.gender && (
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiUser size={14} /> {t("users.form.gender", "Gender")}
                  </p>
                  <p className="font-medium text-base">
                    {user.gender === "male"
                      ? t("users.genders.male", "Male")
                      : t("users.genders.female", "Female")}
                  </p>
                </div>
              )}

              {user.nationality && (
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiGlobe size={14} /> {t("users.form.nationality")}
                  </p>
                  <p className="font-medium text-base">
                    {t(`nationalities.list.${user.nationality}`, user.nationality)}
                  </p>
                </div>
              )}
            </div>

            {(user.specialty ||
              user.bio ||
              (user.branches && user.branches.length > 0) ||
              (user.dynamic_field_values && user.dynamic_field_values.length > 0)) && (
              <>
                <Divider className="my-6" />
                <div className="space-y-6">
                  {user.specialty && (
                    <div>
                      <p className="text-sm text-default-500 mb-2 flex items-center gap-1">
                        <FiCheckCircle size={14} /> {t("users.form.specialty")}
                      </p>
                      <Chip color="primary" size="lg" variant="flat">
                        {user.specialty}
                      </Chip>
                    </div>
                  )}

                  {user.bio && (
                    <div>
                      <p className="text-sm text-default-500 mb-1">{t("users.form.bio")}</p>
                      <p className="text-default-700 leading-relaxed">{user.bio}</p>
                    </div>
                  )}

                  {user.branches && user.branches.length > 0 && (
                    <div>
                      <p className="text-sm text-default-500 mb-2 flex items-center gap-1">
                        <FiMapPin size={14} /> {t("doctors.form.branches", "Branches")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.branches.map((branch) => (
                          <Chip
                            key={branch.id}
                            color="secondary"
                            size="sm"
                            variant="flat"
                          >
                            {branch.name} ({branch.prefix})
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.dynamic_field_values && user.dynamic_field_values.length > 0 && (
                    <div className="space-y-4">
                      {user.dynamic_field_values.map((value) => {
                        const label = isRTL
                          ? value.field_label_ar
                          : value.field_label_en || value.field_label_ar;

                        const fieldDef = (user.branches || [])
                          .flatMap((b) => b.dynamic_fields || [])
                          .find((f) => f.id === value.field_id);
                        const selectedOption = fieldDef?.options?.find(
                          (o) => o.value === value.value_text,
                        );
                        const textDisplay = selectedOption
                          ? isRTL
                            ? selectedOption.label_ar
                            : selectedOption.label_en || selectedOption.label_ar
                          : value.value_text;

                        return (
                          <div key={value.id}>
                            <p className="text-sm text-default-500 mb-1">{label}</p>
                            {value.field_type === "boolean" ? (
                              <Chip
                                color={value.value_boolean ? "success" : "default"}
                                size="sm"
                                variant="flat"
                              >
                                {value.value_boolean ? t("common.yes", "Yes") : t("common.no", "No")}
                              </Chip>
                            ) : value.field_type === "file" ? (
                              value.value_file ? (
                                <a
                                  className="text-primary text-sm underline"
                                  href={value.value_file}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {t("common.fileUploaded")}
                                </a>
                              ) : (
                                <p className="text-default-400 text-sm">—</p>
                              )
                            ) : (
                              <p className="text-default-700">{textDisplay || "—"}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Quick links */}
            <Divider className="my-6" />
            <div className="flex flex-wrap gap-3">
              <Button
                as={Link}
                color="primary"
                size="sm"
                startContent={<FiCreditCard />}
                to="/member/membership"
                variant="flat"
              >
                {t("member.viewMembership")}
              </Button>
              <Button
                as={Link}
                color="secondary"
                size="sm"
                startContent={<FiAward />}
                to="/member/certifications"
                variant="flat"
              >
                {t("member.myCertifications")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-content1 rounded-[32px] shadow-sm border border-default-200 min-h-[400px]">
        <Tabs
          aria-label="Profile details"
          classNames={{
            base: "border-b border-default-200 px-6",
            cursor: "w-full bg-primary",
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            tabContent:
              "group-data-[selected=true]:text-primary font-medium text-base py-4",
          }}
          variant="underlined"
        >
          {/* Certifications Tab */}
          <Tab
            key="certifications"
            title={
              <div className="flex items-center gap-2">
                <FiAward />
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
                  <Button
                    as={Link}
                    className="mt-4"
                    color="primary"
                    size="sm"
                    to="/member/certifications"
                    variant="flat"
                  >
                    {t("member.myCertifications")}
                  </Button>
                </div>
              ) : (
                <Table removeWrapper aria-label="Certifications">
                  <TableHeader>
                    <TableColumn>{t("certifications.certificationType")}</TableColumn>
                    <TableColumn>{t("certifications.issueDate")}</TableColumn>
                    <TableColumn>{t("certifications.expiryDate")}</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {certifications.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">
                          {typeof cert.certification_type === "object" &&
                          cert.certification_type !== null
                            ? cert.certification_type.name
                            : t("common.notSpecified")}
                        </TableCell>
                        <TableCell>{formatDate(cert.issue_date)}</TableCell>
                        <TableCell>
                          {cert.expiry_date
                            ? formatDate(cert.expiry_date)
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
                <GiTakeMyMoney />
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
                  <p className="text-default-500">{t("payments.noRecords")}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-default-50 p-6 rounded-2xl border border-default-200">
                      <p className="text-sm text-default-500">{t("payments.totalPayments")}</p>
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
                      <p className="text-sm text-default-500">{t("payments.totalTransactions")}</p>
                      <p className="text-3xl font-bold text-primary mt-2">{payments.length}</p>
                    </div>
                  </div>

                  <Table removeWrapper aria-label="Payment history">
                    <TableHeader>
                      <TableColumn>{t("payments.referenceNumber")}</TableColumn>
                      <TableColumn>{t("payments.table.amount")}</TableColumn>
                      <TableColumn>{t("payments.table.method")}</TableColumn>
                      <TableColumn>{t("payments.table.paymentDate")}</TableColumn>
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
                              {payment.payment_method || t("common.notSpecified")}
                            </Chip>
                          </TableCell>
                          <TableCell>{formatDate(payment.payment_date || "")}</TableCell>
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

      {/* Danger Zone */}
      <div className="bg-danger-50/40 border border-danger-200 dark:border-danger-900/50 rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-danger-700 dark:text-danger-400 font-semibold text-base flex items-center gap-2">
              <FiAlertTriangle className="text-danger-600 dark:text-danger-400" />
              {t("member.dangerZone", "Danger Zone")}
            </h3>
            <p className="text-danger-600/80 dark:text-danger-400/80 text-sm mt-1">
              {t(
                "member.deleteAccountDesc",
                "Once you delete your account, your profile will be deactivated and you will no longer have access to this portal.",
              )}
            </p>
          </div>
          <Button
            color="danger"
            startContent={<FiTrash2 />}
            variant="flat"
            onPress={() => setIsDeleteOpen(true)}
          >
            {t("member.deleteAccount", "Delete Account")}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-danger">
            <div className="flex items-center gap-2">
              <FiAlertTriangle />
              <span>{t("member.deleteAccountConfirmTitle", "Confirm Account Deletion")}</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600 text-sm">
              {t(
                "member.deleteAccountConfirmMessage",
                "Are you sure you want to delete your account? This will deactivate your account and log you out immediately.",
              )}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={deletingAccount}
              variant="light"
              onPress={() => setIsDeleteOpen(false)}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              color="danger"
              isLoading={deletingAccount}
              onPress={handleDeleteAccount}
            >
              {t("member.confirmDelete", "Delete My Account")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
