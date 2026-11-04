import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { FiSave, FiArrowLeft } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import citiesApi from "@/api/citiesApi";
import { CityCreateInput } from "@/models/city";

export default function CityFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CityCreateInput>({
    name: "",
    region: "",
    prefix: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      const fetchCity = async () => {
        try {
          setLoading(true);
          const res = await citiesApi.getById(parseInt(id));
          const city = res.data;

          setFormData({
            name: city.name,
            region: city.region || "",
            prefix: city.prefix || "",
          });
        } catch (err) {
          console.error("Failed to fetch city", err);
        } finally {
          setLoading(false);
        }
      };

      fetchCity();
    }
  }, [id, isEdit]);

  const handleInputChange = (field: keyof CityCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t("cities.form.required");
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaveLoading(true);
      if (isEdit && id) {
        await citiesApi.update(parseInt(id), formData);
      } else {
        await citiesApi.create(formData);
      }
      navigate("/cities");
    } catch (err: any) {
      console.error("Failed to save city", err);
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
        <div className="flex justify-center items-center h-64">Loading...</div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/cities")}
          >
            <FiArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? t("cities.edit") : t("cities.add")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEdit ? t("cities.edit") : t("cities.add")}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                isRequired
                errorMessage={errors.name}
                isInvalid={!!errors.name}
                label={t("cities.form.name")}
                placeholder={t("cities.form.name")}
                value={formData.name}
                onValueChange={(v) => handleInputChange("name", v)}
              />
              <Input
                label={t("cities.form.region")}
                placeholder={t("cities.form.region")}
                value={formData.region}
                onValueChange={(v) => handleInputChange("region", v)}
              />
              <Input
                label={t("cities.form.prefix")}
                placeholder={t("cities.form.prefix")}
                value={formData.prefix}
                onValueChange={(v) => handleInputChange("prefix", v)}
              />

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  disabled={saveLoading}
                  variant="light"
                  onPress={() => navigate("/cities")}
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
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
