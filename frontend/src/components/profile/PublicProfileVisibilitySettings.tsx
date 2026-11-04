import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Switch,
  Button,
  Tooltip,
} from "@heroui/react";
import {
  FiShare2,
  FiCheck,
  FiExternalLink,
  FiGlobe,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

export interface PublicFieldConfig {
  key: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: "basic" | "contact" | "education" | "affiliations";
}

export const AVAILABLE_PUBLIC_FIELDS: PublicFieldConfig[] = [
  {
    key: "full_name",
    labelAr: "الاسم الكامل",
    labelEn: "Full Name",
    descriptionAr: "عرض اسمك الكامل في الملف العام",
    descriptionEn: "Show your full name on the public profile",
    category: "basic",
  },
  {
    key: "profile_image",
    labelAr: "الصورة الشخصية",
    labelEn: "Profile Photo",
    descriptionAr: "عرض صورتك الشخصية للعامة",
    descriptionEn: "Display your avatar to visitors",
    category: "basic",
  },
  {
    key: "specialty",
    labelAr: "التخصص الطبي",
    labelEn: "Medical Specialty",
    descriptionAr: "عرض التخصص الطبي الدقيق",
    descriptionEn: "Display your primary medical specialty",
    category: "basic",
  },
  {
    key: "bio",
    labelAr: "النبذة التعريفية",
    labelEn: "Biography / Summary",
    descriptionAr: "عرض نبذتك وخبراتك المهنية",
    descriptionEn: "Show your professional bio to patients/visitors",
    category: "basic",
  },
  {
    key: "phone_number",
    labelAr: "رقم الهاتف",
    labelEn: "Phone Number",
    descriptionAr: "السماح للزوار بالتواصل معك عبر الهاتف",
    descriptionEn: "Allow visitors to view your contact number",
    category: "contact",
  },
  {
    key: "email",
    labelAr: "البريد الإلكتروني",
    labelEn: "Email Address",
    descriptionAr: "عرض البريد الإلكتروني للتواصل",
    descriptionEn: "Show your contact email on the profile",
    category: "contact",
  },
  {
    key: "city",
    labelAr: "المدينة والمنطقة",
    labelEn: "City & Region",
    descriptionAr: "عرض مدينة وموقع مزاولة المهنة",
    descriptionEn: "Display your city/region on the profile",
    category: "contact",
  },
  {
    key: "current_degree",
    labelAr: "الدرجة العلمية",
    labelEn: "Academic Degree",
    descriptionAr: "عرض درجتك العلمية (استشاري، أخصائي، إلخ)",
    descriptionEn: "Show your verified academic degree",
    category: "education",
  },
  {
    key: "university_name",
    labelAr: "الجامعة وسنة التخرج",
    labelEn: "University",
    descriptionAr: "عرض جهة التخرج الأكاديمية",
    descriptionEn: "Show your graduating university",
    category: "education",
  },
  {
    key: "branches",
    labelAr: "النقابة الفرعية",
    labelEn: "Syndicate Branch",
    descriptionAr: "عرض النقابة الفرعية ورقم القيد",
    descriptionEn: "Display your affiliated syndicate branch",
    category: "affiliations",
  },
  {
    key: "institutions",
    labelAr: "المؤسسات والعيادات",
    labelEn: "Medical Institutions",
    descriptionAr: "عرض المستشفيات والعيادات التي تعمل بها",
    descriptionEn: "Display hospitals and clinics you practice in",
    category: "affiliations",
  },
  {
    key: "certifications",
    labelAr: "الشهادات والتراخيص",
    labelEn: "Certificates & Licenses",
    descriptionAr: "عرض تراخيص مزاولة المهنة والشهادات المعتمدة",
    descriptionEn: "Display verified licenses and accredited certificates",
    category: "affiliations",
  },
];

interface PublicProfileVisibilitySettingsProps {
  value: string;
  onChange: (newValue: string) => void;
  username: string;
  disabled?: boolean;
}

export const PublicProfileVisibilitySettings: React.FC<
  PublicProfileVisibilitySettingsProps
> = ({ value, onChange, username, disabled = false }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");
  const [copied, setCopied] = useState(false);

  const selectedKeys = new Set(
    (value || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  );

  const toggleField = (key: string, isChecked: boolean) => {
    const updated = new Set(selectedKeys);
    if (isChecked) {
      updated.add(key);
    } else {
      updated.delete(key);
    }
    onChange(Array.from(updated).join(","));
  };

  const publicUrl = `${window.location.origin}/doctors/${username}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-50/70 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <FiGlobe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {t("publicProfile.settingsTitle", "إعدادات الملف العام للطبيب")}
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-normal">
                {t("publicProfile.publicAccess", "متاح للعامة")}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                "publicProfile.settingsDesc",
                "حدد الحقول والمعلومات التي ترغب في ظهورها للزوار عند فتح رابط ملفك الشخصي"
              )}
            </p>
          </div>
        </div>

        {username && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tooltip content={copied ? t("publicProfile.copied", "تم النسخ!") : t("publicProfile.copyLink", "نسخ الرابط")}>
              <Button
                className="flex-1 sm:flex-initial text-xs font-medium"
                color={copied ? "success" : "primary"}
                size="sm"
                startContent={copied ? <FiCheck /> : <FiShare2 />}
                variant="flat"
                onPress={handleCopyLink}
              >
                {copied ? t("publicProfile.copied", "تم النسخ") : t("publicProfile.copyLink", "نسخ الرابط")}
              </Button>
            </Tooltip>

            <Button
              as="a"
              className="text-xs font-medium"
              endContent={<FiExternalLink />}
              href={`/doctors/${username}`}
              size="sm"
              target="_blank"
              variant="bordered"
            >
              {t("publicProfile.preview", "معاينة")}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        {/* Link Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <FiShield className="text-blue-600 shrink-0" />
            <span>{t("publicProfile.yourUrl", "رابط ملفك الشخصي المعتمد:")}</span>
            <code className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
              {publicUrl}
            </code>
          </div>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_PUBLIC_FIELDS.map((field) => {
            const isChecked = selectedKeys.has(field.key);
            return (
              <div
                key={field.key}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isChecked
                    ? "bg-blue-50/40 border-blue-200"
                    : "bg-white border-slate-200 opacity-75"
                }`}
              >
                <div className="space-y-0.5 flex-1 pr-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {isArabic ? field.labelAr : field.labelEn}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isArabic ? field.descriptionAr : field.descriptionEn}
                  </p>
                </div>
                <Switch
                  aria-label={isArabic ? field.labelAr : field.labelEn}
                  color="primary"
                  isDisabled={disabled}
                  isSelected={isChecked}
                  size="sm"
                  onValueChange={(checked) => toggleField(field.key, checked)}
                />
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default PublicProfileVisibilitySettings;
