import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Button, Chip, useDisclosure, Divider, Progress } from "@heroui/react";
import {
  FiSave,
  FiArrowLeft,
  FiSearch,
  FiUser,
  FiUserPlus,
  FiAward,
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiCalendar,
  FiExternalLink,
  FiBriefcase,
} from "react-icons/fi";

import certificationsApi from "@/api/certificationsApi";
import certificationTypesApi from "@/api/certificationTypesApi";
import { CertificationCreateInput, CertificationType } from "@/models";
import { UserEntity } from "@/models/users";
import { UserSearchModal } from "@/pages/users/components";
import DoctorEditModal from "@/pages/member/components/DoctorSearchModal";
import CertificationTypeSearchModal from "@/pages/certification-types/CertificationTypeSearchModal";

// Component Helper for Form Section (Moved outside to prevent re-render focus loss)
const FormSection = ({ title, icon: Icon, children }: any) => (
  <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 mb-6">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-default-100">
      <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary flex items-center justify-center">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

export default function CertificationsFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isRtl = i18n.dir() === "rtl";

  // Modal controls
  const {
    isOpen: isUserSearchModalOpen,
    onOpen: onUserSearchModalOpen,
    onClose: onUserSearchModalClose,
  } = useDisclosure();
  const {
    isOpen: isUserCreateModalOpen,
    onOpen: onUserCreateModalOpen,
    onClose: onUserCreateModalClose,
  } = useDisclosure();
  const {
    isOpen: isCertificationTypeModalOpen,
    onOpen: onCertificationTypeModalOpen,
    onClose: onCertificationTypeModalClose,
  } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState<CertificationCreateInput>({
    doctor_id: 0,
    certification_type_id: 0,
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    issued_from: "",
    document: undefined,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(
    null,
  );

  // Selected items for display
  const [selectedDoctor, setSelectedDoctor] = useState<UserEntity | null>(null);
  const [selectedCertificationType, setSelectedCertificationType] =
    useState<CertificationType | null>(null);

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load certification data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchCertification = async () => {
        try {
          setLoading(true);
          const response = await certificationsApi.getById(parseInt(id));
          const certification = response.data;

          const certificationTypeId =
            typeof certification.certification_type === "number"
              ? certification.certification_type
              : certification.certification_type.id;

          setFormData({
            doctor_id: certification.doctor?.id || 0,
            certification_type_id: certificationTypeId,
            issue_date: certification.issue_date,
            expiry_date: certification.expiry_date || "",
            issued_from: certification.issued_from || "",
            document: undefined,
          });

          if (certification.document) {
            setExistingDocumentUrl(certification.document);
          }

          if (certification.doctor) {
            setSelectedDoctor(certification.doctor);
          }

          if (certification.certification_type) {
            if (typeof certification.certification_type === "object") {
              setSelectedCertificationType(certification.certification_type);
            } else {
              try {
                const typeResponse = await certificationTypesApi.getById(
                  certification.certification_type,
                );

                setSelectedCertificationType(typeResponse.data);
              } catch (err) {
                console.error("Failed to load certification type:", err);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch certification:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCertification();
    }
  }, [id, isEdit]);

  // Handle doctor selection
  const handleDoctorSelect = (doctor: UserEntity) => {
    setSelectedDoctor(doctor);
    setFormData((prev) => ({ ...prev, doctor_id: doctor.id }));
    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors.doctor;

      return newErrors;
    });
  };

  // Handle certification type selection
  const handleCertificationTypeSelect = (
    certificationType: CertificationType,
  ) => {
    setSelectedCertificationType(certificationType);
    setFormData((prev) => ({
      ...prev,
      certification_type_id: certificationType.id,
    }));

    // Auto-calculate expiry date
    if (formData.issue_date && certificationType.validity_period_months) {
      const issueDate = new Date(formData.issue_date);
      const expiryDate = new Date(issueDate);

      expiryDate.setMonth(
        expiryDate.getMonth() + certificationType.validity_period_months,
      );
      setFormData((prev) => ({
        ...prev,
        expiry_date: expiryDate.toISOString().split("T")[0],
      }));
    }

    if (errors.certification_type) {
      setErrors((prev) => ({ ...prev, certification_type: "" }));
    }
  };

  const handleInputChange = (
    field: keyof CertificationCreateInput,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setDocumentFile(file);
      setFormData((prev) => ({ ...prev, document: file }));
      if (errors.document) {
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    }
  };

  const handleRemoveFile = () => {
    setDocumentFile(null);
    setFormData((prev) => ({ ...prev, document: undefined }));
  };

  const handleRemoveExistingDocument = () => {
    setExistingDocumentUrl(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctor_id)
      newErrors.doctor = t("common.form.required") || "Required";
    if (!formData.certification_type_id)
      newErrors.certification_type = t("common.form.required") || "Required";
    if (!formData.issue_date)
      newErrors.issue_date = t("common.form.required") || "Required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      setUploadProgress(0);

      const handleProgress = (progressEvent: any) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };

      if (isEdit && id) {
        await certificationsApi.update(parseInt(id), formData, handleProgress);
      } else {
        await certificationsApi.create(formData, handleProgress);
      }
      navigate("/certifications");
    } catch (error: any) {
      console.error("Failed to save certification:", error);
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
      setSaveLoading(false);
      setUploadProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center text-default-500 font-medium">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const getAbsoluteDocumentUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = certificationsApi.BASE_URL.replace(/\/api\/?$/, "");
    return `${base}${url}`;
  };

  return (
    <div
      className="min-h-screen font-sans max-w-[1600px] mx-auto p-4 lg:p-8 space-y-6"
      dir={isRtl ? "rtl" : "ltr"}
    >
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Button
            isIconOnly
            className="bg-content1 rounded-full shadow-sm"
            variant="light"
            onPress={() => navigate("/certifications")}
          >
            <FiArrowLeft className={`${isRtl ? "rotate-180" : ""}`} size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
              {isEdit
                ? t("certifications.editCertification")
                : t("certifications.addCertification")}
            </h1>
            <p className="text-default-500 font-medium">
              {isEdit
                ? t("certifications.details")
                : t("certifications.createDesc")}
            </p>
          </div>
        </div>

        <form
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          onSubmit={handleSubmit}
        >
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Doctor Selection */}
            <FormSection icon={FiUser} title={t("doctors.doctorInformation")}>
              <div className="space-y-4">
                {selectedDoctor ? (
                  <div className="p-4 rounded-3xl bg-content2 border border-default-200 flex items-center justify-between group transition-all hover:bg-content2/80">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary text-2xl font-bold">
                        {selectedDoctor.profile_image ? (
                          <img
                            alt={selectedDoctor.full_name || selectedDoctor.username}
                            className="w-full h-full rounded-2xl object-cover"
                            src={selectedDoctor.profile_image}
                          />
                        ) : (
                          selectedDoctor.full_name?.[0] ||
                          selectedDoctor.username[0]
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">
                          {selectedDoctor.full_name || selectedDoctor.username}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-default-500 mt-1">
                          <span className="flex items-center gap-1">
                            <FiUser size={14} /> {selectedDoctor.username}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-default-300" />
                          <span>{selectedDoctor.email}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="font-semibold"
                      color="primary"
                      size="sm"
                      startContent={<FiUser />}
                      variant="flat"
                      onPress={onUserSearchModalOpen}
                    >
                      {t("doctors.change")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`cursor-pointer p-6 rounded-3xl border-2 border-dashed border-default-300 hover:border-primary hover:bg-primary-50/50 transition-all flex flex-col items-center justify-center text-center gap-3 h-40 ${errors.doctor ? "border-danger bg-danger-50/10" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={onUserSearchModalOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onUserSearchModalOpen();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-default-500">
                        <FiSearch size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {t("doctors.selectDoctor")}
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          {t("doctors.selectDoctorSubtitle")}
                        </p>
                      </div>
                    </div>
                    <div
                      className="cursor-pointer p-6 rounded-3xl border-2 border-dashed border-default-300 hover:border-success hover:bg-success-50/50 transition-all flex flex-col items-center justify-center text-center gap-3 h-40"
                      role="button"
                      tabIndex={0}
                      onClick={onUserCreateModalOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onUserCreateModalOpen();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-default-500">
                        <FiUserPlus size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {t("doctors.createNew")}
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          {t("doctors.registerDoctor")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {errors.doctor && (
                  <p className="text-danger text-sm font-medium px-2">
                    {errors.doctor}
                  </p>
                )}
              </div>
            </FormSection>

            {/* 2. Certification Details */}
            <FormSection
              icon={FiAward}
              title={t("certifications.certificationDetails")}
            >
              <div className="space-y-6">
                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    {t("certifications.selectCertificationType")}
                  </label>
                  {selectedCertificationType ? (
                    <div
                      className="p-4 bg-default-50 rounded-2xl border border-default-200 cursor-pointer hover:border-primary transition-colors flex items-center justify-between"
                      role="button"
                      tabIndex={0}
                      onClick={onCertificationTypeModalOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onCertificationTypeModalOpen();
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary flex items-center justify-center text-xl">
                          <FiAward />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-lg">
                              {selectedCertificationType.name}
                            </p>
                            {selectedCertificationType.is_renewable && (
                              <Chip
                                className="h-5 text-xs"
                                color="success"
                                size="sm"
                                variant="flat"
                              >
                                {t("certificationTypes.renewable")}
                              </Chip>
                            )}
                          </div>
                          {selectedCertificationType.description && (
                            <p className="text-sm text-default-500 line-clamp-1">
                              {selectedCertificationType.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <FiSearch className="text-default-400" />
                    </div>
                  ) : (
                    <Button
                      className={`w-full justify-start text-left h-20 ${errors.certification_type ? "border-danger" : ""}`}
                      size="lg"
                      startContent={
                        <FiAward
                          className="text-default-400 flex-shrink-0"
                          size={24}
                        />
                      }
                      variant="bordered"
                      onPress={onCertificationTypeModalOpen}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {t("certifications.selectCertificationType")}
                        </p>
                        <p className="text-xs text-default-400 font-normal">
                          {t("certifications.selectCertificationTypeDesc")}
                        </p>
                      </div>
                    </Button>
                  )}
                  {errors.certification_type && (
                    <p className="text-danger text-xs px-2">
                      {errors.certification_type}
                    </p>
                  )}
                </div>

                <Divider className="opacity-50" />

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    isRequired
                    classNames={{ inputWrapper: "h-12 rounded-xl" }}
                    errorMessage={errors.issue_date}
                    isInvalid={!!errors.issue_date}
                    label={t("certifications.issueDate")}
                    labelPlacement="outside"
                    size="lg"
                    startContent={<FiCalendar className="text-default-400" />}
                    type="date"
                    value={formData.issue_date}
                    variant="bordered"
                    onValueChange={(val) =>
                      handleInputChange("issue_date", val)
                    }
                  />
                  <Input
                    classNames={{ inputWrapper: "h-12 rounded-xl" }}
                    description={
                      selectedCertificationType?.validity_period_months
                        ? `${t("common.validFor")} ${selectedCertificationType.validity_period_months} ${t("common.months")}`
                        : t("certifications.optional")
                    }
                    label={t("certifications.expiryDate")}
                    labelPlacement="outside"
                    size="lg"
                    startContent={<FiCalendar className="text-default-400" />}
                    type="date"
                    value={formData.expiry_date || ""}
                    variant="bordered"
                    onValueChange={(val) =>
                      handleInputChange("expiry_date", val)
                    }
                  />
                </div>

                {/* Issued From */}
                <Input
                  classNames={{ inputWrapper: "h-12 rounded-xl" }}
                  label={t("certifications.issuedFrom")}
                  labelPlacement="outside"
                  placeholder={t("certifications.issuedFromPlaceholder")}
                  size="lg"
                  startContent={<FiBriefcase className="text-default-400" />}
                  value={formData.issued_from || ""}
                  variant="bordered"
                  onValueChange={(val) => handleInputChange("issued_from", val)}
                />
              </div>
            </FormSection>

            {/* 3. Document Upload */}
            <FormSection
              icon={FiFileText}
              title={t("certifications.attachment")}
            >
              <div className="space-y-4">
                {/* Existing Document */}
                {existingDocumentUrl && !documentFile && (
                  <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <FiFileText size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {t("certifications.currentDocument")}
                        </p>
                        <a
                          className="text-primary text-sm hover:underline flex items-center gap-1"
                          href={getAbsoluteDocumentUrl(existingDocumentUrl)}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t("common.view")} <FiExternalLink />
                        </a>
                      </div>
                    </div>
                    <Button
                      color="danger"
                      size="sm"
                      startContent={<FiTrash2 />}
                      variant="light"
                      onPress={handleRemoveExistingDocument}
                    >
                      {t("common.remove")}
                    </Button>
                  </div>
                )}

                {/* New File Preview */}
                {documentFile && (
                  <div className="flex items-center justify-between p-4 bg-success-50 border border-success-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-success shadow-sm">
                        <FiFileText size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {documentFile.name}
                        </p>
                        <p className="text-xs text-default-500">
                          {(documentFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={handleRemoveFile}
                    >
                      <FiTrash2 size={18} />
                    </Button>
                  </div>
                )}

                {/* Upload Zone */}
                {!documentFile && (
                  <div className="relative group">
                    <input
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="doc-upload"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <div className="border-2 border-dashed border-default-300 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-primary group-hover:bg-primary-50/30">
                      <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center text-default-500 mb-4 group-hover:scale-110 transition-transform group-hover:text-primary group-hover:bg-white">
                        <FiUploadCloud size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1">
                        {existingDocumentUrl
                          ? t("certifications.replaceDocument")
                          : t("certifications.uploadDocument")}
                      </h4>
                      <p className="text-sm text-default-500 max-w-md mx-auto">
                        {t("certifications.documentHint")}
                      </p>
                    </div>
                  </div>
                )}
                {errors.document && (
                  <p className="text-danger text-sm px-2 text-center">
                    {errors.document}
                  </p>
                )}
              </div>
            </FormSection>
          </div>

          {/* Right Sidebar Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-content1 rounded-[32px] p-6 shadow-sm border border-default-200 sticky top-6">
              <h3 className="font-bold text-lg mb-4">{t("common.actions")}</h3>
              <div className="flex flex-col gap-3">
                <Button
                  className="font-bold shadow-lg shadow-primary/20"
                  color="primary"
                  isLoading={saveLoading}
                  size="lg"
                  startContent={<FiSave />}
                  type="submit"
                  variant="shadow"
                >
                  {isEdit ? t("common.saveChanges") : t("common.save")}
                </Button>
                {uploadProgress !== null && (
                  <Progress
                    className="mt-2"
                    color="primary"
                    label={t("common.uploading") || "Uploading..."}
                    showValueLabel={true}
                    size="md"
                    value={uploadProgress}
                  />
                )}
                <Button
                  className="font-medium"
                  color="default"
                  size="lg"
                  variant="flat"
                  onPress={() => navigate("/certifications")}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Modals */}
        <UserSearchModal
          description={t("doctors.selectDoctorDesc")}
          isOpen={isUserSearchModalOpen}
          selectedUserId={selectedDoctor?.id}
          title={t("doctors.selectDoctor")}
          userTypeFilter="doctor"
          onClose={onUserSearchModalClose}
          onSelect={handleDoctorSelect}
        />

        <DoctorEditModal
          isOpen={isUserCreateModalOpen}
          onClose={onUserCreateModalClose}
          onSave={handleDoctorSelect}
        />

        <CertificationTypeSearchModal
          isOpen={isCertificationTypeModalOpen}
          selectedCertificationTypeId={selectedCertificationType?.id}
          onClose={onCertificationTypeModalClose}
          onSelect={handleCertificationTypeSelect}
        />
      </div>
    );
  }
