import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/react";
import { useTranslation } from "react-i18next";

import AuthLayout from "@/layouts/auth";
import AuthAPI from "@/api/auth";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const userId = searchParams.get("user_id");
  const email = searchParams.get("email");

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t("auth.enterFullCode", "Please enter the full 6-digit code"));

      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await AuthAPI.verifyEmail({
        user_id: Number(userId),
        code: code,
      });

      // Store tokens
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);

      // Redirect to home
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.verificationFailed", "Verification failed"),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setMessage("");

    try {
      // resend using email only from the verification page
      await AuthAPI.resendVerification({ email: email || undefined });
      setMessage(t("auth.codeSent", "Verification code sent successfully"));
      setCode("");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("auth.resendFailed", "Failed to resend code"),
      );
    } finally {
      setIsResending(false);
    }
  };

  // Show error if parameters are missing
  if (!userId || !email) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md p-8 bg-background border border-divider shadow-lg">
          <CardBody className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-danger">
                {t("auth.error", "Error")}
              </h2>
              <p className="text-default-600 mb-4">
                {t(
                  "auth.missingVerificationParams",
                  "Missing verification parameters. Please try logging in again.",
                )}
              </p>
              <Button
                color="primary"
                size="lg"
                onPress={() => navigate("/auth/login")}
              >
                {t("auth.backToLogin", "Back to Login")}
              </Button>
            </div>
          </CardBody>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8 bg-background border border-divider shadow-lg">
        <CardBody className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {t("auth.verifyEmail", "Verify Your Email")}
            </h2>
            <p className="text-default-600">
              {t("auth.verificationSent", "We sent a verification code to")}{" "}
              <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-danger bg-danger-50 border border-danger-200 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 text-sm text-success bg-success-50 border border-success-200 rounded-lg">
              {message}
            </div>
          )}

          <div className="flex justify-center">
            <Input
              className="max-w-[200px]"
              classNames={{
                input: "text-center text-2xl tracking-[0.5em] font-bold",
              }}
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
            isLoading={isVerifying}
            size="lg"
            onPress={handleVerify}
          >
            {t("auth.verify", "Verify")}
          </Button>

          <div className="text-center">
            <p className="text-sm text-default-600 mb-2">
              {t("auth.didntReceive", "Didn't receive the code?")}
            </p>
            <Button
              color="primary"
              isLoading={isResending}
              variant="light"
              onPress={handleResend}
            >
              {t("auth.resendCode", "Resend Code")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </AuthLayout>
  );
}
