import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "ar";

interface LanguageState {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      currentLanguage: "en",
      isRTL: false,
      setLanguage: (language: Language) => {
        const isRTL = language === "ar";

        set({
          currentLanguage: language,
          isRTL,
        });

        // Update document direction and language
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
        document.documentElement.lang = language;
      },
    }),
    {
      name: "language-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Set document direction and language on rehydration
          document.documentElement.dir = state.isRTL ? "rtl" : "ltr";
          document.documentElement.lang = state.currentLanguage;
        }
      },
    },
  ),
);
