import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalBody,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiEdit2 } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import userGroupsApi from "@/api/userGroupsApi";
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import { UserCreateInput, UserEntity } from "@/models/users";
import { Branch } from "@/models/branch";
import { UserGroup } from "@/models/userGroups";
import BranchModal from "@/pages/branches/BranchModal";
import NationalitySearchModal from "@/components/modals/NationalitySearchModal";
import { Nationality } from "@/models/nationality";
import { Spinner } from "@/components/Spinner";

// Validation rules
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: UserCreateInput) => string | null;
}

interface FieldValidation {
  rules: ValidationRule;
  errorMessage?: string;
}

const VALIDATION_RULES: Record<string, FieldValidation> = {
  username: {
    rules: { required: true, minLength: 3, maxLength: 150 },
    errorMessage: "username",
  },
  email: {
    rules: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    errorMessage: "email",
  },
  full_name: {
    rules: { required: false, maxLength: 255 },
    errorMessage: "full_name",
  },
  first_name_field: {
    rules: { required: true, maxLength: 150 },
    errorMessage: "first_name_field",
  },
  father_name: {
    rules: { required: true, maxLength: 150 },
    errorMessage: "father_name",
  },
  grandfather_name: {
    rules: { required: true, maxLength: 150 },
    errorMessage: "grandfather_name",
  },
  family_name: {
    rules: { required: true, maxLength: 150 },
    errorMessage: "family_name",
  },
  first_name_en: {
    rules: { required: false, maxLength: 150 },
    errorMessage: "first_name_en",
  },
  father_name_en: {
    rules: { required: false, maxLength: 150 },
    errorMessage: "father_name_en",
  },
  grandfather_name_en: {
    rules: { required: false, maxLength: 150 },
    errorMessage: "grandfather_name_en",
  },
  family_name_en: {
    rules: { required: false, maxLength: 150 },
    errorMessage: "family_name_en",
  },
  phone_number: {
    rules: { required: false, maxLength: 20 },
    errorMessage: "phone_number",
  },
  password: {
    rules: { required: false, minLength: 8, maxLength: 128 },
    errorMessage: "password",
  },
  specialty: {
    rules: { required: false, maxLength: 200 },
    errorMessage: "specialty",
  },
  bio: {
    rules: { required: false, maxLength: 1000 },
    errorMessage: "bio",
  },
  doctor_number: {
    rules: { required: false, maxLength: 50 },
    errorMessage: "doctor_number",
  },
};

const FIELD_REQUIRED_KEYS: Record<string, string> = {
  username: "users.errors.usernameRequired",
  email: "users.errors.emailRequired",
  full_name: "users.errors.fullNameRequired",
  first_name_field: "users.errors.firstNameRequired",
  father_name: "users.errors.fatherNameRequired",
  grandfather_name: "users.errors.grandfatherNameRequired",
  family_name: "users.errors.familyNameRequired",
  password: "users.errors.passwordRequired",
};

type TouchedFields = Record<string, boolean>;

export default function UsersFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<UserCreateInput>({
    username: "",
    email: "",
    full_name: "",
    // Arabic name fields
    first_name_field: "",
    father_name: "",
    grandfather_name: "",
    family_name: "",
    // English name fields
    first_name_en: "",
    father_name_en: "",
    grandfather_name_en: "",
    family_name_en: "",
    phone_number: "",
    language: "ar",
    password: "",
    is_active: true,
    user_type: "doctor",
    specialty: "",
    bio: "",
    doctor_number: "",
    groups: [],
    branch_ids: [],
    managed_branch_ids: [],
    nationality: "",
    gender: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [selectedManagedBranches, setSelectedManagedBranches] = useState<Branch[]>([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [managedBranchModalOpen, setManagedBranchModalOpen] = useState(false);
  const [nationalityModalOpen, setNationalityModalOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<{id: number; name: string}[]>([]);
  const [loadedUser, setLoadedUser] = useState<UserEntity | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Suppress browser native "Please fill out this field." popups —
  // our custom translated messages handle all validation feedback.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const suppress = (e: Event) => e.preventDefault();
    form.addEventListener("invalid", suppress, true);
    return () => form.removeEventListener("invalid", suppress, true);
  }, []);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ visible: false, type: "success", title: "", message: "" });

  // Validate single field
  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const fieldValidation = VALIDATION_RULES[fieldName];

      if (!fieldValidation) return null;

      const { rules } = fieldValidation;

      // Required check
      if (rules.required) {
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && !value.trim())
        ) {
          return t(FIELD_REQUIRED_KEYS[fieldName] ?? "users.form.required");
        }
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === "string" && !value.trim())) {
        return null;
      }

      // Min length check
      if (
        rules.minLength &&
        typeof value === "string" &&
        value.length < rules.minLength
      ) {
        return t("users.errors.minLength", { min: rules.minLength });
      }

      // Max length check
      if (
        rules.maxLength &&
        typeof value === "string" &&
        value.length > rules.maxLength
      ) {
        return t("users.errors.maxLength", { max: rules.maxLength });
      }

      // Pattern check
      if (
        rules.pattern &&
        typeof value === "string" &&
        !rules.pattern.test(value)
      ) {
        return t("users.form.invalidEmail");
      }

      return null;
    },
    [t],
  );

  // Validate password with confirm password
  const validatePassword = useCallback(
    (
      password: string,
      confirmPwd: string,
      isEditMode: boolean,
    ): Record<string, string> => {
      const passwordErrors: Record<string, string> = {};

      // Only validate password for new users or if password is provided
      if (!isEditMode || password) {
        if (!password.trim()) {
          // Don't show error if not required (edit mode without password change)
          if (!isEditMode) {
            passwordErrors.password = t("users.errors.passwordRequired");
          }
        } else if (password.length < 8) {
          passwordErrors.password = t("users.errors.passwordTooShort");
        } else if (password.length > 128) {
          passwordErrors.password = t("users.errors.maxLength", { max: 128 });
        }

        if (password && password !== confirmPwd) {
          passwordErrors.confirmPassword = t("users.form.passwordsDoNotMatch");
        }
      }

      return passwordErrors;
    },
    [t],
  );

  // Validate entire form
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Validate username
    const usernameError = validateField("username", formData.username);

    if (usernameError) newErrors.username = usernameError;

    // Validate email
    const emailError = validateField("email", formData.email);

    if (emailError) newErrors.email = emailError;

    // Validate full_name for institutions
    if (formData.user_type === "institution") {
      if (!formData.full_name?.trim()) {
        newErrors.full_name = t("users.errors.fullNameRequired");
      }
    }

    // Validate Arabic name fields for non-institutions
    if (formData.user_type !== "institution") {
      const arabicNameFields = [
        "first_name_field",
        "father_name",
        "grandfather_name",
        "family_name",
      ];

      arabicNameFields.forEach((field) => {
        const error = validateField(
          field,
          formData[field as keyof UserCreateInput],
        );

        if (error) newErrors[field] = error;
      });
    }

    // Validate phone (optional but has max length)
    if (formData.phone_number) {
      const phoneError = validateField("phone_number", formData.phone_number);

      if (phoneError) newErrors.phone_number = phoneError;
    }

    // Validate doctor-specific fields
    if (formData.user_type === "doctor") {
      // Specialty is optional but has max length
      if (formData.specialty) {
        const specialtyError = validateField("specialty", formData.specialty);

        if (specialtyError) newErrors.specialty = specialtyError;
      }

      // Doctor number is optional but has max length
      if (formData.doctor_number) {
        const doctorNumberError = validateField(
          "doctor_number",
          formData.doctor_number,
        );

        if (doctorNumberError) newErrors.doctor_number = doctorNumberError;
      }

      // Bio is optional but has max length
      if (formData.bio) {
        const bioError = validateField("bio", formData.bio);

        if (bioError) newErrors.bio = bioError;
      }
    }

    // Validate password
    const passwordErrors = validatePassword(
      formData.password || "",
      confirmPassword,
      isEdit,
    );

    Object.assign(newErrors, passwordErrors);

    // Validate branches for doctors
    if (
      formData.user_type === "doctor" &&
      (!formData.branch_ids || formData.branch_ids.length === 0)
    ) {
      newErrors.branch_ids = t("users.errors.branchRequired");
    }

    return newErrors;
  }, [formData, confirmPassword, isEdit, validateField, validatePassword, t]);

  // Handle field blur - mark field as touched and validate
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Validate the field on blur
    const value = formData[fieldName as keyof UserCreateInput];
    const error = validateField(fieldName, value);

    if (error) {
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  // Handle confirm password blur
  const handleConfirmPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));

    if (formData.password && formData.password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: t("users.form.passwordsDoNotMatch"),
      }));
    }
  };

  // Load available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await userGroupsApi.getAll({ is_active: true });

        setAvailableGroups(response.data.results || response.data);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await doctorSpecialtyApi.getAll({ is_active: true });
        const items = response.data?.results || response.data || [];
        setAvailableSpecialties(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      }
    };
    fetchSpecialties();
  }, []);

  // Load user data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const response = await usersApi.getById(parseInt(id));
          const user = response.data;

          setLoadedUser(user);
          const branchIds = user.branch_ids || (user.branches ? user.branches.map(b => b.id) : []);
          setFormData({
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            first_name_field: user.first_name_field || "",
            father_name: user.father_name || "",
            grandfather_name: user.grandfather_name || "",
            family_name: user.family_name || "",
            first_name_en: user.first_name_en || "",
            father_name_en: user.father_name_en || "",
            grandfather_name_en: user.grandfather_name_en || "",
            family_name_en: user.family_name_en || "",
            phone_number: user.phone_number || "",
            language: user.language,
            password: "",
            is_active: user.is_active,
            user_type: user.user_type,
            specialty: user.specialty || "",
            bio: user.bio || "",
            doctor_number: user.doctor_number || "",
            groups: user.groups,
            branch_ids: branchIds,
            managed_branch_ids: user.managed_branch_ids || [],
            nationality: user.nationality || "",
            gender: user.gender || "",
          });
          if (user.branches) {
            setSelectedBranches(user.branches);
          }
          // Load managed branches
          if (user.managed_branch_ids && user.branches) {
            const managed = user.branches.filter(b => user.managed_branch_ids?.includes(b.id));
            setSelectedManagedBranches(managed);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [id, isEdit]);

  // Handle form field changes
  const handleInputChange = (field: keyof UserCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing (only if field was touched)
    if (touched[field]) {
      const error = validateField(field, value);

      setErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }));
    }

    // When changing user type to doctor, enforce single branch selection
    if (
      field === "user_type" &&
      value === "doctor" &&
      selectedBranches.length > 1
    ) {
      const firstBranch = selectedBranches[0];

      setSelectedBranches([firstBranch]);
      setFormData((prev) => ({ ...prev, branch_ids: [firstBranch.id] }));
    }
  };

  const handleBranchSelect = (branches: Branch[]) => {
    if (formData.user_type === "doctor" && branches.length > 1) {
      setSelectedBranches([branches[branches.length - 1]]);
      handleInputChange("branch_ids", [branches[branches.length - 1].id]);
    } else {
      setSelectedBranches(branches);
      handleInputChange(
        "branch_ids",
        branches.map((b) => b.id),
      );
    }

    // Clear branch error if branches are selected
    if (branches.length > 0 && touched.branch_ids) {
      setErrors((prev) => ({ ...prev, branch_ids: "" }));
    }
  };

  const handleManagedBranchSelect = (branches: Branch[]) => {
    setSelectedManagedBranches(branches);
    handleInputChange(
      "managed_branch_ids",
      branches.map((b) => b.id),
    );
  };

  const handleNationalitySelect = (nationalities: Nationality[]) => {
    if (nationalities.length > 0) {
      handleInputChange("nationality", nationalities[0].name);
    } else {
      handleInputChange("nationality", "");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = [
      "username",
      "email",
      "full_name",
      "first_name_field",
      "father_name",
      "grandfather_name",
      "family_name",
      "phone_number",
      "password",
      "confirmPassword",
      "specialty",
      "bio",
      "doctor_number",
      "branch_ids",
    ];

    setTouched(
      allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    );

    // Validate entire form
    const validationErrors = validateForm();

    setErrors(validationErrors);

    // Return if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setSubmitModalOpen(true);
      setSaveLoading(true);

      const submitData: any = { ...formData };

      if (isEdit && !formData.password) {
        delete submitData.password;
        delete submitData.confirm_password;
      } else if (formData.password) {
        submitData.confirm_password = confirmPassword;
      }

      if (isEdit && id) {
        await usersApi.update(parseInt(id), submitData);
        setToast({
          visible: true,
          type: "success",
          title: t("users.toast.success"),
          message: t("users.toast.updateSuccess"),
        });
      } else {
        await usersApi.create(submitData);
        setToast({
          visible: true,
          type: "success",
          title: t("users.toast.success"),
          message: t("users.toast.createSuccess"),
        });
      }

      navigate("/users");
    } catch (error: any) {
      console.error("Failed to save user:", error);

      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        const responseData = error.response.data;

        if (typeof responseData === "string") {
          apiErrors.general = responseData;
        } else if (typeof responseData === "object") {
          Object.keys(responseData).forEach((key) => {
            const value = responseData[key];

            if (Array.isArray(value)) {
              apiErrors[key] = value[0];
            } else if (typeof value === "object" && value !== null) {
              Object.keys(value).forEach((nestedKey) => {
                if (Array.isArray(value[nestedKey])) {
                  apiErrors[`${key}.${nestedKey}`] = value[nestedKey][0];
                } else {
                  apiErrors[`${key}.${nestedKey}`] = String(value[nestedKey]);
                }
              });
            } else {
              apiErrors[key] = String(value);
            }
          });
        }

        if (Object.keys(apiErrors).length === 0) {
          apiErrors.general = t("users.errors.saveFailed");
        }

        setErrors((prev) => ({ ...prev, ...apiErrors }));

        // Show error toast
        setToast({
          visible: true,
          type: "error",
          title: t("users.toast.error"),
          message: t("users.errors.saveFailed"),
        });

        // Mark fields with API errors as touched
        Object.keys(apiErrors).forEach((key) => {
          if (key !== "general") {
            setTouched((prev) => ({ ...prev, [key]: true }));
          }
        });
      } else {
        setToast({
          visible: true,
          type: "error",
          title: t("users.toast.error"),
          message: t("users.errors.networkError"),
        });
      }
    } finally {
      setSaveLoading(false);
      setSubmitModalOpen(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">{t("users.loading")}</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button isIconOnly variant="light" onPress={() => navigate("/users")}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? t("users.edit") : t("users.add")}
            </h1>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEdit ? t("users.edit") : t("users.add")}
            </h2>
          </CardHeader>
          <CardBody>
            <form ref={formRef} noValidate className="space-y-6" onSubmit={handleSubmit}>
              {/* General Error Message */}
              {errors.general && (
                <div className="p-4 bg-danger-100 border border-danger rounded-lg text-danger">
                  {errors.general}
                </div>
              )}

              {/* Toast Notification */}
              {toast.visible && (
                <div
                  className={`p-4 rounded-lg border ${
                    toast.type === "success"
                      ? "bg-success-100 border-success text-success"
                      : "bg-danger-100 border-danger text-danger"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{toast.title}</p>
                      <p className="text-sm mt-1">{toast.message}</p>
                    </div>
                    <button
                      className="text-lg"
                      onClick={() =>
                        setToast((prev) => ({ ...prev, visible: false }))
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={touched.username ? errors.username : ""}
                  isInvalid={touched.username && !!errors.username}
                  label={t("users.form.username")}
                  placeholder={t("users.form.usernamePlaceholder")}
                  value={formData.username}
                  onBlur={() => handleBlur("username")}
                  onValueChange={(value) =>
                    handleInputChange("username", value)
                  }
                />
                <Input
                  isRequired
                  errorMessage={touched.email ? errors.email : ""}
                  isInvalid={touched.email && !!errors.email}
                  label={t("users.form.email")}
                  placeholder={t("users.form.emailPlaceholder")}
                  type="email"
                  value={formData.email}
                  onBlur={() => handleBlur("email")}
                  onValueChange={(value) => handleInputChange("email", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  isRequired
                  label={t("users.form.userType")}
                  placeholder={t("users.form.userTypePlaceholder")}
                  selectedKeys={[formData.user_type]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    handleInputChange("user_type", selectedKey || "manager");
                  }}
                >
                  <SelectItem key="doctor">
                    {t("users.userTypes.doctor")}
                  </SelectItem>
                  <SelectItem key="manager">
                    {t("users.userTypes.manager")}
                  </SelectItem>
                  <SelectItem key="student">
                    {t("users.userTypes.student")}
                  </SelectItem>
                  <SelectItem key="institution">
                    {t("users.userTypes.institution")}
                  </SelectItem>
                  <SelectItem key="viewer">
                    {t("users.userTypes.viewer", "Viewer")}
                  </SelectItem>
                  <SelectItem key="advertiser">
                    {t("users.userTypes.advertiser", "Advertiser")}
                  </SelectItem>
                </Select>

                {formData.user_type !== "institution" && (
                  <Select
                    label={t("users.form.gender")}
                    placeholder={t("users.form.genderPlaceholder")}
                    selectedKeys={formData.gender ? [formData.gender] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleInputChange("gender", selectedKey || "");
                    }}
                  >
                    <SelectItem key="male">{t("users.genders.male")}</SelectItem>
                    <SelectItem key="female">{t("users.genders.female")}</SelectItem>
                  </Select>
                )}
              </div>

              {/* Arabic Name Section - Only for non-institution users */}
              {formData.user_type !== "institution" && (
                <>
                  <h3 className="text-lg font-medium">
                    {t("users.form.arabicName")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      errorMessage={
                        touched.first_name_field ? errors.first_name_field : ""
                      }
                      isInvalid={
                        touched.first_name_field && !!errors.first_name_field
                      }
                      label={t(
                        "users.form.firstNameArabic",
                        "First Name (Arabic)",
                      )}
                      placeholder={t(
                        "users.form.firstNameArabicPlaceholder",
                        "Enter first name in Arabic",
                      )}
                      value={formData.first_name_field || ""}
                      onBlur={() => handleBlur("first_name_field")}
                      onValueChange={(value) =>
                        handleInputChange("first_name_field", value)
                      }
                    />
                    <Input
                      isRequired
                      errorMessage={
                        touched.father_name ? errors.father_name : ""
                      }
                      isInvalid={touched.father_name && !!errors.father_name}
                      label={t(
                        "users.form.fatherNameArabic",
                        "Father Name (Arabic)",
                      )}
                      placeholder={t(
                        "users.form.fatherNameArabicPlaceholder",
                        "Enter father name in Arabic",
                      )}
                      value={formData.father_name || ""}
                      onBlur={() => handleBlur("father_name")}
                      onValueChange={(value) =>
                        handleInputChange("father_name", value)
                      }
                    />
                    <Input
                      isRequired
                      errorMessage={
                        touched.grandfather_name ? errors.grandfather_name : ""
                      }
                      isInvalid={
                        touched.grandfather_name && !!errors.grandfather_name
                      }
                      label={t(
                        "users.form.grandfatherNameArabic",
                        "Grandfather Name (Arabic)",
                      )}
                      placeholder={t(
                        "users.form.grandfatherNameArabicPlaceholder",
                        "Enter grandfather name in Arabic",
                      )}
                      value={formData.grandfather_name || ""}
                      onBlur={() => handleBlur("grandfather_name")}
                      onValueChange={(value) =>
                        handleInputChange("grandfather_name", value)
                      }
                    />
                    <Input
                      isRequired
                      errorMessage={
                        touched.family_name ? errors.family_name : ""
                      }
                      isInvalid={touched.family_name && !!errors.family_name}
                      label={t(
                        "users.form.familyNameArabic",
                        "Family Name (Arabic)",
                      )}
                      placeholder={t(
                        "users.form.familyNameArabicPlaceholder",
                        "Enter family name in Arabic",
                      )}
                      value={formData.family_name || ""}
                      onBlur={() => handleBlur("family_name")}
                      onValueChange={(value) =>
                        handleInputChange("family_name", value)
                      }
                    />
                  </div>

                  {/* English Name Section (Optional) */}
                  <h3 className="text-lg font-medium">
                    {t("users.form.englishName")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      errorMessage={
                        touched.first_name_en ? errors.first_name_en : ""
                      }
                      isInvalid={
                        touched.first_name_en && !!errors.first_name_en
                      }
                      label={t(
                        "users.form.firstNameEnglish",
                        "First Name (English)",
                      )}
                      placeholder={t(
                        "users.form.firstNameEnglishPlaceholder",
                        "Enter first name in English",
                      )}
                      value={formData.first_name_en || ""}
                      onBlur={() => handleBlur("first_name_en")}
                      onValueChange={(value) =>
                        handleInputChange("first_name_en", value)
                      }
                    />
                    <Input
                      errorMessage={
                        touched.father_name_en ? errors.father_name_en : ""
                      }
                      isInvalid={
                        touched.father_name_en && !!errors.father_name_en
                      }
                      label={t(
                        "users.form.fatherNameEnglish",
                        "Father Name (English)",
                      )}
                      placeholder={t(
                        "users.form.fatherNameEnglishPlaceholder",
                        "Enter father name in English",
                      )}
                      value={formData.father_name_en || ""}
                      onBlur={() => handleBlur("father_name_en")}
                      onValueChange={(value) =>
                        handleInputChange("father_name_en", value)
                      }
                    />
                    <Input
                      errorMessage={
                        touched.grandfather_name_en
                          ? errors.grandfather_name_en
                          : ""
                      }
                      isInvalid={
                        touched.grandfather_name_en &&
                        !!errors.grandfather_name_en
                      }
                      label={t(
                        "users.form.grandfatherNameEnglish",
                        "Grandfather Name (English)",
                      )}
                      placeholder={t(
                        "users.form.grandfatherNameEnglishPlaceholder",
                        "Enter grandfather name in English",
                      )}
                      value={formData.grandfather_name_en || ""}
                      onBlur={() => handleBlur("grandfather_name_en")}
                      onValueChange={(value) =>
                        handleInputChange("grandfather_name_en", value)
                      }
                    />
                    <Input
                      errorMessage={
                        touched.family_name_en ? errors.family_name_en : ""
                      }
                      isInvalid={
                        touched.family_name_en && !!errors.family_name_en
                      }
                      label={t(
                        "users.form.familyNameEnglish",
                        "Family Name (English)",
                      )}
                      placeholder={t(
                        "users.form.familyNameEnglishPlaceholder",
                        "Enter family name in English",
                      )}
                      value={formData.family_name_en || ""}
                      onBlur={() => handleBlur("family_name_en")}
                      onValueChange={(value) =>
                        handleInputChange("family_name_en", value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Institution name field */}
              {formData.user_type === "institution" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    isRequired
                    errorMessage={touched.full_name ? errors.full_name : ""}
                    isInvalid={touched.full_name && !!errors.full_name}
                    label={t("users.form.fullName")}
                    placeholder={t("users.form.fullNamePlaceholder")}
                    value={formData.full_name}
                    onBlur={() => handleBlur("full_name")}
                    onValueChange={(value) =>
                      handleInputChange("full_name", value)
                    }
                  />
                </div>
              )}

              {/* Doctor-specific fields */}
              {formData.user_type === "doctor" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-default-100 rounded-lg">
                  <Select
                    disallowEmptySelection
                    errorMessage={touched.specialty ? errors.specialty : ""}
                    isInvalid={touched.specialty && !!errors.specialty}
                    label={t("users.form.specialty")}
                    placeholder={t("users.form.specialtyPlaceholder")}
                    selectedKeys={formData.specialty ? [formData.specialty] : []}
                    onBlur={() => handleBlur("specialty")}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      handleInputChange("specialty", selected);
                    }}
                  >
                    {availableSpecialties.map((spec) => (
                      <SelectItem key={spec.name}>{spec.name}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    description={
                      isEdit && loadedUser?.full_doctor_number
                        ? `${t("users.form.fullDoctorNumber")}: ${loadedUser.full_doctor_number}`
                        : t("users.form.doctorNumberHint")
                    }
                    errorMessage={
                      touched.doctor_number ? errors.doctor_number : ""
                    }
                    isInvalid={touched.doctor_number && !!errors.doctor_number}
                    label={t("users.form.doctorNumber")}
                    placeholder={t("users.form.doctorNumberPlaceholder")}
                    value={formData.doctor_number || ""}
                    onBlur={() => handleBlur("doctor_number")}
                    onValueChange={(value) =>
                      handleInputChange("doctor_number", value)
                    }
                  />
                  <Textarea
                    className="md:col-span-2"
                    errorMessage={touched.bio ? errors.bio : ""}
                    isInvalid={touched.bio && !!errors.bio}
                    label={t("users.form.bio")}
                    minRows={3}
                    placeholder={t("users.form.bioPlaceholder")}
                    value={formData.bio || ""}
                    onBlur={() => handleBlur("bio")}
                    onValueChange={(value) => handleInputChange("bio", value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  errorMessage={touched.phone_number ? errors.phone_number : ""}
                  isInvalid={touched.phone_number && !!errors.phone_number}
                  label={t("users.form.phone")}
                  placeholder={t("users.form.phonePlaceholder")}
                  value={formData.phone_number}
                  onBlur={() => handleBlur("phone_number")}
                  onValueChange={(value) =>
                    handleInputChange("phone_number", value)
                  }
                />
                <Select
                  isRequired
                  label={t("users.form.language")}
                  placeholder={t("users.form.languagePlaceholder")}
                  selectedKeys={[formData.language]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    handleInputChange("language", selectedKey || "en");
                  }}
                >
                  <SelectItem key="en">{t("users.languages.en")}</SelectItem>
                  <SelectItem key="ar">{t("users.languages.ar")}</SelectItem>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isReadOnly
                  label={t("users.form.nationality")}
                  placeholder={t("users.form.selectNationality")}
                  value={formData.nationality ? t(`nationalities.list.${formData.nationality}`, formData.nationality) : ""}
                  onClick={() => setNationalityModalOpen(true)}
                  classNames={{
                    input: "cursor-pointer",
                    inputWrapper: "cursor-pointer"
                  }}
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  description={
                    isEdit ? t("users.form.passwordHint") : undefined
                  }
                  errorMessage={touched.password ? errors.password : ""}
                  isInvalid={touched.password && !!errors.password}
                  isRequired={!isEdit}
                  label={t("users.form.password")}
                  placeholder={t("users.form.passwordPlaceholder")}
                  type="password"
                  value={formData.password}
                  onBlur={() => handleBlur("password")}
                  onValueChange={(value) =>
                    handleInputChange("password", value)
                  }
                />
                <Input
                  errorMessage={
                    touched.confirmPassword ? errors.confirmPassword : ""
                  }
                  isInvalid={
                    touched.confirmPassword && !!errors.confirmPassword
                  }
                  isRequired={!isEdit || !!formData.password}
                  label={t("users.form.confirmPassword")}
                  placeholder={t("users.form.confirmPasswordPlaceholder")}
                  type="password"
                  value={confirmPassword}
                  onBlur={handleConfirmPasswordBlur}
                  onValueChange={(value) => {
                    setConfirmPassword(value);
                    if (
                      touched.confirmPassword &&
                      value &&
                      formData.password &&
                      value !== formData.password
                    ) {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: t("users.form.passwordsDoNotMatch"),
                      }));
                    } else if (touched.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                />
              </div>

              {/* Branches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("users.branches")}</h3>
                  <Button
                    size="sm"
                    startContent={<FiEdit2 />}
                    variant="flat"
                    onPress={() => setBranchModalOpen(true)}
                  >
                    {formData.user_type === "doctor"
                      ? t("users.selectBranch")
                      : t("users.selectBranches")}
                  </Button>
                </div>
                {errors.branch_ids && touched.branch_ids && (
                  <p className="text-danger text-sm">{errors.branch_ids}</p>
                )}
                {selectedBranches.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-default-100 rounded-lg">
                    {selectedBranches.map((branch) => (
                      <Chip key={branch.id} color="primary" variant="flat">
                        {branch.name} ({branch.prefix})
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("users.groups")}</h3>
                <Select
                  description={t("users.form.groupsDescription")}
                  label={t("users.form.groups")}
                  placeholder={t("users.form.selectGroups")}
                  selectedKeys={formData.groups?.map(String) || []}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => {
                    const selectedKeys = Array.from(keys).map((key) =>
                      parseInt(key as string),
                    );

                    handleInputChange("groups", selectedKeys);
                  }}
                >
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id}>{group.name}</SelectItem>
                  ))}
                </Select>
                {formData.groups && formData.groups.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-default-100 rounded-lg">
                    {formData.groups.map((groupId) => {
                      const group = availableGroups.find(
                        (g) => g.id === groupId,
                      );

                      return group ? (
                        <Chip key={groupId} color="primary" variant="flat">
                          {group.name}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {t("users.permissions")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Switch
                    isSelected={formData.is_active}
                    onValueChange={(value) =>
                      handleInputChange("is_active", value)
                    }
                  >
                    {t("users.form.isActive")}
                  </Switch>
                  <Switch
                    isSelected={!!formData.is_staff}
                    onValueChange={(value) =>
                      handleInputChange("is_staff", value)
                    }
                  >
                    {t("users.form.isStaff")}
                  </Switch>
                </div>
              </div>

              {/* Managed Branches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("users.form.managedBranches")}</h3>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setManagedBranchModalOpen(true)}
                  >
                    {t("users.selectBranches")}
                  </Button>
                </div>
                {selectedManagedBranches.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-default-100 rounded-lg">
                    {selectedManagedBranches.map((branch) => (
                      <Chip key={branch.id} color="warning" variant="flat">
                        {branch.name} ({branch.prefix})
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  disabled={saveLoading}
                  variant="light"
                  onPress={() => navigate("/users")}
                >
                  {t("users.form.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={saveLoading}
                  startContent={<FiSave />}
                  type="submit"
                >
                  {t("users.form.save")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <BranchModal
          isOpen={branchModalOpen}
          mode={formData.user_type === "doctor" ? "single" : "multiple"}
          selectedBranches={selectedBranches}
          title={
            formData.user_type === "doctor"
              ? t("users.selectDoctorBranch")
              : t("users.selectUserBranches")
          }
          onClose={() => setBranchModalOpen(false)}
          onSelect={handleBranchSelect}
        />

        <BranchModal
          isOpen={managedBranchModalOpen}
          mode="single"
          selectedBranches={selectedManagedBranches}
          title={t("users.form.selectManagedBranches")}
          onClose={() => setManagedBranchModalOpen(false)}
          onSelect={handleManagedBranchSelect}
        />

        <NationalitySearchModal
          isOpen={nationalityModalOpen}
          mode="single"
          selectedNationalityName={formData.nationality}
          onClose={() => setNationalityModalOpen(false)}
          onSelect={handleNationalitySelect}
        />

        {/* Submit Loading Modal */}
        <Modal
          hideCloseButton
          isDismissable={false}
          isOpen={submitModalOpen}
          onClose={() => {}}
        >
          <ModalContent>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Spinner size={48} />
                <p className="text-lg">{t("users.submitting")}</p>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
