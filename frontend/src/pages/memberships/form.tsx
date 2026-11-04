import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Divider,
} from "@heroui/react";
import { GiTakeMyMoney } from "react-icons/gi";
import {
  FiXCircle,
  FiSave,
  FiUser,
  FiSearch,
  FiMapPin,
  FiArrowLeft,
  FiRefreshCw,
  FiAward,
  FiCreditCard,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiBell,
} from "react-icons/fi";

import {
  RenewMembershipModal,
  RenewMembershipData,
} from "./RenewMembershipModal";

import DefaultLayout from "@/layouts/default";
import doctorsMembershipApi, {
  DoctorsMembershipCreateRequest,
  DoctorsMembershipData,
  PaymentStatus,
} from "@/api/doctorsMembershipApi";
import { PaymentModal, PaymentData } from "@/pages/payments/PaymentModal";
import { UserSearchModal } from "@/pages/users/components";
import MembershipTypeSearchModal from "@/pages/membership-types/MembershipTypeSearchModal";
import branchesApi from "@/api/branchesApi";
import { doctorsMembershipRenewHistoryApi } from "@/api/membershipRenewHistoryApi";
import { formatCurrency } from "@/misc/formatCurrency";
import { UserEntity } from "@/models/users";
import { MembershipTypeModel } from "@/models/membershipTypes";
import { Branch } from "@/models/branch";
import { formatDate } from "@/misc/formatDate";
import { SendNotificationModal } from "@/components/modals";

interface DoctorsMembershipFormData {
  doctor_id: number;
  membership_type_id: number;
  branch_id?: number;
  start_date: string;
  end_date?: string;
  status: "active" | "pending" | "canceled" | "expired";
  is_active: boolean;
  subscription_count: number;
  payment_method?: "cash" | "bank_transfer";
  reference_number?: string;
  invoice_file?: File | null;
}

const computeEndDate = (start: string, durationMonths: number, count: number) => {
  const startDate = new Date(start);
  const endDate = new Date(startDate);

  endDate.setMonth(endDate.getMonth() + durationMonths * (count || 1));

  return endDate.toISOString().split("T")[0];
};

export default function MembershipFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isRtl = i18n.dir() === "rtl";

  // Modal controls
  const {
    isOpen: isUserSearchModalOpen,
    onOpen: onUserSearchModalOpen,
    onClose: onUserSearchModalClose,
  } = useDisclosure();
  const {
    isOpen: isMembershipTypeModalOpen,
    onOpen: onMembershipTypeModalOpen,
    onClose: onMembershipTypeModalClose,
  } = useDisclosure();
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
  const { isOpen: isNotificationModalOpen, onOpen: onNotificationModalOpen, onClose: onNotificationModalClose } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState<DoctorsMembershipFormData>({
    doctor_id: 0,
    membership_type_id: 0,
    branch_id: undefined,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "pending",
    is_active: true,
    subscription_count: 1,
    payment_method: undefined,
    reference_number: "",
    invoice_file: null,
  });

  // Selected items for display
  const [selectedDoctor, setSelectedDoctor] = useState<UserEntity | null>(null);
  const [selectedMembershipType, setSelectedMembershipType] =
    useState<MembershipTypeModel | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [membershipData, setMembershipData] =
    useState<DoctorsMembershipData | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDoctorSelectionDisabled =
    isEdit &&
    membershipData &&
    (membershipData.status === "active" ||
      Number(membershipData.paid_amount) > 0 ||
      membershipData.has_renew_history);

  const doctorDegree = (selectedDoctor as any)?.current_degree_detail ?? null;
  const allowsMultipleSubscriptions = !!doctorDegree?.allows_multiple_subscriptions;

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);
        const response = await branchesApi.getAll({ page_size: 100 });

        setBranches(response.data.results);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Load membership data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchMembership = async () => {
        try {
          setLoading(true);
          const response = await doctorsMembershipApi.getById(parseInt(id));
          const membership = response.data;

          setMembershipData(membership);
          
          const membershipTypeId = typeof membership.membership_type === 'number' 
            ? membership.membership_type 
            : (membership.membership_type?.id || membership.membership_type_id || 0);
          
          setFormData({
            doctor_id: membership.doctor?.id || 0,
            membership_type_id: membershipTypeId,
            branch_id: membership.branch?.id,
            start_date: membership.start_date,
            end_date: membership.end_date || "",
            status: membership.status || "pending",
            is_active: membership.is_active,
            subscription_count: membership.subscription_count || 1,
          });

          if (membership.doctor) {
            setSelectedDoctor(membership.doctor as any);
          }

          if (membership.membership_type) {
            if (typeof membership.membership_type === "object") {
              setSelectedMembershipType(
                membership.membership_type as MembershipTypeModel,
              );
            } else {
              try {
                const { default: membershipTypesApi } = await import(
                  "@/api/membershipTypesApi"
                );
                const mtResponse = await membershipTypesApi.getById(
                  membership.membership_type,
                );

                setSelectedMembershipType(mtResponse.data);
              } catch (err) {
                console.error("Failed to load membership type:", err);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch membership:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchMembership();
    }
  }, [id, isEdit]);

  const handleDoctorSelect = (doctor: UserEntity) => {
    setSelectedDoctor(doctor);

    const doctorBranchId = (doctor as any).branches?.[0]?.id || (doctor as any).branch_ids?.[0];
    const newDegree = (doctor as any).current_degree_detail ?? null;
    const newDegreeId: number | null = newDegree?.id ?? null;
    const newAllowsMultiple = !!newDegree?.allows_multiple_subscriptions;

    // If the previously selected membership type is tied to a degree that
    // doesn't match the newly selected doctor, it's no longer valid.
    const typeMismatch =
      selectedMembershipType?.academic_degree &&
      selectedMembershipType.academic_degree !== newDegreeId;

    if (typeMismatch) {
      setSelectedMembershipType(null);
    }

    setFormData((prev) => {
      const nextCount = newAllowsMultiple ? prev.subscription_count : 1;

      return {
        ...prev,
        doctor_id: doctor.id,
        branch_id: doctorBranchId !== undefined ? doctorBranchId : prev.branch_id,
        subscription_count: nextCount,
        membership_type_id: typeMismatch ? 0 : prev.membership_type_id,
        end_date: typeMismatch ? "" : prev.end_date,
      };
    });

    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors.doctor;
      if (doctorBranchId !== undefined) {
        delete newErrors.branch_id;
      }

      return newErrors;
    });
  };

  const handleMembershipTypeSelect = (membershipType: MembershipTypeModel) => {
    setSelectedMembershipType(membershipType);
    setFormData(prev => ({ ...prev, membership_type_id: membershipType.id }));

    if (formData.start_date) {
      setFormData((prev) => ({
        ...prev,
        end_date: computeEndDate(
          prev.start_date,
          membershipType.duration_months,
          prev.subscription_count,
        ),
      }));
    }

    if (errors.membership_type_id) {
      setErrors(prev => ({ ...prev, membership_type_id: '' }));
    }
  };

  const handleSubscriptionCountChange = (value: number) => {
    const count = Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;

    setFormData((prev) => ({
      ...prev,
      subscription_count: count,
      end_date:
        selectedMembershipType && prev.start_date
          ? computeEndDate(prev.start_date, selectedMembershipType.duration_months, count)
          : prev.end_date,
    }));
  };

  const handleInputChange = (
    field: keyof DoctorsMembershipFormData,
    value: string | boolean | number | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "start_date" && selectedMembershipType) {
      setFormData((prev) => ({
        ...prev,
        end_date: computeEndDate(
          value as string,
          selectedMembershipType.duration_months,
          prev.subscription_count,
        ),
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctor_id)
      newErrors.doctor = t("common.form.required") || "Required";
    if (!formData.membership_type_id)
      newErrors.membership_type_id = t("common.form.required") || "Required";
    if (!formData.branch_id)
      newErrors.branch_id = t("common.form.required") || "Required";
    if (!formData.start_date)
      newErrors.start_date = t("common.form.required") || "Required";

    if (!isEdit) {
      if (!formData.payment_method) {
        newErrors.payment_method = t("common.form.required") || "Required";
      } else if (formData.payment_method === "bank_transfer") {
        if (!formData.reference_number) {
          newErrors.reference_number = t("common.form.required") || "Required";
        }
        if (!formData.invoice_file) {
          newErrors.invoice_file = t("common.form.required") || "Required";
        }
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!validateForm()) return;
    try {
      setSaveLoading(true);
      if (isEdit && id) {
        const response = await doctorsMembershipApi.update(
          parseInt(id),
          formData,
        );

        setMembershipData(response.data);
        toast.success(
          t("membership.updateSuccess", "Membership updated successfully"),
        );
      } else {
        const unitPrice =
          typeof selectedMembershipType?.price === "number"
            ? selectedMembershipType.price
            : parseFloat(selectedMembershipType?.price || "0");
        const submitData: DoctorsMembershipCreateRequest = {
          ...formData,
          end_date: formData.end_date || undefined,
          total_amount: unitPrice * (formData.subscription_count || 1),
          paid_amount: 0,
          payment_status: "unpaid" as PaymentStatus,
        };
        const response = await doctorsMembershipApi.create(submitData);

        setMembershipData(response.data);
        toast.success(
          t("membership.createSuccess", "Membership created successfully"),
        );
      }
      navigate("/memberships");
    } catch (error: any) {
      console.error("Failed to save membership:", error);
      toast.error(t("membership.saveError", "Failed to save membership"));
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};

        Object.keys(error.response.data).forEach((key) => {
          if (Array.isArray(error.response.data[key])) {
            apiErrors[key] = error.response.data[key][0];
          } else {
            apiErrors[key] = error.response.data[key];
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePaymentSubmit = async (paymentData: PaymentData) => {
    if (!id || !membershipData) return;
    try {
      setPaymentLoading(true);
      const response = await doctorsMembershipApi.addPayment(
        parseInt(id),
        paymentData,
      );

      setMembershipData(response.data.membership);
      setFormData((prev) => ({
        ...prev,
        status: response.data.membership.status,
      }));
      toast.success(t("payment.addSuccess", "Payment added successfully"));
      onPaymentModalClose();
    } catch (error) {
      console.error("Failed to add payment:", error);
      toast.error(t("payment.addError", "Failed to add payment"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRenewSubmit = async (data: RenewMembershipData) => {
    if (!id || !membershipData) return;
    try {
      setRenewLoading(true);
      await doctorsMembershipRenewHistoryApi.create({
        membership: parseInt(id),
        new_end_date: data.new_end_date,
        amount: data.amount,
        previous_end_date: membershipData.end_date,
        notes: data.notes,
      });
      const response = await doctorsMembershipApi.getById(parseInt(id));

      setMembershipData(response.data);
      setFormData((prev) => ({
        ...prev,
        end_date: response.data.end_date || "",
      }));
      toast.success(
        t("membership.renewSuccess", "Membership renewed successfully"),
      );
      onRenewModalClose();
    } catch (error) {
      console.error("Failed to renew membership:", error);
      toast.error(t("membership.renewError", "Failed to renew membership"));
    } finally {
      setRenewLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !membershipData) return;
    if (
      !window.confirm(
        t(
          "membership.confirmCancel",
          "Are you sure you want to cancel this membership?",
        ),
      )
    )
      return;
    try {
      setCancelLoading(true);
      const response = await doctorsMembershipApi.cancel(parseInt(id));

      setMembershipData(response.data);
      setFormData((prev) => ({
        ...prev,
        status: response.data.status,
        is_active: response.data.is_active,
      }));
      toast.success(
        t("membership.cancelSuccess", "Membership canceled successfully"),
      );
    } catch (error) {
      console.error("Failed to cancel membership:", error);
      toast.error(t("membership.cancelError", "Failed to cancel membership"));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSendNotification = async (data: any) => {
    if (!id) return;
    try {
      await doctorsMembershipApi.sendNotification(parseInt(id), data);
      toast.success(t('notifications.sendSuccess', 'Notification sent successfully'));
      onNotificationModalClose();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error(t('notifications.sendError', 'Failed to send notification'));
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <div className="text-center text-default-500 font-medium">
            {t("common.loading")}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Helper Section Component
  const FormSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 mb-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-default-100">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );

  return (
    <DefaultLayout>
      <div
        className="min-h-screen font-sans max-w-[1600px] mx-auto p-4 lg:p-8 space-y-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              className="bg-content1 rounded-full shadow-sm"
              variant="light"
              onPress={() => navigate("/memberships")}
            >
              <FiArrowLeft
                className={`${isRtl ? "rotate-180" : ""}`}
                size={20}
              />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
                {isEdit
                  ? t("membership.editMembership")
                  : t("membership.addMembership")}
              </h1>
              <p className="text-default-500 font-medium">
                {isEdit
                  ? t("membership.manageMembershipDetails")
                  : t("membership.createNewMembership")}
              </p>
            </div>
          </div>

          {/* Action Buttons for existing membership */}
          {isEdit && membershipData && (
            <div className="flex items-center gap-3">
              {membershipData.payment_status !== "paid" && (
                <Button
                  className="font-semibold"
                  color="success"
                  startContent={<GiTakeMyMoney />}
                  variant="shadow"
                  onPress={onPaymentModalOpen}
                >
                  {t("payment.addPayment")}
                </Button>
              )}
              <Button
                className="font-semibold"
                color="secondary"
                isLoading={renewLoading}
                startContent={<FiRefreshCw />}
                variant="flat"
                onPress={onRenewModalOpen}
              >
                {t("membership.renew")}
              </Button>
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<FiBell />}
                        onPress={onNotificationModalOpen}
                        className="font-semibold"
                    >
                        {t('membership.actions.sendNotification')}
                    </Button>
              {membershipData.status !== "canceled" &&
                membershipData.status !== "expired" && (
                  <Button
                    className="font-semibold"
                    color="danger"
                    isLoading={cancelLoading}
                    startContent={<FiXCircle />}
                    variant="light"
                    onPress={handleCancel}
                  >
                    {t("membership.cancel")}
                  </Button>
                )}
            </div>
          )}
        </div>

        <form
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          onSubmit={handleSubmit}
        >
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Doctor Selection */}
            <FormSection
              icon={FiUser}
              title={t("doctors.selectDoctor", "Doctor Information")}
            >
              <div className="space-y-4">
                {selectedDoctor ? (
                  <div className="p-4 rounded-3xl bg-content2 border border-default-200 flex items-center justify-between group transition-all hover:bg-content2/80">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {selectedDoctor.profile_image ? (
                          <img
                            alt={
                              selectedDoctor.full_name ||
                              selectedDoctor.username
                            }
                            className="w-full h-full rounded-2xl object-cover"
                            src={selectedDoctor.profile_image}
                          />
                        ) : (
                          selectedDoctor.full_name?.[0] ||
                          selectedDoctor.username?.[0]
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">
                          {selectedDoctor.full_name || selectedDoctor.username}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-default-500 mt-1">
                          <span className="flex items-center gap-1">
                            <FiUser size={14} /> {selectedDoctor.username}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-default-300" />
                          <span>{selectedDoctor.email}</span>
                        </div>
                        {((selectedDoctor as any).branches?.length > 0 || (selectedDoctor as any).institutions?.length > 0) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(selectedDoctor as any).branches?.map((b: any) => (
                              <span key={b.id} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                                {b.name}
                              </span>
                            ))}
                            {(selectedDoctor as any).institutions?.map((inst: any) => (
                              <span key={inst.id} className="text-xs bg-secondary-50 text-secondary-600 px-2 py-0.5 rounded-full font-medium">
                                {inst.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      className="font-semibold"
                      color="primary"
                      isDisabled={!!isDoctorSelectionDisabled}
                      size="sm"
                      startContent={<FiUser />}
                      variant="flat"
                      onPress={onUserSearchModalOpen}
                    >
                      {t("doctors.change", "Change")}
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div
                      className={`cursor-pointer p-6 rounded-3xl border-2 border-dashed border-default-300 hover:border-primary hover:bg-primary/10 transition-all flex flex-col items-center justify-center text-center gap-3 h-40 ${errors.doctor ? "border-danger bg-danger/10" : ""}`}
                      onClick={
                        !isDoctorSelectionDisabled
                          ? onUserSearchModalOpen
                          : undefined
                      }
                    >
                      <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-default-500">
                        <FiSearch size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {t("doctors.selectDoctor", "Select Doctor")}
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          {t("doctors.selectDoctorSubtitle", "Search and select a doctor from database")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {errors.doctor && (
                  <p className="text-danger text-sm font-medium px-2">
                    {errors.doctor}
                  </p>
                )}
              </div>
            </FormSection>

            {/* 2. Membership Details */}
            <FormSection
              icon={FiAward}
              title={t(
                "membership.subscriptionDetails",
                "Subscription Details",
              )}
            >
              <div className="space-y-6">
                {/* Type & Branch Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">
                      {t("membershipTypes.selectType")}
                    </label>
                    {selectedMembershipType ? (
                      <div
                        className="p-3 bg-default-50 rounded-2xl border border-default-200 cursor-pointer hover:border-primary transition-colors flex items-center justify-between"
                        role="button"
                        tabIndex={0}
                        onClick={onMembershipTypeModalOpen}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            onMembershipTypeModalOpen();
                          }
                        }}
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {selectedMembershipType.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip
                              className="h-5 text-xs"
                              color="success"
                              size="sm"
                              variant="flat"
                            >
                              {formatCurrency(
                                Number(selectedMembershipType.price),
                                "ar-LY",
                                "LYD",
                              )}
                            </Chip>
                            <span className="text-xs text-default-400">
                              {selectedMembershipType.duration_months}{" "}
                              {t("membershipTypes.months")}
                            </span>
                          </div>
                        </div>
                        <FiSearch className="text-default-400" />
                      </div>
                    ) : (
                      <Button
                        className={`w-full justify-start text-left h-16 ${errors.membership_type ? "border-danger" : ""}`}
                        size="lg"
                        startContent={<FiAward className="text-default-400" />}
                        variant="bordered"
                        onPress={onMembershipTypeModalOpen}
                      >
                        {t("membershipTypes.selectType")}
                      </Button>
                    )}
                    {errors.membership_type && (
                      <p className="text-danger text-xs px-1">
                        {errors.membership_type}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">
                      {t("membership.branch")}
                    </label>
                    <Select
                      isRequired
                      classNames={{
                        trigger:
                          "h-16 rounded-2xl bg-default-50 border-default-200",
                      }}
                      errorMessage={errors.branch_id}
                      isInvalid={!!errors.branch_id}
                      isLoading={branchesLoading}
                      placeholder={t("membership.selectBranch")}
                      selectedKeys={
                        formData.branch_id
                          ? [formData.branch_id.toString()]
                          : []
                      }
                      size="lg"
                      startContent={<FiMapPin className="text-default-400" />}
                      variant="bordered"
                      onSelectionChange={(keys: any) => {
                        const key = Array.from(keys)[0];
                        handleInputChange(
                          "branch_id",
                          key ? Number(key) : undefined,
                        );
                      }}
                    >
                      {branches.map((branch) => (
                        <SelectItem
                          key={branch.id.toString()}
                          textValue={branch.name}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{branch.name}</span>
                            <span className="text-xs text-default-400">
                              Prefix: {branch.prefix || "N/A"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <Divider className="opacity-50" />

                {/* Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      isRequired
                      classNames={{ inputWrapper: "h-12 rounded-xl" }}
                      errorMessage={errors.start_date}
                      isInvalid={!!errors.start_date}
                      label={t("membership.startDate")}
                      labelPlacement="outside"
                      size="lg"
                      startContent={<FiCalendar className="text-default-400" />}
                      type="date"
                      value={formData.start_date}
                      variant="bordered"
                      onValueChange={(val) =>
                        handleInputChange("start_date", val)
                      }
                    />
                  </div>
                  <div>
                    <Input
                      classNames={{ inputWrapper: "h-12 rounded-xl" }}
                      description={
                        selectedMembershipType
                          ? `${selectedMembershipType.duration_months * (formData.subscription_count || 1)} ${t("membershipTypes.months", "months")} duration`
                          : undefined
                      }
                      label={t("membership.endDate")}
                      labelPlacement="outside"
                      size="lg"
                      startContent={<FiClock className="text-default-400" />}
                      type="date"
                      value={formData.end_date || ""}
                      variant="bordered"
                      onValueChange={(val) =>
                        handleInputChange("end_date", val)
                      }
                    />
                  </div>
                </div>

                {/* Subscription Count (only for degrees that allow multiple periods) */}
                {allowsMultipleSubscriptions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        classNames={{ inputWrapper: "h-12 rounded-xl" }}
                        label={t("membership.subscriptionCount", "Number of Subscriptions")}
                        labelPlacement="outside"
                        min={1}
                        size="lg"
                        type="number"
                        value={String(formData.subscription_count)}
                        variant="bordered"
                        onValueChange={(val) =>
                          handleSubscriptionCountChange(parseInt(val, 10) || 1)
                        }
                      />
                    </div>
                    {selectedMembershipType && (
                      <div className="flex items-end pb-1">
                        <Chip color="success" size="lg" variant="flat">
                          {formatCurrency(
                            (typeof selectedMembershipType.price === "number"
                              ? selectedMembershipType.price
                              : parseFloat(selectedMembershipType.price || "0")) *
                              (formData.subscription_count || 1),
                            "ar-LY",
                            "LYD",
                          )}
                        </Chip>
                      </div>
                    )}
                  </div>
                )}

                {/* Status (Hidden or Readonly usually, forcing Active/Pending logic) */}
                <div className="hidden">
                  <Select selectedKeys={[formData.status]}>
                    <SelectItem key="active">Active</SelectItem>
                  </Select>
                </div>
              </div>
            </FormSection>

            {!isEdit && (
              <FormSection
                icon={FiCreditCard}
                title={t("payment.paymentDetails", "Payment Details")}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      isRequired
                      isInvalid={!!errors.payment_method}
                      errorMessage={errors.payment_method}
                      label={t("payment.paymentMethod", "Payment Method")}
                      labelPlacement="outside"
                      placeholder={t("payment.selectMethod", "Select Payment Method")}
                      selectedKeys={formData.payment_method ? [formData.payment_method] : []}
                      variant="bordered"
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as "cash" | "bank_transfer";
                        setFormData(prev => ({
                          ...prev,
                          payment_method: val || undefined,
                          invoice_file: val !== 'bank_transfer' ? null : prev.invoice_file,
                          reference_number: val !== 'bank_transfer' ? "" : prev.reference_number
                        }));
                        setErrors(prev => ({ ...prev, payment_method: "" }));
                      }}
                    >
                      <SelectItem key="cash">{t("payments.methods.cash", "Cash")}</SelectItem>
                      <SelectItem key="bank_transfer">{t("payments.methods.bankTransfer", "Bank Transfer")}</SelectItem>
                    </Select>

                    {formData.payment_method === 'bank_transfer' && (
                      <Input
                        isRequired
                        isInvalid={!!errors.reference_number}
                        errorMessage={errors.reference_number}
                        label={t("payment.referenceNumber", "Reference Number")}
                        labelPlacement="outside"
                        placeholder={t("payment.referenceNumberPlaceholder", "Enter bank reference number")}
                        value={formData.reference_number || ""}
                        variant="bordered"
                        onValueChange={(val) => {
                          setFormData(prev => ({ ...prev, reference_number: val }));
                          setErrors(prev => ({ ...prev, reference_number: "" }));
                        }}
                      />
                    )}
                  </div>

                  {formData.payment_method === 'bank_transfer' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground/80 block">
                        {t("payment.uploadInvoice", "Upload Bank Transfer Receipt (PDF)")}
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="w-full text-sm text-default-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFormData(prev => ({ ...prev, invoice_file: file }));
                          setErrors(prev => ({ ...prev, invoice_file: "" }));
                        }}
                      />
                      {errors.invoice_file && (
                        <p className="text-danger text-xs font-semibold mt-1">
                          {errors.invoice_file}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* 3. Financial Summary (Only Edit Mode) */}
            {isEdit && membershipData && (
              <FormSection
                icon={FiCreditCard}
                title={t("payment.paymentInformation")}
              >
                <div className="bg-default-50 rounded-2xl p-6 border border-default-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="p-4 bg-content1 rounded-xl shadow-sm">
                      <p className="text-sm text-default-500 mb-1">
                        {t("payment.totalAmount")}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(
                          Number(membershipData.total_amount),
                          "ar-LY",
                          "LYD",
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 rounded-xl shadow-sm border border-success/20">
                      <p className="text-sm text-success mb-1">
                        {t("payment.paidAmount")}
                      </p>
                      <p className="text-xl font-bold text-success">
                        {formatCurrency(
                          Number(membershipData.paid_amount),
                          "ar-LY",
                          "LYD",
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-warning/10 rounded-xl shadow-sm border border-warning/20">
                      <p className="text-sm text-warning mb-1">
                        {t("payment.remainingAmount")}
                      </p>
                      <p className="text-xl font-bold text-warning">
                        {formatCurrency(
                          Number(membershipData.remaining_amount),
                          "ar-LY",
                          "LYD",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-default-200">
                    <span className="font-medium text-default-600">
                      {t("payment.status")}
                    </span>
                             <div className="flex items-center gap-2">
                    <Chip
                      className="font-medium"
                      color={
                        membershipData.payment_status === "paid"
                          ? "success"
                          : membershipData.payment_status === "partial"
                            ? "warning"
                            : "danger"
                      }
                      startContent={
                        membershipData.payment_status === "paid" ? (
                          <FiCheckCircle />
                        ) : (
                          <FiAlertCircle />
                        )
                      }
                      variant="flat"
                    >
                      {t(
                        `membership.paymentStatus${membershipData.payment_status.charAt(0).toUpperCase() + membershipData.payment_status.slice(1)}`,
                      )}
                    </Chip>
                                 {membershipData.payment_status !== 'paid' && (
                                    <Button
                                        size="sm"
                                        color="success"
                                        variant="light"
                                        startContent={<GiTakeMyMoney size={16} />}
                                        onPress={onPaymentModalOpen}
                                        className="font-semibold"
                                    >
                                        {t('payment.addPayment')}
                                    </Button>
                                 )}
                             </div>
                  </div>
                </div>
              </FormSection>
            )}
          </div>

          {/* Right Column: Sidebar Actions & History */}
          <div className="lg:col-span-4 space-y-6">
            {/* Submit Action Card */}
            <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200 sticky top-6">
              <h3 className="font-bold text-lg mb-4">
                {t("common.actions", "Actions")}
              </h3>
              <div className="flex flex-col gap-3">
                <Button
                  className="font-bold shadow-lg shadow-primary/20"
                  color="primary"
                  isLoading={saveLoading}
                  size="lg"
                  startContent={<FiSave />}
                  variant="shadow"
                  onPress={(e) => handleSubmit(e as any)}
                >
                  {isEdit
                    ? t("common.saveChanges")
                    : t("membership.createMembership")}
                </Button>
                <Button
                  className="font-medium"
                  color="default"
                  size="lg"
                  variant="flat"
                  onPress={() => navigate("/memberships")}
                >
                  {t("common.cancel")}
                </Button>
              </div>

              {/* Quick Status Info */}
              {isEdit && membershipData && (
                <div className="mt-6 pt-6 border-t border-default-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">
                      {t("membership.status")}
                    </span>
                    <Chip
                      className="border-none"
                      color={
                        membershipData.status === "active"
                          ? "success"
                          : membershipData.status === "expired"
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                      variant="dot"
                    >
                      {t(`membership.${membershipData.status}`)}
                    </Chip>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-500">
                      {t("common.created")}
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(membershipData.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
                
                {/* Payment History Card */}
                {membershipData?.payments && membershipData.payments.length > 0 && (
                    <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200">
                        <div className="flex items-center gap-2 mb-4">
                            <FiCreditCard className="text-success" />
                            <h3 className="font-bold text-lg">{t('payment.paymentHistory', 'Payment History')}</h3>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                           {membershipData.payments.map((payment) => (
                               <div key={payment.id} className="relative pl-6 pb-6 border-l-2 border-default-200 last:pb-0 last:border-l-0">
                                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-success border-4 border-content1"></div>
                                   
                                   <div className="bg-default-50 p-3 rounded-2xl border border-default-100">
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="text-xs font-bold text-default-500">{new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</span>
                                           <Chip size="sm" variant="flat" color="success" className="h-5 text-[10px] px-1">{formatCurrency(payment.amount, 'ar-LY', 'LYD')} </Chip>
                                       </div>
                                       <p className="text-xs text-default-600 mb-1">
                                           <span className="opacity-70">{t('payment.method', 'Method')}: </span> 
                                           <span className="font-semibold">{t(`payment.methods.${payment.payment_method}`, payment.payment_method)}</span>
                                       </p>
                                       {payment.reference_number && (
                                           <p className="text-[10px] text-default-500">
                                               <span className="opacity-70">{t('payment.referenceNumber', 'Ref')}: </span>
                                               {payment.reference_number}
                                           </p>
                                       )}
                                       {payment.description && (
                                           <p className="text-[10px] text-default-400 italic bg-content1 p-2 rounded-lg mt-2">"{payment.description}"</p>
                                       )}
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                )}

            {/* History Card */}
            {membershipData?.renew_history &&
              membershipData.renew_history.length > 0 && (
                <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FiRefreshCw className="text-secondary" />
                    <h3 className="font-bold text-lg">
                      {t("membership.renewHistory")}
                    </h3>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {membershipData.renew_history.map((history) => (
                      <div
                        key={history.id}
                        className="relative pl-6 pb-6 border-l-2 border-default-200 last:pb-0 last:border-l-0"
                      >
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-secondary border-4 border-content1" />

                        <div className="bg-default-50 p-3 rounded-2xl border border-default-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-default-500">
                              {new Date(
                                history.renew_date,
                              ).toLocaleDateString()}
                            </span>
                            <Chip
                              className="h-5 text-[10px] px-1"
                              color="success"
                              size="sm"
                              variant="flat"
                            >
                              {formatCurrency(
                                history.amount,
                                "ar-LY",
                                "LYD",
                              )}{" "}
                            </Chip>
                          </div>
                          <p className="text-xs text-default-600 mb-1">
                            <span className="opacity-70">
                              {t("membership.endDate")}:{" "}
                            </span>
                            <span className="font-semibold">
                              {new Date(
                                history.new_end_date,
                              ).toLocaleDateString()}
                            </span>
                          </p>
                          {history.notes && (
                            <p className="text-[10px] text-default-400 italic bg-content1 p-2 rounded-lg mt-2">
                              &quot;{history.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </form>

        {/* Modals */}
        <UserSearchModal
          description={t(
            "doctors.selectDoctorDesc",
            "Choose a doctor for this membership",
          )}
          isOpen={isUserSearchModalOpen}
          selectedUserId={selectedDoctor?.id}
          title={t("doctors.selectDoctor", "Select Doctor")}
          userTypeFilter="doctor"
          onClose={onUserSearchModalClose}
          onSelect={handleDoctorSelect}
        />



        <MembershipTypeSearchModal
          degreeFilter={selectedDoctor ? (doctorDegree?.id ?? null) : undefined}
          isOpen={isMembershipTypeModalOpen}
          selectedMembershipTypeId={selectedMembershipType?.id}
          onClose={onMembershipTypeModalClose}
          onSelect={handleMembershipTypeSelect}
        />

        {membershipData && (
          <PaymentModal
            isLoading={paymentLoading}
            isOpen={isPaymentModalOpen}
            paidAmount={membershipData.paid_amount}
            remainingAmount={membershipData.remaining_amount || 0}
            totalAmount={membershipData.total_amount}
            onClose={onPaymentModalClose}
            onSubmit={handlePaymentSubmit}
          />
        )}

        {membershipData && (
          <RenewMembershipModal
            isLoading={renewLoading}
            isOpen={isRenewModalOpen}
            membership={membershipData}
            onClose={onRenewModalClose}
            onSubmit={handleRenewSubmit}
          />
        )}

        {membershipData && (
          <SendNotificationModal
            isOpen={isNotificationModalOpen}
            onClose={onNotificationModalClose}
            onSend={handleSendNotification}
            defaultTitle={t('membership.notificationDefaultTitle')}
          />
        )}

      
      </div>
    </DefaultLayout>
  );
}
