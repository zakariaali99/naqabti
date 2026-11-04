import type { PaymentCreate, PaymentUpdate } from "@/models/payments";
import type { UserEntity } from "@/models/users";
import type { DoctorsMembershipData } from "@/api/doctorsMembershipApi";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Spinner,
  Chip,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiUpload, FiEye, FiFile } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { paymentsApi } from "@/api/paymentsApi";
import usersApi from "@/api/usersApi";
import membershipApi from "@/api/doctorsMembershipApi";
import { DocumentPreviewModal } from "@/components/modals";

const PaymentFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [members, setMembers] = useState<UserEntity[]>([]);
  const [memberships, setMemberships] = useState<DoctorsMembershipData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PaymentCreate>({
    user_id: 0,
    membership_id: 0,
    amount: "0",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    reference_number: "",
    description: "",
    upload_document: undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch members (users)
        const membersResponse = await usersApi.getAll();

        setMembers(membersResponse.data.results || membersResponse.data);

        // Fetch memberships
        const membershipsResponse = await membershipApi.getAll({
          page_size: 1000,
        });

        setMemberships(membershipsResponse.data.results || []);

        // Fetch payment data if editing
        if (isEditing && id) {
          const paymentResponse = await paymentsApi.get(parseInt(id));
          const paymentData = paymentResponse.data;

          setFormData({
            user_id: paymentData.user.id,
            membership_id: paymentData.membership,
            amount: paymentData.amount,
            payment_date: paymentData.payment_date.split("T")[0],
            payment_method: paymentData.payment_method,
            reference_number: paymentData.reference_number || "",
            description: paymentData.description || "",
          });
          if (paymentData.transaction_document_url) {
            setExistingDocumentUrl(paymentData.transaction_document_url);
          }
        }
      } catch (err) {
        setError(t("common.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, t]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id) {
      newErrors.user = t("payments.form.required");
    }
    if (!formData.membership_id) {
      newErrors.membership_id = t("payments.form.required");
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t("payments.form.invalidAmount");
    }
    if (!formData.payment_date) {
      newErrors.payment_date = t("payments.form.required");
    }
    if (!formData.payment_method) {
      newErrors.payment_method = t("payments.form.required");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && id) {
        const updateData: PaymentUpdate = { ...formData, id: parseInt(id) };

        await paymentsApi.update(parseInt(id), updateData);
      } else {
        await paymentsApi.create(formData);
      }

      navigate("/payments");
    } catch (err: any) {
      setError(err.response?.data?.message || t("payments.form.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PaymentCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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

  return (
    <DefaultLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/payments")}
          >
            <FiArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? t("payments.edit") : t("payments.add")}
            </h1>
          </div>
        </div>

        {error && (
          <Card>
            <CardBody>
              <p className="text-danger">{error}</p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEditing ? t("payments.editTitle") : t("payments.addTitle")}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  isRequired
                  errorMessage={errors.user_id}
                  isInvalid={!!errors.user_id}
                  label={t("payments.form.member")}
                  placeholder={t("payments.form.memberPlaceholder")}
                  selectedKeys={
                    formData.user_id ? [formData.user_id.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const userId = Array.from(keys)[0] as string;

                    handleInputChange("user_id", userId ? parseInt(userId) : 0);
                  }}
                >
                  {members.map((member) => (
                    <SelectItem key={member.id}>
                      {member.full_name ? member.full_name : member.username}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  isRequired
                  errorMessage={errors.membership_id}
                  isInvalid={!!errors.membership_id}
                  label={t("payments.form.membership")}
                  placeholder={t(
                    "payments.form.membershipPlaceholder",
                    "Select Membership",
                  )}
                  selectedKeys={
                    formData.membership_id ? [formData.membership_id.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const membershipId = Array.from(keys)[0] as string;

                    handleInputChange(
                      "membership_id",
                      membershipId ? parseInt(membershipId) : 0,
                    );
                  }}
                >
                  {memberships.map((membership) => (
                    <SelectItem key={membership.id!}>
                      {membership.membership_number ||
                        `Membership ${membership.id}`}{" "}
                      -{" "}
                      {membership.doctor?.full_name ||
                        membership.doctor?.username}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  isInvalid={!!errors.amount}
                  errorMessage={errors.amount}
                  label={t("payments.form.amount")}
                  placeholder={t("payments.form.amountPlaceholder")}
                  type="number"
                  step="0.01"
                  value={formData.amount.toString()}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  startContent="LYD"
                />

                <Input
                  isRequired
                  errorMessage={errors.payment_date}
                  isInvalid={!!errors.payment_date}
                  label={t("payments.form.paymentDate")}
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    handleInputChange("payment_date", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  isRequired
                  errorMessage={errors.payment_method}
                  isInvalid={!!errors.payment_method}
                  label={t("payments.form.paymentMethod")}
                  placeholder={t("payments.form.paymentMethodPlaceholder")}
                  selectedKeys={
                    formData.payment_method ? [formData.payment_method] : []
                  }
                  onSelectionChange={(keys) => {
                    const method = Array.from(keys)[0] as string;

                    handleInputChange("payment_method", method);
                  }}
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
                  <SelectItem key="other">
                    {t("payments.methods.other")}
                  </SelectItem>
                </Select>

                <Input
                  label={t("payments.form.referenceNumber")}
                  placeholder={t("payments.form.referenceNumberPlaceholder")}
                  value={formData.reference_number || ""}
                  onChange={(e) =>
                    handleInputChange("reference_number", e.target.value)
                  }
                />
              </div>

              <Textarea
                label={t("payments.form.description")}
                minRows={3}
                placeholder={t("payments.form.descriptionPlaceholder")}
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />

              {/* Transaction Document Upload */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("payments.form.transactionDocument")}
                </p>

                {existingDocumentUrl && !formData.upload_document && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-default-50 border border-default-200">
                    <FiFile className="text-default-500 flex-shrink-0" size={18} />
                    <span className="text-sm text-default-700 flex-1">
                      {t("payments.form.currentDocument")}
                    </span>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<FiEye size={14} />}
                      onPress={() => setPreviewOpen(true)}
                    >
                      {t("common.preview")}
                    </Button>
                  </div>
                )}

                {formData.upload_document && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="success"
                    startContent={<FiFile size={12} />}
                    onClose={() => handleInputChange("upload_document", undefined)}
                  >
                    {formData.upload_document.name}
                  </Chip>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleInputChange("upload_document", file);
                  }}
                />
                <Button
                  variant="flat"
                  color="default"
                  startContent={<FiUpload size={16} />}
                  onPress={() => fileInputRef.current?.click()}
                >
                  {existingDocumentUrl
                    ? t("payments.form.changeDocument")
                    : t("payments.form.uploadDocument")}
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  isDisabled={submitting}
                  variant="flat"
                  onPress={() => navigate("/payments")}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={submitting}
                  startContent={!submitting && <FiSave size={16} />}
                  type="submit"
                >
                  {submitting ? t("common.loading") : t("common.save")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
      <DocumentPreviewModal
        isOpen={previewOpen}
        url={existingDocumentUrl}
        title={t("payments.documentPreview")}
        onClose={() => setPreviewOpen(false)}
      />
    </DefaultLayout>
  );
};

export default PaymentFormPage;
