import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FiMoreVertical,
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
  FiBook,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { GiTakeMyMoney } from "react-icons/gi";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import certificationsApi from "@/api/certificationsApi";
import { paymentsApi } from "@/api/paymentsApi";
import { UserEntity } from "@/models/users";
import { Certification } from "@/models/certifications";
import { Payment } from "@/models/payments";
import { formatDate } from "@/misc/formatDate";
import { formatCurrency } from "@/misc/formatCurrency";

export default function StudentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<UserEntity | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [studentLoading, setStudentLoading] = useState(true);
  const [certificationsLoading, setCertificationsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [toggleActiveLoading, setToggleActiveLoading] = useState(false);
  const [verifyingLoading, setVerifyingLoading] = useState(false);

  const {
    isOpen: isToggleActiveModalOpen,
    onOpen: onToggleActiveModalOpen,
    onClose: onToggleActiveModalClose,
  } = useDisclosure();

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      try {
        setStudentLoading(true);
        const response = await usersApi.getById(parseInt(id));
        setStudent(response.data);
      } catch (error) {
        console.error("Failed to fetch student:", error);
      } finally {
        setStudentLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

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

  const handleConfirmToggleActive = async () => {
    if (!student) return;
    try {
      setToggleActiveLoading(true);
      await usersApi.toggleActive(student.id);
      const response = await usersApi.getById(student.id);
      setStudent(response.data);
      onToggleActiveModalClose();
    } catch (error) {
      console.error("Failed to toggle active status:", error);
    } finally {
      setToggleActiveLoading(false);
    }
  };

  const handleManualVerification = async () => {
    if (!student) return;
    try {
      setVerifyingLoading(true);
      await usersApi.verifyEmail(student.id);
      const response = await usersApi.getById(student.id);
      setStudent(response.data);
      toast.success(t("common.verifiedSuccessfully", "Email verified successfully"));
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    } finally {
      setVerifyingLoading(false);
    }
  };

  if (studentLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner color="primary" label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!student) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-default-500">
          {t("common.notFound")}
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div
        className="min-h-screen font-sans space-y-6 pb-10"
        dir={student.language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header Actions */}
        <div className="flex items-center justify-between px-2">
          <Button
            className="font-medium text-default-600 hover:text-foreground"
            startContent={
              <FiArrowLeft
                className={student.language === "ar" ? "rotate-180" : ""}
              />
            }
            variant="light"
            onPress={() => navigate("/students")}
          >
            {t("common.back")}
          </Button>

          <div className="flex items-center gap-2">
            {!student.email_verified && (
              <Button
                className="hidden sm:flex"
                color="success"
                isLoading={verifyingLoading}
                startContent={<FiCheck />}
                variant="flat"
                onPress={handleManualVerification}
              >
                {t("common.verifyManually", "Verify Manually")}
              </Button>
            )}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="sm:hidden"
                  color="primary"
                  variant="flat"
                >
                  <FiMoreVertical size={20} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Actions">
                {!student.email_verified ? (
                  <DropdownItem
                    key="verify"
                    startContent={<FiCheck />}
                    onPress={handleManualVerification}
                  >
                    {t("common.verifyManually", "Verify Manually")}
                  </DropdownItem>
                ) : null}
                <DropdownItem
                  key="status"
                  className={student.is_active ? "text-danger" : "text-success"}
                  startContent={
                    student.is_active ? (
                      <FiXCircle className="text-danger" />
                    ) : (
                      <FiCheckCircle className="text-success" />
                    )
                  }
                  onPress={onToggleActiveModalOpen}
                >
                  {student.is_active ? t("common.deactivate") : t("common.activate")}
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<FiEdit />}
                  onPress={() => navigate(`/students/${id}/edit`)}
                >
                  {t("common.edit")}
                </DropdownItem>
                <DropdownItem
                  key="send-notification"
                  startContent={<FiSend className="text-primary" />}
                  onPress={() => navigate(`/notifications/send?userId=${id}`)}
                >
                  {t("notifications.sendSingle", "Send Notification")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <div className="hidden sm:flex gap-2">
              <Button
                color={student.is_active ? "danger" : "success"}
                startContent={
                  student.is_active ? <FiXCircle /> : <FiCheckCircle />
                }
                variant="flat"
                onPress={onToggleActiveModalOpen}
              >
                {student.is_active ? t("common.deactivate") : t("common.activate")}
              </Button>
              <Button
                color="secondary"
                startContent={<FiSend />}
                variant="flat"
                onPress={() => navigate(`/notifications/send?userId=${id}`)}
              >
                {t("notifications.sendSingle", "Send Notification")}
              </Button>
              <Button
                color="primary"
                startContent={<FiEdit />}
                variant="shadow"
                onPress={() => navigate(`/students/${id}/edit`)}
              >
                {t("common.edit")}
              </Button>
            </div>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-content1 rounded-[32px] overflow-hidden shadow-sm border border-default-200">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Avatar & Summary */}
            <div className="lg:w-80 bg-default-50/50 border-b lg:border-b-0 lg:border-r border-default-200 p-8 flex flex-col items-center justify-center text-center">
              <Avatar
                isBordered
                className="w-32 h-32 text-4xl mb-4"
                color={student.is_active ? "primary" : "default"}
                fallback={<FiUser className="text-4xl" />}
                imgProps={{ className: "object-cover" }}
                src={student.profile_image}
              />
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {student.first_name_field && student.family_name
                  ? `${student.first_name_field} ${student.father_name || ""} ${student.grandfather_name || ""} ${student.family_name}`.trim()
                  : student.full_name || student.username}
              </h2>
              {student.first_name_en && student.family_name_en && (
                <p className="text-default-400 mb-1">
                  {`${student.first_name_en} ${student.father_name_en || ""} ${student.grandfather_name_en || ""} ${student.family_name_en}`.trim()}
                </p>
              )}
              <p className="text-default-500 mb-4">{student.email}</p>

              <div className="flex flex-wrap justify-center gap-2">
                <Chip
                  className="border-none"
                  color={student.email_verified ? "success" : "warning"}
                  size="sm"
                  startContent={
                    student.email_verified ? (
                      <FiCheck size={12} />
                    ) : (
                      <FiAlertCircle size={12} />
                    )
                  }
                  variant="flat"
                >
                  {student.email_verified
                    ? t("common.verified", "Verified")
                    : t("common.unverified", "Unverified")}
                </Chip>
                <Chip
                  className="border-none"
                  color={student.is_active ? "success" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {student.is_active ? t("common.active") : t("common.inactive")}
                </Chip>
              </div>
            </div>

            {/* Right: Info Grid */}
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
                  <p className="font-medium text-base">{student.username}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiPhone size={14} /> {t("users.form.phone")}
                  </p>
                  <p className="font-medium text-base" dir="ltr">
                    {student.phone_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiCalendar size={14} /> {t("users.form.birthdate")}
                  </p>
                  <p className="font-medium text-base">
                    {student.birthdate ? formatDate(student.birthdate) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiGlobe size={14} /> {t("users.form.language")}
                  </p>
                  <p className="font-medium text-base">
                    {student.language === "ar"
                      ? t("users.languages.ar")
                      : t("users.languages.en")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                    <FiCalendar size={14} /> {t("users.table.dateJoined")}
                  </p>
                  <p className="font-medium text-base">
                    {formatDate(student.date_joined)}
                  </p>
                </div>
                {student.gender && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiUser size={14} /> {t("users.form.gender", "Gender")}
                    </p>
                    <p className="font-medium text-base">
                      {student.gender === "male"
                        ? t("users.genders.male", "Male")
                        : t("users.genders.female", "Female")}
                    </p>
                  </div>
                )}
                {student.university_name && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiBook size={14} /> {t("students.form.university")}
                    </p>
                    <Chip color="primary" size="lg" variant="flat">
                      {student.university_name}
                    </Chip>
                  </div>
                )}
                {student.graduation_year && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiCalendar size={14} /> {t("students.form.graduationYear")}
                    </p>
                    <p className="font-medium text-base">{student.graduation_year}</p>
                  </div>
                )}
                {student.city && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiMapPin size={14} /> {t("students.form.city")}
                    </p>
                    <p className="font-medium text-base">{student.city}</p>
                  </div>
                )}
                {student.nationality && (
                  <div>
                    <p className="text-sm text-default-500 mb-1 flex items-center gap-1">
                      <FiGlobe size={14} /> {t("students.form.nationality")}
                    </p>
                    <p className="font-medium text-base">{student.nationality}</p>
                  </div>
                )}
              </div>

              {student.group_names && student.group_names.length > 0 && (
                <>
                  <Divider className="my-6" />
                  <div>
                    <p className="text-sm text-default-500 mb-2">
                      {t("users.form.groups")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {student.group_names.map((group, i) => (
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

        {student.branches && student.branches.length > 0 && (
          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h3 className="text-lg font-bold">
                {t("students.form.branchRequirementsTitle", { branchName: student.branches[0].name })}
              </h3>
            </CardHeader>
            <CardBody className="space-y-6">
              {student.dynamic_field_values && student.dynamic_field_values.length > 0 && (
                <div className="space-y-4">
                  {student.dynamic_field_values.map((value) => {
                    const isAr = student.language === "ar";
                    const label = isAr
                      ? value.field_label_ar
                      : value.field_label_en || value.field_label_ar;

                    const fieldDef = (student.branches || [])
                      .flatMap((b) => b.dynamic_fields || [])
                      .find((f) => f.id === value.field_id);
                    const selectedOption = fieldDef?.options?.find(
                      (o) => o.value === value.value_text,
                    );
                    const textDisplay = selectedOption
                      ? isAr
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
                            {value.value_boolean ? t("common.yes") : t("common.no")}
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

              <div>
                <p className="text-sm text-default-500 mb-2 flex items-center gap-1">
                  <FiMapPin size={14} /> {t("students.form.branches")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {student.branches.map((branch) => (
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
              </div>

              {student.institutions && student.institutions.length > 0 && (
                <div>
                  <p className="text-sm text-default-500 mb-2">
                    {t("students.form.institutions")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {student.institutions.map((inst) => (
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
                </div>
              )}

              {student.bio && (
                <div>
                  <p className="text-sm text-default-500 mb-1">
                    {t("students.form.cvLabel")}
                  </p>
                  <p className="text-default-700 leading-relaxed">
                    {student.bio}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tabs Section */}
        <div className="bg-content1 rounded-[32px] shadow-sm border border-default-200 min-h-[400px]">
          <Tabs
            aria-label="Student details"
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
                  <Table removeWrapper aria-label="Student certifications">
                    <TableHeader>
                      <TableColumn>
                        {t("certifications.certificationType")}
                      </TableColumn>
                      <TableColumn>{t("certifications.issueDate")}</TableColumn>
                      <TableColumn>{t("certifications.expiryDate")}</TableColumn>
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
                    <p className="text-default-500">{t("payments.noRecords")}</p>
                  </div>
                ) : (
                  <>
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
                          {formatCurrency(
                            payments.reduce(
                              (sum, p) => sum + parseFloat(p.amount || "0"),
                              0,
                            ) / payments.length,
                            "ar-LY",
                            "LYD",
                          )}
                        </p>
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

      {/* Toggle Active Confirmation Modal */}
      <Modal isOpen={isToggleActiveModalOpen} onClose={onToggleActiveModalClose}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {student?.is_active
                  ? t("doctors.deactivateAccount")
                  : t("doctors.activateAccount")}
              </ModalHeader>
              <ModalBody>
                <p>
                  {student?.is_active
                    ? t("doctors.deactivateConfirm")
                    : t("doctors.activateConfirm")}
                </p>
              </ModalBody>
              <div className="flex justify-end gap-2 p-4">
                <Button variant="light" onPress={onToggleActiveModalClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color={student?.is_active ? "danger" : "success"}
                  isLoading={toggleActiveLoading}
                  onPress={handleConfirmToggleActive}
                >
                  {student?.is_active
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
