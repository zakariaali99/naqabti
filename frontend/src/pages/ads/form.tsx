import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
  Spinner,
  Progress,
  Chip,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiUpload,
  FiX,
  FiUsers,
  FiCheckCircle,
} from "react-icons/fi";

import adsApi from "@/api/adsApi";
import branchesApi from "@/api/branchesApi";
import citiesApi from "@/api/citiesApi";
import doctorSpecialtyApi from "@/api/doctorSpecialtyApi";
import { AdCreateInput } from "@/models/ad";
import { useUserStore } from "@/stores/userStore";

export default function AdFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useUserStore();

  const isStaffOrManager = user?.is_staff || user?.user_type === "manager";

  // Wizard Step
  const [step, setStep] = useState(1);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Targeting states
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set());

  // Data collections
  const [branches, setBranches] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  // Estimation state
  const [estimating, setEstimating] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);
  const [audienceBreakdown, setAudienceBreakdown] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resBranches, resCities, resSpecs] = await Promise.all([
          branchesApi.getAll({ page_size: 200 }),
          citiesApi.getAll({ page_size: 200 }),
          doctorSpecialtyApi.getAll({ page_size: 200 }),
        ]);

        setBranches(resBranches.data.results || []);
        setCities(resCities.data.results || []);
        setSpecialties(resSpecs.data.results || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchAd = async () => {
        try {
          setLoading(true);
          const response = await adsApi.getById(Number(id));
          const ad = response.data;

          setTitle(ad.title);
          setContent(ad.content);
          setStatus(ad.status);
          if (ad.featured_image) {
            setImagePreview(ad.featured_image as string);
          }

          if (ad.target_branches) {
            setSelectedBranches(new Set(ad.target_branches.map((b) => b.toString())));
          }
          if (ad.target_cities) {
            setSelectedCities(new Set(ad.target_cities.map((c) => c.toString())));
          }
          if (ad.target_specialties) {
            setSelectedSpecialties(new Set(ad.target_specialties.map((s) => s.toString())));
          }
        } catch (error) {
          console.error("Failed to load ad details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAd();
    }
  }, [id, isEditMode]);

  // Real-time audience calculation
  useEffect(() => {
    const calculateAudience = async () => {
      setEstimating(true);
      try {
        const params = {
          branch_ids: Array.from(selectedBranches).join(","),
          city_ids: Array.from(selectedCities).join(","),
          specialty_ids: Array.from(selectedSpecialties).join(","),
        };
        const response = await adsApi.calculateAudience(params);
        setAudienceCount(response.data.count);
        setAudienceBreakdown(response.data.breakdown);
      } catch (err) {
        console.error("Failed to calculate audience size:", err);
      } finally {
        setEstimating(false);
      }
    };

    // Calculate when entering step 2 or 3, or targeting changes
    if (step >= 2) {
      calculateAudience();
    }
  }, [selectedBranches, selectedCities, selectedSpecialties, step]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setFeaturedImage(null);
    setImagePreview("");
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!content.trim()) newErrors.content = "Ad description/content is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setSaveLoading(true);
      const payload: AdCreateInput = {
        title,
        content,
        target_branches: Array.from(selectedBranches).map(Number),
        target_cities: Array.from(selectedCities).map(Number),
        target_specialties: Array.from(selectedSpecialties).map(Number),
        status,
      };

      if (featuredImage) {
        payload.featured_image = featuredImage;
      }

      if (isEditMode && id) {
        await adsApi.patch(Number(id), payload as any);
      } else {
        await adsApi.create(payload);
      }

      navigate("/ads");
    } catch (error: any) {
      console.error("Failed to save ad campaign:", error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="light" onPress={() => navigate("/ads")}>
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? t("ads.editTitle", "Edit Ad Campaign") : t("ads.createTitle", "New Ad Campaign")}
            </h1>
            <p className="text-default-500 text-sm">
              {t("ads.form.subtitle", "Configure target criteria and premium styling for your campaign")}
            </p>
          </div>
        </div>

        {/* Custom Progress Wizard indicator */}
        <div className="flex justify-between items-center gap-4 py-2 border-b border-default-100">
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-default-100"}`}>1</span>
            <span className="text-sm font-medium">{t("ads.steps.info", "Info")}</span>
          </div>
          <div className="flex-1 h-0.5 bg-default-200" />
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-default-100"}`}>2</span>
            <span className="text-sm font-medium">{t("ads.steps.targeting", "Targeting")}</span>
          </div>
          <div className="flex-1 h-0.5 bg-default-200" />
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-default-100"}`}>3</span>
            <span className="text-sm font-medium">{t("ads.steps.preview", "Estimation")}</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("ads.form.general", "General Campaign Information")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                isRequired
                errorMessage={errors.title}
                isInvalid={!!errors.title}
                label={t("ads.form.title", "Campaign Title")}
                placeholder={t("ads.form.titlePlaceholder", "E.g. Special Cardiology Workshop Offer")}
                value={title}
                onValueChange={setTitle}
              />

              <Textarea
                isRequired
                errorMessage={errors.content}
                isInvalid={!!errors.content}
                label={t("ads.form.content", "Ad Content")}
                minRows={8}
                placeholder={t("ads.form.contentPlaceholder", "Write the full description/body message...")}
                value={content}
                onValueChange={setContent}
              />

              {isStaffOrManager && (
                <Select
                  label={t("ads.form.status", "Campaign Status")}
                  selectedKeys={[status]}
                  onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as any)}
                >
                  <SelectItem key="draft">{t("ads.status.draft", "Draft")}</SelectItem>
                  <SelectItem key="published">{t("ads.status.published", "Published")}</SelectItem>
                  <SelectItem key="archived">{t("ads.status.archived", "Archived")}</SelectItem>
                </Select>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700">{t("ads.form.featuredImage", "Featured Banner Image")}</label>
                {imagePreview ? (
                  <div className="relative border rounded-lg p-2 max-w-md bg-default-50">
                    <img alt="preview" className="rounded max-h-48 object-cover mx-auto" src={imagePreview} />
                    <Button
                      isIconOnly
                      className="absolute top-4 right-4 bg-danger/80 hover:bg-danger text-white rounded-full"
                      size="sm"
                      onPress={handleClearImage}
                    >
                      <FiX />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-default-300 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-default-50 cursor-pointer relative">
                    <input
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <FiUpload className="text-3xl text-default-400 mb-2" />
                    <p className="text-sm text-default-600 font-medium">
                      {t("ads.form.uploadClick", "Click or Drag to Upload Ad Banner Image")}
                    </p>
                    <p className="text-xs text-default-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("ads.form.targetingTitle", "Define Target Audience")}</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <p className="text-sm text-default-500">
                {t("ads.form.targetingDesc", "Filter down which syndicate members should see your campaign. Leaving a criteria blank means targeting all members under that category.")}
              </p>

              <Select
                selectionMode="multiple"
                label={t("ads.form.branches", "Target Branches")}
                placeholder={t("ads.form.allBranches", "All Branches")}
                selectedKeys={selectedBranches}
                onSelectionChange={(keys) => setSelectedBranches(keys as Set<string>)}
              >
                {branches.map((b) => (
                  <SelectItem key={b.id.toString()}>{b.name}</SelectItem>
                ))}
              </Select>

              <Select
                selectionMode="multiple"
                label={t("ads.form.cities", "Target Cities")}
                placeholder={t("ads.form.allCities", "All Cities")}
                selectedKeys={selectedCities}
                onSelectionChange={(keys) => setSelectedCities(keys as Set<string>)}
              >
                {cities.map((c) => (
                  <SelectItem key={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </Select>

              <Select
                selectionMode="multiple"
                label={t("ads.form.specialties", "Target Specialties")}
                placeholder={t("ads.form.allSpecialties", "All Specialties")}
                selectedKeys={selectedSpecialties}
                onSelectionChange={(keys) => setSelectedSpecialties(keys as Set<string>)}
              >
                {specialties.map((s) => (
                  <SelectItem key={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </Select>

              <div className="bg-default-50 p-4 rounded-lg flex items-center justify-between border border-default-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiUsers className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t("ads.form.realtimeAudience", "Current Projected Reach")}</h3>
                    <p className="text-xs text-default-500">{t("ads.form.calculatedBasedTarget", "Updated dynamically as selections change")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {estimating ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="text-xl font-bold text-primary">{audienceCount.toLocaleString()} {t("ads.form.members", "doctors")}</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t("ads.form.reviewTitle", "Campaign Review & Projected Audience Details")}</h2>
              <Chip color={status === "published" ? "success" : "default"} variant="flat">
                {status}
              </Chip>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-default-400 uppercase">{t("ads.review.titleLabel", "Campaign Title")}</h4>
                    <p className="text-lg font-bold text-default-800">{title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-default-400 uppercase">{t("ads.review.contentLabel", "Body Message")}</h4>
                    <p className="text-sm text-default-600 whitespace-pre-line">{content}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {imagePreview && (
                    <div>
                      <h4 className="text-xs font-semibold text-default-400 uppercase mb-1">{t("ads.review.banner", "Campaign Banner")}</h4>
                      <img alt="Banner Preview" className="rounded-lg object-cover w-full h-32 border border-default-100" src={imagePreview} />
                    </div>
                  )}
                  <div className="border border-default-100 p-4 rounded-lg bg-primary/5 space-y-2">
                    <h4 className="text-xs font-semibold text-primary uppercase">{t("ads.review.estimatedAudience", "Expected Audience Reach")}</h4>
                    {estimating ? (
                      <Spinner size="sm" />
                    ) : (
                      <div>
                        <div className="text-3xl font-extrabold text-primary">{audienceCount.toLocaleString()}</div>
                        <p className="text-xs text-default-500 mt-1">{t("ads.review.audienceDisclaimer", "Total unique registered physicians matching targeting filters")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {audienceBreakdown && (
                <div className="space-y-4 pt-4 border-t border-default-100">
                  <h3 className="font-semibold text-sm">{t("ads.review.breakdownTitle", "Audience Breakdown")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-default-500">{t("ads.review.byBranch", "Top Targeted Branches")}</h4>
                      {audienceBreakdown.by_branch?.length > 0 ? (
                        audienceBreakdown.by_branch.map((item: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{item.name}</span>
                              <span>{item.count}</span>
                            </div>
                            <Progress color="primary" size="sm" value={(item.count / (audienceCount || 1)) * 100} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-default-400 italic">No branch filters selected</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-default-500">{t("ads.review.byCity", "Top Targeted Cities")}</h4>
                      {audienceBreakdown.by_city?.length > 0 ? (
                        audienceBreakdown.by_city.map((item: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{item.name}</span>
                              <span>{item.count}</span>
                            </div>
                            <Progress color="secondary" size="sm" value={(item.count / (audienceCount || 1)) * 100} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-default-400 italic">No city filters selected</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            disabled={step === 1}
            variant="light"
            onPress={handleBack}
          >
            {t("common.back", "Back")}
          </Button>

          {step < 3 ? (
            <Button
              color="primary"
              endContent={<FiArrowRight />}
              onPress={handleNext}
            >
              {t("common.next", "Next")}
            </Button>
          ) : (
            <Button
              color="primary"
              isLoading={saveLoading}
              startContent={<FiCheckCircle />}
              onPress={handleSubmit}
            >
              {isEditMode ? t("ads.update", "Save Campaign") : t("ads.submit", "Launch Campaign")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
