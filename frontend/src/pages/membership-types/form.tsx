import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import DefaultLayout from "@/layouts/default";
import { membershipTypesApi } from "@/api/membershipTypesApi";
import academicDegreesApi from "@/api/academicDegreesApi";
import {
  MembershipTypeModel,
  CreateMembershipTypeRequest,
} from "@/models/membershipTypes";
import { AcademicDegree } from "@/models/academicDegree";

const MembershipTypesFormPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [degrees, setDegrees] = useState<AcademicDegree[]>([]);
  const [formData, setFormData] = useState<CreateMembershipTypeRequest>({
    name: "",
    description: "",
    duration_months: 12,
    price: "",
    academic_degree: null,
    is_active: true,
  });

  const fetchMembershipType = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await membershipTypesApi.getById(parseInt(id));
      const data: MembershipTypeModel = response.data;

      setFormData({
        name: data.name,
        description: data.description,
        duration_months: data.duration_months,
        price: data.price,
        academic_degree: data.academic_degree ?? null,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error fetching membership type:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchMembershipType();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const res = await academicDegreesApi.getAll();
        setDegrees(res.data.results || []);
      } catch (error) {
        console.error("Error fetching academic degrees:", error);
      }
    };

    fetchDegrees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (isEdit && id) {
        await membershipTypesApi.update(parseInt(id), formData);
      } else {
        await membershipTypesApi.create(formData);
      }

      navigate("/membership-types");
    } catch (error) {
      console.error("Error saving membership type:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateMembershipTypeRequest,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner label={t("membershipTypes.ui.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit
                  ? t("membershipTypes.form.editTitle")
                  : t("membershipTypes.form.addTitle")}
              </h1>
              <p className="text-default-500">
                {isEdit
                  ? t("membershipTypes.form.editSubtitle")
                  : t("membershipTypes.form.addSubtitle")}
              </p>
            </div>
            <Button
              startContent={<FiArrowLeft />}
              variant="light"
              onPress={() => navigate("/membership-types")}
            >
              {t("membershipTypes.actions.back")}
            </Button>
          </CardHeader>

          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  isRequired
                  label={t("membershipTypes.form.name")}
                  placeholder={t("membershipTypes.form.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />

                <Input
                  isRequired
                  label={t("membershipTypes.form.duration")}
                  min="1"
                  placeholder={t("membershipTypes.form.durationPlaceholder")}
                  type="number"
                  value={formData.duration_months.toString()}
                  onChange={(e) =>
                    handleInputChange(
                      "duration_months",
                      parseInt(e.target.value) || 1,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  isRequired
                  label={t("membershipTypes.form.price")}
                  min="0"
                  placeholder={t("membershipTypes.form.pricePlaceholder")}
                  startContent={
                    <span className="text-default-400">
                      {t("common.currency")}
                    </span>
                  }
                  step="0.01"
                  type="number"
                  value={formData.price.toString()}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={formData.is_active}
                    onValueChange={(checked) =>
                      handleInputChange("is_active", checked)
                    }
                  />
                  <span className="text-sm">
                    {t("membershipTypes.form.active")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label={t("membershipTypes.form.academicDegree")}
                  placeholder={t("membershipTypes.form.academicDegreePlaceholder")}
                  selectedKeys={[
                    formData.academic_degree
                      ? String(formData.academic_degree)
                      : "all",
                  ]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string;

                    handleInputChange(
                      "academic_degree",
                      key && key !== "all" ? Number(key) : null,
                    );
                  }}
                >
                  <SelectItem key="all">
                    {t("membershipTypes.form.allDegrees")}
                  </SelectItem>
                  {degrees.map((degree) => (
                    <SelectItem key={String(degree.id)}>
                      {degree.name}
                    </SelectItem>
                  )) as any}
                </Select>
              </div>

              <Textarea
                label={t("membershipTypes.form.description")}
                placeholder={t("membershipTypes.form.descriptionPlaceholder")}
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />

              <div className="flex gap-4 pt-4">
                <Button
                  color="primary"
                  disabled={submitting}
                  isLoading={submitting}
                  startContent={<FiSave />}
                  type="submit"
                >
                  {submitting
                    ? t("membershipTypes.actions.saving")
                    : t("membershipTypes.actions.save")}
                </Button>

                <Button
                  disabled={submitting}
                  variant="light"
                  onPress={() => navigate("/membership-types")}
                >
                  {t("membershipTypes.actions.cancel")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default MembershipTypesFormPage;
