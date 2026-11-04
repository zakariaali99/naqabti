import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enPayments from "./locales/en/payments";
import arPayments from "./locales/ar/payments";
import enPayment from "./locales/en/payment";
import arPayment from "./locales/ar/payment";
import enNav from "./locales/en/nav";
import enSettings from "./locales/en/settings";
import enCommon from "./locales/en/common";
import enMenu from "./locales/en/menu";
import enAuth from "./locales/en/auth";
import enProfile from "./locales/en/profile";
import enChangePassword from "./locales/en/changePassword";
import enDashboard from "./locales/en/dashboard";
import arNav from "./locales/ar/nav";
import arSettings from "./locales/ar/settings";
import arCommon from "./locales/ar/common";
import arMenu from "./locales/ar/menu";
import arAuth from "./locales/ar/auth";
import arProfile from "./locales/ar/profile";
import arChangePassword from "./locales/ar/changePassword";
import arDashboard from "./locales/ar/dashboard";
import enUsers from "./locales/en/users";
import enPermissionGroups from "./locales/en/permissionGroups";
import enMembership from "./locales/en/membership";
import enMembershipTypes from "./locales/en/membershipTypes";
import enDoctors from "./locales/en/doctors";
import enCertifications from "./locales/en/certifications";
import enCertificationTypes from "./locales/en/certificationTypes";
import enNotifications from "./locales/en/notifications";
import enMember from "./locales/en/member";
import enCities from "./locales/en/cities";
import enNationalities from "./locales/en/nationalities";
import enAcademicDegrees from "./locales/en/academicDegrees";
import enInstitutions from "./locales/en/institutions";
import enStudents from "./locales/en/students";
import enProfessionalDevelopment from "./locales/en/professionalDevelopment";
import enPosts from "./locales/en/posts";
import enEvents from "./locales/en/events";
import enBranches from "./locales/en/branches";
import enComplaints from "./locales/en/complaints";
import enLibrary from "./locales/en/library";
import enMedicalReports from "./locales/en/medicalReports";
import enDoctorSpecialties from "./locales/en/doctorSpecialties";
import arDoctorSpecialties from "./locales/ar/doctorSpecialties";
import arUsers from "./locales/ar/users";
import arPermissionGroups from "./locales/ar/permissionGroups";
import arMembership from "./locales/ar/membership";
import arMembershipTypes from "./locales/ar/membershipTypes";
import arDoctors from "./locales/ar/doctors";
import arCertifications from "./locales/ar/certifications";
import arCertificationTypes from "./locales/ar/certificationTypes";
import arNotifications from "./locales/ar/notifications";
import arMember from "./locales/ar/member";
import arCities from "./locales/ar/cities";
import arNationalities from "./locales/ar/nationalities";
import arAcademicDegrees from "./locales/ar/academicDegrees";
import arInstitutions from "./locales/ar/institutions";
import arStudents from "./locales/ar/students";
import arProfessionalDevelopment from "./locales/ar/professionalDevelopment";
import arPosts from "./locales/ar/posts";
import arEvents from "./locales/ar/events";
import arBranches from "./locales/ar/branches";
import arComplaints from "./locales/ar/complaints";
import arLibrary from "./locales/ar/library";
import arMedicalReports from "./locales/ar/medicalReports";
import enAds from "./locales/en/ads";
import arAds from "./locales/ar/ads";
import enPublicProfile from "./locales/en/publicProfile";
import arPublicProfile from "./locales/ar/publicProfile";

const resources = {
  en: {
    translation: {
      nav: enNav,
      settings: enSettings,
      common: enCommon,
      menu: enMenu,
      auth: enAuth,
      profile: enProfile,
      changePassword: enChangePassword,
      dashboard: enDashboard,
      users: enUsers,
      permissionGroups: enPermissionGroups,
      payments: enPayments,
      payment: enPayment,
      membership: enMembership,
      membershipTypes: enMembershipTypes,
      doctors: enDoctors,
      certifications: enCertifications,
      certificationTypes: enCertificationTypes,
      notifications: enNotifications,
      cities: enCities,
      nationalities: enNationalities,
      academicDegrees: enAcademicDegrees,
      institutions: enInstitutions,
      students: enStudents,
      member: enMember,
      professionalDevelopment: enProfessionalDevelopment,
      posts: enPosts,
      events: enEvents,
      branches: enBranches,
      complaints: enComplaints,
      library: enLibrary,
      medicalReports: enMedicalReports,
      doctorSpecialties: enDoctorSpecialties,
      ads: enAds,
      publicProfile: enPublicProfile,
    },
  },
  ar: {
    translation: {
      nav: arNav,
      settings: arSettings,
      common: arCommon,
      menu: arMenu,
      auth: arAuth,
      payments: arPayments,
      payment: arPayment,
      profile: arProfile,
      changePassword: arChangePassword,
      dashboard: arDashboard,
      users: arUsers,
      permissionGroups: arPermissionGroups,
      membership: arMembership,
      membershipTypes: arMembershipTypes,
      doctors: arDoctors,
      certifications: arCertifications,
      certificationTypes: arCertificationTypes,
      notifications: arNotifications,
      cities: arCities,
      nationalities: arNationalities,
      academicDegrees: arAcademicDegrees,
      institutions: arInstitutions,
      students: arStudents,
      member: arMember,
      professionalDevelopment: arProfessionalDevelopment,
      posts: arPosts,
      events: arEvents,
      branches: arBranches,
      complaints: arComplaints,
      library: arLibrary,
      medicalReports: arMedicalReports,
      doctorSpecialties: arDoctorSpecialties,
      ads: arAds,
      publicProfile: arPublicProfile,
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
