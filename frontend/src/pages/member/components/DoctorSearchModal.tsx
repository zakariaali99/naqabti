import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Switch,
} from "@heroui/react";
import { FiSave, FiUser } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import usersApi from "@/api/usersApi";
import { UserEntity, UserCreateInput, UserUpdateInput } from "@/models/users";

interface DoctorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: UserEntity) => void;
  doctorId?: number; // If provided, edit existing doctor, otherwise create new
}

const DoctorEditModal = ({
  isOpen,
  onClose,
  onSave,
  doctorId,
}: DoctorEditModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<UserCreateInput>>({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    password: "",
    user_type: "doctor",
    specialty: "",
    bio: "",
    language: "en",
    is_active: true,
    is_staff: false,
    groups: [],
  });

  const isEdit = Boolean(doctorId);

  // Load existing doctor data for editing
  useEffect(() => {
    if (isOpen && isEdit && doctorId) {
      const fetchDoctor = async () => {
        try {
          setLoading(true);
          const response = await usersApi.getById(doctorId);
          const doctor: UserEntity = response.data;

          setFormData({
            username: doctor.username,
            email: doctor.email,
            full_name: doctor.full_name,
            phone_number: doctor.phone_number || "",
            user_type: doctor.user_type,
            specialty: doctor.specialty || "",
            bio: doctor.bio || "",
            language: doctor.language,
            is_active: doctor.is_active,
            is_staff: doctor.is_staff,
            groups: doctor.groups,
          });
        } catch (error) {
          console.error("Error fetching doctor:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchDoctor();
    } else if (isOpen && !isEdit) {
      // Reset form for new doctor
      setFormData({
        username: "",
        email: "",
        full_name: "",
        phone_number: "",
        password: "",
        user_type: "doctor",
        specialty: "",
        bio: "",
        language: "en",
        is_active: true,
        is_staff: false,
        groups: [],
      });
    }
  }, [isOpen, isEdit, doctorId]);

  // Handle form field changes
  const handleInputChange = (field: keyof UserCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username?.trim()) {
      newErrors.username = t("common.form.required") || "Required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = t("common.form.required") || "Required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email =
        t("doctors.validation.invalidEmail", "Invalid email format") ||
        "Invalid email";
    }

    if (!formData.full_name?.trim()) {
      newErrors.full_name = t("common.form.required") || "Required";
    }

    if (!isEdit && !formData.password?.trim()) {
      newErrors.password =
        t(
          "doctors.validation.passwordRequired",
          "Password is required for new users",
        ) || "Password required";
    }

    if (!formData.specialty?.trim()) {
      newErrors.specialty =
        t("doctors.validation.specialtyRequired", "Specialty is required") ||
        "Specialty required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      let doctor: UserEntity;

      if (isEdit && doctorId) {
        const updateData: UserUpdateInput = { ...formData };

        if (!updateData.password?.trim()) {
          delete updateData.password; // Don't send empty password
        }
        const response = await usersApi.update(doctorId, updateData);

        doctor = response.data;
      } else {
        const response = await usersApi.create(formData as UserCreateInput);

        doctor = response.data;
      }

      onSave(doctor);
      onClose();
    } catch (error: any) {
      console.error("Failed to save doctor:", error);

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
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      email: "",
      full_name: "",
      phone_number: "",
      password: "",
      user_type: "doctor",
      specialty: "",
      bio: "",
      language: "en",
      is_active: true,
      is_staff: false,
      groups: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FiUser className="text-primary" />
            <h3 className="text-lg font-semibold">
              {isEdit
                ? t("doctors.edit", "Edit Doctor")
                : t("doctors.add", "Add Doctor")}
            </h3>
          </div>
          <p className="text-sm text-default-500">
            {isEdit
              ? t("doctors.editSubtitle", "Update doctor information")
              : t("doctors.addSubtitle", "Create a new doctor profile")}
          </p>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner label={t("common.loading", "Loading...")} size="lg" />
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.username}
                  isInvalid={!!errors.username}
                  label={t("common.username", "Username")}
                  placeholder={t(
                    "doctors.placeholders.username",
                    "Enter username",
                  )}
                  value={formData.username || ""}
                  onValueChange={(value) =>
                    handleInputChange("username", value)
                  }
                />

                <Input
                  isRequired
                  errorMessage={errors.email}
                  isInvalid={!!errors.email}
                  label={t("common.email", "Email")}
                  placeholder={t("doctors.placeholders.email", "Enter email")}
                  type="email"
                  value={formData.email || ""}
                  onValueChange={(value) => handleInputChange("email", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.full_name}
                  isInvalid={!!errors.full_name}
                  label={t("common.name", "Full Name")}
                  placeholder={t(
                    "doctors.placeholders.fullName",
                    "Enter full name",
                  )}
                  value={formData.full_name || ""}
                  onValueChange={(value) =>
                    handleInputChange("full_name", value)
                  }
                />

                <Input
                  label={t("common.phone", "Phone")}
                  placeholder={t(
                    "doctors.placeholders.phone",
                    "Enter phone number",
                  )}
                  value={formData.phone_number || ""}
                  onValueChange={(value) =>
                    handleInputChange("phone_number", value)
                  }
                />
              </div>

              {!isEdit && (
                <Input
                  isRequired
                  errorMessage={errors.password}
                  isInvalid={!!errors.password}
                  label={t("common.password", "Password")}
                  placeholder={t(
                    "doctors.placeholders.password",
                    "Enter password",
                  )}
                  type="password"
                  value={formData.password || ""}
                  onValueChange={(value) =>
                    handleInputChange("password", value)
                  }
                />
              )}

              {/* Doctor-specific fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.specialty}
                  isInvalid={!!errors.specialty}
                  label={t("doctors.fields.specialty", "Specialty")}
                  placeholder={t(
                    "doctors.placeholders.specialty",
                    "Enter doctor specialty",
                  )}
                  value={formData.specialty || ""}
                  onValueChange={(value) =>
                    handleInputChange("specialty", value)
                  }
                />

                <Select
                  label={t("common.language", "Language")}
                  selectedKeys={formData.language ? [formData.language] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    handleInputChange("language", selectedKey as "ar" | "en");
                  }}
                >
                  <SelectItem key="en">English</SelectItem>
                  <SelectItem key="ar">العربية</SelectItem>
                </Select>
              </div>

              <Textarea
                label={t("doctors.fields.bio", "Bio")}
                placeholder={t(
                  "doctors.placeholders.bio",
                  "Enter doctor biography",
                )}
                rows={3}
                value={formData.bio || ""}
                onValueChange={(value) => handleInputChange("bio", value)}
              />

              {/* Status */}
              <div className="flex items-center gap-4">
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(value) =>
                    handleInputChange("is_active", value)
                  }
                >
                  {t("common.active", "Active")}
                </Switch>

                <Switch
                  isSelected={formData.is_staff}
                  onValueChange={(value) =>
                    handleInputChange("is_staff", value)
                  }
                >
                  {t("common.staff", "Staff")}
                </Switch>
              </div>
            </form>
          )}
        </ModalBody>

        <ModalFooter>
          <Button disabled={saving} variant="light" onPress={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            color="primary"
            disabled={loading}
            isLoading={saving}
            startContent={<FiSave />}
            onPress={() => handleSubmit(new Event("submit") as any)}
          >
            {saving
              ? t("common.saving", "Saving...")
              : t("common.save", "Save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DoctorEditModal;
