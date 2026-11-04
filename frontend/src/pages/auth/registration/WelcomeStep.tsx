import { Card, CardBody } from "@heroui/react";
import { Button } from "@heroui/button";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiMail, FiArrowRight } from "react-icons/fi";

interface WelcomeStepProps {
  email: string;
  userType: "doctor" | "student" | "institution";
  onContinue: () => void;
}

export default function WelcomeStep({
  email,
  userType,
  onContinue,
}: WelcomeStepProps) {
  const { t } = useTranslation();

  const getUserTypeMessage = () => {
    switch (userType) {
      case "doctor":
        return t("auth.welcomeDoctor");
      case "student":
        return t("auth.welcomeStudent");
      case "institution":
        return t("auth.welcomeInstitution");
      default:
        return t("auth.welcome");
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardBody className="flex flex-col items-center justify-center py-12 text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-success-100 flex items-center justify-center mb-6">
          <FiCheckCircle className="w-12 h-12 text-success-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("auth.accountCreated")}
        </h2>

        {/* Message */}
        <p className="text-default-600 mb-6 max-w-md">{getUserTypeMessage()}</p>

        {/* Email verification notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8 max-w-md w-full">
          <div className="flex items-start gap-3">
            <FiMail className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-primary-700">
                {t("auth.verifyEmailSent")}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                {t("auth.verifyEmailDesc")} <strong>{email}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          className="font-semibold px-8"
          color="primary"
          endContent={<FiArrowRight />}
          size="lg"
          onPress={onContinue}
        >
          {t("auth.proceedToVerification")}
        </Button>
      </CardBody>
    </Card>
  );
}
