import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { FiSave, FiArrowLeft } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import certificationTypesApi from "@/api/certificationTypesApi";
import { CertificationTypeCreate } from "@/models/certificationTypes";

export default function CertificationTypesFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Predefined categories
  const categories = [
    "professional",
    "academic",
    "technical",
    "safety",
    "compliance",
    "specialization",
  ];

  // Form state
  const [formData, setFormData] = useState<CertificationTypeCreate>({
    name: "",
    description: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load certification type data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchCertificationType = async () => {
        try {
          setLoading(true);
          const response = await certificationTypesApi.getById(parseInt(id));
          const certificationType = response.data;

          setFormData({
            name: certificationType.name,
            description: certificationType.description || "",
            category: certificationType.category || "",
          });
        } catch (error) {
          console.error("Failed to fetch certification type:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCertificationType();
    }
  }, [id, isEdit]);

  // Handle form field changes
  const handleInputChange = (
    field: keyof CertificationTypeCreate,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("certificationTypes.form.required");
    }
    if (!formData.description?.trim()) {
      newErrors.description = t("certificationTypes.form.required");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaveLoading(true);

      if (isEdit && id) {
        await certificationTypesApi.update(parseInt(id), {
          ...formData,
          id: parseInt(id),
        });
      } else {
        await certificationTypesApi.create(formData);
      }

      navigate("/certification-types");
    } catch (error: any) {
      console.error("Failed to save certification type:", error);

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
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/certification-types")}
          >
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit
                ? t("certificationTypes.edit")
                : t("certificationTypes.add")}
            </h1>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEdit
                ? t("certificationTypes.edit")
                : t("certificationTypes.add")}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Basic Information */}
              <Input
                isRequired
                errorMessage={errors.name}
                isInvalid={!!errors.name}
                label={t("certificationTypes.form.name")}
                placeholder={t("certificationTypes.form.namePlaceholder")}
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
              />

              <Textarea
                isRequired
                errorMessage={errors.description}
                isInvalid={!!errors.description}
                label={t("certificationTypes.form.description")}
                minRows={3}
                placeholder={t(
                  "certificationTypes.form.descriptionPlaceholder",
                )}
                value={formData.description}
                onValueChange={(value) =>
                  handleInputChange("description", value)
                }
              />

              <Select
                errorMessage={errors.category}
                isInvalid={!!errors.category}
                label={t("certificationTypes.form.category")}
                placeholder={t("certificationTypes.form.categoryPlaceholder")}
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("category", selectedKey || "");
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category}>
                    {t(`certificationTypes.categories.${category}`)}
                  </SelectItem>
                ))}
              </Select>

              {/* Form Actions */}
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  disabled={saveLoading}
                  variant="light"
                  onPress={() => navigate("/certification-types")}
                >
                  {t("certificationTypes.form.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={saveLoading}
                  startContent={<FiSave />}
                  type="submit"
                >
                  {t("certificationTypes.form.save")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
