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

import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import { DoctorSpecialty } from "@/models/doctorSpecialty";

interface DoctorSpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  specialtyToEdit: DoctorSpecialty | null;
}

export default function DoctorSpecialtyModal({
  isOpen,
  onClose,
  onSuccess,
  specialtyToEdit,
}: DoctorSpecialtyModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!specialtyToEdit;

  useEffect(() => {
    if (isOpen) {
      if (specialtyToEdit) {
        setFormData({
          name: specialtyToEdit.name || "",
          is_active: specialtyToEdit.is_active,
        });
      } else {
        setFormData({
          name: "",
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, specialtyToEdit]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t("common.required", "This field is required");
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
        is_active: formData.is_active,
      };

      if (isEdit && specialtyToEdit) {
        await doctorSpecialtyApi.update(specialtyToEdit.id, payload);
      } else {
        await doctorSpecialtyApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save specialty:", error);
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
                {isEdit ? t("doctorSpecialties.edit", "Edit Specialty") : t("doctorSpecialties.add", "Add Specialty")}
              </h3>
            </ModalHeader>
            <ModalBody className="py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  isRequired
                  label={t("doctorSpecialties.form.name", "Name")}
                  placeholder={t("doctorSpecialties.form.name", "Name")}
                  value={formData.name}
                  onValueChange={(val) => handleInputChange("name", val)}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  variant="bordered"
                />

                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(val) => handleInputChange("is_active", val)}
                >
                  {t("common.active", "Active")}
                </Switch>

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
