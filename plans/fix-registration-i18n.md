# Fix i18n in Registration Components

## Problem
The registration components in `frontend/src/pages/auth/registration/` are using incorrect translation key prefixes. They use `registration.` prefix but the translations are stored in the `auth` namespace.

## Current Pattern (Incorrect)
```tsx
t("registration.selectAccountType", "Select Account Type")
t("registration.personalInfo", "Personal Information")
```

## Correct Pattern (Following dashboard.tsx)
```tsx
t("auth.selectAccountType")
t("auth.personalInfo")
```

## Files to Update

### 1. AccountTypeStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings (they exist in translation files)

### 2. DoctorInfoStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 3. EducationInfoStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 4. LocationInfoStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 5. PersonalInfoStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 6. ReviewSubmitStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 7. WelcomeStep.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

### 8. register.tsx
- Change all `registration.` prefixes to `auth.`
- Remove fallback strings

## Translation Keys Mapping

| Current Key | Correct Key |
|-------------|-------------|
| registration.selectAccountType | auth.selectAccountType |
| registration.selectAccountTypeDesc | auth.selectAccountTypeDesc |
| registration.student | auth.student |
| registration.studentDesc | auth.studentDesc |
| registration.doctor | auth.doctor |
| registration.doctorDesc | auth.doctorDesc |
| registration.institution | auth.institution |
| registration.institutionDesc | auth.institutionDesc |
| registration.personalInfo | auth.personalInfo |
| registration.institutionInfo | auth.institutionInfo |
| registration.fullName | auth.fullName |
| registration.username | auth.username |
| registration.email | auth.email |
| registration.password | auth.password |
| registration.phone | auth.phone |
| registration.birthdate | auth.birthdate |
| registration.locationInfo | auth.locationInfo |
| registration.city | auth.city |
| registration.address | auth.address |
| registration.nationality | auth.nationality |
| registration.passportImage | auth.passportImage |
| registration.educationInfo | auth.educationInfo |
| registration.university | auth.university |
| registration.degree | auth.degree |
| registration.specialty | auth.specialty |
| registration.doctorInfo | auth.doctorInfo |
| registration.membershipNumber | auth.membershipNumber |
| registration.selectBranch | auth.selectBranch |
| registration.reviewTitle | auth.reviewTitle |
| registration.accountType | auth.accountType |
| registration.welcome | auth.welcome |
| registration.accountCreated | auth.accountCreated |
| registration.proceedToVerification | auth.proceedToVerification |

## Common Keys
The components also use `common.` prefixed keys which are correct:
- `common.continue`
- `common.back`
- `common.next`
- `common.loading`

These should remain unchanged.
