import { Link } from "@heroui/link";
import { useTranslation } from "react-i18next";

import { useLanguageStore } from "@/stores/languageStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { Navbar } from "@/components/navbar";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();

  // Sync language between store and i18n
  useLanguageSync();

  return (
    <div
      className={`relative flex flex-col min-h-screen ${isRTL ? "rtl" : "ltr"}`}
    >
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-grow p-6 overflow-auto w-full">{children}</main>
      </div>
      <footer className="w-full flex items-center justify-center py-3 border-t border-divider bg-background/95 backdrop-blur-sm">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="http://alaryam.ly/"
          title="alaryam.ly homepage"
        >
          <span className="text-default-600">{t("common.developedBy")}</span>
          <p className="text-primary font-semibold">{t("common.muwaija")}</p>
        </Link>
      </footer>
    </div>
  );
}
