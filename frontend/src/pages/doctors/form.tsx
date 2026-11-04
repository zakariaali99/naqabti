import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Avatar,
  Chip,
  Switch,
  Card,
  CardHeader,
  CardBody,
} from "@heroui/react";
import {
  FiSave,
  FiArrowLeft,
  FiUser,
  FiUpload,
  FiEdit2,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import citiesApi from "@/api/citiesApi";
import academicDegreesApi from "@/api/academicDegreesApi";
import { UserEntity, UserCreateInput } from "@/models/users";
import { Branch } from "@/models/branch";
import { City } from "@/models/city";
import { AcademicDegree } from "@/models/academicDegree";
import { BranchDynamicField } from "@/models/dynamicField";
import BranchModal from "@/pages/branches/BranchModal";
import InstitutionModal from "@/pages/institutions/InstitutionModal";
import NationalitySearchModal from "@/components/modals/NationalitySearchModal";
import { Nationality } from "@/models/nationality";
import { Institution } from "@/models/institution";
import DoctorStatusSwitcher from "@/pages/doctors/components/DoctorStatusSwitcher";

const DoctorsFormPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Institution[]>([]);
  const [institutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<
    Record<number, { value_text?: string; value_boolean?: boolean }>
  >({});
  const [dynamicFieldFiles, setDynamicFieldFiles] = useState<Record<number, File>>({});
  const [branchJustSelected, setBranchJustSelected] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const suppress = (e: Event) => e.preventDefault();
    form.addEventListener("invalid", suppress, true);
    return () => form.removeEventListener("invalid", suppress, true);
  }, []);
  const [nationalityModalOpen, setNationalityModalOpen] = useState(false);
  const [loadedUser, setLoadedUser] = useState<UserEntity | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<{id: number; name: string}[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [degrees, setDegrees] = useState<AcademicDegree[]>([]);
  const [formData, setFormData] = useState<Partial<UserCreateInput>>({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
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
    password: "",
    user_type: "doctor",
    specialty: "",
    bio: "",
    doctor_number: "",
    language: "en",
    nationality: "",
    birthdate: "",
    city: "",
    address: "",
    university_name: "",
    current_degree: "",
    membership_number: "",
    is_active: true,
    is_staff: false,
    groups: [],
    branch_ids: [],
    institution_ids: [],
    gender: "",
  });

  const selectedBranch = selectedBranches[0];
  const dynamicFields: BranchDynamicField[] = (selectedBranch?.dynamic_fields || []).filter(
    (f) => f.is_active,
  );

  const fetchUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await usersApi.getById(parseInt(id));
      const data: UserEntity = response.data;

      setLoadedUser(data);

      setFormData({
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        phone_number: data.phone_number || "",
        // Arabic name fields
        first_name_field: data.first_name_field || "",
        father_name: data.father_name || "",
        grandfather_name: data.grandfather_name || "",
        family_name: data.family_name || "",
        // English name fields
        first_name_en: data.first_name_en || "",
        father_name_en: data.father_name_en || "",
        grandfather_name_en: data.grandfather_name_en || "",
        family_name_en: data.family_name_en || "",
        user_type: data.user_type,
        specialty: data.specialty || "",
        bio: data.bio || "",
        doctor_number: data.doctor_number || "",
        language: data.language,
        nationality: data.nationality || "",
        birthdate: data.birthdate || "",
        city: data.city ? String(data.city) : "",
        address: data.address || "",
        university_name: data.university_name || "",
        current_degree: data.current_degree || "",
        membership_number: data.membership_number || "",
        is_active: data.is_active,
        is_staff: data.is_staff,
        groups: data.groups,
        // branch_ids / institution_ids are write-only on the API, so derive
        // them from the nested read-only objects returned by the GET.
        branch_ids:
          data.branch_ids || (data.branches || []).map((b) => b.id),
        institution_ids:
          data.institution_ids || (data.institutions || []).map((i) => i.id),
        gender: data.gender || "",
      });

      if (data.branches) {
        setSelectedBranches(data.branches);
      }

      const seededValues: Record<number, { value_text?: string; value_boolean?: boolean }> = {};
      (data.dynamic_field_values || []).forEach((v) => {
        seededValues[v.field_id] = {
          value_text: v.value_text ?? undefined,
          value_boolean: v.value_boolean ?? undefined,
        };
      });
      setDynamicFieldValues(seededValues);

      if (data.institutions) {
        setSelectedInstitutions(data.institutions);
      }

      if (data.profile_image) {
        setImagePreview(data.profile_image);
      }

      if (data.passport_image) {
        setPassportPreview(data.passport_image);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [id, isEdit]);

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

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await citiesApi.getAll({ page_size: 500 });
        const items = response.data?.results || response.data || [];
        setCities(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
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
      } catch (error) {
        console.error("Failed to fetch degrees:", error);
      }
    };
    fetchDegrees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = t("users.errors.usernameRequired");
    if (!formData.email) newErrors.email = t("users.errors.emailRequired");
    if (!formData.first_name_field?.trim())
      newErrors.first_name_field = t("users.errors.firstNameRequired");
    if (!formData.father_name?.trim())
      newErrors.father_name = t("users.errors.fatherNameRequired");
    if (!formData.grandfather_name?.trim())
      newErrors.grandfather_name = t("users.errors.grandfatherNameRequired");
    if (!formData.family_name?.trim())
      newErrors.family_name = t("users.errors.familyNameRequired");
    if (!isEdit && !formData.password) newErrors.password = t("doctors.validation.passwordRequired");
    if (formData.password && formData.password !== confirmPassword) {
      newErrors.confirmPassword = t("doctors.validation.passwordMismatch");
    }
    if (!formData.branch_ids?.length) {
      newErrors.branch_ids = t("users.errors.branchRequired");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(
        t("users.form.fixValidationErrors", "Please fix the highlighted fields"),
      );
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);

      const dynamicFieldValueInputs = Object.entries(dynamicFieldValues)
        .filter(([fieldId]) => dynamicFields.some((f) => f.id === Number(fieldId)))
        .map(([fieldId, v]) => ({ field_id: Number(fieldId), ...v }));

      if (isEdit && id) {
        const updateData: any = { ...formData, dynamic_field_value_inputs: dynamicFieldValueInputs };

        if (!formData.password) {
          delete updateData.password;
          delete updateData.confirm_password;
        } else {
          updateData.confirm_password = confirmPassword;
        }
        await usersApi.update(parseInt(id), updateData);

        if (imageFile) {
          await usersApi.uploadImage(parseInt(id), imageFile);
        }
        if (passportFile) {
          await usersApi.uploadPassportImage(parseInt(id), passportFile);
        }
        for (const [fieldId, file] of Object.entries(dynamicFieldFiles)) {
          await usersApi.uploadDynamicFieldFile(parseInt(id), Number(fieldId), file);
        }
      } else {
        const createData: any = {
          ...formData,
          confirm_password: confirmPassword,
          dynamic_field_value_inputs: dynamicFieldValueInputs,
        };
        const response = await usersApi.create(createData);

        if (imageFile && response.data.id) {
          await usersApi.uploadImage(response.data.id, imageFile);
        }
        if (passportFile && response.data.id) {
          await usersApi.uploadPassportImage(response.data.id, passportFile);
        }
        if (response.data.id) {
          for (const [fieldId, file] of Object.entries(dynamicFieldFiles)) {
            await usersApi.uploadDynamicFieldFile(response.data.id, Number(fieldId), file);
          }
        }
      }

      toast.success(
        isEdit
          ? t("users.toast.updateSuccess")
          : t("users.toast.createSuccess"),
      );
      navigate("/doctors");
    } catch (error: any) {
      console.error("Error saving user:", error);
      if (error?.response?.data && typeof error.response.data === "object") {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data).forEach(([key, val]) => {
          apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        if (apiErrors.detail) {
          apiErrors.general = apiErrors.detail;
        }
        setErrors(apiErrors);
      } else {
        setErrors({ general: t("users.errors.saveFailed") });
      }
      toast.error(t("users.errors.saveFailed"));
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors((prev) => ({ ...prev, [field]: "" }));
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
          classNames={{ trigger: "rounded-xl" }}
          errorMessage={errors[errorKey]}
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
        classNames={{ inputWrapper: "rounded-xl" }}
        errorMessage={errors[errorKey]}
        isInvalid={!!errors[errorKey]}
        label={label}
        placeholder={placeholder}
        value={value.value_text || ""}
        variant="bordered"
        onValueChange={(v) => handleDynamicFieldChange(field.id, { value_text: v })}
      />
    );
  };

  const handleInstitutionSelect = (institutions: Institution[]) => {
    setSelectedInstitutions(institutions);
    handleInputChange(
      "institution_ids",
      institutions.map((i) => i.id),
    );
  };

  const handleNationalitySelect = (nationalities: Nationality[]) => {
    if (nationalities.length > 0) {
      handleInputChange("nationality", nationalities[0].name);
    } else {
      handleInputChange("nationality", "");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImageFile(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setPassportFile(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner
            color="primary"
            label={t("common.loading")}
            size="lg"
          />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen font-sans pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 px-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit
                ? t("doctors.edit")
                : t("doctors.add")}
            </h1>
            <p className="text-default-500 mt-1">
              {isEdit
                ? t("doctors.editSubtitle")
                : t("doctors.addSubtitle")}
            </p>
          </div>
          <Button
            className="font-medium text-default-600 hover:text-foreground"
            startContent={<FiArrowLeft />}
            variant="light"
            onPress={() => navigate("/doctors")}
          >
            {t("common.back")}
          </Button>
        </div>

        <form
          ref={formRef}
          noValidate
          className="flex flex-col lg:flex-row gap-8 items-start"
          onSubmit={handleSubmit}
        >
          {/* Left Side: Media Uploads */}
          <div className="w-full lg:w-1/3 space-y-6">
            {/* Profile Image Card */}
            <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 flex flex-col items-center text-center">
              <h3 className="text-lg font-semibold mb-6 self-start w-full text-left">
                {t("doctors.form.profileImage")}
              </h3>

              <div className="relative group">
                <Avatar
                  isBordered
                  className="w-40 h-40 text-6xl mb-6 shadow-md"
                  color="primary"
                  icon={<FiUser />}
                  src={imagePreview || undefined}
                />
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    document.getElementById("profile-image-input")?.click()
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("profile-image-input")?.click();
                    }
                  }}
                >
                  <FiUpload className="text-white text-3xl" />
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  fullWidth
                  color="primary"
                  startContent={<FiUpload />}
                  variant="flat"
                  onPress={() =>
                    document.getElementById("profile-image-input")?.click()
                  }
                >
                  {t("doctors.form.upload")}
                </Button>
                {imagePreview && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <FiEdit2 /> {/* Using Edit/Close icon for reset visual */}
                  </Button>
                )}
              </div>
              <input
                accept="image/*"
                className="hidden"
                id="profile-image-input"
                type="file"
                onChange={handleImageChange}
              />
              <p className="text-tiny text-default-400 mt-3 text-center">
                {t("common.allowedFormats")}
              </p>
            </div>

            {/* Passport Card */}
            <div className={`bg-content1 rounded-[32px] p-8 shadow-sm border ${isEdit && !passportPreview ? "border-warning-300" : "border-default-200"}`}>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <FiFileText />
                {t("doctors.fields.passportImage")}
                {isEdit && !passportPreview && (
                  <span className="ms-auto">
                    <FiAlertCircle className="text-warning" size={18} />
                  </span>
                )}
              </h3>

              {isEdit && !passportPreview && (
                <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-2">
                  <FiAlertCircle className="text-warning-600 mt-0.5 shrink-0" size={15} />
                  <p className="text-xs text-warning-700">
                    {t("doctors.noDocumentDesc", "Upload a passport or national ID to verify this doctor's identity.")}
                  </p>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] transition-colors ${
                  passportPreview
                    ? "border-primary border-solid p-0 overflow-hidden bg-black/5"
                    : isEdit
                      ? "border-warning-300 hover:border-warning-400 bg-warning-50/30"
                      : "border-default-300 hover:border-default-400 bg-default-50"
                }`}
                role="button"
                tabIndex={0}
                onClick={() =>
                  document.getElementById("passport-image-input")?.click()
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
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
                  <div className="text-center cursor-pointer p-6">
                    <FiUpload className={`mx-auto text-3xl mb-2 ${isEdit ? "text-warning-400" : "text-default-400"}`} />
                    <p className={`text-sm font-medium ${isEdit ? "text-warning-600" : "text-default-500"}`}>
                      {t("doctors.form.uploadPassport")}
                    </p>
                    <p className="text-xs text-default-400 mt-1">
                      {t("member.docUploadFormats")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="passport-image-input"
                  type="file"
                  onChange={handlePassportChange}
                />
                {passportPreview && (
                  <Button
                    fullWidth
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      setPassportFile(null);
                      setPassportPreview(null);
                    }}
                  >
                    {t("common.remove")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Form Fields */}
          <div className="flex-1 space-y-6">
            {isEdit && loadedUser && loadedUser.user_type === "doctor" && (
              <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
                <CardHeader className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold">
                    {t("doctors.approvalStatus")}
                  </h3>
                  <DoctorStatusSwitcher
                    doctor={loadedUser}
                    onUpdated={setLoadedUser}
                  />
                </CardHeader>
              </Card>
            )}

            {errors.general && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl flex items-start gap-3">
                <FiAlertCircle className="text-danger mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-danger">{errors.general}</p>
              </div>
            )}

            <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
              <CardHeader className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-100 text-primary">
                  <FiUser size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {t("common.information")}
                  </h3>
                  <p className="text-sm text-default-400">
                    {t("doctors.form.infoSubtitle")}
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.username}
                    isInvalid={!!errors.username}
                    label={t("common.username")}
                    placeholder={t("doctors.placeholders.username")}
                    value={formData.username || ""}
                    variant="bordered"
                    onChange={(e) => handleInputChange("username", e.target.value)}
                  />

                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.email}
                    isInvalid={!!errors.email}
                    label={t("common.email")}
                    placeholder={t("doctors.placeholders.email")}
                    type="email"
                    value={formData.email || ""}
                    variant="bordered"
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.phone_number}
                    isInvalid={!!errors.phone_number}
                    label={t("users.form.phone")}
                    placeholder={t("users.form.phonePlaceholder")}
                    type="tel"
                    value={formData.phone_number || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                  />

                  {!isEdit && (
                    <>
                      <Input
                        isRequired
                        classNames={{ inputWrapper: "rounded-xl" }}
                        errorMessage={errors.password}
                        isInvalid={!!errors.password}
                        label={t("common.password")}
                        placeholder={t("doctors.placeholders.password")}
                        type="password"
                        value={formData.password || ""}
                        variant="bordered"
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                      />
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
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }}
                      />
                    </>
                  )}

                  {isEdit && (
                    <>
                      <Input
                        classNames={{ inputWrapper: "rounded-xl" }}
                        description={t("doctors.form.passwordHint")}
                        errorMessage={errors.password}
                        isInvalid={!!errors.password}
                        label={t("common.password")}
                        placeholder={t("doctors.placeholders.password")}
                        type="password"
                        value={formData.password || ""}
                        variant="bordered"
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                      />
                      {formData.password && (
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
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
              <CardHeader>
                <h3 className="text-lg font-bold">{t("users.form.arabicName")}</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.first_name_field}
                    isInvalid={!!errors.first_name_field}
                    label={t("users.form.firstNameArabic")}
                    placeholder={t("users.form.firstNameArabicPlaceholder")}
                    value={formData.first_name_field || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("first_name_field", e.target.value)
                    }
                  />

                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.father_name}
                    isInvalid={!!errors.father_name}
                    label={t("users.form.fatherNameArabic")}
                    placeholder={t("users.form.fatherNameArabicPlaceholder")}
                    value={formData.father_name || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("father_name", e.target.value)
                    }
                  />

                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.grandfather_name}
                    isInvalid={!!errors.grandfather_name}
                    label={t("users.form.grandfatherNameArabic")}
                    placeholder={t("users.form.grandfatherNameArabicPlaceholder")}
                    value={formData.grandfather_name || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("grandfather_name", e.target.value)
                    }
                  />

                  <Input
                    isRequired
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.family_name}
                    isInvalid={!!errors.family_name}
                    label={t("users.form.familyNameArabic")}
                    placeholder={t("users.form.familyNameArabicPlaceholder")}
                    value={formData.family_name || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("family_name", e.target.value)
                    }
                  />
                </div>
              </CardBody>
            </Card>

            <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
              <CardHeader>
                <h3 className="text-lg font-bold">{t("users.form.englishName")}</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.first_name_en}
                    isInvalid={!!errors.first_name_en}
                    label={t("users.form.firstNameEnglish")}
                    placeholder={t("users.form.firstNameEnglishPlaceholder")}
                    value={formData.first_name_en || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("first_name_en", e.target.value)
                    }
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.father_name_en}
                    isInvalid={!!errors.father_name_en}
                    label={t("users.form.fatherNameEnglish")}
                    placeholder={t("users.form.fatherNameEnglishPlaceholder")}
                    value={formData.father_name_en || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("father_name_en", e.target.value)
                    }
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.grandfather_name_en}
                    isInvalid={!!errors.grandfather_name_en}
                    label={t("users.form.grandfatherNameEnglish")}
                    placeholder={t("users.form.grandfatherNameEnglishPlaceholder")}
                    value={formData.grandfather_name_en || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("grandfather_name_en", e.target.value)
                    }
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.family_name_en}
                    isInvalid={!!errors.family_name_en}
                    label={t("users.form.familyNameEnglish")}
                    placeholder={t("users.form.familyNameEnglishPlaceholder")}
                    value={formData.family_name_en || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("family_name_en", e.target.value)
                    }
                  />
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
                    errorMessage={errors.city}
                    isInvalid={!!errors.city}
                    label={t("auth.city")}
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
                    errorMessage={errors.address}
                    isInvalid={!!errors.address}
                    label={t("auth.address")}
                    placeholder={t("auth.addressPlaceholder")}
                    value={formData.address || ""}
                    variant="bordered"
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.university_name}
                    isInvalid={!!errors.university_name}
                    label={t("auth.university")}
                    placeholder={t("auth.universityPlaceholder")}
                    value={formData.university_name || ""}
                    variant="bordered"
                    onChange={(e) =>
                      handleInputChange("university_name", e.target.value)
                    }
                  />

                  <Select
                    classNames={{ trigger: "rounded-xl" }}
                    errorMessage={errors.current_degree}
                    isInvalid={!!errors.current_degree}
                    label={t("auth.degree")}
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
                </div>
              </CardBody>
            </Card>

            <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
              <CardHeader>
                <h3 className="text-lg font-bold">{t("doctors.form.professionalDetails")}</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <Select
                    disallowEmptySelection
                    classNames={{ trigger: "rounded-xl" }}
                    label={t("doctors.fields.specialty")}
                    placeholder={t("doctors.placeholders.specialty")}
                    selectedKeys={formData.specialty ? [formData.specialty] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      handleInputChange("specialty", selected);
                    }}
                  >
                    {availableSpecialties.map((spec) => (
                      <SelectItem key={spec.name}>{spec.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    classNames={{ trigger: "rounded-xl" }}
                    errorMessage={errors.language}
                    isInvalid={!!errors.language}
                    label={t("common.language")}
                    selectedKeys={formData.language ? [formData.language] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleInputChange("language", selectedKey as "ar" | "en");
                    }}
                  >
                    <SelectItem key="en">English</SelectItem>
                    <SelectItem key="ar">العربية</SelectItem>
                  </Select>

                  <Select
                    classNames={{ trigger: "rounded-xl" }}
                    errorMessage={errors.gender}
                    isInvalid={!!errors.gender}
                    label={t("users.form.gender")}
                    placeholder={t("users.form.genderPlaceholder")}
                    selectedKeys={formData.gender ? [formData.gender] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      handleInputChange("gender", selectedKey || "");
                    }}
                  >
                    <SelectItem key="male">{t("users.genders.male")}</SelectItem>
                    <SelectItem key="female">{t("users.genders.female")}</SelectItem>
                  </Select>

                  <Input
                    isReadOnly
                    classNames={{
                      input: "cursor-pointer",
                      inputWrapper: "rounded-xl cursor-pointer"
                    }}
                    errorMessage={errors.nationality}
                    isInvalid={!!errors.nationality}
                    label={t("users.form.nationality")}
                    placeholder={t("users.form.selectNationality")}
                    value={formData.nationality ? t(`nationalities.list.${formData.nationality}`, formData.nationality) : ""}
                    variant="bordered"
                    onClick={() => setNationalityModalOpen(true)}
                  />

                  <Input
                    classNames={{ inputWrapper: "rounded-xl" }}
                    errorMessage={errors.birthdate}
                    isInvalid={!!errors.birthdate}
                    label={t("auth.birthdate")}
                    type="date"
                    value={formData.birthdate || ""}
                    variant="bordered"
                    onChange={(e) => handleInputChange("birthdate", e.target.value)}
                  />

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className={`text-small font-medium relative top-1 ${
                          errors.branch_ids ? "text-danger" : "text-foreground"
                        }`}
                      >
                        {t("doctors.form.branches")}
                        <span className="text-danger">&nbsp;*</span>
                      </label>
                      <Button
                        className="font-medium"
                        color="primary"
                        size="sm"
                        startContent={<FiEdit2 />}
                        variant="light"
                        onPress={() => setBranchModalOpen(true)}
                      >
                        {t("doctors.form.selectBranch")}
                      </Button>
                    </div>
                    <div
                      className={`min-h-[56px] rounded-xl border-2 transition-colors p-2 flex flex-wrap gap-2 items-center cursor-pointer ${
                        errors.branch_ids
                          ? "border-danger bg-danger-50/30"
                          : "border-default-200 hover:border-default-400"
                      }`}
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
                        <span
                          className={`text-sm px-2 ${
                            errors.branch_ids
                              ? "text-danger"
                              : "text-default-400"
                          }`}
                        >
                          {t("doctors.form.noBranchSelected")}
                        </span>
                      )}
                    </div>
                    {errors.branch_ids && (
                      <p className="text-tiny text-danger px-1">
                        {errors.branch_ids}
                      </p>
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
                  <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
                    <CardHeader>
                      <h3 className="text-lg font-bold">
                        {t("doctors.form.branchRequirementsTitle", { branchName: selectedBranch.name })}
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <Input
                          classNames={{ inputWrapper: "rounded-xl" }}
                          description={
                            isEdit && loadedUser?.full_doctor_number
                              ? `${t("users.form.fullDoctorNumber")}: ${loadedUser.full_doctor_number}`
                              : t("doctors.form.licenseNumberHint")
                          }
                          errorMessage={errors.doctor_number}
                          isInvalid={!!errors.doctor_number}
                          label={t("doctors.form.licenseNumberLabel")}
                          placeholder={t("doctors.form.licenseNumberPlaceholder")}
                          value={formData.doctor_number || ""}
                          variant="bordered"
                          onChange={(e) =>
                            handleInputChange("doctor_number", e.target.value)
                          }
                        />

                        <Input
                          classNames={{ inputWrapper: "rounded-xl" }}
                          description={t("auth.membershipNumberDesc")}
                          errorMessage={errors.membership_number}
                          isInvalid={!!errors.membership_number}
                          label={t("auth.membershipNumber")}
                          placeholder={t("auth.membershipNumberPlaceholder")}
                          value={formData.membership_number || ""}
                          variant="bordered"
                          onChange={(e) =>
                            handleInputChange("membership_number", e.target.value)
                          }
                        />

                        {dynamicFields.map((field) => renderDynamicField(field))}

                        {/* Institution Selection */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-small font-medium text-foreground relative top-1">
                              {t("doctors.form.institutions")}
                            </label>
                            <Button
                              className="font-medium"
                              color="primary"
                              size="sm"
                              startContent={<FiEdit2 />}
                              variant="light"
                              onPress={() => setInstitutionModalOpen(true)}
                            >
                              {t("doctors.form.selectInstitution")}
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
                                {t("doctors.form.noInstitutionSelected")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <Textarea
                            classNames={{ inputWrapper: "rounded-xl" }}
                            label={t("doctors.form.cvLabel")}
                            placeholder={t("doctors.form.cvPlaceholder")}
                            rows={4}
                            value={formData.bio || ""}
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

            {/* Footer Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                className="font-medium rounded-xl"
                color="default"
                disabled={submitting}
                size="lg"
                variant="flat"
                onPress={() => navigate("/doctors")}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="font-medium rounded-xl px-8"
                color="primary"
                disabled={submitting}
                isLoading={submitting}
                size="lg"
                startContent={<FiSave />}
                type="submit"
                variant="shadow"
              >
                {submitting
                  ? t("common.saving")
                  : t("common.save")}
              </Button>
            </div>
          </div>
        </form>

        <BranchModal
          isOpen={branchModalOpen}
          mode="single"
          selectedBranches={selectedBranches}
          title={t("doctors.form.branchModalTitle")}
          onClose={() => setBranchModalOpen(false)}
          onSelect={handleBranchSelect}
        />

        <InstitutionModal
          isOpen={institutionModalOpen}
          mode="multiple"
          selectedInstitutions={selectedInstitutions}
          title={t("doctors.form.institutionModalTitle")}
          onClose={() => setInstitutionModalOpen(false)}
          onSelect={handleInstitutionSelect}
        />

        <NationalitySearchModal
          isOpen={nationalityModalOpen}
          mode="single"
          selectedNationalityName={formData.nationality}
          onClose={() => setNationalityModalOpen(false)}
          onSelect={handleNationalitySelect}
        />

        <Toaster position="top-right" />
      </div>
    </DefaultLayout>
  );
};

export default DoctorsFormPage;
