import type { PaymentMethod } from "@/api/doctorsMembershipApi";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "@/misc/formatCurrency";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentData) => Promise<void>;
  remainingAmount: number;
  totalAmount: number;
  paidAmount: number;
  isLoading?: boolean;
}

export interface PaymentData {
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  description?: string;
  upload_document?: File | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  remainingAmount,
  totalAmount,
  paidAmount,
  isLoading = false,
}: PaymentModalProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<PaymentData>({
    amount: remainingAmount,
    payment_method: "cash",
    reference_number: "",
    description: "",
    upload_document: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethods: { key: PaymentMethod; label: string }[] = [
    { key: "cash", label: t("payment.methods.cash") },
    { key: "card", label: t("payment.methods.card") },
    { key: "bank_transfer", label: t("payment.methods.bankTransfer") },
    { key: "online", label: t("payment.methods.online") },
    { key: "other", label: t("payment.methods.other") },
  ];

  const handleInputChange = (
    field: keyof PaymentData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t("payment.errors.amountRequired");
    } else if (formData.amount > remainingAmount) {
      newErrors.amount = t("payment.errors.amountExceedsRemaining");
    }

    if (formData.payment_method === "bank_transfer" && !formData.upload_document) {
      newErrors.upload_document = t("payment.errors.documentRequired", "Receipt document is required for bank transfers");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        amount: remainingAmount,
        payment_method: "cash",
        reference_number: "",
        description: "",
        upload_document: null,
      });
      setErrors({});
    } catch (error) {
      console.error("Payment submission error:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: remainingAmount,
      payment_method: "cash",
      reference_number: "",
      description: "",
      upload_document: null,
    });
    setErrors({});
    onClose();
  };

  // Ensure values are numbers before using .toFixed
  const safeTotalAmount =
    typeof totalAmount === "number" ? totalAmount : Number(totalAmount) || 0;
  const safePaidAmount =
    typeof paidAmount === "number" ? paidAmount : Number(paidAmount) || 0;
  const safeRemainingAmount =
    typeof remainingAmount === "number"
      ? remainingAmount
      : Number(remainingAmount) || 0;

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={handleClose}>
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">{t("payment.addPayment")}</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-default-100 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-600">
                  {t("payment.totalAmount")}:
                </span>
                <span className="font-semibold">
                  {formatCurrency(safeTotalAmount, "ar-LY", "LYD")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-default-600">
                  {t("payment.paidAmount")}:
                </span>
                <span className="font-semibold text-success">
                  {formatCurrency(safePaidAmount, "ar-LY", "LYD")}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-default-200 pt-2">
                <span className="text-default-600">
                  {t("payment.remainingAmount")}:
                </span>
                <span className="font-semibold text-warning">
                  {formatCurrency(safeRemainingAmount, "ar-LY", "LYD")}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <Input
              errorMessage={errors.amount}
              isInvalid={!!errors.amount}
              label={t("payment.amount")}
              max={remainingAmount}
              min="0"
              placeholder={t("payment.enterAmount")}
              startContent={<span className="text-default-400">$</span>}
              step="0.01"
              type="number"
              value={formData.amount.toString()}
              onValueChange={(value) =>
                handleInputChange("amount", parseFloat(value) || 0)
              }
            />

            {/* Payment Method */}
            <Select
              label={t("payment.paymentMethod")}
              placeholder={t("payment.selectMethod")}
              selectedKeys={[formData.payment_method]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as PaymentMethod;

                handleInputChange("payment_method", selected);
              }}
            >
              {paymentMethods.map((method) => (
                <SelectItem key={method.key}>{method.label}</SelectItem>
              ))}
            </Select>

            {/* Reference Number (Dynamically shown) */}
            {(formData.payment_method === "online" || formData.payment_method === "bank_transfer") && (
              <Input
                label={t("payment.referenceNumber")}
                placeholder={t("payment.enterReference")}
                value={formData.reference_number}
                onValueChange={(value) =>
                  handleInputChange("reference_number", value)
                }
              />
            )}

            {/* File Upload for Bank Transfer */}
            {formData.payment_method === "bank_transfer" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-default-600 block">
                  {t("payment.receiptImage", "Receipt Document / Image")}
                </label>
                <div className={`flex flex-col gap-2 p-4 border-2 border-dashed rounded-2xl items-center justify-center hover:border-primary hover:bg-primary/5 transition-all ${errors.upload_document ? "border-danger bg-danger/5" : "border-default-300"}`}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="receipt-file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleInputChange("upload_document", file);
                    }}
                  />
                  <label htmlFor="receipt-file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                    <span className="text-primary font-bold hover:underline">
                      {formData.upload_document ? formData.upload_document.name : t("payment.uploadFile", "Choose File")}
                    </span>
                    <span className="text-xs text-default-400">
                      {t("payment.fileFormatHint", "Images or PDF up to 5MB")}
                    </span>
                  </label>
                </div>
                {errors.upload_document && (
                  <p className="text-xs text-danger">{errors.upload_document}</p>
                )}
              </div>
            )}

            {/* Description */}
            <Textarea
              label={t("payment.description")}
              minRows={3}
              placeholder={t("payment.enterDescription")}
              value={formData.description}
              onValueChange={(value) => handleInputChange("description", value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={isLoading} variant="light" onPress={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button color="primary" isLoading={isLoading} onPress={handleSubmit}>
            {t("payment.submitPayment")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
