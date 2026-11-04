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
  Switch,
} from "@heroui/react";
import { FiSave, FiArrowLeft } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import eventsApi from "@/api/eventsApi";
import { EventCreateInput } from "@/models/event";

export default function EventFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<EventCreateInput>({
    title: "",
    content: "",
    excerpt: "",
    event_date: new Date().toISOString(),
    location: "",
    max_attendees: undefined,
    status: "draft",
    is_featured: false,
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const res = await eventsApi.getById(parseInt(id));
          const event = res.data;

          setFormData({
            title: event.title,
            content: event.content || "",
            excerpt: event.excerpt || "",
            event_date: event.event_date,
            location: event.location || "",
            max_attendees: event.max_attendees,
            status: event.status,
            is_featured: event.is_featured,
          });
        } catch (err) {
          console.error("Failed to fetch event", err);
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [id, isEditMode]);

  const handleInputChange = (field: keyof EventCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = t("common.required");
    if (!formData.event_date) newErrors.event_date = t("common.required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      if (isEditMode && id) {
        await eventsApi.update(parseInt(id), formData);
      } else {
        await eventsApi.create(formData);
      }
      navigate("/events");
    } catch (err: any) {
      console.error("Failed to save event", err);
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
        <div className="flex justify-center items-center h-64">
          {t("common.loading")}
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/events")}
          >
            <FiArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? t("events.edit") : t("events.add")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEditMode ? t("events.edit") : t("events.add")}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                isRequired
                errorMessage={errors.title}
                isInvalid={!!errors.title}
                label={t("events.form.title")}
                placeholder={t("events.form.titlePlaceholder")}
                value={formData.title}
                onValueChange={(v) => handleInputChange("title", v)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.event_date}
                  isInvalid={!!errors.event_date}
                  label={t("events.form.eventDate")}
                  placeholder={t("events.form.eventDatePlaceholder")}
                  type="datetime-local"
                  value={
                    formData.event_date
                      ? new Date(formData.event_date)
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "event_date",
                      new Date(e.target.value).toISOString(),
                    )
                  }
                />

                <Input
                  errorMessage={errors.location}
                  isInvalid={!!errors.location}
                  label={t("events.form.location")}
                  placeholder={t("events.form.locationPlaceholder")}
                  value={formData.location}
                  onValueChange={(v) => handleInputChange("location", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("events.form.maxAttendees")}
                  min={0}
                  placeholder={t("events.form.maxAttendeesPlaceholder")}
                  type="number"
                  value={formData.max_attendees?.toString() || ""}
                  onValueChange={(v) =>
                    handleInputChange(
                      "max_attendees",
                      v ? parseInt(v) : undefined,
                    )
                  }
                />

                <Select
                  label={t("events.form.status")}
                  selectedKeys={formData.status ? [formData.status] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    handleInputChange("status", selected);
                  }}
                >
                  {["draft", "published", "archived"].map((status) => (
                    <SelectItem key={status}>
                      {t(`events.status.${status}`)}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Textarea
                label={t("events.form.excerpt")}
                minRows={2}
                placeholder={t("events.form.excerptPlaceholder")}
                value={formData.excerpt}
                onValueChange={(v) => handleInputChange("excerpt", v)}
              />

              <Textarea
                label={t("events.form.content")}
                minRows={6}
                placeholder={t("events.form.contentPlaceholder")}
                value={formData.content}
                onValueChange={(v) => handleInputChange("content", v)}
              />

              <Switch
                isSelected={formData.is_featured}
                onValueChange={(v) => handleInputChange("is_featured", v)}
              >
                {t("events.form.isFeatured")}
              </Switch>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  disabled={saveLoading}
                  variant="light"
                  onPress={() => navigate("/events")}
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
