import { Link } from "@heroui/link";
import { useTranslation } from "react-i18next";

import { useLanguageStore } from "@/stores/languageStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { Navbar } from "@/components/navbar";

export default function AuthLayout({
  children,
  maxWidth = "max-w-2xl",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();

  // Sync language between store and i18n
  useLanguageSync();

  return (
    <div className={`relative min-h-screen flex flex-col ${isRTL ? "rtl" : "ltr"}`}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className={`w-full ${maxWidth}`}>{children}</div>
      </main>
      <footer className="w-full flex items-center justify-center py-3 border-t border-divider bg-background/95 backdrop-blur-sm">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="http://alaryam.ly/"
          title="alaryam.ly"
        >
          <span className="text-default-600">{t("common.developedBy")}</span>
          <p className="text-primary font-semibold">{t("common.muwaija")}</p>
        </Link>
      </footer>
    </div>
  );
}
