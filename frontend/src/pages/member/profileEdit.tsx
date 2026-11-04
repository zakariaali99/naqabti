import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Avatar,
  Progress,
  Switch,
  Card,
  CardHeader,
  CardBody,
  Chip,
} from "@heroui/react";
import {
  FiSave,
  FiArrowLeft,
  FiUser,
  FiUpload,
  FiEdit2,
  FiFileText,
  FiLock,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";
import usersApi from "@/api/usersApi";
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import citiesApi from "@/api/citiesApi";
import academicDegreesApi from "@/api/academicDegreesApi";
import branchesApi from "@/api/branchesApi";
import NationalitySearchModal from "@/components/modals/NationalitySearchModal";
import CompleteProfileModal from "@/components/modals/CompleteProfileModal";
import PublicProfileVisibilitySettings from "@/components/profile/PublicProfileVisibilitySettings";
import InstitutionModal from "@/pages/institutions/InstitutionModal";
import { Nationality } from "@/models/nationality";
import { City } from "@/models/city";
import { AcademicDegree } from "@/models/academicDegree";
import { Branch } from "@/models/branch";
import { Institution } from "@/models/institution";
import { BranchDynamicField } from "@/models/dynamicField";
import {
  calculateProfileCompletion,
  calculateNameCompletion,
  ProfileCompletionField,
} from "@/utils/profileCompletion";

export default function MemberProfileEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);
  const { isRTL } = useLanguageStore();

  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSpecialties, setAvailableSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [nationalityModalOpen, setNationalityModalOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [degrees, setDegrees] = useState<AcademicDegree[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<
    Record<number, { value_text?: string; value_boolean?: boolean }>
  >({});
  const [dynamicFieldFiles, setDynamicFieldFiles] = useState<Record<number, File>>({});
  const [branchJustSelected, setBranchJustSelected] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([]);
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  const isInstitution = user?.user_type === "institution";
  const isDoctor = user?.user_type === "doctor";
  const isLocked = isDoctor && user?.approval_status === "approved";

  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    full_name: "",
    first_name_field: "",
    father_name: "",
    grandfather_name: "",
    family_name: "",
    first_name_en: "",
    father_name_en: "",
    grandfather_name_en: "",
    family_name_en: "",
    specialty: "",
    bio: "",
    language: "ar" as "ar" | "en",
    gender: "" as "male" | "female" | "",
    nationality: "",
    birthdate: "",
    city: "",
    address: "",
    university_name: "",
    current_degree: "",
    membership_number: "",
    branch_id: "",
    public_profile_fields: "full_name,profile_image,specialty,bio,branches,current_degree",
  });

  const selectedBranch = branches.find((b) => String(b.id) === formData.branch_id);
  const dynamicFields: BranchDynamicField[] = (selectedBranch?.dynamic_fields || []).filter(
    (f) => f.is_active,
  );

  const {
    percentage: completionPercentage,
    missingFields,
    completedFields,
  } = calculateProfileCompletion(
    {
      ...formData,
      profile_image: imagePreview || user?.profile_image,
      passport_image: passportPreview || user?.passport_image,
    },
    isDoctor,
  );

  const {
    missingFields: nameMissingFields,
    completedFields: nameCompletedFields,
  } = calculateNameCompletion(formData, isInstitution);

  const isFieldMissing = (field: ProfileCompletionField) =>
    missingFields.includes(field);

  const MissingFlag = ({ field }: { field: ProfileCompletionField }) =>
    isDoctor && isFieldMissing(field) ? (
      <FiAlertCircle
        aria-label={t("member.fieldNeededForCompletion")}
        className="inline text-warning shrink-0"
        size={13}
      />
    ) : null;

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const suppress = (e: Event) => e.preventDefault();
    form.addEventListener("invalid", suppress, true);
    return () => form.removeEventListener("invalid", suppress, true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setFormData({
      email: user.email || "",
      phone_number: user.phone_number || "",
      full_name: user.full_name || "",
      first_name_field: user.first_name_field || "",
      father_name: user.father_name || "",
      grandfather_name: user.grandfather_name || "",
      family_name: user.family_name || "",
      first_name_en: user.first_name_en || "",
      father_name_en: user.father_name_en || "",
      grandfather_name_en: user.grandfather_name_en || "",
      family_name_en: user.family_name_en || "",
      specialty: user.specialty || "",
      bio: user.bio || "",
      language: user.language || "ar",
      gender: user.gender || "",
      nationality: user.nationality || "",
      birthdate: user.birthdate || "",
      city: user.city ? String(user.city) : "",
      address: user.address || "",
      university_name: user.university_name || "",
      current_degree: user.current_degree || "",
      membership_number: user.membership_number || "",
      branch_id: user.branches?.[0]?.id ? String(user.branches[0].id) : "",
      public_profile_fields:
        (user as any).public_profile_fields ||
        "full_name,profile_image,specialty,bio,branches,current_degree",
    });
    const seededValues: Record<number, { value_text?: string; value_boolean?: boolean }> = {};
    (user.dynamic_field_values || []).forEach((v) => {
      seededValues[v.field_id] = {
        value_text: v.value_text ?? undefined,
        value_boolean: v.value_boolean ?? undefined,
      };
    });
    setDynamicFieldValues(seededValues);
    if (user.institutions) setSelectedInstitutions(user.institutions);
    if (user.profile_image) setImagePreview(user.profile_image);
    if (user.passport_image) setPassportPreview(user.passport_image);
  }, [user]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await citiesApi.getAll({ page_size: 500 });
        const items = response.data?.results || response.data || [];
        setCities(Array.isArray(items) ? items : []);
      } catch {
        // silent
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const response = await academicDegreesApi.getAll({ page_size: 100 });
        const items = response.data?.results || response.data || [];
        setDegrees(Array.isArray(items) ? items : []);
      } catch {
        // silent
      }
    };
    fetchDegrees();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchesApi.getAll({ page_size: 100 });
        const items = response.data?.results || response.data || [];
        setBranches(Array.isArray(items) ? items : []);
      } catch {
        // silent
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await doctorSpecialtyApi.getAll({ is_active: true });
        const items = response.data?.results || response.data || [];
        setAvailableSpecialties(Array.isArray(items) ? items : []);
      } catch {
        // silent
      }
    };
    fetchSpecialties();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleNationalitySelect = (nationalities: Nationality[]) => {
    handleInputChange("nationality", nationalities[0]?.name || "");
  };

  const handleInstitutionSelect = (institutions: Institution[]) => {
    setSelectedInstitutions(institutions);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPassportFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPassportPreview(reader.result as string);
    reader.readAsDataURL(file);
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
    const label = isRTL ? field.label_ar : field.label_en || field.label_ar;
    const placeholder = isRTL
      ? field.placeholder_ar
      : field.placeholder_en || field.placeholder_ar;
    const errorKey = `dynamic_field_${field.id}`;
    const value = dynamicFieldValues[field.id] || {};

    if (field.field_type === "boolean") {
      return (
        <div key={field.id} className="flex items-center">
          <Switch
            isDisabled={isLocked}
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
          classNames={{ trigger: "rounded-xl" }}
          errorMessage={errors[errorKey]}
          isDisabled={isLocked}
          isInvalid={!!errors[errorKey]}
          label={label}
          placeholder={placeholder}
          selectedKeys={value.value_text ? [value.value_text] : []}
          variant="bordered"
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            handleDynamicFieldChange(field.id, { value_text: selected || "" });
          }}
        >
          {(field.options || []).map((option) => (
            <SelectItem key={option.value} textValue={isRTL ? option.label_ar : option.label_en || option.label_ar}>
              {isRTL ? option.label_ar : option.label_en || option.label_ar}
            </SelectItem>
          ))}
        </Select>
      );
    }

    if (field.field_type === "file") {
      const existingValue = user?.dynamic_field_values?.find((v) => v.field_id === field.id);
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
            disabled={isLocked}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDynamicFieldFileChange(field.id, file);
            }}
          />
          {(pendingFile || existingValue?.value_file) && (
            <p className="text-xs text-default-400">
              {pendingFile ? pendingFile.name : t("common.fileUploaded", "File uploaded")}
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
        classNames={{ inputWrapper: "rounded-xl" }}
        errorMessage={errors[errorKey]}
        isDisabled={isLocked}
        isInvalid={!!errors[errorKey]}
        label={label}
        placeholder={placeholder}
        value={value.value_text || ""}
        variant="bordered"
        onValueChange={(v) => handleDynamicFieldChange(field.id, { value_text: v })}
      />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (isLocked) {
      // Profile is locked once approved — only a password change is allowed.
      if (!password) return;
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: t("doctors.validation.passwordMismatch") });
        return;
      }
      try {
        setSubmitting(true);
        await usersApi.update(user.id, {
          password,
          confirm_password: confirmPassword,
        } as any);
        toast.success(t("member.profileSaved", "Profile saved successfully"));
        setPassword("");
        setConfirmPassword("");
      } catch (error: any) {
        if (error?.response?.data && typeof error.response.data === "object") {
          const apiErrors: Record<string, string> = {};
          Object.entries(error.response.data).forEach(([key, val]) => {
            apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
          });
          setErrors(apiErrors);
        } else {
          toast.error(t("common.saveError", "Failed to save changes"));
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = t("users.errors.emailRequired");
    if (!formData.branch_id) newErrors.branch_id = t("member.branchRequired");
    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = t("doctors.validation.passwordMismatch");
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
                user?.dynamic_field_values?.find((v) => v.field_id === field.id)?.value_file
              )
            : !!value?.value_text;
      if (!hasValue) {
        newErrors[`dynamic_field_${field.id}`] = t("member.dynamicFieldRequired");
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      const { branch_id, ...rest } = formData;
      const updatePayload: any = { ...rest };
      updatePayload.branch_ids = branch_id ? [Number(branch_id)] : [];
      updatePayload.institution_ids = selectedInstitutions.map((i) => i.id);
      updatePayload.dynamic_field_value_inputs = Object.entries(dynamicFieldValues)
        .filter(([fieldId]) => dynamicFields.some((f) => f.id === Number(fieldId)))
        .map(([fieldId, v]) => ({ field_id: Number(fieldId), ...v }));
      if (password) {
        updatePayload.password = password;
        updatePayload.confirm_password = confirmPassword;
      }

      await usersApi.update(user.id, updatePayload);

      if (imageFile) await usersApi.uploadImage(user.id, imageFile);
      if (passportFile) await usersApi.uploadPassportImage(user.id, passportFile);
      for (const [fieldId, file] of Object.entries(dynamicFieldFiles)) {
        await usersApi.uploadDynamicFieldFile(user.id, Number(fieldId), file);
      }

      await fetchUserProfile();
      toast.success(t("member.profileSaved", "Profile saved successfully"));
      setShowCompletionModal(true);
    } catch (error: any) {
      if (error?.response?.data && typeof error.response.data === "object") {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data).forEach(([key, val]) => {
          apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setErrors(apiErrors);
      } else {
        toast.error(t("common.saveError", "Failed to save changes"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans pb-10 max-w-7xl mx-auto p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("member.editProfile", "Edit Profile")}
          </h1>
          <p className="text-default-500 mt-1">
            {t("member.editProfileDesc", "Update your personal information")}
          </p>
        </div>
        <Button
          className="font-medium text-default-600"
          startContent={<FiArrowLeft className={isRTL ? "rotate-180" : ""} />}
          variant="light"
          onPress={() => navigate("/member/profile")}
        >
          {t("common.back")}
        </Button>
      </div>

      {isLocked && (
        <div className="bg-default-100 border border-default-200 rounded-2xl p-5 flex items-start gap-3 mb-8">
          <FiLock className="text-default-500 mt-0.5 shrink-0" size={20} />
          <p className="text-sm text-default-600">{t("member.profileLockedNotice")}</p>
        </div>
      )}

      {isDoctor && !isLocked && (
        <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <FiTrendingUp size={18} />
              </div>
              <span className="font-bold text-foreground">
                {t("member.profileCompletion")}
              </span>
            </div>
            <span
              className={`font-black text-lg ${isRTL ? "font-arabic-numerals" : ""}`}
            >
              {completionPercentage}%
            </span>
          </div>
          <Progress
            color="primary"
            value={completionPercentage}
            className="w-full"
            size="md"
            radius="full"
          />
          {missingFields.length > 0 && (
            <p className="text-xs text-default-400 mt-3">
              {t("member.fieldsRemainingToComplete", { icon: "⚠" })}
            </p>
          )}
        </div>
      )}

      {!isInstitution && (
        <div className="bg-warning-50 border border-warning-200 rounded-2xl p-5 flex items-start gap-3 mb-8">
          <FiAlertCircle className="text-warning-600 mt-0.5 shrink-0" size={24} />
          <div className="text-start">
            <p className="text-base font-semibold text-warning-700">
              {t("member.officialNamesNoteTitle")}
            </p>
            <p className="text-sm text-warning-600 mt-1">
              {t("member.officialNamesNote")}
            </p>
          </div>
        </div>
      )}

      <form
        ref={formRef}
        noValidate
        className="flex flex-col lg:flex-row gap-8 items-start"
        onSubmit={handleSubmit}
      >
        {/* Left: Image Uploads */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Profile Image */}
          <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 flex flex-col items-center text-center">
            <h3 className="text-lg font-semibold mb-6 self-start w-full flex items-center gap-1.5">
              {t("doctors.form.profileImage")}
              <MissingFlag field="profile_image" />
            </h3>

            <div className="relative group">
              <Avatar
                isBordered
                className="w-40 h-40 text-6xl mb-6 shadow-md"
                color="primary"
                icon={<FiUser />}
                src={imagePreview || undefined}
              />
              {!isLocked && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => document.getElementById("profile-image-input")?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("profile-image-input")?.click();
                    }
                  }}
                >
                  <FiUpload className="text-white text-3xl" />
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button
                fullWidth
                color="primary"
                isDisabled={isLocked}
                startContent={<FiUpload />}
                variant="flat"
                onPress={() => document.getElementById("profile-image-input")?.click()}
              >
                {t("doctors.form.upload")}
              </Button>
              {imagePreview && imagePreview !== user.profile_image && (
                <Button
                  isIconOnly
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setImageFile(null);
                    setImagePreview(user.profile_image || null);
                  }}
                >
                  <FiEdit2 />
                </Button>
              )}
            </div>
            <input
              accept="image/*"
              className="hidden"
              disabled={isLocked}
              id="profile-image-input"
              type="file"
              onChange={handleImageChange}
            />
            <p className="text-tiny text-default-400 mt-3">{t("common.allowedFormats")}</p>
          </div>

          {/* Passport / ID */}
          <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiFileText /> {t("doctors.fields.passportImage")}
              <MissingFlag field="passport_image" />
            </h3>

            <div
              className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] transition-colors ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
                passportPreview
                  ? "border-primary border-solid p-0 overflow-hidden bg-black/5"
                  : "border-default-300 hover:border-default-400 bg-default-50"
              }`}
              role="button"
              tabIndex={0}
              onClick={() => !isLocked && document.getElementById("passport-image-input")?.click()}
              onKeyDown={(e) => {
                if (!isLocked && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  document.getElementById("passport-image-input")?.click();
                }
              }}
            >
              {passportPreview ? (
                <img
                  alt="Passport"
                  className="w-full h-auto object-contain max-h-[200px]"
                  src={passportPreview}
                />
              ) : (
                <div className="text-center p-6">
                  <FiUpload className="mx-auto text-3xl text-default-400 mb-2" />
                  <p className="text-sm text-default-500 font-medium">
                    {t("doctors.form.uploadPassport")}
                  </p>
                  <p className="text-xs text-default-400 mt-1">{t("member.docUploadFormats")}</p>
                </div>
              )}
            </div>
            <input
              accept="image/*,application/pdf"
              className="hidden"
              disabled={isLocked}
              id="passport-image-input"
              type="file"
              onChange={handlePassportChange}
            />
            {!isLocked && passportPreview && passportPreview !== user.passport_image && (
              <Button
                fullWidth
                className="mt-3"
                color="danger"
                variant="flat"
                onPress={() => {
                  setPassportFile(null);
                  setPassportPreview(user.passport_image || null);
                }}
              >
                {t("common.remove")}
              </Button>
            )}
          </div>
        </div>

        {/* Right: Form Fields */}
        <div className="flex-1 space-y-6">
          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary-100 text-primary">
                <FiUser size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("common.information")}</h3>
                <p className="text-sm text-default-400">{t("doctors.form.infoSubtitle")}</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <Input
                  isRequired
                  classNames={{ inputWrapper: "rounded-xl" }}
                  errorMessage={errors.email}
                  isDisabled={isLocked}
                  isInvalid={!!errors.email}
                  label={<span className="flex items-center gap-1.5">{t("common.email")}<MissingFlag field="email" /></span>}
                  type="email"
                  value={formData.email}
                  variant="bordered"
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />

                <Input
                  classNames={{ inputWrapper: "rounded-xl" }}
                  isDisabled={isLocked}
                  label={<span className="flex items-center gap-1.5">{t("users.form.phone")}<MissingFlag field="phone_number" /></span>}
                  type="tel"
                  value={formData.phone_number}
                  variant="bordered"
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                {t("member.identity", "Identity")}
                <MissingFlag field="full_name" />
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {isInstitution ? (
                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    isDisabled={isLocked}
                    label={t("auth.institutionName")}
                    placeholder={t("auth.institutionNamePlaceholder")}
                    value={formData.full_name}
                    variant="bordered"
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                  />
                ) : (
                  <>
                    {/* Arabic Name */}
                    <div className="col-span-1 md:col-span-2 pb-2">
                      <h4 className="text-base font-semibold text-default-700">
                        {t("users.form.arabicName")}
                      </h4>
                    </div>

                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.firstNameArabic")}
                      placeholder={t("users.form.firstNameArabicPlaceholder")}
                      value={formData.first_name_field}
                      variant="bordered"
                      onChange={(e) => handleInputChange("first_name_field", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.fatherNameArabic")}
                      placeholder={t("users.form.fatherNameArabicPlaceholder")}
                      value={formData.father_name}
                      variant="bordered"
                      onChange={(e) => handleInputChange("father_name", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.grandfatherNameArabic")}
                      placeholder={t("users.form.grandfatherNameArabicPlaceholder")}
                      value={formData.grandfather_name}
                      variant="bordered"
                      onChange={(e) => handleInputChange("grandfather_name", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.familyNameArabic")}
                      placeholder={t("users.form.familyNameArabicPlaceholder")}
                      value={formData.family_name}
                      variant="bordered"
                      onChange={(e) => handleInputChange("family_name", e.target.value)}
                    />

                    {/* English Name */}
                    <div className="col-span-1 md:col-span-2 pt-4 pb-2">
                      <h4 className="text-base font-semibold text-default-700">
                        {t("users.form.englishName")}
                      </h4>
                    </div>

                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.firstNameEnglish")}
                      placeholder={t("users.form.firstNameEnglishPlaceholder")}
                      value={formData.first_name_en}
                      variant="bordered"
                      onChange={(e) => handleInputChange("first_name_en", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.fatherNameEnglish")}
                      placeholder={t("users.form.fatherNameEnglishPlaceholder")}
                      value={formData.father_name_en}
                      variant="bordered"
                      onChange={(e) => handleInputChange("father_name_en", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.grandfatherNameEnglish")}
                      placeholder={t("users.form.grandfatherNameEnglishPlaceholder")}
                      value={formData.grandfather_name_en}
                      variant="bordered"
                      onChange={(e) => handleInputChange("grandfather_name_en", e.target.value)}
                    />
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={t("users.form.familyNameEnglish")}
                      placeholder={t("users.form.familyNameEnglishPlaceholder")}
                      value={formData.family_name_en}
                      variant="bordered"
                      onChange={(e) => handleInputChange("family_name_en", e.target.value)}
                    />

                    {/* Birthdate */}
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={<span className="flex items-center gap-1.5">{t("auth.birthdate")}<MissingFlag field="birthdate" /></span>}
                      type="date"
                      value={formData.birthdate}
                      variant="bordered"
                      onChange={(e) => handleInputChange("birthdate", e.target.value)}
                    />
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h3 className="text-lg font-bold">
                {t("member.locationAndEducation", "Location & Education")}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <Select
                  classNames={{ trigger: "rounded-xl" }}
                  isDisabled={isLocked}
                  label={<span className="flex items-center gap-1.5">{t("auth.city")}<MissingFlag field="city" /></span>}
                  placeholder={t("auth.cityPlaceholder")}
                  selectedKeys={formData.city ? [formData.city] : []}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange("city", selected || "");
                  }}
                >
                  {cities.map((c) => (
                    <SelectItem key={String(c.id)} textValue={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  classNames={{ inputWrapper: "rounded-xl" }}
                  isDisabled={isLocked}
                  label={<span className="flex items-center gap-1.5">{t("auth.address")}<MissingFlag field="address" /></span>}
                  placeholder={t("auth.addressPlaceholder")}
                  value={formData.address}
                  variant="bordered"
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />

                {!isInstitution && (
                  <>
                    <Input
                      classNames={{ inputWrapper: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={<span className="flex items-center gap-1.5">{t("auth.university")}<MissingFlag field="university_name" /></span>}
                      placeholder={t("auth.universityPlaceholder")}
                      value={formData.university_name}
                      variant="bordered"
                      onChange={(e) => handleInputChange("university_name", e.target.value)}
                    />

                    <Select
                      classNames={{ trigger: "rounded-xl" }}
                      isDisabled={isLocked}
                      label={<span className="flex items-center gap-1.5">{t("auth.degree")}<MissingFlag field="current_degree" /></span>}
                      placeholder={t("auth.degreePlaceholder")}
                      selectedKeys={formData.current_degree ? [formData.current_degree] : []}
                      variant="bordered"
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleInputChange("current_degree", selected || "");
                      }}
                    >
                      {degrees.map((degree) => (
                        <SelectItem key={degree.name} textValue={degree.name}>
                          {degree.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h3 className="text-lg font-bold">{t("doctors.form.professionalDetails")}</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {availableSpecialties.length > 0 && (
                  <Select
                    classNames={{ trigger: "rounded-xl" }}
                    isDisabled={isLocked}
                    label={t("doctors.fields.specialty")}
                    placeholder={t("doctors.placeholders.specialty")}
                    selectedKeys={formData.specialty ? [formData.specialty] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      handleInputChange("specialty", selected || "");
                    }}
                  >
                    {availableSpecialties.map((spec) => (
                      <SelectItem key={spec.name}>{spec.name}</SelectItem>
                    ))}
                  </Select>
                )}

                <Select
                  classNames={{ trigger: "rounded-xl" }}
                  isDisabled={isLocked}
                  label={t("common.language")}
                  selectedKeys={[formData.language]}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as "ar" | "en";
                    handleInputChange("language", selected || "ar");
                  }}
                >
                  <SelectItem key="en">English</SelectItem>
                  <SelectItem key="ar">العربية</SelectItem>
                </Select>

                <Select
                  classNames={{ trigger: "rounded-xl" }}
                  isDisabled={isLocked}
                  label={t("users.form.gender")}
                  placeholder={t("users.form.genderPlaceholder")}
                  selectedKeys={formData.gender ? [formData.gender] : []}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange("gender", selected || "");
                  }}
                >
                  <SelectItem key="male">{t("users.genders.male")}</SelectItem>
                  <SelectItem key="female">{t("users.genders.female")}</SelectItem>
                </Select>

                <Input
                  isReadOnly
                  classNames={{ input: "cursor-pointer", inputWrapper: "rounded-xl cursor-pointer" }}
                  isDisabled={isLocked}
                  label={<span className="flex items-center gap-1.5">{t("users.form.nationality")}<MissingFlag field="nationality" /></span>}
                  placeholder={t("users.form.selectNationality")}
                  value={
                    formData.nationality
                      ? t(`nationalities.list.${formData.nationality}`, formData.nationality)
                      : ""
                  }
                  variant="bordered"
                  onClick={() => !isLocked && setNationalityModalOpen(true)}
                />

                <Select
                  isRequired
                  classNames={{ trigger: "rounded-xl" }}
                  errorMessage={errors.branch_id || errors.branch_ids}
                  isDisabled={isLocked}
                  isInvalid={!!errors.branch_id || !!errors.branch_ids}
                  label={t("auth.selectBranch")}
                  placeholder={t("auth.selectBranchPlaceholder")}
                  selectedKeys={formData.branch_id ? [formData.branch_id] : []}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange("branch_id", selected || "");
                    setDynamicFieldValues({});
                    setDynamicFieldFiles({});
                    setBranchJustSelected(true);
                  }}
                >
                  {branches.map((branch) => (
                    <SelectItem key={String(branch.id)} textValue={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </Select>
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
                <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
                  <CardHeader>
                    <h3 className="text-lg font-bold">
                      {t("member.branchRequirementsTitle", { branchName: selectedBranch.name })}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                      {isDoctor && (
                        <Input
                          classNames={{ inputWrapper: "rounded-xl" }}
                          description={t("auth.membershipNumberDesc")}
                          isDisabled={isLocked}
                          label={<span className="flex items-center gap-1.5">{t("auth.membershipNumber")}<MissingFlag field="membership_number" /></span>}
                          placeholder={t("auth.membershipNumberPlaceholder")}
                          value={formData.membership_number}
                          variant="bordered"
                          onChange={(e) => handleInputChange("membership_number", e.target.value)}
                        />
                      )}

                      {dynamicFields.map((field) => renderDynamicField(field))}

                      {/* Institution Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-small font-medium text-foreground relative top-1">
                            {t("member.institutions")}
                          </label>
                          <Button
                            className="font-medium"
                            color="primary"
                            isDisabled={isLocked}
                            size="sm"
                            startContent={<FiEdit2 />}
                            variant="light"
                            onPress={() => setInstitutionModalOpen(true)}
                          >
                            {t("member.selectInstitution")}
                          </Button>
                        </div>
                        <div
                          className={`min-h-[56px] rounded-xl border-2 border-default-200 hover:border-default-400 transition-colors p-2 flex flex-wrap gap-2 items-center ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => !isLocked && setInstitutionModalOpen(true)}
                          onKeyDown={(e) => {
                            if (!isLocked && (e.key === "Enter" || e.key === " ")) {
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
                              {t("member.noInstitutionSelected")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <Textarea
                          classNames={{ inputWrapper: "rounded-xl" }}
                          isDisabled={isLocked}
                          label={t(isDoctor ? "member.cvLabel" : "member.bioLabel")}
                          placeholder={t("doctors.placeholders.bio")}
                          rows={4}
                          value={formData.bio}
                          variant="bordered"
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {isDoctor && (
            <PublicProfileVisibilitySettings
              disabled={false}
              username={user?.username || ""}
              value={formData.public_profile_fields}
              onChange={(val) => setFormData((prev) => ({ ...prev, public_profile_fields: val }))}
            />
          )}

          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader className="flex-col items-start gap-1">
              <h3 className="text-base font-semibold text-default-700 flex items-center gap-2">
                <FiLock size={16} /> {t("member.changePassword", "Change Password")}
              </h3>
              <p className="text-sm text-default-400">
                {t("doctors.form.passwordHint")}
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <Input
                  classNames={{ inputWrapper: "rounded-xl" }}
                  label={t("common.password")}
                  placeholder={t("doctors.placeholders.password")}
                  type="password"
                  value={password}
                  variant="bordered"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  }}
                />
                {password && (
                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.confirmPassword}
                    isInvalid={!!errors.confirmPassword}
                    label={t("common.confirmPassword")}
                    placeholder={t("doctors.placeholders.confirmPassword")}
                    type="password"
                    value={confirmPassword}
                    variant="bordered"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                    }}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Footer */}
          <div className="flex gap-4 justify-end">
            <Button
              className="font-medium rounded-xl"
              color="default"
              disabled={submitting}
              size="lg"
              variant="flat"
              onPress={() => navigate("/member/profile")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="font-medium rounded-xl px-8"
              color="primary"
              disabled={submitting || (isLocked && !password)}
              isLoading={submitting}
              size="lg"
              startContent={<FiSave />}
              type="submit"
              variant="shadow"
            >
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </form>

      <NationalitySearchModal
        isOpen={nationalityModalOpen}
        mode="single"
        selectedNationalityName={formData.nationality}
        onClose={() => setNationalityModalOpen(false)}
        onSelect={handleNationalitySelect}
      />

      <InstitutionModal
        isOpen={institutionModalOpen}
        mode="multiple"
        selectedInstitutions={selectedInstitutions}
        title={t("member.institutionModalTitle")}
        onClose={() => setInstitutionModalOpen(false)}
        onSelect={handleInstitutionSelect}
      />

      <CompleteProfileModal
        completedFields={completedFields}
        isOpen={showCompletionModal}
        missingFields={missingFields}
        nameCompletedFields={nameCompletedFields}
        nameMissingFields={nameMissingFields}
        percentage={completionPercentage}
        onClose={() => {
          setShowCompletionModal(false);
          navigate("/member/profile");
        }}
      />
    </div>
  );
}
