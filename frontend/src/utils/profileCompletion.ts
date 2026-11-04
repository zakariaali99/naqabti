import { UserEntity } from "@/models/users";

export type ProfileCompletionField =
  | "email"
  | "full_name"
  | "phone_number"
  | "profile_image"
  | "birthdate"
  | "city"
  | "address"
  | "nationality"
  | "passport_image"
  | "university_name"
  | "current_degree"
  | "membership_number"
  | "branch_id"
  | "first_name_field"
  | "father_name"
  | "grandfather_name"
  | "family_name";

export type ProfileCompletionValues = Partial<
  Record<ProfileCompletionField, string | number | null | undefined>
>;

const BASE_FIELDS: ProfileCompletionField[] = [
  "email",
  "full_name",
  "phone_number",
  "profile_image",
  "birthdate",
  "city",
  "address",
  "nationality",
  "passport_image",
  "university_name",
  "current_degree",
];

// Doctors also need a membership number and a branch to actually complete
// a membership application / become approvable.
const DOCTOR_ONLY_FIELDS: ProfileCompletionField[] = ["membership_number", "branch_id"];

// The 4-part Arabic name scheme used by individual (non-institution) accounts.
const NAME_FIELDS: ProfileCompletionField[] = [
  "first_name_field",
  "father_name",
  "grandfather_name",
  "family_name",
];

// Institutions only have a single free-text name field.
const INSTITUTION_NAME_FIELDS: ProfileCompletionField[] = ["full_name"];

export function getProfileCompletionFields(
  isDoctor: boolean,
): ProfileCompletionField[] {
  return isDoctor ? [...BASE_FIELDS, ...DOCTOR_ONLY_FIELDS] : BASE_FIELDS;
}

export function getNameCompletionFields(
  isInstitution: boolean,
): ProfileCompletionField[] {
  return isInstitution ? INSTITUTION_NAME_FIELDS : NAME_FIELDS;
}

// Maps each field to the i18n key already used for its label elsewhere in
// the app, so hints shown outside the form (e.g. the complete-profile modal)
// stay consistent with the form's own field labels.
export const PROFILE_FIELD_LABEL_KEYS: Record<ProfileCompletionField, string> = {
  email: "common.email",
  full_name: "auth.fullName",
  phone_number: "common.phone",
  profile_image: "doctors.form.profileImage",
  birthdate: "auth.birthdate",
  city: "auth.city",
  address: "auth.address",
  nationality: "auth.nationality",
  passport_image: "auth.passportImage",
  university_name: "auth.university",
  current_degree: "auth.degree",
  membership_number: "auth.membershipNumber",
  branch_id: "auth.selectBranch",
  first_name_field: "users.form.firstNameArabic",
  father_name: "users.form.fatherNameArabic",
  grandfather_name: "users.form.grandfatherNameArabic",
  family_name: "users.form.familyNameArabic",
};

// Builds the completion input from an API user object, so pages that display
// a fetched user (detail/list views) share the same completion math as the
// profile edit form.
export function profileCompletionValuesFromUser(
  user: UserEntity,
): ProfileCompletionValues {
  return {
    email: user.email,
    full_name: user.full_name,
    phone_number: user.phone_number,
    profile_image: user.profile_image,
    birthdate: user.birthdate,
    city: user.city,
    address: user.address,
    nationality: user.nationality,
    passport_image: user.passport_image,
    university_name: user.university_name,
    current_degree: user.current_degree,
    membership_number: user.membership_number,
    branch_id: user.branches?.[0]?.id,
    first_name_field: user.first_name_field,
    father_name: user.father_name,
    grandfather_name: user.grandfather_name,
    family_name: user.family_name,
  };
}

function computeCompletion(
  fields: ProfileCompletionField[],
  values: ProfileCompletionValues,
): {
  percentage: number;
  missingFields: ProfileCompletionField[];
  completedFields: ProfileCompletionField[];
} {
  const missingFields = fields.filter((field) => !values[field]);
  const completedFields = fields.filter((field) => values[field]);
  const percentage = fields.length
    ? Math.round(((fields.length - missingFields.length) / fields.length) * 100)
    : 100;

  return { percentage, missingFields, completedFields };
}

export function calculateProfileCompletion(
  values: ProfileCompletionValues,
  isDoctor: boolean,
): {
  percentage: number;
  missingFields: ProfileCompletionField[];
  completedFields: ProfileCompletionField[];
} {
  return computeCompletion(getProfileCompletionFields(isDoctor), values);
}

// Separate from calculateProfileCompletion so the name fields (which are
// multiple inputs — first/father/grandfather/family name) can be tracked
// and displayed as their own completion metric.
export function calculateNameCompletion(
  values: ProfileCompletionValues,
  isInstitution: boolean,
): {
  percentage: number;
  missingFields: ProfileCompletionField[];
  completedFields: ProfileCompletionField[];
} {
  return computeCompletion(getNameCompletionFields(isInstitution), values);
}
