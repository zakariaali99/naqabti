import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/react";
import { Link } from "@heroui/link";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";

import { Logo } from "@/components/icons";
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";
import AuthLayout from "@/layouts/auth";
import { isPhoneWithoutCountryCode } from "@/utils/phone";

export default function LoginPage() {
  const { t } = useTranslation();
  const { isRTL } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered =
    new URLSearchParams(location.search).get("registered") === "true";

  const { login, isLoading, error, clearError, user } = useUserStore();

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const toggleVisibility = () => setShowPassword(!showPassword);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
    // Clear field-specific error when user types
    if (field === "username" && errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (field === "password" && errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    const newErrors: { username?: string; password?: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = t(
        "auth.usernameRequired",
        "Username, email, or phone number is required",
      );
    }
    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired", "Password is required");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    try {
      // Use username for login (can be username or phone number)
      // This will store tokens in localStorage before any authenticated request
      await login(formData.username, formData.password);

      // Redirect to home page after successful login
      navigate("/");
    } catch (error: any) {
      console.error("Login failed:", error);
    }
  };

  if (user) {
    return (
      <>
        <Navigate to={"/"} />
      </>
    );
  }

  return (
    <AuthLayout maxWidth="max-w-5xl">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 w-full">
        <div className="flex justify-center shrink-0">
          <Link
            aria-label={t("common.site.name")}
            className="flex items-center justify-center"
            href="/"
          >
            <div className="hover:scale-105 transition-transform">
              <Logo
                className="w-[55vw] sm:w-[45vw] md:w-[25vw] min-w-[180px] max-w-[260px] md:max-w-[360px] h-auto"
                style={{ height: "auto" }}
              />
            </div>
          </Link>
        </div>

        <div className="w-full max-w-lg flex-1">
          <Card className="w-full p-8 bg-background border border-divider shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h5
                className={`text-2xl font-bold text-foreground mb-8 ${isRTL ? "text-right" : "text-left"}`}
              >
                {t("auth.signIn")}
              </h5>

              {justRegistered && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-3 p-4 text-sm text-success bg-success-50 border border-success-200 rounded-lg"
                  role="alert"
                >
                  <FiCheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p>{t("auth.registeredSuccess")}</p>
                </div>
              )}

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-3 p-4 text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg"
                  role="alert"
                >
                  <FiAlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {t("auth.loginFailed", "Login failed")}
                    </p>
                    <p className="mt-1 text-danger-600">
                      {t(error || "auth.unknownError", {
                        defaultValue: t(
                          "auth.invalidCredentials",
                          "Invalid username or password. Please try again.",
                        ),
                      })}
                    </p>
                    {isPhoneWithoutCountryCode(formData.username) && (
                      <p className="mt-1 text-danger-600">
                        {t("auth.phoneLoginHint")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium text-foreground ${isRTL ? "text-right" : "text-left"}`}
                  htmlFor="username"
                >
                  {t("auth.usernameOrPhone")}
                </label>
                <Input
                  className="w-full"
                  errorMessage={errors.username}
                  id="username"
                  isDisabled={isLoading}
                  isInvalid={!!errors.username}
                  name="username"
                  placeholder={t("auth.usernameOrPhonePlaceholder")}
                  size="lg"
                  type="text"
                  value={formData.username}
                  variant="bordered"
                  onValueChange={(value) =>
                    handleInputChange("username", value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium text-foreground ${isRTL ? "text-right" : "text-left"}`}
                  htmlFor="password"
                >
                  {t("auth.password")}
                </label>
                <Input
                  className="w-full"
                  endContent={
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {showPassword ? (
                        <FiEyeOff className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <FiEye className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  errorMessage={errors.password}
                  id="password"
                  isDisabled={isLoading}
                  isInvalid={!!errors.password}
                  name="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  size="lg"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  variant="bordered"
                  onValueChange={(value) =>
                    handleInputChange("password", value)
                  }
                />
              </div>

              <Button
                className="w-full font-medium"
                color="primary"
                isLoading={isLoading}
                size="lg"
                type="submit"
              >
                {isLoading ? t("auth.signingIn") : t("auth.login")}
              </Button>

              <div
                className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <div className="text-sm text-default-600">
                  {t("auth.notRegistered", "Don't have an account?")}{" "}
                  <a
                    className="text-primary hover:text-primary-600 transition-colors font-medium"
                    href="/auth/register"
                  >
                    {t("auth.createAccount", "Create Account")}
                  </a>
                </div>
                <a
                  className="text-sm text-primary hover:text-primary-600 transition-colors font-medium"
                  href="/auth/reset-password"
                >
                  {t("auth.forgotPassword", "Forgot Password?")}
                </a>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
