import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Spinner, Chip, Avatar } from "@heroui/react";
import {
  FiArrowLeft,
  FiEdit,
  FiHome,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import institutionsApi from "@/api/institutionsApi";
import { Institution } from "@/models/institution";
import { formatDate } from "@/misc/formatDate";

export default function InstitutionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await institutionsApi.getById(parseInt(id));

        setInstitution(res.data);
      } catch (err) {
        console.error("Failed to load institution", err);
        setInstitution(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner color="primary" label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!institution) {
    return (
      <DefaultLayout>
        <div className="p-12 text-center">
          <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-6 text-default-400">
            <FiHome size={48} />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {t("common.notFound")}
          </h3>
          <Button
            className="mt-4"
            color="primary"
            variant="flat"
            onPress={() => navigate("/institutions")}
          >
            {t("common.back")}
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen font-sans space-y-8 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              className="rounded-full bg-content2 text-default-500 hover:text-foreground"
              variant="light"
              onPress={() => navigate("/institutions")}
            >
              <FiArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("institutions.detailSubtitle")}
              </h1>
              <p className="text-default-500 font-mono text-sm opacity-80">
                ID: {institution.id}
              </p>
            </div>
          </div>
          <Button
            className="rounded-2xl font-medium"
            color="primary"
            startContent={<FiEdit />}
            variant="shadow"
            onPress={() => navigate(`/institutions/${id}/edit`)}
          >
            {t("common.edit")}
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-content1 rounded-[32px] p-8 md:p-10 shadow-sm border border-default-200 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] pointer-events-none rotate-12">
            <FiHome size={400} />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <Avatar
              isBordered
              showFallback
              className="w-32 h-32 md:w-40 md:h-40 text-4xl rounded-[32px] shadow-xl"
              color={institution.is_active ? "success" : "default"}
              icon={<FiHome />}
              src={institution.logo}
            />

            <div className="flex-1 space-y-5 pt-2 w-full">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    {institution.name}
                  </h2>
                  <Chip
                    className="rounded-lg h-7"
                    color={institution.is_active ? "success" : "default"}
                    variant="flat"
                  >
                    {institution.is_active
                      ? t("common.active")
                      : t("common.inactive")}
                  </Chip>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {institution.email && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-default-50 border border-default-100 hover:border-primary-200 transition-colors cursor-default">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                      <FiMail size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-default-400 font-medium uppercase tracking-wider">
                        {t("users.form.email")}
                      </p>
                      <span className="font-semibold text-foreground">
                        {institution.email}
                      </span>
                    </div>
                  </div>
                )}

                {institution.phone && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-default-50 border border-default-100 hover:border-primary-200 transition-colors cursor-default">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                      <FiPhone size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-default-400 font-medium uppercase tracking-wider">
                        {t("users.form.phone")}
                      </p>
                      <span className="font-medium text-foreground" dir="ltr">
                        {institution.phone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 h-full">
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary">
                <FiMapPin size={20} />
              </div>
              {t("institutions.locationInfo", "Location")}
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-default-100 last:border-0 hover:bg-default-50/50 px-2 rounded-lg transition-colors">
                <span className="text-default-500 font-medium">
                  {t("institutions.form.address") || "Address"}
                </span>
                <span className="font-bold text-foreground text-right max-w-[200px]">
                  {institution.address || "-"}
                </span>
              </div>

              {institution.latitude && institution.longitude ? (
                <div>
                  <span className="text-default-500 font-medium block mb-2">
                    Map Location
                  </span>
                  <div className="h-48 rounded-2xl overflow-hidden border">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${institution.longitude - 0.01}%2C${institution.latitude - 0.01}%2C${institution.longitude + 0.01}%2C${institution.latitude + 0.01}&layer=mapnik&marker=${institution.latitude}%2C${institution.longitude}`}
                      title="Institution Location"
                    />
                  </div>
                  <p className="text-xs text-default-400 mt-1">
                    {institution.latitude}, {institution.longitude}
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center py-3 px-2 rounded-lg">
                  <span className="text-default-500 font-medium">
                    Coordinates
                  </span>
                  <span className="font-bold text-foreground">-</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-content1 rounded-[32px] p-8 shadow-sm border border-default-200 h-full">
            <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary">
                <FiGlobe size={20} />
              </div>
              Details
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-default-100 last:border-0 hover:bg-default-50/50 px-2 rounded-lg transition-colors">
                <span className="text-default-500 font-medium">
                  {t("users.form.email")}
                </span>
                <span className="font-bold text-foreground">
                  {institution.email || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-default-100 last:border-0 hover:bg-default-50/50 px-2 rounded-lg transition-colors">
                <span className="text-default-500 font-medium">Phone</span>
                <span className="font-bold text-foreground">
                  {institution.phone || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-default-100 last:border-0 hover:bg-default-50/50 px-2 rounded-lg transition-colors">
                <span className="text-default-500 font-medium">Active</span>
                <Chip
                  className="font-semibold"
                  color={institution.is_active ? "success" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {institution.is_active
                    ? t("common.yes")
                    : t("common.no")}
                </Chip>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-default-100 last:border-0 hover:bg-default-50/50 px-2 rounded-lg transition-colors">
                <span className="text-default-500 font-medium">
                  {t("users.table.dateJoined")}
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(institution.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
