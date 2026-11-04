import { PERMISSIONS } from "@/types/permissions";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  // navItems uses translation keys; use `getNavItems(t)` to translate at runtime
  navSections: [
    {
      sectionKey: "nav.dashboard",
      items: [
        { labelKey: "nav.home", href: "/", icon: "FiHome" },
        {
          labelKey: "nav.doctorMap",
          href: "/doctor-map",
          icon: "LibyaMapIcon",
          permission: PERMISSIONS.USER.VIEW,
        },
      ],
    },
    {
      sectionKey: "nav.members",
      items: [
        {
          labelKey: "nav.membership",
          href: "/memberships",
          icon: "FiUsers",
          permission: PERMISSIONS.MEMBERSHIP.VIEW,
        },
        {
          labelKey: "nav.doctors",
          href: "/doctors",
          icon: "FaUserMd",
          permission: PERMISSIONS.MEMBERSHIP.VIEW,
        },
        {
          labelKey: "nav.students",
          href: "/students",
          icon: "FaUserGraduate",
          permission: PERMISSIONS.MEMBERSHIP.VIEW,
        },
        {
          labelKey: "nav.institutions",
          href: "/institutions",
          icon: "FaUniversity",
          permission: PERMISSIONS.MEMBERSHIP.VIEW,
        },
      ],
    },
    {
      sectionKey: "nav.services",
      items: [
        {
          labelKey: "nav.certifications",
          href: "/certifications",
          icon: "FiAward",
          permission: PERMISSIONS.CERTIFICATION.VIEW,
        },
        {
          labelKey: "nav.payments",
          href: "/payments",
          icon: "GiTakeMyMoney",
          permission: PERMISSIONS.PAYMENT.VIEW,
        },
        {
          labelKey: "nav.professionalDevelopment",
          href: "/professional-development",
          icon: "FiBriefcase",
          permission: PERMISSIONS.PROFESSIONAL_DEVELOPMENT.VIEW,
          submenu: [
            {
              labelKey: "nav.professionalDevelopmentList",
              href: "/professional-development",
              icon: "FiList",
              permission: PERMISSIONS.PROFESSIONAL_DEVELOPMENT.VIEW,
            },
            {
              labelKey: "nav.professionalDevelopmentTypes",
              href: "/professional-development/types",
              icon: "FiTag",
              permission: PERMISSIONS.PROFESSIONAL_DEVELOPMENT.VIEW,
            },
            {
              labelKey: "nav.professionalDevelopmentCategories",
              href: "/professional-development/categories",
              icon: "FiFolder",
              permission: PERMISSIONS.PROFESSIONAL_DEVELOPMENT.VIEW,
            },
          ],
        },
        {
          labelKey: "nav.library",
          href: "/library",
          icon: "FiBook",
        },
        {
          labelKey: "nav.medicalReports",
          href: "/medical-reports",
          icon: "FiActivity",
        },
        {
          labelKey: "nav.insurance",
          href: "/insurance",
          icon: "FiShield",
        },
        {
          labelKey: "nav.ads",
          href: "/ads",
          icon: "FiMonitor",
          permission: PERMISSIONS.AD.VIEW,
        },
      ],
    },
    {
      sectionKey: "nav.communication",
      items: [
        {
          labelKey: "nav.notifications",
          href: "/notifications",
          icon: "FiBell",
          permission: PERMISSIONS.NOTIFICATION.VIEW,
        },
        {
          labelKey: "nav.posts",
          href: "/posts",
          icon: "MdArticle",
          permission: PERMISSIONS.POST.VIEW,
        },
        {
          labelKey: "nav.events",
          href: "/events",
          icon: "FiActivity",
          permission: PERMISSIONS.POST.VIEW,
        },
        {
          labelKey: "nav.complaints",
          href: "/complaints",
          icon: "FiMessageSquare",
        },
      ],
    },
    {
      sectionKey: "nav.settings",
      items: [
        {
          labelKey: "nav.system",
          href: "/settings",
          icon: "FiSettings",
          submenu: [
            {
              labelKey: "nav.membershipTypes",
              href: "/membership-types",
              icon: "FiLayers",
              permission: PERMISSIONS.MEMBERSHIP_TYPE.VIEW,
            },
            {
              labelKey: "nav.certificationTypes",
              href: "/certification-types",
              icon: "FiTag",
              permission: PERMISSIONS.CERTIFICATION_TYPE.VIEW,
            },
            {
              labelKey: "nav.users",
              href: "/users",
              icon: "FiUser",
              permission: PERMISSIONS.USER.VIEW,
            },
            {
              labelKey: "nav.userGroups",
              href: "/user-groups",
              icon: "MdGroups",
              permission: PERMISSIONS.USER_GROUP.VIEW,
            },
            {
              labelKey: "nav.branches",
              href: "/branches",
              icon: "FiGitBranch",
              permission: PERMISSIONS.BRANCH.VIEW,
            },
            {
              labelKey: "nav.cities",
              href: "/cities",
              icon: "FiMapPin",
              permission: PERMISSIONS.CITY.VIEW,
            },
            {
              labelKey: "nav.nationalities",
              href: "/nationalities",
              icon: "FiFlag",
              permission: PERMISSIONS.NATIONALITY.VIEW,
            },
            {
              labelKey: "nav.academicDegrees",
              href: "/academic-degrees",
              icon: "FiBookOpen",
              permission: PERMISSIONS.ACADEMIC_DEGREE.VIEW,
            },
            {
              labelKey: "nav.doctorSpecialties",
              href: "/doctor-specialties",
              icon: "FiStar",
              permission: PERMISSIONS.ACADEMIC_DEGREE.VIEW,
            },
          ],
        },
      ],
    },
  ],
};

export function getNavItems(t: (key: string) => string) {
  return siteConfig.navSections.map((section) => ({
    section: t(section.sectionKey),
    items: section.items.map((i) => ({
      label: t(i.labelKey as string),
      href: i.href,
      icon: i.icon,
      permission: (i as any).permission,
      submenu: (i as any).submenu?.map((sub: any) => ({
        label: t(sub.labelKey as string),
        href: sub.href,
        icon: sub.icon,
        permission: sub.permission,
      })),
    })),
  }));
}
