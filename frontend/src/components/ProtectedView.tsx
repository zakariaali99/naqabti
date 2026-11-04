import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { Spinner } from "@heroui/react";
import { Link } from "@heroui/link";
import { useTranslation } from "react-i18next";

import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

const ProtectedView = () => {
  const { user, isLoading, initialize } = useUserStore();
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Use Zustand store for sidebar expanded state
  const { isExpanded: isSidebarExpanded } = useSidebarStore();

  useEffect(() => {
    if (!user && !isLoading) {
      initialize();
    }
  }, [user, isLoading, initialize]);

  // Sync language between store and i18n
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
      <Navbar
        onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden top-16 sm:top-24"
          role="button"
          tabIndex={0}
          onClick={() => setIsMobileSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsMobileSidebarOpen(false);
            }
          }}
        />
      )}

      <div className="flex flex-1 p-0">
        {/* Desktop sidebar */}
        <div
          className={`hidden md:block fixed top-16 sm:top-24 ${isRTL ? "right-0" : "left-0"} h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] z-40 transition-all duration-300`}
        >
          <Sidebar />
        </div>

        {/* Mobile sidebar */}
        <div
          className={`md:hidden fixed top-16 sm:top-24 ${isRTL ? "right-0" : "left-0"} h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] z-50 transform transition-transform duration-300 ${isMobileSidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full invisible" : "-translate-x-full invisible"}`}
        >
          <Sidebar />
        </div>

        <main
          className={`flex-grow overflow-auto w-full transition-all duration-300 p-6 ${isRTL ? (isSidebarExpanded ? "md:pr-64" : "md:pr-20") : isSidebarExpanded ? "md:pl-64" : "md:pl-20"}`}
        >
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

export default ProtectedView;

