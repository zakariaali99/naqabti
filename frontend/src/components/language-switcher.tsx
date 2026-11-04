import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@heroui/shared-icons";

import { useLanguageStore, Language } from "@/stores/languageStore";

const languages = [
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const { i18n } = useTranslation();

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    i18n.changeLanguage(language);
  };

  const currentLang = languages.find((lang) => lang.key === currentLanguage);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className="h-10 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full px-4 min-w-[80px]"
          endContent={<ChevronDownIcon className="w-3 h-3 text-white/70" />}
          size="sm"
          variant="light"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLang?.flag}</span>
            <span className="hidden sm:inline font-medium text-sm">
              {currentLang?.label}
            </span>
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        className="min-w-[140px]"
        selectedKeys={[currentLanguage]}
        selectionMode="single"
        onAction={(key) => handleLanguageChange(key as Language)}
      >
        {languages.map((lang) => (
          <DropdownItem
            key={lang.key}
            className="data-[selected=true]:bg-primary-100 data-[selected=true]:text-primary"
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
