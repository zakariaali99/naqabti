import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, Suspense } from "react";
import { Spinner } from "@heroui/react";
import { Link } from "@heroui/link";
import { useTranslation } from "react-i18next";

import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { Navbar } from "@/components/navbar";

const MemberProtectedView = () => {
  const { user, isLoading, initialize } = useUserStore();
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();

  useEffect(() => {
    if (!user && !isLoading) {
      initialize();
    }
  }, [user, isLoading, initialize]);

  useLanguageSync();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/auth/login" />;
  }

  return (
    <div
      className={`relative flex flex-col min-h-screen ${isRTL ? "rtl" : "ltr"}`}
    >
      <Navbar />

      <div className="flex flex-1 pt-16 sm:pt-24">
        <main className="flex-grow overflow-auto w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[60vh] w-full">
                <Spinner label="Loading..." size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

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
};

export default MemberProtectedView;
