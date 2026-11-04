import React from "react";
import { Button } from "@heroui/react";
import { FiGlobe } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  LEGAL_LAST_UPDATED,
  LegalDocument,
  accountDeletion,
  privacyPolicy,
} from "./legalContent";

import { useLanguageStore } from "@/stores/languageStore";

const DOCUMENTS = {
  privacy: privacyPolicy,
  accountDeletion,
};

interface LegalPageProps {
  page: keyof typeof DOCUMENTS;
}

/** Public, no-login page for the privacy policy and account deletion steps. */
const LegalPage: React.FC<LegalPageProps> = ({ page }) => {
  const { i18n } = useTranslation();
  const { setLanguage } = useLanguageStore();
  const isArabic = i18n.language.startsWith("ar");
  const doc: LegalDocument = DOCUMENTS[page][isArabic ? "ar" : "en"];

  const toggleLanguage = () => {
    const nextLang = isArabic ? "en" : "ar";

    setLanguage(nextLang);
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen bg-slate-50" dir={isArabic ? "rtl" : "ltr"}>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link className="text-base font-extrabold text-[#0a2540]" to="/">
            نقابتي · Naqabti
          </Link>
          <Button
            className="text-xs font-semibold text-slate-600 bg-slate-100/80"
            size="sm"
            startContent={<FiGlobe className="w-3.5 h-3.5" />}
            variant="flat"
            onPress={toggleLanguage}
          >
            {isArabic ? "English" : "العربية"}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-[#0a2540]">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {isArabic ? "آخر تحديث: " : "Last updated: "}
          {LEGAL_LAST_UPDATED}
        </p>
        <p className="mt-6 text-slate-700 leading-relaxed">{doc.intro}</p>

        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-xl font-semibold text-[#0a2540]">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-slate-700 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc ps-6 space-y-2 text-slate-700 leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <nav className="mt-12 pt-6 border-t border-slate-200 flex gap-6 text-sm">
          <Link className="text-[#0a2540] underline" to="/privacy">
            {privacyPolicy[isArabic ? "ar" : "en"].title}
          </Link>
          <Link className="text-[#0a2540] underline" to="/account-deletion">
            {accountDeletion[isArabic ? "ar" : "en"].title}
          </Link>
        </nav>
      </main>
    </div>
  );
};

export default LegalPage;
