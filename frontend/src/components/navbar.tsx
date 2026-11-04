import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { useTranslation } from "react-i18next";
import { FiMenu } from "react-icons/fi";

import { UserDropdown } from "@/components/UserDropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useUserStore } from "@/stores/userStore";

interface NavbarProps {
  onMenuToggle?: () => void;
}

export const Navbar = ({ onMenuToggle }: NavbarProps = {}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useUserStore();

  return (
    <header className="h-16 sm:h-24 flex items-center justify-between px-4 sm:px-6 lg:px-12 z-30 shrink-0 bg-[#1A2038] backdrop-blur-sm sticky top-0 border-b border-white/10 shadow-lg">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            className="lg:hidden p-2 bg-white/10 rounded-xl shadow-sm text-white hover:bg-white/20 transition-colors"
            onClick={onMenuToggle}
          >
            <FiMenu size={20} />
          </button>
        )}
        <Link
          className="flex justify-start items-center gap-2"
          color="foreground"
          href="/"
        >
          <div className="text-white hover:scale-105 transition-transform">
            <Logo size={42} />
          </div>
          <span className="font-extrabold text-2xl text-white tracking-tight hidden sm:block">
            {t("common.site.name")}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeSwitch />
          </div>

          {isAuthenticated ? (
            <div className="ml-2">
              <UserDropdown />
            </div>
          ) : (
            <Button
              as={Link}
              className="bg-[#2B95E8] text-white font-medium rounded-full px-6"
              href="/auth/login"
              variant="solid"
            >
              {t("auth.login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
