import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Spinner,
  Select,
  SelectItem,
  Switch,
  Chip,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiEye, FiEyeOff, FiEdit2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import { UserCreateInput, UserEntity } from "@/models/users";
import { Branch } from "@/models/branch";
import { Institution } from "@/models/institution";
import { BranchDynamicField } from "@/models/dynamicField";
import BranchModal from "@/pages/branches/BranchModal";
import InstitutionModal from "@/pages/institutions/InstitutionModal";

const CARD_CLASSNAMES = { base: "rounded-[32px] shadow-sm border border-default-200" };

export default function StudentFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadedUser, setLoadedUser] = useState<UserEntity | null>(null);

  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([]);
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<
    Record<number, { value_text?: string; value_boolean?: boolean }>
  >({});
  const [dynamicFieldFiles, setDynamicFieldFiles] = useState<Record<number, File>>({});
  const [branchJustSelected, setBranchJustSelected] = useState(false);

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
    profile_image: undefined,
    bio: undefined,
    university_name: undefined,
    graduation_year: undefined,
    city: undefined,
    nationality: undefined,
    language: "ar",
    password: "",
    is_active: true,
    is_staff: false,
    user_type: "student",
    groups: [],
    branch_ids: [],
    gender: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedBranch = selectedBranches[0];
  const dynamicFields: BranchDynamicField[] = (selectedBranch?.dynamic_fields || []).filter(
    (f) => f.is_active,
  );

  // Load existing student for edit
  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const resp = await usersApi.getById(parseInt(id));
        const user = resp.data;

        setLoadedUser(user);

        setFormData({
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          // Arabic name fields
          first_name_field: user.first_name_field || "",
          father_name: user.father_name || "",
          grandfather_name: user.grandfather_name || "",
          family_name: user.family_name || "",
          // English name fields
          first_name_en: user.first_name_en || "",
          father_name_en: user.father_name_en || "",
          grandfather_name_en: user.grandfather_name_en || "",
          family_name_en: user.family_name_en || "",
          phone_number: user.phone_number || "",
          profile_image: user.profile_image || undefined,
          bio: user.bio || undefined,
          university_name: user.university_name || undefined,
          graduation_year: user.graduation_year || undefined,
          city: user.city || undefined,
          nationality: user.nationality || undefined,
          language: user.language,
          password: "",
          is_active: user.is_active,
          is_staff: user.is_staff,
          user_type: "student",
          groups: user.groups || [],
          branch_ids: user.branch_ids || [],
          gender: user.gender || "",
        });

        if (user.branches) setSelectedBranches(user.branches);
        if (user.institutions) setSelectedInstitutions(user.institutions);

        const seededValues: Record<number, { value_text?: string; value_boolean?: boolean }> = {};
        (user.dynamic_field_values || []).forEach((v) => {
          seededValues[v.field_id] = {
            value_text: v.value_text ?? undefined,
            value_boolean: v.value_boolean ?? undefined,
          };
        });
        setDynamicFieldValues(seededValues);
      } catch (err) {
        console.error("Failed to load student", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, isEdit]);

  // Preview handling for profile image
  useEffect(() => {
    if (!formData.profile_image) {
      setPreviewUrl(null);

      return;
    }

    if (typeof formData.profile_image === "string") {
      setPreviewUrl(formData.profile_image);

      return;
    }

    const file = formData.profile_image as File;
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [formData.profile_image]);

  const handleInputChange = (field: keyof UserCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBranchSelect = (branches: Branch[]) => {
    setSelectedBranches(branches);
    handleInputChange(
      "branch_ids",
      branches.map((b) => b.id),
    );
    setDynamicFieldValues({});
    setDynamicFieldFiles({});
    setBranchJustSelected(true);
  };

  const handleInstitutionSelect = (institutions: Institution[]) => {
    setSelectedInstitutions(institutions);
  };

  const handleDynamicFieldChange = (
    fieldId: number,
    value: { value_text?: string; value_boolean?: boolean },
  ) => {
    setDynamicFieldValues((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], ...value } }));
    const errorKey = `dynamic_field_${fieldId}`;
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: "" }));
  };

  const handleDynamicFieldFileChange = (fieldId: number, file: File) => {
    setDynamicFieldFiles((prev) => ({ ...prev, [fieldId]: file }));
    const errorKey = `dynamic_field_${fieldId}`;
    if (errors[errorKey]) setErrors((prev) => ({ ...prev, [errorKey]: "" }));
  };

  const renderDynamicField = (field: BranchDynamicField) => {
    const isAr = i18n.language === "ar";
    const label = isAr ? field.label_ar : field.label_en || field.label_ar;
    const placeholder = isAr ? field.placeholder_ar : field.placeholder_en || field.placeholder_ar;
    const errorKey = `dynamic_field_${field.id}`;
    const value = dynamicFieldValues[field.id] || {};

    if (field.field_type === "boolean") {
      return (
        <div key={field.id} className="flex items-center">
          <Switch
            isSelected={!!value.value_boolean}
            onValueChange={(v) => handleDynamicFieldChange(field.id, { value_boolean: v })}
          >
            {label}
            {field.is_required && <span className="text-danger">&nbsp;*</span>}
          </Switch>
        </div>
      );
    }

    if (field.field_type === "select") {
      return (
        <Select
          key={field.id}
          isRequired={field.is_required}
          errorMessage={errors[errorKey]}
          isInvalid={!!errors[errorKey]}
          label={label}
          placeholder={placeholder}
          selectedKeys={value.value_text ? [value.value_text] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            handleDynamicFieldChange(field.id, { value_text: selected || "" });
          }}
        >
          {(field.options || []).map((option) => (
            <SelectItem key={option.value} textValue={isAr ? option.label_ar : option.label_en || option.label_ar}>
              {isAr ? option.label_ar : option.label_en || option.label_ar}
            </SelectItem>
          ))}
        </Select>
      );
    }

    if (field.field_type === "file") {
      const existingValue = loadedUser?.dynamic_field_values?.find((v) => v.field_id === field.id);
      const pendingFile = dynamicFieldFiles[field.id];

      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-sm text-default-500">
            {label}
            {field.is_required && <span className="text-danger">&nbsp;*</span>}
          </label>
          <input
            accept="image/*,application/pdf"
            className="block w-full text-sm text-default-500"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDynamicFieldFileChange(field.id, file);
            }}
          />
          {(pendingFile || existingValue?.value_file) && (
            <p className="text-xs text-default-400">
              {pendingFile ? pendingFile.name : t("common.fileUploaded")}
            </p>
          )}
          {errors[errorKey] && <p className="text-tiny text-danger px-1">{errors[errorKey]}</p>}
        </div>
      );
    }

    return (
      <Input
        key={field.id}
        isRequired={field.is_required}
        errorMessage={errors[errorKey]}
        isInvalid={!!errors[errorKey]}
        label={label}
        placeholder={placeholder}
        value={value.value_text || ""}
        onValueChange={(v) => handleDynamicFieldChange(field.id, { value_text: v })}
      />
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim())
      newErrors.username = t("students.form.required") || "Required";
    if (!formData.email.trim())
      newErrors.email = t("students.form.required") || "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = t("users.form.invalidEmail") || "Invalid email";
    if (selectedBranches.length === 0)
      newErrors.branch_ids = t("member.branchRequired");

    if (!isEdit) {
      if (!formData.password)
        newErrors.password = t("students.form.required") || "Required";
      else if (formData.password.length < 6)
        newErrors.password = t("users.form.passwordTooShort") || "Too short";
      if (formData.password !== confirmPassword)
        newErrors.confirmPassword =
          t("users.form.passwordsDoNotMatch") || "Passwords do not match";
    } else if (formData.password) {
      if (formData.password.length < 6)
        newErrors.password = t("users.form.passwordTooShort") || "Too short";
      if (formData.password !== confirmPassword)
        newErrors.confirmPassword =
          t("users.form.passwordsDoNotMatch") || "Passwords do not match";
    }

    dynamicFields.forEach((field) => {
      if (!field.is_required) return;
      const value = dynamicFieldValues[field.id];
      const hasValue =
        field.field_type === "boolean"
          ? value?.value_boolean !== undefined
          : field.field_type === "file"
            ? !!(
                dynamicFieldFiles[field.id] ||
                loadedUser?.dynamic_field_values?.find((v) => v.field_id === field.id)?.value_file
              )
            : !!value?.value_text;
      if (!hasValue) {
        newErrors[`dynamic_field_${field.id}`] = t("member.dynamicFieldRequired");
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      const payload: any = { ...formData };

      payload.user_type = "student";
      payload.confirm_password = confirmPassword;
      payload.institution_ids = selectedInstitutions.map((i) => i.id);
      payload.dynamic_field_value_inputs = Object.entries(dynamicFieldValues)
        .filter(([fieldId]) => dynamicFields.some((f) => f.id === Number(fieldId)))
        .map(([fieldId, v]) => ({ field_id: Number(fieldId), ...v }));

      let studentId: number;

      if (isEdit) {
        if (!payload.password) delete payload.password;
        if (!payload.password) delete payload.confirm_password;
        await usersApi.update(parseInt(id as string), payload);
        studentId = parseInt(id as string);
      } else {
        const response = await usersApi.create(payload);
        studentId = response.data.id;
      }

      for (const [fieldId, file] of Object.entries(dynamicFieldFiles)) {
        await usersApi.uploadDynamicFieldFile(studentId, Number(fieldId), file);
      }

      navigate("/students");
    } catch (err: any) {
      console.error("Failed to save student", err);
      if (err.response?.data) {
        const apiErrors: Record<string, string> = {};

        Object.keys(err.response.data).forEach((key) => {
          apiErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key][0]
            : err.response.data[key];
        });
        setErrors(apiErrors);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/students")}
          >
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? t("students.detailSubtitle") : t("students.add")}
            </h1>
            <p className="text-default-500">
              {isEdit
                ? t("students.detailSubtitle")
                : t("students.addSubtitle")}
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card classNames={CARD_CLASSNAMES}>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("students.form.accountInfo", "Account Info")}</h2>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-full md:w-48 flex-shrink-0">
                  <label className="block cursor-pointer rounded-md border-2 border-dashed border-default-200 p-4 text-center hover:border-default-300">
                    {previewUrl ? (
                      <img
                        alt="profile preview"
                        className="w-40 h-40 object-cover mx-auto rounded"
                        src={previewUrl}
                      />
                    ) : (
                      <div className="w-40 h-40 bg-default-100 mx-auto flex items-center justify-center rounded">
                        <span className="text-default-400">
                          {t("students.form.profileImage") || "Profile Image"}
                        </span>
                      </div>
                    )}
                    <div className="mt-3">
                      <input
                        accept="image/*"
                        className="mt-2"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file)
                            handleInputChange("profile_image" as any, file);
                        }}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    isRequired
                    errorMessage={errors.username}
                    isInvalid={!!errors.username}
                    label={t("users.form.username")}
                    placeholder={t("users.form.usernamePlaceholder")}
                    value={formData.username}
                    onValueChange={(v) => handleInputChange("username", v)}
                  />

                  <Input
                    isRequired
                    errorMessage={errors.email}
                    isInvalid={!!errors.email}
                    label={t("users.form.email")}
                    placeholder={t("users.form.emailPlaceholder")}
                    value={formData.email}
                    onValueChange={(v) => handleInputChange("email", v)}
                  />

                  <Input
                    errorMessage={errors.phone_number}
                    isInvalid={!!errors.phone_number}
                    label={t("users.form.phone")}
                    placeholder={t("users.form.phonePlaceholder")}
                    value={formData.phone_number}
                    onValueChange={(v) => handleInputChange("phone_number", v)}
                  />

                  <Input
                    description={
                      isEdit ? "Leave blank to keep current password" : undefined
                    }
                    endContent={
                      <button
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="p-1 text-default-500 hover:text-default-700"
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    }
                    errorMessage={errors.password}
                    isInvalid={!!errors.password}
                    isRequired={!isEdit}
                    label={t("users.form.password")}
                    placeholder={t("users.form.passwordPlaceholder")}
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onValueChange={(v) => handleInputChange("password", v)}
                  />

                  <Input
                    endContent={
                      <button
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                        className="p-1 text-default-500 hover:text-default-700"
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    }
                    errorMessage={errors.confirmPassword}
                    isInvalid={!!errors.confirmPassword}
                    isRequired={!isEdit || !!formData.password}
                    label={t("users.form.confirmPassword")}
                    placeholder={t("users.form.confirmPasswordPlaceholder")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card classNames={CARD_CLASSNAMES}>
            <CardHeader>
              <h3 className="text-lg font-medium">
                {t("users.form.arabicName", "Arabic Name")}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.first_name_field}
                  isInvalid={!!errors.first_name_field}
                  label={t("users.form.firstNameArabic", "First Name (Arabic)")}
                  placeholder={t(
                    "users.form.firstNameArabicPlaceholder",
                    "Enter first name in Arabic",
                  )}
                  value={formData.first_name_field || ""}
                  onValueChange={(v) =>
                    handleInputChange("first_name_field", v)
                  }
                />
                <Input
                  isRequired
                  errorMessage={errors.father_name}
                  isInvalid={!!errors.father_name}
                  label={t(
                    "users.form.fatherNameArabic",
                    "Father Name (Arabic)",
                  )}
                  placeholder={t(
                    "users.form.fatherNameArabicPlaceholder",
                    "Enter father name in Arabic",
                  )}
                  value={formData.father_name || ""}
                  onValueChange={(v) => handleInputChange("father_name", v)}
                />
                <Input
                  isRequired
                  errorMessage={errors.grandfather_name}
                  isInvalid={!!errors.grandfather_name}
                  label={t(
                    "users.form.grandfatherNameArabic",
                    "Grandfather Name (Arabic)",
                  )}
                  placeholder={t(
                    "users.form.grandfatherNameArabicPlaceholder",
                    "Enter grandfather name in Arabic",
                  )}
                  value={formData.grandfather_name || ""}
                  onValueChange={(v) =>
                    handleInputChange("grandfather_name", v)
                  }
                />
                <Input
                  isRequired
                  errorMessage={errors.family_name}
                  isInvalid={!!errors.family_name}
                  label={t(
                    "users.form.familyNameArabic",
                    "Family Name (Arabic)",
                  )}
                  placeholder={t(
                    "users.form.familyNameArabicPlaceholder",
                    "Enter family name in Arabic",
                  )}
                  value={formData.family_name || ""}
                  onValueChange={(v) => handleInputChange("family_name", v)}
                />
              </div>
            </CardBody>
          </Card>

          <Card classNames={CARD_CLASSNAMES}>
            <CardHeader>
              <h3 className="text-lg font-medium">
                {t("users.form.englishName", "English Name (Optional)")}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  errorMessage={errors.first_name_en}
                  isInvalid={!!errors.first_name_en}
                  label={t(
                    "users.form.firstNameEnglish",
                    "First Name (English)",
                  )}
                  placeholder={t(
                    "users.form.firstNameEnglishPlaceholder",
                    "Enter first name in English",
                  )}
                  value={formData.first_name_en || ""}
                  onValueChange={(v) => handleInputChange("first_name_en", v)}
                />
                <Input
                  errorMessage={errors.father_name_en}
                  isInvalid={!!errors.father_name_en}
                  label={t(
                    "users.form.fatherNameEnglish",
                    "Father Name (English)",
                  )}
                  placeholder={t(
                    "users.form.fatherNameEnglishPlaceholder",
                    "Enter father name in English",
                  )}
                  value={formData.father_name_en || ""}
                  onValueChange={(v) => handleInputChange("father_name_en", v)}
                />
                <Input
                  errorMessage={errors.grandfather_name_en}
                  isInvalid={!!errors.grandfather_name_en}
                  label={t(
                    "users.form.grandfatherNameEnglish",
                    "Grandfather Name (English)",
                  )}
                  placeholder={t(
                    "users.form.grandfatherNameEnglishPlaceholder",
                    "Enter grandfather name in English",
                  )}
                  value={formData.grandfather_name_en || ""}
                  onValueChange={(v) =>
                    handleInputChange("grandfather_name_en", v)
                  }
                />
                <Input
                  errorMessage={errors.family_name_en}
                  isInvalid={!!errors.family_name_en}
                  label={t(
                    "users.form.familyNameEnglish",
                    "Family Name (English)",
                  )}
                  placeholder={t(
                    "users.form.familyNameEnglishPlaceholder",
                    "Enter family name in English",
                  )}
                  value={formData.family_name_en || ""}
                  onValueChange={(v) => handleInputChange("family_name_en", v)}
                />
              </div>
            </CardBody>
          </Card>

          <Card classNames={CARD_CLASSNAMES}>
            <CardHeader>
              <h3 className="text-lg font-medium">
                {t("students.sections.location", "Location & Education")}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t("students.form.city") || "City"}
                  placeholder={t("students.form.city") || "City"}
                  value={(formData as any).city || ""}
                  onValueChange={(v) => handleInputChange("city" as any, v)}
                />

                <Input
                  label={t("students.form.nationality") || "Nationality"}
                  placeholder={t("students.form.nationality") || "Nationality"}
                  value={(formData as any).nationality || ""}
                  onValueChange={(v) =>
                    handleInputChange("nationality" as any, v)
                  }
                />

                <Select
                  label={t("users.form.gender") || "Gender"}
                  placeholder={t("users.form.genderPlaceholder") || "Select Gender"}
                  selectedKeys={formData.gender ? [formData.gender] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleInputChange("gender", selectedKey || "");
                  }}
                >
                  <SelectItem key="male">{t("users.genders.male") || "Male"}</SelectItem>
                  <SelectItem key="female">{t("users.genders.female") || "Female"}</SelectItem>
                </Select>

                <Input
                  label={t("students.form.university") || "University/College"}
                  placeholder={
                    t("students.form.university") || "University/College"
                  }
                  value={(formData as any).university_name || ""}
                  onValueChange={(v) =>
                    handleInputChange("university_name" as any, v)
                  }
                />

                <Input
                  label={t("students.form.graduationYear") || "Graduation Year"}
                  placeholder={
                    t("students.form.graduationYear") || "e.g., 2024"
                  }
                  type="number"
                  value={(formData as any).graduation_year?.toString() || ""}
                  onValueChange={(v) =>
                    handleInputChange(
                      "graduation_year" as any,
                      v ? parseInt(v) : undefined,
                    )
                  }
                />

                {/* Branch Selection */}
                <div className="space-y-2 md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-small font-medium text-foreground relative top-1">
                      {t("students.form.branches")}
                    </label>
                    <Button
                      className="font-medium"
                      color="primary"
                      size="sm"
                      startContent={<FiEdit2 />}
                      variant="light"
                      onPress={() => setBranchModalOpen(true)}
                    >
                      {t("students.form.selectBranch")}
                    </Button>
                  </div>
                  <div
                    className="min-h-[56px] rounded-xl border-2 border-default-200 hover:border-default-400 transition-colors p-2 flex flex-wrap gap-2 items-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => setBranchModalOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setBranchModalOpen(true);
                      }
                    }}
                  >
                    {selectedBranches.length > 0 ? (
                      selectedBranches.map((branch) => (
                        <Chip
                          key={branch.id}
                          className="rounded-lg"
                          color="primary"
                          variant="flat"
                        >
                          {branch.name} ({branch.prefix})
                        </Chip>
                      ))
                    ) : (
                      <span className="text-default-400 text-sm px-2">
                        {t("students.form.noBranchSelected")}
                      </span>
                    )}
                  </div>
                  {errors.branch_ids && (
                    <p className="text-tiny text-danger px-1">{errors.branch_ids}</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <AnimatePresence>
            {selectedBranch && (
              <motion.div
                key={selectedBranch.id}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                initial={branchJustSelected ? { opacity: 0, height: 0 } : false}
                style={{ overflow: "hidden" }}
                transition={{ duration: 0.3 }}
              >
                <Card classNames={CARD_CLASSNAMES}>
                  <CardHeader>
                    <h3 className="text-lg font-medium">
                      {t("students.form.branchRequirementsTitle", { branchName: selectedBranch.name })}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dynamicFields.map((field) => renderDynamicField(field))}

                      {/* Institution Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-small font-medium text-foreground relative top-1">
                            {t("students.form.institutions")}
                          </label>
                          <Button
                            className="font-medium"
                            color="primary"
                            size="sm"
                            startContent={<FiEdit2 />}
                            variant="light"
                            onPress={() => setInstitutionModalOpen(true)}
                          >
                            {t("students.form.selectInstitution")}
                          </Button>
                        </div>
                        <div
                          className="min-h-[56px] rounded-xl border-2 border-default-200 hover:border-default-400 transition-colors p-2 flex flex-wrap gap-2 items-center cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => setInstitutionModalOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setInstitutionModalOpen(true);
                            }
                          }}
                        >
                          {selectedInstitutions.length > 0 ? (
                            selectedInstitutions.map((inst) => (
                              <Chip
                                key={inst.id}
                                className="rounded-lg"
                                color="secondary"
                                variant="flat"
                              >
                                {inst.name}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-default-400 text-sm px-2">
                              {t("students.form.noInstitutionSelected")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Textarea
                          label={t("students.form.cvLabel")}
                          minRows={3}
                          placeholder={t("students.form.cvPlaceholder")}
                          value={(formData as any).bio || ""}
                          onValueChange={(v) => handleInputChange("bio" as any, v)}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 justify-end pt-4">
            <Button
              disabled={saveLoading}
              variant="light"
              onPress={() => navigate("/students")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={saveLoading}
              startContent={<FiSave />}
              type="submit"
            >
              {t("common.save")}
            </Button>
          </div>
        </form>
      </div>

      <BranchModal
        isOpen={branchModalOpen}
        mode="single"
        selectedBranches={selectedBranches}
        title={t("students.form.branchModalTitle")}
        onClose={() => setBranchModalOpen(false)}
        onSelect={handleBranchSelect}
      />

      <InstitutionModal
        isOpen={institutionModalOpen}
        mode="multiple"
        selectedInstitutions={selectedInstitutions}
        title={t("students.form.institutionModalTitle")}
        onClose={() => setInstitutionModalOpen(false)}
        onSelect={handleInstitutionSelect}
      />
    </DefaultLayout>
  );
}
