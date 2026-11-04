import React, { useState } from "react";
import { Card, CardHeader, CardBody, Divider, Tooltip, Button } from "@heroui/react";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiCopy,
  FiCheck,
  FiExternalLink,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PublicDoctorProfile } from "@/api/publicDoctorApi";

interface DoctorContactCardProps {
  doctor: PublicDoctorProfile;
}

export const DoctorContactCard: React.FC<DoctorContactCardProps> = ({ doctor }) => {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const hasPhone = Boolean(doctor.phone_number);
  const hasEmail = Boolean(doctor.email);
  const hasCity = Boolean(doctor.city_name || doctor.area);

  if (!hasPhone && !hasEmail && !hasCity) {
    return null;
  }

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardHeader className="flex gap-3 px-6 pt-5 pb-3">
        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
          <FiPhone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a2540]">
            {t("publicProfile.contactInfo", "معلومات التواصل")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("publicProfile.contactSubtitle", "قنوات التواصل المباشرة المعتمدة")}
          </p>
        </div>
      </CardHeader>
      <Divider className="opacity-60" />
      <CardBody className="px-6 py-5 space-y-3.5">
        {hasPhone && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 hover:border-emerald-200 transition-colors group">
            <a
              className="flex items-center gap-3 min-w-0 flex-1"
              href={`tel:${doctor.phone_number}`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-800 group-hover:scale-105 transition-transform shrink-0">
                <FiPhone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{t("common.phone", "رقم الهاتف")}</p>
                <p className="text-sm font-bold text-slate-900 dir-ltr text-right truncate">
                  {doctor.phone_number}
                </p>
              </div>
            </a>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip content={copiedKey === "phone" ? t("publicProfile.copied", "تم النسخ!") : t("publicProfile.copyLink", "نسخ")}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => handleCopy(doctor.phone_number!, "phone")}
                >
                  {copiedKey === "phone" ? (
                    <FiCheck className="text-emerald-600 w-3.5 h-3.5" />
                  ) : (
                    <FiCopy className="text-slate-400 w-3.5 h-3.5" />
                  )}
                </Button>
              </Tooltip>
              <Button
                as="a"
                className="text-xs font-medium text-emerald-700"
                href={`tel:${doctor.phone_number}`}
                size="sm"
                variant="flat"
              >
                {t("publicProfile.call", "اتصال")}
              </Button>
            </div>
          </div>
        )}

        {hasEmail && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 hover:border-blue-200 transition-colors group">
            <a
              className="flex items-center gap-3 min-w-0 flex-1"
              href={`mailto:${doctor.email}`}
            >
              <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-800 group-hover:scale-105 transition-transform shrink-0">
                <FiMail className="w-4 h-4" />
              </div>
              <div className="min-w-0 pr-2">
                <p className="text-xs text-slate-500">{t("common.email", "البريد الإلكتروني")}</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {doctor.email}
                </p>
              </div>
            </a>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip content={copiedKey === "email" ? t("publicProfile.copied", "تم النسخ!") : t("publicProfile.copyLink", "نسخ")}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => handleCopy(doctor.email!, "email")}
                >
                  {copiedKey === "email" ? (
                    <FiCheck className="text-blue-600 w-3.5 h-3.5" />
                  ) : (
                    <FiCopy className="text-slate-400 w-3.5 h-3.5" />
                  )}
                </Button>
              </Tooltip>
              <Button
                as="a"
                className="text-xs font-medium text-blue-700"
                href={`mailto:${doctor.email}`}
                size="sm"
                variant="flat"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {hasCity && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70">
            <div className="p-2.5 rounded-xl bg-rose-100/70 text-rose-800 shrink-0">
              <FiMapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("auth.city", "المدينة وموقع الممارسة")}</p>
              <p className="text-sm font-bold text-slate-900">
                {[doctor.city_name, doctor.area].filter(Boolean).join(" — ")}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default DoctorContactCard;
