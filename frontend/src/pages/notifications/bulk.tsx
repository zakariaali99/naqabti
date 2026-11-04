import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
} from "@heroui/react";
import { FiSend, FiArrowLeft, FiUsers, FiSearch, FiCheckCircle } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import notificationsApi from "@/api/notificationsApi";
import usersApi from "@/api/usersApi";
import citiesApi from '@/api/citiesApi';
import { Branch } from "@/models/branch";
import { City } from '@/models/city';
import BranchModal from "@/pages/branches/BranchModal";
import NationalitySearchModal from "@/components/modals/NationalitySearchModal";
import { Nationality } from "@/models/nationality";
import AcademicDegreeSearchModal from "@/components/modals/AcademicDegreeSearchModal";
import { AcademicDegree } from "@/models/academicDegree";

export default function BulkNotificationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();


  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    notification_type: "info",
  });

  const [sendToAllDevices, setSendToAllDevices] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [nationalityModalOpen, setNationalityModalOpen] = useState(false);
  const [academicDegreeModalOpen, setAcademicDegreeModalOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    user_type: "",
    graduation_year_after: "",
    graduation_year_before: "",
    current_degree: "",
    email_verified: "",
    nationality: "",
    city: [] as string[],
    birthdate_after: "",
    birthdate_before: "",
    gender: "",
  });

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [sendLoading, setSendLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Recipients preview
  const [recipientsList, setRecipientsList] = useState<any[]>([]);
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Load cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setCitiesLoading(true);
        const response = await citiesApi.getAll();
        setCities(response.data?.results || []);
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, []);

  // Calculate recipient count when branches change
  useEffect(() => {
    const fetchUserCount = async () => {
      if (sendToAllDevices) {
        try {
          const response = await usersApi.getAll({ limit: 1 });

          setRecipientCount(response.data.count || 0);
        } catch (error) {
          console.error("Failed to fetch total user count:", error);
          setRecipientCount(0);
        }

        return;
      }

      if (selectedBranches.length === 0) {
        setRecipientCount(0);

        return;
      }

      try {
        const branchIds = selectedBranches.map((b) => b.id);
        const params: any = {
          branch_ids: branchIds.join(','),
          limit: 1
        };

        // Add filters
        if (filters.user_type)
          params.user_type = filters.user_type;
        if (filters.graduation_year_after)
          params.graduation_year_after = filters.graduation_year_after;
        if (filters.graduation_year_before)
          params.graduation_year_before = filters.graduation_year_before;
        if (filters.current_degree)
          params.current_degree = filters.current_degree;
        if (filters.email_verified)
          params.email_verified = filters.email_verified;
        if (filters.nationality) params.nationality = filters.nationality;
        if (filters.city && filters.city.length > 0) params.city = filters.city.join(',');
        if (filters.birthdate_after) params.birthdate_after = filters.birthdate_after;
        if (filters.birthdate_before) params.birthdate_before = filters.birthdate_before;
        if (filters.gender) params.gender = filters.gender;

        const response = await usersApi.getAll(params);

        setRecipientCount(response.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch user count:", error);
        setRecipientCount(0);
      }
    };

    fetchUserCount();
  }, [selectedBranches, sendToAllDevices, filters]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBranchSelect = (branches: Branch[]) => {
    setSelectedBranches(branches);
    setIsBranchModalOpen(false);
    if (errors.branches) {
      setErrors((prev) => ({ ...prev, branches: "" }));
    }
  };

  const handleRemoveBranch = (branchId: number) => {
    setSelectedBranches((prev) => prev.filter((b) => b.id !== branchId));
  };

  const handleNationalitySelect = (nationalities: Nationality[]) => {
    if (nationalities.length > 0) {
      setFilters((prev) => ({ ...prev, nationality: nationalities[0].name }));
    } else {
      setFilters((prev) => ({ ...prev, nationality: "" }));
    }
  };

  const handleAcademicDegreeSelect = (degrees: AcademicDegree[]) => {
    if (degrees.length > 0) {
      setFilters((prev) => ({ ...prev, current_degree: degrees[0].name }));
    } else {
      setFilters((prev) => ({ ...prev, current_degree: "" }));
    }
  };

  const handleSearchRecipients = async () => {
    if (selectedBranches.length === 0 && !sendToAllDevices) return;

    try {
      setRecipientsLoading(true);
      const branchIds = selectedBranches.map((b) => b.id);
      const params: any = {
        branch_ids: branchIds.join(","),
        limit: 100, // Limit preview to 100 users
      };

      // Add filters
      if (filters.user_type)
        params.user_type = filters.user_type;
      if (filters.graduation_year_after)
        params.graduation_year_after = filters.graduation_year_after;
      if (filters.graduation_year_before)
        params.graduation_year_before = filters.graduation_year_before;
      if (filters.current_degree)
        params.current_degree = filters.current_degree;
      if (filters.email_verified)
        params.email_verified = filters.email_verified;
      if (filters.nationality) params.nationality = filters.nationality;
      if (filters.city && filters.city.length > 0) params.city = filters.city.join(',');
      if (filters.birthdate_after) params.birthdate_after = filters.birthdate_after;
      if (filters.birthdate_before) params.birthdate_before = filters.birthdate_before;
      if (filters.gender) params.gender = filters.gender;

      const response = await usersApi.getAll(params);

      setRecipientsList(response.data.results || []);
      setIsRecipientsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch recipients:", error);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = t("notifications.form.required");
      }
      if (!formData.message.trim()) {
        newErrors.message = t("notifications.form.required");
      } else if (formData.message.length < 10) {
        newErrors.message = t("notifications.form.messageMinLength");
      }
    }

    if (step === 2) {
      if (!sendToAllDevices && selectedBranches.length === 0) {
        newErrors.branches = t("notifications.form.selectBranchError");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setSendLoading(true);

      const payload: Record<string, any> = {
        title: formData.title,
        message: formData.message,
        notification_type: 'info',
      };

      if (sendToAllDevices) {
        payload.send_to_all_devices = true;
      } else {
        payload.send_to_all_devices = false;
        const branchIds = selectedBranches.map((b) => b.id);
        payload.branch_ids = branchIds.join(",");

        if (filters.user_type) payload.user_type = filters.user_type;
        if (filters.graduation_year_after) payload.graduation_year_after = filters.graduation_year_after;
        if (filters.graduation_year_before) payload.graduation_year_before = filters.graduation_year_before;
        if (filters.current_degree) payload.current_degree = filters.current_degree;
        if (filters.email_verified) payload.email_verified = filters.email_verified;
        if (filters.nationality) payload.nationality = filters.nationality;
        if (filters.city && filters.city.length > 0) payload.city = filters.city.join(',');
        if (filters.birthdate_after) payload.birthdate_after = filters.birthdate_after;
        if (filters.birthdate_before) payload.birthdate_before = filters.birthdate_before;
        if (filters.gender) payload.gender = filters.gender;
      }

      await notificationsApi.sendBulk(payload as any);

      navigate("/notifications");
    } catch (error: any) {
      console.error('Failed to send bulk notification:', error);
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach(key => {
          apiErrors[key] = Array.isArray(error.response.data[key]) 
            ? error.response.data[key][0] 
            : error.response.data[key];
        });
        setErrors(apiErrors);
      }
    } finally {
      setSendLoading(false);
    }
  };

  const steps = [
    { title: t('notifications.form.details'), icon: 1 },
    { title: t('notifications.filters.title'), icon: 2 },
    { title: t('notifications.summary.title'), icon: 3 },
  ];

  return (
    <DefaultLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            isIconOnly
            variant="light"
            onPress={() => currentStep > 1 ? handleBack() : navigate('/notifications')}
          >
            <FiArrowLeft />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('notifications.sendBulk')}</h1>
            <div className="flex items-center gap-3 mt-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep === (idx + 1) ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                    currentStep > (idx + 1) ? 'bg-success text-white' : 'bg-default-100 text-default-400'
                  }`}>
                    {currentStep > (idx + 1) ? <FiCheckCircle /> : step.icon}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${currentStep === (idx + 1) ? 'text-primary' : 'text-default-400'}`}>
                    {step.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 hidden sm:block ${currentStep > (idx + 1) ? 'bg-success' : 'bg-default-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-default-200/50 overflow-visible">
          <CardBody className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
                    <FiSend size={20} />
                  </div>
                  <h2 className="text-xl font-bold">{t('notifications.form.details')}</h2>
                </div>
                <Input
                  label={t('notifications.form.title')}
                  labelPlacement="outside"
                  placeholder={t('notifications.form.titlePlaceholder')}
                  value={formData.title}
                  onValueChange={(val) => handleInputChange('title', val)}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                  isRequired
                  variant="bordered"
                  size="lg"
                  classNames={{ label: "font-semibold" }}
                />
                <Textarea
                  label={t('notifications.form.message')}
                  labelPlacement="outside"
                  placeholder={t('notifications.form.messagePlaceholder')}
                  value={formData.message}
                  onValueChange={(val) => handleInputChange('message', val)}
                  isInvalid={!!errors.message}
                  errorMessage={errors.message}
                  isRequired
                  minRows={6}
                  variant="bordered"
                  size="lg"
                  classNames={{ label: "font-semibold" }}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success">
                    <FiUsers size={20} />
                  </div>
                  <h2 className="text-xl font-bold">{t('notifications.filters.title')}</h2>
                </div>

                <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${sendToAllDevices ? 'border-primary bg-primary-50' : 'border-default-100 bg-white hover:border-default-300'}`}
                     onClick={() => {
                        const nextVal = !sendToAllDevices;
                        setSendToAllDevices(nextVal);
                        if (nextVal) setSelectedBranches([]);
                     }}>
                  <div className="flex items-start gap-4">
                    <Checkbox isSelected={sendToAllDevices} />
                    <div>
                      <h3 className="font-bold text-lg">{t('notifications.form.sendToAllDevices')}</h3>
                      <p className="text-default-500 text-sm">{t('notifications.form.sendToAllDevicesHint')}</p>
                    </div>
                  </div>
                </div>

                {!sendToAllDevices && (
                  <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold">{t('notifications.form.selectBranches')}</h3>
                        <p className="text-xs text-default-400">{t('notifications.bulk.subtitle')}</p>
                      </div>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={() => setIsBranchModalOpen(true)}
                        startContent={<FiUsers />}
                        className="font-bold"
                      >
                        {selectedBranches.length === 0 ? t('notifications.form.selectBranches') : t('notifications.form.changeSelection')}
                      </Button>
                    </div>

                    {selectedBranches.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-default-50 rounded-2xl border border-default-100">
                        {selectedBranches.map((branch) => (
                          <Chip key={branch.id} onClose={() => handleRemoveBranch(branch.id)} variant="flat" color="primary">
                            {branch.name}
                          </Chip>
                        ))}
                      </div>
                    )}

                    {errors.branches && <p className="text-danger text-sm font-medium">{errors.branches}</p>}

                    {selectedBranches.length > 0 && (
                      <div className="p-6 bg-default-50 rounded-3xl border border-default-200">
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-default-500">{t('notifications.filters.title')} (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <Select
                            label={t('notifications.filters.userType')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.userTypePlaceholder')}
                            selectedKeys={filters.user_type ? [filters.user_type] : []}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0] as string;
                              setFilters(pw => ({ ...pw, user_type: selectedKey || "" }));
                            }}
                            variant="bordered"
                          >
                            <SelectItem key="doctor" textValue={t('users.userTypes.doctor')}>
                              {t('users.userTypes.doctor')}
                            </SelectItem>
                            <SelectItem key="manager" textValue={t('users.userTypes.manager')}>
                              {t('users.userTypes.manager')}
                            </SelectItem>
                            <SelectItem key="student" textValue={t('users.userTypes.student')}>
                              {t('users.userTypes.student')}
                            </SelectItem>
                            <SelectItem key="institution" textValue={t('users.userTypes.institution')}>
                              {t('users.userTypes.institution')}
                            </SelectItem>
                            <SelectItem key="viewer" textValue={t('users.userTypes.viewer', 'Viewer')}>
                              {t('users.userTypes.viewer', 'Viewer')}
                            </SelectItem>
                            <SelectItem key="advertiser" textValue={t('users.userTypes.advertiser', 'Advertiser')}>
                              {t('users.userTypes.advertiser', 'Advertiser')}
                            </SelectItem>
                          </Select>
                          <Select
                            label={t('users.form.gender', 'Gender')}
                            labelPlacement="outside"
                            placeholder={t('users.form.genderPlaceholder', 'Select Gender')}
                            selectedKeys={filters.gender ? [filters.gender] : []}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0] as string;
                              setFilters(pw => ({ ...pw, gender: selectedKey || "" }));
                            }}
                            variant="bordered"
                          >
                            <SelectItem key="male" textValue={t('users.genders.male')}>
                              {t('users.genders.male')}
                            </SelectItem>
                            <SelectItem key="female" textValue={t('users.genders.female')}>
                              {t('users.genders.female')}
                            </SelectItem>
                          </Select>
                          <Input 
                            label={t('notifications.filters.graduationYearFrom')} 
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.graduationYearFromPlaceholder')}
                            value={filters.graduation_year_after} 
                            onValueChange={(v) => setFilters(pw => ({ ...pw, graduation_year_after: v }))} 
                            variant="bordered" 
                          />
                          <Input 
                            label={t('notifications.filters.graduationYearTo')} 
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.graduationYearToPlaceholder')}
                            value={filters.graduation_year_before} 
                            onValueChange={(v) => setFilters(pw => ({ ...pw, graduation_year_before: v }))} 
                            variant="bordered" 
                          />
                          <Input
                            isReadOnly
                            label={t('notifications.filters.currentDegree')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.currentDegreePlaceholder')}
                            value={filters.current_degree ? t(`academicDegrees.list.${filters.current_degree.toLowerCase()}`, filters.current_degree) : ""}
                            onClick={() => setAcademicDegreeModalOpen(true)}
                            variant="bordered"
                            classNames={{
                              input: "cursor-pointer",
                              inputWrapper: "cursor-pointer"
                            }}
                          />
                          <Input
                            isReadOnly
                            label={t('notifications.filters.nationality')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.nationalityPlaceholder')}
                            value={filters.nationality ? t(`nationalities.list.${filters.nationality}`, filters.nationality) : ""}
                            onClick={() => setNationalityModalOpen(true)}
                            variant="bordered"
                            classNames={{
                              input: "cursor-pointer",
                              inputWrapper: "cursor-pointer"
                            }}
                          />
                          <Select
                            label={t('notifications.filters.city')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.cityPlaceholder')}
                            selectedKeys={new Set(filters.city)}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => setFilters(pw => ({ ...pw, city: Array.from(keys) as string[] }))}
                            variant="bordered"
                            isLoading={citiesLoading}
                          >
                            {cities.map((city) => {
                              const isArabic = i18n.language === "ar";
                              const displayName = isArabic && city.name_ar ? city.name_ar : city.name;
                              return (
                                <SelectItem key={city.name} textValue={displayName}>
                                  {displayName}
                                </SelectItem>
                              );
                            })}
                          </Select>
                          <Input
                            label={t('notifications.filters.birthdateFrom')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.birthdatePlaceholder')}
                            type="date"
                            value={filters.birthdate_after}
                            onValueChange={(v) => setFilters(pw => ({ ...pw, birthdate_after: v }))}
                            variant="bordered"
                          />
                          <Input
                            label={t('notifications.filters.birthdateTo')}
                            labelPlacement="outside"
                            placeholder={t('notifications.filters.birthdatePlaceholder')}
                            type="date"
                            value={filters.birthdate_before}
                            onValueChange={(v) => setFilters(pw => ({ ...pw, birthdate_before: v }))}
                            variant="bordered"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center mt-6">
                      <Button
                        startContent={<FiSearch />}
                        onPress={handleSearchRecipients}
                        isLoading={recipientsLoading}
                        size="lg"
                        className="font-bold rounded-2xl"
                        variant="flat"
                        color="secondary"
                      >
                        {t('notifications.filters.searchRecipients')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary">
                    <FiSearch size={20} />
                  </div>
                  <h2 className="text-xl font-bold">{t('notifications.summary.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-8 bg-gradient-to-br from-primary to-primary-600 rounded-[2.5rem] text-white shadow-xl shadow-primary/20">
                      <p className="text-primary-100 text-xs font-black uppercase tracking-widest mb-1">{t('notifications.summary.recipients')}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{recipientCount}</span>
                        <span className="text-lg opacity-80">{t('notifications.summary.users')}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-default-100 rounded-[2rem] border border-default-200">
                       <p className="text-default-500 text-xs font-bold uppercase tracking-wider mb-2">{t('notifications.summary.branches')}</p>
                       <div className="flex flex-wrap gap-2">
                        {sendToAllDevices ? (
                          <Chip color="primary" variant="shadow">{t('notifications.form.sendToAllDevices')}</Chip>
                        ) : selectedBranches.length > 0 ? (
                           selectedBranches.map(b => <Chip key={b.id} size="sm" variant="flat">{b.name}</Chip>)
                        ) : <span className="text-default-400 italic">None selected</span>}
                       </div>
                    </div>
                  </div>

                  <div className="p-8 border-2 border-default-100 rounded-[2.5rem] space-y-6">
                    <div>
                      <p className="text-xs text-default-400 font-black uppercase tracking-widest mb-2">{t('notifications.form.title')}</p>
                      <p className="text-xl font-bold text-default-800">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-400 font-black uppercase tracking-widest mb-2">{t('notifications.form.message')}</p>
                      <p className="text-default-600 text-md leading-relaxed line-clamp-6">{formData.message}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Chip
                    color="secondary"
                    variant="flat"
                    className="px-4 py-1"
                  >
                    {t(`notifications.types.${formData.notification_type}`)}
                  </Chip>
                </div>

                {/* Active Filters */}
                {!sendToAllDevices &&
                  selectedBranches.length > 0 &&
                  (filters.user_type ||
                    filters.gender ||
                    filters.graduation_year_after ||
                    filters.graduation_year_before ||
                    filters.current_degree ||
                    filters.email_verified ||
                    filters.nationality ||
                    filters.city ||
                    filters.birthdate_after ||
                    filters.birthdate_before) && (
                    <div>
                      <p className="text-sm text-default-600 mb-2">
                        {t("notifications.summary.activeFilters")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {filters.user_type && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.userType")}:{" "}
                            {t(`users.userTypes.${filters.user_type}`, filters.user_type)}
                          </Chip>
                        )}
                        {filters.gender && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("users.form.gender")}:{" "}
                            {filters.gender === "male"
                              ? t("users.genders.male", "Male")
                              : t("users.genders.female", "Female")}
                          </Chip>
                        )}
                        {(filters.graduation_year_after || filters.graduation_year_before) && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.graduationYear")}:{" "}
                            {filters.graduation_year_after || "-"} → {filters.graduation_year_before || "-"}
                          </Chip>
                        )}
                        {filters.current_degree && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.currentDegree")}:{" "}
                            {t(`academicDegrees.list.${filters.current_degree.toLowerCase()}`, filters.current_degree)}
                          </Chip>
                        )}
                        {filters.email_verified && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.emailVerified")}:{" "}
                            {filters.email_verified === "true"
                              ? t("notifications.filters.verified")
                              : t("notifications.filters.notVerified")}
                          </Chip>
                        )}
                        {filters.nationality && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.nationality")}:{" "}
                            {t(`nationalities.list.${filters.nationality}`, filters.nationality)}
                          </Chip>
                        )}
                        {filters.city && filters.city.length > 0 && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.city")}: {filters.city.join(', ')}
                          </Chip>
                        )}
                        {(filters.birthdate_after || filters.birthdate_before) && (
                          <Chip color="secondary" size="sm" variant="flat">
                            {t("notifications.filters.birthdate")}:{" "}
                            {filters.birthdate_after || "-"} → {filters.birthdate_before || "-"}
                          </Chip>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-default-100">
              <Button
                variant="light"
                onPress={() => currentStep > 1 ? handleBack() : navigate('/notifications')}
                size="lg"
                className="font-semibold"
              >
                {currentStep === 1 ? t('common.cancel') : t('common.back')}
              </Button>
              
              <Button
                color="primary"
                onPress={currentStep < 3 ? handleNext : handleSubmit}
                isLoading={sendLoading}
                size="lg"
                className="px-10 font-black shadow-xl shadow-primary/30"
                startContent={currentStep === 3 ? <FiSend /> : null}
              >
                {t(currentStep < 3 ? 'common.next' : 'notifications.form.send')}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Modals */}
        <BranchModal
          isOpen={isBranchModalOpen}
          mode="multiple"
          selectedBranches={selectedBranches}
          onClose={() => setIsBranchModalOpen(false)}
          onSelect={handleBranchSelect}
        />

        <NationalitySearchModal
          isOpen={nationalityModalOpen}
          mode="single"
          selectedNationalityName={filters.nationality}
          onClose={() => setNationalityModalOpen(false)}
          onSelect={handleNationalitySelect}
        />

        <AcademicDegreeSearchModal
          isOpen={academicDegreeModalOpen}
          mode="single"
          selectedAcademicDegreeName={filters.current_degree}
          onClose={() => setAcademicDegreeModalOpen(false)}
          onSelect={handleAcademicDegreeSelect}
        />

        <Modal isOpen={isRecipientsModalOpen} onClose={() => setIsRecipientsModalOpen(false)} size="3xl" scrollBehavior="inside" backdrop="blur">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 p-8 pb-4">
                  <h3 className="text-2xl font-black">{t("notifications.filters.recipientsPreview")}</h3>
                  <p className="text-default-500 font-medium">
                    {t("notifications.filters.showingResults", {
                      count: recipientsList.length,
                      total: recipientCount,
                    })}
                  </p>
                </ModalHeader>
                <ModalBody className="px-8 pb-8">
                  {recipientsList.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-48 text-default-400 gap-4">
                      <FiUsers size={48} className="opacity-20" />
                      <p className="font-bold">{t("notifications.filters.noRecipients")}</p>
                    </div>
                  ) : (
                    <Table aria-label="Recipients table" removeWrapper className="border rounded-2xl">
                      <TableHeader>
                        <TableColumn className="bg-default-50">{t('users.table.fullName')}</TableColumn>
                        <TableColumn className="bg-default-50">{t('users.form.userType')}</TableColumn>
                        <TableColumn className="bg-default-50">{t('branches.table.name')}</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {recipientsList.map((user) => (
                          <TableRow key={user.id} className="border-b last:border-none">
                            <TableCell>
                              <User
                                name={user.full_name || user.username}
                                description={user.email}
                                avatarProps={{ src: user.profile_image, name: user.full_name || user.username }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip size="sm" variant="dot" color="primary">{t(`users.userTypes.${user.user_type}`)}</Chip>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{user.branch?.name || '-'}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ModalBody>
                <ModalFooter className="p-8 pt-4 border-t">
                  <Button color="default" variant="flat" onPress={onClose} className="font-bold">
                    {t("common.close")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
