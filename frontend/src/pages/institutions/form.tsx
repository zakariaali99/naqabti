import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Switch,
  Spinner,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiMapPin, FiX } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import DefaultLayout from "@/layouts/default";
import institutionsApi from "@/api/institutionsApi";
import { InstitutionInput } from "@/models/institution";
import { City } from "@/models/city";
import CitySelectModal from "@/pages/cities/CitySelectModal";

export default function InstitutionFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [formData, setFormData] = useState<InstitutionInput>({
    name: "",
    address: "",
    phone: "",
    email: "",
    latitude: null,
    longitude: null,
    logo: null,
    is_active: true,
    city_id: null,
  });

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([28, 17], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !formData.latitude || !formData.longitude) return;
    const { latitude, longitude } = formData;
    mapRef.current.setView([latitude, longitude], 12);
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
    }
  }, [formData.latitude, formData.longitude]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await institutionsApi.getById(parseInt(id));
        const u = res.data;

        setFormData({
          name: u.name,
          address: u.address || "",
          phone: u.phone || "",
          email: u.email || "",
          latitude: u.latitude,
          longitude: u.longitude,
          logo: u.logo || null,
          is_active: u.is_active,
          city_id: u.city_id ?? u.city?.id ?? null,
        });
        if (u.city) setSelectedCity(u.city);
      } catch (err) {
        console.error("Failed to load institution", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id, isEdit]);

  const handleInputChange = (field: keyof InstitutionInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ly`,
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));
        setSearchQuery(display_name);
      }
    } catch (err) {
      console.error("Location search failed", err);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim())
      newErrors.name = t("users.form.required");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaveLoading(true);

      if (isEdit && id) {
        await institutionsApi.update(parseInt(id), formData);
      } else {
        await institutionsApi.create(formData);
      }
      navigate("/institutions");
    } catch (err: any) {
      console.error("Failed to save institution", err);
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
            onPress={() => navigate("/institutions")}
          >
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? t("institutions.edit") : t("institutions.add")}
            </h1>
            <p className="text-default-500">{t("institutions.addSubtitle")}</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("institutions.form.basicInfo", "Basic Info")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  label={t("institutions.form.name") || "Name"}
                  placeholder={t("institutions.form.name") || "Institution Name"}
                  value={formData.name}
                  onValueChange={(v) => handleInputChange("name", v)}
                />

                <Input
                  label={t("users.form.email")}
                  placeholder={t("users.form.emailPlaceholder")}
                  value={formData.email || ""}
                  onValueChange={(v) => handleInputChange("email", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("users.form.phone")}
                  placeholder={t("users.form.phonePlaceholder")}
                  value={formData.phone || ""}
                  onValueChange={(v) => handleInputChange("phone", v)}
                />

                <Input
                  label={t("institutions.form.logo") || "Logo"}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleInputChange("logo", f);
                  }}
                />
              </div>

              <Textarea
                label={t("institutions.form.address") || "Address"}
                placeholder={t("institutions.form.address") || "Address"}
                value={formData.address || ""}
                onValueChange={(v) => handleInputChange("address", v)}
              />

              <Switch
                isSelected={formData.is_active}
                onValueChange={(v) => handleInputChange("is_active", v)}
              >
                {t("users.form.isActive")}
              </Switch>
            </CardBody>
          </Card>

          <Card classNames={{ base: "rounded-[32px] shadow-sm border border-default-200" }}>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("institutions.form.location") || "Location"}
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* City Selector */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    readOnly
                    errorMessage={errors.city_id}
                    isInvalid={!!errors.city_id}
                    label={t("institutions.form.city", "City")}
                    placeholder={t("institutions.form.selectCity", "Select a city...")}
                    startContent={<FiMapPin className="text-default-400" />}
                    value={selectedCity ? selectedCity.name : ""}
                    onClick={() => setCityModalOpen(true)}
                    endContent={
                      selectedCity ? (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedCity(null);
                            handleInputChange("city_id", null);
                          }}
                        >
                          <FiX />
                        </Button>
                      ) : null
                    }
                  />
                </div>
                <Button
                  className="mt-5 rounded-2xl"
                  color="primary"
                  variant="flat"
                  onPress={() => setCityModalOpen(true)}
                >
                  {t("common.browse", "Browse")}
                </Button>
              </div>

              {/* Location Map Picker */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onKeyPress={(e) => e.key === "Enter" && searchLocation()}
                  />
                  <Button
                    className="rounded-2xl"
                    color="primary"
                    variant="flat"
                    onPress={searchLocation}
                  >
                    Search
                  </Button>
                </div>
                <div
                  ref={mapContainerRef}
                  className="h-72 rounded-2xl overflow-hidden border border-default-200"
                />
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-default-400">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-4 justify-end pt-4">
            <Button
              disabled={saveLoading}
              variant="light"
              onPress={() => navigate("/institutions")}
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
      <CitySelectModal
        isOpen={cityModalOpen}
        selectedCityId={formData.city_id}
        onClose={() => setCityModalOpen(false)}
        onSelect={(city) => {
          setSelectedCity(city);
          handleInputChange("city_id", city.id);
        }}
      />
    </DefaultLayout>
  );
}
