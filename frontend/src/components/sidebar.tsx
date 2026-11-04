// Imports
import { Tooltip } from "@heroui/tooltip";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiTag,
  FiUser,
  FiAward,
  FiBell,
  FiMapPin,
  FiFlag,
  FiBookOpen,
  FiList,
  FiFolder,
  FiSettings,
  FiGitBranch,
  FiBook,
  FiActivity,
  FiChevronsLeft,
  FiChevronsRight,
  FiBriefcase,
  FiLayers,
  FiMessageSquare,
  FiGrid,
  FiShield,
  FiMonitor,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";
import { FaUserMd, FaUserGraduate, FaUniversity } from "react-icons/fa";
import { MdArticle, MdGroups } from "react-icons/md";

import { useLanguageStore } from "@/stores/languageStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { getNavItems } from "@/config/site";
import { ChevronDownIcon, ChevronRightIcon, LibyaMapIcon } from "@/components/icons";
import { useUserStore } from "@/stores/userStore";

// Icon mapping
const iconMap = {
  FiHome,
  FiUsers,
  FiPackage,
  FiTag,
  FiUser,
  FiAward,
  FiBell,
  GiTakeMyMoney,
  FiMapPin,
  FiFlag,
  FiSettings,
  FiGitBranch,
  FiBookOpen,
  FiList,
  FiFolder,
  FiBook,
  FiActivity,
  FiBriefcase,
  FiLayers,
  FiMessageSquare,
  FiGrid,
  FiShield,
  FiMonitor,
  FaUserMd,
  FaUserGraduate,
  FaUniversity,
  MdArticle,
  MdGroups,
  LibyaMapIcon,
};

// Permission helpers (unchanged)
const useUserPermissions = () => {
  const user = useUserStore((state) => state.user);

  return {
    permissions: user?.group_permissions || [],
    isStaff: user?.is_staff || false,
    userType: user?.user_type,
  };
};

const hasPermission = (
  userPermissions: string[],
  isAdmin: boolean,
  permission?: string | null,
) => {
  if (isAdmin) return true;
  if (!permission) return true;

  return userPermissions.includes(permission);
};

const filterNavItems = (
  sections: any[],
  userPermissions: string[],
  isAdmin: boolean,
) => {
  return sections
    .map((section) => {
      const filteredItems = section.items
        .map((item: any) => {
          if (item.submenu && Array.isArray(item.submenu)) {
            const filteredSubmenu = item.submenu.filter((subItem: any) =>
              hasPermission(userPermissions, isAdmin, subItem.permission),
            );

            if (filteredSubmenu.length === 0) {
              if (
                item.permission &&
                hasPermission(userPermissions, isAdmin, item.permission)
              ) {
                return { ...item, submenu: [] };
              }

              return null;
            }

            return { ...item, submenu: filteredSubmenu };
          }
          if (!hasPermission(userPermissions, isAdmin, item.permission))
            return null;

          return item;
        })
        .filter(Boolean);

      if (filteredItems.length === 0) return null;

      return { ...section, items: filteredItems };
    })
    .filter(Boolean);
};

// Sidebar component
export const Sidebar = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const location = useLocation();

  // Use Zustand store for sidebar state
  const { isExpanded, toggle, expandedMenus, toggleMenu } = useSidebarStore();
  const sidebarExpanded = isExpanded;

  const handleToggle = () => {
    toggle();
  };

  const { permissions: userPermissions, isStaff, userType } = useUserPermissions();
  const isAdmin = isStaff || userType === 'institution';

  const toggleSubmenu = (key: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when just toggling
    toggleMenu(key);
  };

  const navSections = getNavItems(t); // Translation function 't' passed here handles translation
  const filteredNavSections = filterNavItems(
    navSections,
    userPermissions,
    isAdmin,
  );
  const navigate = useNavigate();

  return (
    <div
      className={`h-full bg-[#1A2038] text-white flex flex-col items-center py-4 shadow-2xl transition-all duration-300 ease-in-out ${sidebarExpanded ? "w-64" : "w-20"} overflow-hidden`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Toggle Button */}
      <div className="w-full px-3 mb-4">
        <button
          className="w-full flex items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200"
          onClick={handleToggle}
        >
          {sidebarExpanded ? (
            isRTL ? (
              <FiChevronsRight size={24} />
            ) : (
              <FiChevronsLeft size={24} />
            )
          ) : isRTL ? (
            <FiChevronsLeft size={24} />
          ) : (
            <FiChevronsRight size={24} />
          )}
        </button>
      </div>

      {/* Sidebar Content */}
      <nav className="flex-1 w-full px-3 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {filteredNavSections.map((section: any, idx: number) => (
          <div key={idx} className="space-y-2">
            {/* Section Header - Only visible when expanded */}
            {sidebarExpanded && section.section && (
              <div
                className={`px-4 text-xs font-bold text-gray-500 uppercase tracking-widest ${isRTL ? "text-right" : "text-left"}`}
              >
                {section.section}
              </div>
            )}

            {section.items.map((item: any) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              const IconComponent = item.icon
                ? iconMap[item.icon as keyof typeof iconMap]
                : null;
              const isExpanded = expandedMenus[item.href];

              return (
                <div key={item.href} className="flex flex-col">
                  <Tooltip
                    color="primary"
                    content={item.label}
                    isDisabled={sidebarExpanded}
                    placement={isRTL ? "left" : "right"}
                  >
                    <div
                      className={`
                        w-full flex items-center p-3 rounded-2xl transition-all duration-200 cursor-pointer relative overflow-hidden
                        ${isActive
                          ? "bg-white/10 text-[#2B95E8]"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }
                      `}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        if (hasSubmenu) {
                          toggleSubmenu(item.href, e);
                        } else {
                          navigate(item.href);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (hasSubmenu) {
                            toggleSubmenu(item.href, e as any);
                          } else {
                            navigate(item.href);
                          }
                        }
                      }}
                    >
                      {IconComponent && (
                        <IconComponent className="min-w-[24px]" size={24} />
                      )}

                      <span
                        className={`${isRTL ? "mr-4" : "ml-4"} font-medium whitespace-nowrap transition-opacity duration-300 ${sidebarExpanded ? "opacity-100" : "opacity-0"}`}
                      >
                        {item.label}
                      </span>

                      {hasSubmenu && sidebarExpanded && (
                        <div
                          className={`${isRTL ? "mr-auto" : "ml-auto"} transition-opacity duration-300`}
                        >
                          {isExpanded ? (
                            <ChevronDownIcon size={16} />
                          ) : (
                            <ChevronRightIcon isRTL={isRTL} size={16} />
                          )}
                        </div>
                      )}
                    </div>
                  </Tooltip>

                  {/* Submenu Items - Only visible when sidebar is expanded AND menu is expanded */}
                  {hasSubmenu && isExpanded && sidebarExpanded && (
                    <div
                      className={`${isRTL ? "pr-10 pl-2" : "pl-10 pr-2"} space-y-1 mt-1 transition-all`}
                    >
                      {item.submenu.map((subItem: any) => {
                        const SubIcon = subItem.icon
                          ? iconMap[subItem.icon as keyof typeof iconMap]
                          : null;
                        const childActive = location.pathname === subItem.href;

                        return (
                          <div
                            key={subItem.href}
                            className={`
                              w-full flex items-center p-2 rounded-xl text-sm transition-all duration-200 cursor-pointer
                              ${childActive ? "text-[#2B95E8] bg-white/5" : "text-gray-500 hover:text-white hover:bg-white/5"}
                            `}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(subItem.href);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(subItem.href);
                              }
                            }}
                          >
                            {SubIcon && (
                              <SubIcon
                                className={isRTL ? "ml-2" : "mr-2"}
                                size={16}
                              />
                            )}
                            <span className="whitespace-nowrap">
                              {subItem.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Divider between sections (optional, checking if not last item) */}
            {idx < filteredNavSections.length - 1 && (
              <div className="border-t border-white/5 mx-2 my-2" />
            )}
          </div>
        ))}
      </nav>

      {/* User Avatar Placeholder at Bottom */}
      {sidebarExpanded && (
        <div className="mt-auto mb-4 p-2 transition-opacity duration-300">
          <div className="text-xs text-gray-500 font-medium text-center">
            {t("common.site.name")} v1.0
          </div>
        </div>
      )}
    </div>
  );
};
