import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Spinner, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { FiShield, FiGlobe, FiCheckCircle } from "react-icons/fi";
import {
  publicDoctorApi,
  PublicDoctorProfile,
} from "@/api/publicDoctorApi";
import { useLanguageStore } from "@/stores/languageStore";
import DoctorHeaderCard from "./DoctorHeaderCard";
import DoctorAboutCard from "./DoctorAboutCard";
import DoctorContactCard from "./DoctorContactCard";
import DoctorAffiliationsCard from "./DoctorAffiliationsCard";
import DoctorCertificationsCard from "./DoctorCertificationsCard";
import DoctorNotFound from "./DoctorNotFound";

export const PublicDoctorProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { t, i18n } = useTranslation();
  const { isRTL, setLanguage } = useLanguageStore();

  const [doctor, setDoctor] = useState<PublicDoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    const fetchDoctor = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await publicDoctorApi.getProfile(username);
        setDoctor(data);
      } catch (err: any) {
        console.error("Failed to load doctor public profile:", err);
        setError(
          err.response?.data?.detail ||
            t("publicProfile.notFoundDesc", "الملف المهني غير متاح أو قيد المراجعة")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [username, t]);

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith("ar") ? "en" : "ar";
    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white border border-slate-200 shadow-lg">
          <Spinner color="primary" size="lg" />
          <p className="text-sm font-semibold text-slate-700">
            {t("common.loading", "جاري تحميل الملف المهني المعتمد...")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" dir={isRTL ? "rtl" : "ltr"}>
        <header className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-[#0a2540]">نقابتي</span>
            <span className="text-xs text-slate-400 font-mono">Naqabti</span>
          </Link>
        </header>
        <DoctorNotFound message={error || undefined} username={username} />
        <footer className="py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} نقابتي — جميع الحقوق محفوظة
        </footer>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between font-sans selection:bg-teal-100 selection:text-teal-900"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top Glassmorphic Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0a2540] to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-sm">
              ن
            </div>
            <div>
              <span className="text-base font-extrabold text-[#0a2540] tracking-tight">نقابتي</span>
              <span className="text-[11px] text-slate-400 font-medium block -mt-1 font-mono">
                Official Medical Registry
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70">
              <FiCheckCircle className="text-emerald-600 w-3.5 h-3.5" />
              <span>{t("publicProfile.officialVerification", "ملف مهني موثق ومعتمد")}</span>
            </div>

            <Button
              className="text-xs font-semibold text-slate-600 bg-slate-100/80 hover:bg-slate-200/80"
              size="sm"
              startContent={<FiGlobe className="w-3.5 h-3.5" />}
              variant="flat"
              onPress={toggleLanguage}
            >
              {i18n.language.startsWith("ar") ? "English" : "العربية"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6 flex-1">
        {/* Header Hero Card */}
        <DoctorHeaderCard doctor={doctor} />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-6">
            <DoctorAboutCard doctor={doctor} />
            <DoctorAffiliationsCard doctor={doctor} />
            <DoctorCertificationsCard doctor={doctor} />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 lg:sticky lg:top-20">
            <DoctorContactCard doctor={doctor} />

            {/* Syndicate Trust Badge Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0a2540] text-white shadow-md space-y-3">
              <div className="flex items-center gap-2 text-teal-400">
                <FiShield className="w-5 h-5" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  {t("publicProfile.trustTitle", "الضمان والاعتماد الرسمي")}
                </p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  "publicProfile.trustDesc",
                  "هذا الملف صادر وموثق إلكترونياً من قبل النقابة العامة للأطباء والجهات الصحية المختصة في دولة ليبيا."
                )}
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-700/80">
                <span>Naqabti Verified</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Official Syndicate Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-sm">
            <div className="w-5 h-5 rounded-md bg-[#0a2540] text-white flex items-center justify-center text-xs">
              ن
            </div>
            <span>منظومة نقابتي — المنصة الوطنية الموحدة للرعاية الصحية والنقابات المهنية</span>
          </div>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            جميع البيانات والمعلومات المعروضة تم التحقق منها واعتمادها رسمياً. تُحدّث السجلات بشكل دوري عبر الربط المباشر مع النقابات الفرعية.
          </p>
          <p className="text-slate-400 text-[11px] pt-1">
            © {new Date().getFullYear()} نقابتي — جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicDoctorProfilePage;
