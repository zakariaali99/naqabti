import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody } from '@heroui/card';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import AuthLayout from '@/layouts/auth';
import AuthAPI from '@/api/auth';
import { useUserStore } from '@/stores/userStore';


type Step = 'request' | 'verify' | 'reset';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  // isRTL removed if unused

  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get step from URL query param or use default
  const initialStep = (searchParams.get("step") as Step) || "request";
  const userIdParam = searchParams.get("user_id");

  const [step, setStep] = useState<Step>(initialStep);
  const [userId, setUserId] = useState<number | null>(
    userIdParam ? parseInt(userIdParam) : null,
  );
  const [email, setEmail] = useState("");

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/" />;
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleRequestReset = async () => {
    if (!identifier.trim()) {
      setError(
        t("auth.emailOrUsernameRequired", "Email or username is required"),
      );

      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Check if input is email or username
      const isEmail = identifier.includes("@");
      const data = isEmail ? { email: identifier } : { username: identifier };

      const response = await AuthAPI.requestPasswordReset(data);

      // Store user_id for next step if returned
      if (response.user_id) {
        setUserId(response.user_id);
        setEmail(response.email || identifier);
        setStep("verify");
        navigate(
          "/auth/reset-password?step=verify&user_id=" + response.user_id,
        );
      } else {
        // Always show success to prevent enumeration
        setMessage(
          t(
            "auth.resetCodeSent",
            "If an account exists, a reset code will be sent to your email.",
          ),
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.requestResetFailed", "Failed to request password reset"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!userId) {
      setError(t("auth.invalidRequest", "Invalid request"));

      return;
    }

    if (code.length !== 6) {
      setError(t("auth.enterFullCode", "Please enter the full 6-digit code"));

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await AuthAPI.verifyPasswordReset({
        user_id: userId,
        code: code,
      });

      setStep("reset");
      navigate("/auth/reset-password?step=reset&user_id=" + userId);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.invalidCode", "Invalid or expired verification code"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!identifier.trim()) {
      setError(
        t("auth.emailOrUsernameRequired", "Email or username is required"),
      );

      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const isEmail = identifier.includes("@");
      const data = isEmail ? { email: identifier } : { username: identifier };

      const response = await AuthAPI.requestPasswordReset(data);

      if (response.user_id) {
        setUserId(response.user_id);
        setEmail(response.email || identifier);
      }

      setMessage(t("auth.codeSent", "Verification code sent successfully"));
      setCode("");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.resendFailed", "Failed to resend code"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) {
      setError(t("auth.invalidRequest", "Invalid request"));

      return;
    }

    if (!newPassword) {
      setError(t("auth.newPasswordRequired", "New password is required"));

      return;
    }

    if (newPassword.length < 8) {
      setError(
        t("auth.passwordTooShort", "Password must be at least 8 characters"),
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch", "Passwords do not match"));

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await AuthAPI.confirmPasswordReset({
        user_id: userId,
        code: code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Redirect to login with success message
      navigate("/auth/login?reset=success");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.resetFailed", "Failed to reset password"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t("auth.forgotPassword", "Forgot Password?")}
        </h2>
        <p className="text-default-600">
          {t(
            "auth.enterEmailForReset",
            "Enter your email or username to reset your password",
          )}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 text-sm text-success bg-success-50 border border-success-200 rounded-lg mb-4">
          {message}
        </div>
      )}

      <div className="space-y-4">
        <Input
          isDisabled={isLoading}
          label={t("auth.emailOrUsername", "Email or Username")}
          placeholder={t(
            "auth.enterEmailOrUsername",
            "Enter your email or username",
          )}
          size="lg"
          type="text"
          value={identifier}
          variant="bordered"
          onValueChange={setIdentifier}
        />
      </div>

      <Button
        className="w-full mt-6"
        color="primary"
        isLoading={isLoading}
        size="lg"
        onPress={handleRequestReset}
      >
        {t("auth.sendResetCode", "Send Reset Code")}
      </Button>

      <div className="text-center mt-4">
        <a
          className="text-sm text-primary hover:text-primary-600 transition-colors"
          href="/auth/login"
        >
          {t("auth.backToLogin", "Back to Login")}
        </a>
      </div>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t("auth.verifyCode", "Verify Code")}
        </h2>
        <p className="text-default-600">
          {t("auth.codeSentTo", "We sent a verification code to")}{" "}
          <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-center mb-6">
        <Input
          className="max-w-[200px]"
          classNames={{
            input: "text-center text-2xl tracking-[0.5em] font-bold",
          }}
          isDisabled={isLoading}
          maxLength={6}
          placeholder="------"
          size="lg"
          type="text"
          value={code}
          variant="bordered"
          onValueChange={setCode}
        />
      </div>

      <Button
        className="w-full"
        color="primary"
        isDisabled={code.length !== 6}
        isLoading={isLoading}
        size="lg"
        onPress={handleVerifyCode}
      >
        {t("auth.verify", "Verify")}
      </Button>

      <div className="text-center mt-4">
        <p className="text-sm text-default-600 mb-2">
          {t("auth.didntReceive", "Didn't receive the code?")}
        </p>
        <Button
          color="primary"
          isLoading={isLoading}
          variant="light"
          onPress={handleResendCode}
        >
          {t("auth.resendCode", "Resend Code")}
        </Button>
      </div>

      <div className="text-center mt-4">
        <a
          className="text-sm text-primary hover:text-primary-600 transition-colors"
          href="/auth/login"
        >
          {t("auth.backToLogin", "Back to Login")}
        </a>
      </div>
    </>
  );

  const renderResetStep = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t("auth.setNewPassword", "Set New Password")}
        </h2>
        <p className="text-default-600">
          {t("auth.enterNewPassword", "Enter your new password")}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          endContent={
            <button
              aria-label="toggle password visibility"
              className="focus:outline-none"
              type="button"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <FiEyeOff className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <FiEye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          isDisabled={isLoading}
          label={t("auth.newPassword", "New Password")}
          placeholder={t("auth.enterNewPassword", "Enter new password")}
          size="lg"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          variant="bordered"
          onValueChange={setNewPassword}
        />

        <Input
          endContent={
            <button
              aria-label="toggle password visibility"
              className="focus:outline-none"
              type="button"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <FiEyeOff className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <FiEye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          isDisabled={isLoading}
          label={t("auth.confirmPassword", "Confirm Password")}
          placeholder={t(
            "auth.confirmPasswordPlaceholder",
            "Confirm new password",
          )}
          size="lg"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          variant="bordered"
          onValueChange={setConfirmPassword}
        />
      </div>

      <Button
        className="w-full mt-6"
        color="primary"
        isDisabled={!newPassword || !confirmPassword}
        isLoading={isLoading}
        size="lg"
        onPress={handleResetPassword}
      >
        {t("auth.resetPassword", "Reset Password")}
      </Button>

      <div className="text-center mt-4">
        <a
          className="text-sm text-primary hover:text-primary-600 transition-colors"
          href="/auth/login"
        >
          {t("auth.backToLogin", "Back to Login")}
        </a>
      </div>
    </>
  );

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8 bg-background border border-divider shadow-lg">
        <CardBody className="space-y-4">
          {step === "request" && renderRequestStep()}
          {step === "verify" && renderVerifyStep()}
          {step === "reset" && renderResetStep()}
        </CardBody>
      </Card>
    </AuthLayout>
  );
}
