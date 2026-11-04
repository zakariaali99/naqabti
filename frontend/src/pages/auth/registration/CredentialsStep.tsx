import { Chip, Divider } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useTranslation } from "react-i18next";
import { FiKey, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from "react-icons/fi";
import {
  PasswordStrengthMeter,
  StrengthLevel,
} from "@xho/react-password-meter";
import { useState, useMemo, forwardRef, RefObject, InputHTMLAttributes } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { RegisterData } from "@/api/auth";
import { useLanguageStore } from "@/stores/languageStore";

// Bare native input so react-phone-number-input can manage focus/caret directly;
// the bordered "shell" styling lives on the wrapping div instead.
const PhoneNumberField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      {...props}
      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-default-400"
    />
  ),
);
PhoneNumberField.displayName = "PhoneNumberField";

interface CredentialsStepProps {
  data: Partial<RegisterData>;
  onChange: (data: Partial<RegisterData>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  serverErrors?: Record<string, string>;
  headingRef?: RefObject<HTMLHeadingElement>;
}

interface ValidationErrors {
  first_name?: string;
  family_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

export default function CredentialsStep({
  data,
  onChange,
  onSubmit,
  isSubmitting = false,
  serverErrors = {},
  headingRef,
}: CredentialsStepProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const isInstitution = data.user_type === "institution";
  const hasEmail = !!data.email?.trim();
  const hasPhone = !!data.phone_number?.trim();
  const [strengthLevel, setStrengthLevel] = useState<StrengthLevel>("weak");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    return isValidPhoneNumber(phone);
  };

  const errors: ValidationErrors = useMemo(() => {
    const errs: ValidationErrors = {};

    if (!data.first_name?.trim()) {
      errs.first_name = t("auth.fieldRequired");
    }

    if (!data.family_name?.trim()) {
      errs.family_name = t("auth.fieldRequired");
    }

    if (hasEmail && !validateEmail(data.email!)) {
      errs.email = t("auth.emailInvalid");
    } else if (!hasEmail && !hasPhone) {
      errs.email = t("auth.emailOrPhoneRequired");
    }

    if (!data.password) {
      errs.password = t("auth.fieldRequired");
    } else if (strengthLevel === "weak" || strengthLevel === "fair") {
      errs.password = t("auth.passwordMinRequirement");
    }

    if (!confirmPassword) {
      errs.confirmPassword = t("auth.fieldRequired");
    } else if (data.password !== confirmPassword) {
      errs.confirmPassword = t("auth.passwordsDoNotMatch");
    }

    if (isInstitution && !hasPhone) {
      errs.phone = t("auth.fieldRequired");
    } else if (hasPhone && !validatePhone(data.phone_number!)) {
      errs.phone = t("auth.phoneInvalid");
    } else if (!hasPhone && !hasEmail) {
      errs.phone = t("auth.emailOrPhoneRequired");
    }

    return errs;
  }, [data, isInstitution, hasEmail, hasPhone, t, confirmPassword, strengthLevel]);

  const isValidPassword = (): boolean =>
    strengthLevel === "good" || strengthLevel === "strong";

  const isValid = (): boolean =>
    Object.keys(errors).length === 0 && isValidPassword() && data.password === confirmPassword;

  const handlePasswordChange = (value: string) => onChange({ password: value });

  const handleStrengthChange = (result: {
    score: number;
    level: StrengthLevel;
  }) => setStrengthLevel(result.level);

  const handleFieldBlur = (fieldName: string) =>
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

  const handleSubmit = () => {
    const allFields = ["first_name", "family_name", "email", "password", "confirmPassword", "phone"];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((f) => (newTouched[f] = true));
    setTouched(newTouched);

    if (isValid()) onSubmit();
  };

  const getStrengthLabel = (level: StrengthLevel): string => {
    switch (level) {
      case "weak":
        return t("auth.passwordWeak");
      case "fair":
        return t("auth.passwordFair");
      case "good":
        return t("auth.passwordGood");
      case "strong":
        return t("auth.passwordStrong");
      default:
        return "";
    }
  };

  const getStrengthChipColor = (
    level: StrengthLevel,
  ): "danger" | "warning" | "success" | "default" => {
    switch (level) {
      case "weak":
        return "danger";
      case "fair":
        return "warning";
      case "good":
      case "strong":
        return "success";
      default:
        return "default";
    }
  };

  const getFieldError = (fieldName: string): string | undefined =>
    touched[fieldName]
      ? (errors as Record<string, string | undefined>)[fieldName]
      : undefined;

  const isFieldInvalid = (fieldName: string): boolean =>
    touched[fieldName] &&
    !!(errors as Record<string, string | undefined>)[fieldName];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary-100 text-primary shrink-0">
          <FiKey size={20} />
        </div>
        <div>
          <h3 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-foreground outline-none">
            {t("auth.accountCredentials")}
          </h3>
          <p className="text-sm text-default-400">
            {t("auth.accountCredentialsDesc")}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            isRequired
            errorMessage={getFieldError("first_name") || serverErrors?.first_name}
            isInvalid={isFieldInvalid("first_name") || !!serverErrors?.first_name}
            label={t("auth.firstName")}
            labelPlacement="outside"
            name="first_name"
            placeholder={t("auth.firstNamePlaceholder")}
            value={data.first_name || ""}
            variant="bordered"
            onBlur={() => handleFieldBlur("first_name")}
            onValueChange={(value) => onChange({ first_name: value })}
          />

          <Input
            isRequired
            errorMessage={getFieldError("family_name") || serverErrors?.family_name}
            isInvalid={isFieldInvalid("family_name") || !!serverErrors?.family_name}
            label={t("auth.lastName")}
            labelPlacement="outside"
            name="family_name"
            placeholder={t("auth.lastNamePlaceholder")}
            value={data.family_name || ""}
            variant="bordered"
            onBlur={() => handleFieldBlur("family_name")}
            onValueChange={(value) => onChange({ family_name: value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            errorMessage={getFieldError("email") || serverErrors?.email}
            isInvalid={isFieldInvalid("email") || !!serverErrors?.email}
            label={t("auth.email")}
            labelPlacement="outside"
            name="email"
            placeholder={t("auth.emailPlaceholder")}
            startContent={<FiMail className="text-default-400" />}
            type="email"
            value={data.email || ""}
            variant="bordered"
            onBlur={() => handleFieldBlur("email")}
            onValueChange={(value) => onChange({ email: value })}
          />

          <div className="space-y-1.5">
            <label className="text-sm text-default-500" htmlFor="phone_number">
              {t("auth.phone")}
              {(isInstitution || !hasEmail) && <span className="text-danger">&nbsp;*</span>}
            </label>
            <div
              className={`flex items-center gap-2 h-10 px-3 rounded-xl border-2 transition-colors ${
                isFieldInvalid("phone") || !!serverErrors?.phone_number
                  ? "border-danger"
                  : "border-default-200 hover:border-default-400 focus-within:border-primary"
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <FiPhone className="text-default-400 shrink-0" />
              <PhoneInput
                className="flex-1 flex items-center gap-2 [&_.PhoneInputCountry]:me-1"
                defaultCountry="LY"
                id="phone_number"
                inputComponent={PhoneNumberField}
                placeholder={t("auth.phonePlaceholder")}
                value={data.phone_number || ""}
                onBlur={() => handleFieldBlur("phone")}
                onChange={(value?: string) => onChange({ phone_number: value || "" })}
              />
            </div>
            {(getFieldError("phone") || serverErrors?.phone_number) && (
              <p className="text-tiny text-danger px-1">
                {getFieldError("phone") || serverErrors?.phone_number}
              </p>
            )}
          </div>
        </div>

        <Divider />

        <div className="space-y-2">
          <Input
            isRequired
            endContent={
              <button
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                className="focus:outline-none"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword
                  ? <FiEyeOff className="text-default-400" />
                  : <FiEye className="text-default-400" />}
              </button>
            }
            errorMessage={getFieldError("password")}
            isInvalid={isFieldInvalid("password")}
            label={t("auth.password")}
            labelPlacement="outside"
            name="password"
            placeholder={t("auth.passwordPlaceholder")}
            startContent={<FiLock className="text-default-400" />}
            type={showPassword ? "text" : "password"}
            value={data.password || ""}
            variant="bordered"
            onBlur={() => handleFieldBlur("password")}
            onValueChange={handlePasswordChange}
          />

          {data.password && (
            <div className="px-1 space-y-1.5">
              <PasswordStrengthMeter
                password={data.password || ""}
                showLabel={false}
                onChange={handleStrengthChange}
              />
              <div role="status" aria-live="polite" className="flex justify-between items-center">
                <p className="text-xs text-default-500">
                  {t("auth.passwordStrength")}
                </p>
                <div className="flex items-center gap-2">
                  {!isValidPassword() && (
                    <p className="text-xs text-danger">
                      {t("auth.passwordMinRequirement")}
                    </p>
                  )}
                  <Chip color={getStrengthChipColor(strengthLevel)} size="sm" variant="flat">
                    {getStrengthLabel(strengthLevel)}
                  </Chip>
                </div>
              </div>
            </div>
          )}

          <Input
            isRequired
            endContent={
              <button
                aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                className="focus:outline-none"
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword
                  ? <FiEyeOff className="text-default-400" />
                  : <FiEye className="text-default-400" />}
              </button>
            }
            errorMessage={getFieldError("confirmPassword")}
            isInvalid={isFieldInvalid("confirmPassword")}
            label={t("auth.confirmPasswordRegistration")}
            labelPlacement="outside"
            name="confirm_password"
            placeholder={t("auth.confirmPasswordRegistrationPlaceholder")}
            startContent={<FiLock className="text-default-400" />}
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            variant="bordered"
            onBlur={() => handleFieldBlur("confirmPassword")}
            onValueChange={(v) => {
              setConfirmPassword(v);
              setTouched((prev) => ({ ...prev, confirmPassword: true }));
            }}
          />
        </div>
      </div>

      <Button
        className="w-full font-semibold"
        color="primary"
        isLoading={isSubmitting}
        size="lg"
        data-testid="register-submit"
        onPress={handleSubmit}
      >
        {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>

      <div className="pb-4 sm:pb-0" />
    </div>
  );
}
