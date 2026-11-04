import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Switch,
} from "@heroui/react";
import { FiSave } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import academicDegreesApi from "@/api/academicDegreesApi";
import { AcademicDegree } from "@/models/academicDegree";

interface AcademicDegreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicDegreeToEdit: AcademicDegree | null;
}

export default function AcademicDegreeModal({
  isOpen,
  onClose,
  onSuccess,
  academicDegreeToEdit,
}: AcademicDegreeModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    allows_multiple_subscriptions: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!academicDegreeToEdit;

  useEffect(() => {
    if (isOpen) {
      if (academicDegreeToEdit) {
        setFormData({
          name: academicDegreeToEdit.name || "",
          allows_multiple_subscriptions:
            academicDegreeToEdit.allows_multiple_subscriptions ?? false,
        });
      } else {
        setFormData({
          name: "",
          allows_multiple_subscriptions: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, academicDegreeToEdit]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t("academicDegrees.form.required", "This field is required");
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
        allows_multiple_subscriptions: formData.allows_multiple_subscriptions,
      };

      if (isEdit && academicDegreeToEdit) {
        await academicDegreesApi.update(academicDegreeToEdit.id, payload);
      } else {
        await academicDegreesApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save academic degree:", error);
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
                {isEdit ? t("academicDegrees.edit", "Edit Academic Degree") : t("academicDegrees.add", "Add Academic Degree")}
              </h3>
            </ModalHeader>
            <ModalBody className="py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  isRequired
                  label={t("academicDegrees.form.name", "Name")}
                  placeholder={t("academicDegrees.form.name", "Name")}
                  value={formData.name}
                  onValueChange={(val) => handleInputChange("name", val)}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  variant="bordered"
                />

                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={formData.allows_multiple_subscriptions}
                    onValueChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        allows_multiple_subscriptions: checked,
                      }))
                    }
                  />
                  <span className="text-sm">
                    {t(
                      "academicDegrees.form.allowsMultipleSubscriptions",
                      "Allows multiple subscription periods",
                    )}
                  </span>
                </div>

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
