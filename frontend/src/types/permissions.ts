/**
 * Central registry of all application permissions
 * Format: app_label.action_model
 */

export const PERMISSIONS = {
  // User permissions
  USER: {
    VIEW: "niqabaty.view_user",
    ADD: "niqabaty.add_user",
    CHANGE: "niqabaty.change_user",
    DELETE: "niqabaty.delete_user",
  },

  // Branch permissions
  BRANCH: {
    VIEW: "niqabaty.view_branch",
    ADD: "niqabaty.add_branch",
    CHANGE: "niqabaty.change_branch",
    DELETE: "niqabaty.delete_branch",
  },

  // Membership permissions
  MEMBERSHIP: {
    VIEW: "niqabaty.view_doctorsmembership",
    ADD: "niqabaty.add_doctorsmembership",
    CHANGE: "niqabaty.change_doctorsmembership",
    DELETE: "niqabaty.delete_doctorsmembership",
  },

  // Membership Type permissions
  MEMBERSHIP_TYPE: {
    VIEW: "niqabaty.view_membershiptype",
    ADD: "niqabaty.add_membershiptype",
    CHANGE: "niqabaty.change_membershiptype",
    DELETE: "niqabaty.delete_membershiptype",
  },

  // Payment permissions
  PAYMENT: {
    VIEW: "niqabaty.view_payment",
    ADD: "niqabaty.add_payment",
    CHANGE: "niqabaty.change_payment",
    DELETE: "niqabaty.delete_payment",
  },

  // Certification permissions
  CERTIFICATION: {
    VIEW: "niqabaty.view_certification",
    ADD: "niqabaty.add_certification",
    CHANGE: "niqabaty.change_certification",
    DELETE: "niqabaty.delete_certification",
  },

  // Certification Type permissions
  CERTIFICATION_TYPE: {
    VIEW: "niqabaty.view_certificationtype",
    ADD: "niqabaty.add_certificationtype",
    CHANGE: "niqabaty.change_certificationtype",
    DELETE: "niqabaty.delete_certificationtype",
  },

  // City permissions
  CITY: {
    VIEW: "niqabaty.view_city",
    ADD: "niqabaty.add_city",
    CHANGE: "niqabaty.change_city",
    DELETE: "niqabaty.delete_city",
  },

  // Nationality permissions
  NATIONALITY: {
    VIEW: "niqabaty.view_nationality",
    ADD: "niqabaty.add_nationality",
    CHANGE: "niqabaty.change_nationality",
    DELETE: "niqabaty.delete_nationality",
  },

  // Academic Degree permissions
  ACADEMIC_DEGREE: {
    VIEW: "niqabaty.view_academicdegree",
    ADD: "niqabaty.add_academicdegree",
    CHANGE: "niqabaty.change_academicdegree",
    DELETE: "niqabaty.delete_academicdegree",
  },

  // Post permissions
  POST: {
    VIEW: "niqabaty.view_post",
    ADD: "niqabaty.add_post",
    CHANGE: "niqabaty.change_post",
    DELETE: "niqabaty.delete_post",
  },

  // Professional Development permissions
  PROFESSIONAL_DEVELOPMENT: {
    VIEW: "niqabaty.view_professionaldevelopment",
    ADD: "niqabaty.add_professionaldevelopment",
    CHANGE: "niqabaty.change_professionaldevelopment",
    DELETE: "niqabaty.delete_professionaldevelopment",
  },

  // Notification permissions
  NOTIFICATION: {
    VIEW: "niqabaty.view_notification",
    ADD: "niqabaty.add_notification",
    CHANGE: "niqabaty.change_notification",
    DELETE: "niqabaty.delete_notification",
  },

  // Ad permissions
  AD: {
    VIEW: "niqabaty.view_ad",
    ADD: "niqabaty.add_ad",
    CHANGE: "niqabaty.change_ad",
    DELETE: "niqabaty.delete_ad",
  },

  // User Group permissions
  USER_GROUP: {
    VIEW: "auth.view_group",
    ADD: "auth.add_group",
    CHANGE: "auth.change_group",
    DELETE: "auth.delete_group",
  },
} as const;

// Type helpers
export type Permission = string;
export type PermissionAction = "view" | "add" | "change" | "delete";
