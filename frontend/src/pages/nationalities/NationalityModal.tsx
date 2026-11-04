import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
} from "@heroui/react";
import { FiSave } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import nationalitiesApi from "@/api/nationalitiesApi";
import { Nationality } from "@/models/nationality";

interface NationalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nationalityToEdit: Nationality | null;
}

export default function NationalityModal({
  isOpen,
  onClose,
  onSuccess,
  nationalityToEdit,
}: NationalityModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!nationalityToEdit;

  useEffect(() => {
    if (isOpen) {
      if (nationalityToEdit) {
        setFormData({
          name: nationalityToEdit.name || "",
          code: nationalityToEdit.code || "",
        });
      } else {
        setFormData({
          name: "",
          code: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, nationalityToEdit]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t("nationalities.form.required", "This field is required");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      };

      if (isEdit && nationalityToEdit) {
        await nationalitiesApi.update(nationalityToEdit.id, payload);
      } else {
        await nationalitiesApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save nationality:", error);
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach((key) => {
          apiErrors[key] = Array.isArray(error.response.data[key])
            ? error.response.data[key][0]
            : error.response.data[key];
        });
        setErrors(apiErrors);
      } else {
        setErrors({ non_field_errors: error.message || "An error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-divider pb-4">
              <h3 className="text-xl font-bold">
                {isEdit ? t("nationalities.edit", "Edit Nationality") : t("nationalities.add", "Add Nationality")}
              </h3>
            </ModalHeader>
            <ModalBody className="py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  isRequired
                  label={t("nationalities.form.name", "Name")}
                  placeholder={t("nationalities.form.name", "Name")}
                  value={formData.name}
                  onValueChange={(val) => handleInputChange("name", val)}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  variant="bordered"
                />
                <Input
                  label={t("nationalities.form.code", "ISO Code")}
                  placeholder={t("nationalities.form.code", "ISO Code")}
                  value={formData.code}
                  onValueChange={(val) => handleInputChange("code", val)}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code}
                  variant="bordered"
                />

                {errors.non_field_errors && (
                  <div className="p-3 text-sm text-danger bg-danger-50 border border-danger-200 rounded-xl">
                    {errors.non_field_errors}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-divider">
                  <Button
                    variant="light"
                    onPress={onClose}
                    isDisabled={loading}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={loading}
                    startContent={!loading && <FiSave />}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
