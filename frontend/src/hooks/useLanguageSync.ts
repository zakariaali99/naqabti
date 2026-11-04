import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useLanguageStore } from "@/stores/languageStore";

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguageStore();

  useEffect(() => {
    // Sync i18n language with store on mount
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [i18n, currentLanguage]);

  useEffect(() => {
    // Listen to i18n language changes and update store
    const handleLanguageChange = (lng: string) => {
      if (lng !== currentLanguage && (lng === "en" || lng === "ar")) {
        setLanguage(lng as "en" | "ar");
      }
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n, currentLanguage, setLanguage]);
};
