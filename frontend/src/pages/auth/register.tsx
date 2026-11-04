import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

import AccountTypeStep from "./registration/AccountTypeStep";
import CredentialsStep from "./registration/CredentialsStep";

import AuthLayout from "@/layouts/auth";
import AuthAPI, { RegisterData } from "@/api/auth";
import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";

const STEPS: Array<"account_type" | "credentials"> = ["account_type", "credentials"];

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  const { isRTL } = useLanguageStore();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Set translated page title
  useEffect(() => {
    document.title = `${t('auth.createAccount')} | ${t('common.site.name')}`;
  }, [t]);

  const [phase, setPhase] = useState<"account_type" | "credentials">("account_type");
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    user_type: "doctor",
    language: "ar",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // Warn before tab/window close when user has entered data beyond defaults
  const hasEnteredData = Object.keys(formData).some(
    (k) => k !== "user_type" && k !== "language",
  );
  useEffect(() => {
    if (!hasEnteredData) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasEnteredData]);

  const updateFormData = (data: Partial<RegisterData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (Object.keys(serverErrors).length > 0) {
      setServerErrors((prev) => {
        const next = { ...prev };
        Object.keys(data).forEach((key) => {
          delete next[key];
        });
        return next;
      });
    }
  };

  const focusStepHeading = () => {
    // Defer until after the re-render so the new step's heading is mounted
    setTimeout(() => stepHeadingRef.current?.focus(), 50);
  };

  const handleAccountTypeNext = () => {
    setPhase("credentials");
    focusStepHeading();
  };

  const handleBack = () => {
    setPhase("account_type");
    focusStepHeading();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setServerErrors({});

    try {
      const submitData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !key.startsWith("_")
        ) {
          submitData.append(key, String(value));
        }
      });

      await AuthAPI.register(submitData as unknown as RegisterData);

      toast.success(
        formData.user_type === "doctor"
          ? t("member.accountPendingTitle")
          : t("auth.accountCreated"),
      );

      try {
        await login((formData.email || formData.phone_number)!, formData.password!);
        navigate("/");
      } catch {
        // Registration succeeded even if auto-login failed; send them to log in manually.
        navigate("/auth/login?registered=true");
      }
    } catch (err: any) {
      // Handle Django serializer validation errors (e.g., {username: ["Username already taken"]})
      const responseData = err.response?.data;
      let errorMessage = t("auth.registrationFailed");

      if (responseData) {
        if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === "object" && !Array.isArray(responseData)) {
          // Parse field validation errors
          const errors: Record<string, string> = {};
          Object.entries(responseData).forEach(([key, msgs]) => {
            errors[key] = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          });
          setServerErrors(errors);
          errorMessage = t("auth.checkFormForErrors");
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginLinkClick = (e: React.MouseEvent) => {
    if (hasEnteredData && !window.confirm(t("auth.leaveWarning"))) {
      e.preventDefault();
    }
  };

  const stepNumber = STEPS.indexOf(phase) + 1;

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl p-4 sm:p-8 bg-background border border-divider shadow-lg">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {phase === "credentials" ? (
              <Button
                className="font-medium text-default-500 -ms-2"
                size="sm"
                startContent={<FiArrowLeft className={isRTL ? "rotate-180" : ""} size={14} />}
                variant="light"
                onPress={handleBack}
              >
                {t("auth.back")}
              </Button>
            ) : (
              <span />
            )}
            <span className="text-xs font-semibold text-default-400 uppercase tracking-wide">
              {t("auth.stepIndicator", { current: stepNumber, total: STEPS.length })}
            </span>
          </div>
          <div className="w-full h-1.5 bg-default-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(stepNumber / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div key={phase} className="animate-in fade-in duration-300">
          {phase === "account_type" ? (
            <AccountTypeStep
              data={formData}
              headingRef={stepHeadingRef}
              onChange={updateFormData}
              onNext={handleAccountTypeNext}
            />
          ) : (
            <CredentialsStep
              data={formData}
              headingRef={stepHeadingRef}
              isSubmitting={isSubmitting}
              serverErrors={serverErrors}
              onChange={updateFormData}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Footer link – shown only on first step */}
        {phase === "account_type" && (
          <p className="text-center text-sm text-default-500 mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/auth/login"
              className="text-primary font-semibold hover:underline"
              onClick={handleLoginLinkClick}
            >
              {t('auth.signInLink')}
            </Link>
          </p>
        )}
      </Card>
    </AuthLayout>
  );
}
