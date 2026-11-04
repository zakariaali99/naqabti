import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { FiSave, FiUser, FiMail, FiPhone, FiLock } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import usersApi from "@/api/usersApi";
import { UserEntity, UserCreateInput } from "@/models/users";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserEntity) => void;
  defaultUserType?: "doctor" | "manager";
}

const UserCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultUserType = "doctor",
}: UserCreateModalProps) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<UserCreateInput>({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    language: "ar",
    password: "",
    is_active: true,
    is_staff: false,
    user_type: defaultUserType,
    specialty: "",
    bio: "",
    groups: [],
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UserCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("users.errors.usernameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("users.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("users.errors.invalidEmail");
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = t("users.errors.fullNameRequired");
    }

    if (!formData.password) {
      newErrors.password = t("users.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("users.errors.passwordTooShort");
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = t("users.errors.passwordMismatch");
    }

    if (formData.user_type === "doctor" && !formData.specialty?.trim()) {
      newErrors.specialty = t("users.errors.specialtyRequired");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create user
      const response = await usersApi.create(formData);
      const newUser = response.data;

      // Call success callback
      onSuccess(newUser);

      // Reset form and close
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Failed to create user:", error);

      // Handle API validation errors
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
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      full_name: "",
      phone_number: "",
      language: "ar",
      password: "",
      is_active: true,
      is_staff: false,
      user_type: defaultUserType,
      specialty: "",
      bio: "",
      groups: [],
    });
    setConfirmPassword("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      classNames={{
        // base: "overflow-y-scroll",
        body: "py-6 overflow-y-auto",
        wrapper: "overflow-scoll",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-divider pb-4">
          <h3 className="text-xl font-bold">{t("users.createNew")}</h3>
          <p className="text-sm text-default-500 font-normal">
            {t("users.createNewDesc")}
          </p>
        </ModalHeader>

        <ModalBody>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type - Full Width */}
            <div className="w-full">
              <Select
                isRequired
                classNames={{
                  label: "font-semibold",
                }}
                label={t("users.userType")}
                selectedKeys={[formData.user_type]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as "doctor" | "manager";

                  handleInputChange("user_type", value);
                }}
              >
                <SelectItem key="doctor">{t("users.doctor")}</SelectItem>
                <SelectItem key="manager">{t("users.manager")}</SelectItem>
              </Select>
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-default-700 uppercase tracking-wide">
                {t("users.basicInformation")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <Input
                  isRequired
                  errorMessage={errors.full_name}
                  isInvalid={!!errors.full_name}
                  label={t("users.fullName")}
                  placeholder={t("users.enterFullName")}
                  startContent={<FiUser className="text-default-400" />}
                  value={formData.full_name}
                  onValueChange={(value) =>
                    handleInputChange("full_name", value)
                  }
                />

                {/* Username */}
                <Input
                  isRequired
                  errorMessage={errors.username}
                  isInvalid={!!errors.username}
                  label={t("users.username")}
                  placeholder={t("users.enterUsername")}
                  startContent={<FiUser className="text-default-400" />}
                  value={formData.username}
                  onValueChange={(value) =>
                    handleInputChange("username", value)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <Input
                  isRequired
                  errorMessage={errors.email}
                  isInvalid={!!errors.email}
                  label={t("users.email")}
                  placeholder={t("users.enterEmail")}
                  startContent={<FiMail className="text-default-400" />}
                  type="email"
                  value={formData.email}
                  onValueChange={(value) => handleInputChange("email", value)}
                />

                {/* Phone */}
                <Input
                  label={t("users.phone")}
                  placeholder={t("users.enterPhone")}
                  startContent={<FiPhone className="text-default-400" />}
                  value={formData.phone_number}
                  onValueChange={(value) =>
                    handleInputChange("phone_number", value)
                  }
                />
              </div>

              {/* Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  isRequired
                  label={t("users.language")}
                  selectedKeys={[formData.language]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as "ar" | "en";

                    handleInputChange("language", value);
                  }}
                >
                  <SelectItem key="ar">{t("users.languages.ar")}</SelectItem>
                  <SelectItem key="en">{t("users.languages.en")}</SelectItem>
                </Select>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-default-700 uppercase tracking-wide">
                {t("users.security")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <Input
                  isRequired
                  description={t("users.passwordHint")}
                  errorMessage={errors.password}
                  isInvalid={!!errors.password}
                  label={t("users.password")}
                  placeholder={t("users.enterPassword")}
                  startContent={<FiLock className="text-default-400" />}
                  type="password"
                  value={formData.password}
                  onValueChange={(value) =>
                    handleInputChange("password", value)
                  }
                />

                {/* Confirm Password */}
                <Input
                  isRequired
                  errorMessage={errors.confirmPassword}
                  isInvalid={!!errors.confirmPassword}
                  label={t("users.confirmPassword")}
                  placeholder={t("users.confirmPasswordPlaceholder")}
                  startContent={<FiLock className="text-default-400" />}
                  type="password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            {formData.user_type === "doctor" && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-default-700 uppercase tracking-wide">
                  {t("users.professionalInformation")}
                </h4>

                {/* Specialty */}
                <Input
                  isRequired
                  errorMessage={errors.specialty}
                  isInvalid={!!errors.specialty}
                  label={t("users.specialty")}
                  placeholder={t("users.enterSpecialty")}
                  value={formData.specialty || ""}
                  onValueChange={(value) =>
                    handleInputChange("specialty", value)
                  }
                />

                {/* Bio */}
                <Textarea
                  label={t("users.bio")}
                  maxRows={5}
                  minRows={3}
                  placeholder={t("users.enterBio")}
                  value={formData.bio || ""}
                  onValueChange={(value) => handleInputChange("bio", value)}
                />
              </div>
            )}

            {/* API Errors */}
            {errors.non_field_errors && (
              <div className="text-sm text-danger bg-danger-50 p-3 rounded-lg border border-danger-200">
                {errors.non_field_errors}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end pt-4 border-t border-divider">
              <Button
                className="w-full sm:w-auto"
                disabled={loading}
                variant="light"
                onPress={handleClose}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                color="primary"
                disabled={loading}
                isLoading={loading}
                startContent={!loading && <FiSave />}
                type="submit"
              >
                {t("users.createUser")}
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserCreateModal;
