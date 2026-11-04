import { RefObject } from "react";
import { Card, CardBody } from "@heroui/react";
import { Button } from "@heroui/button";
import { useTranslation } from "react-i18next";
import { FiCheck } from "react-icons/fi";

import { RegisterData } from "@/api/auth";

interface AccountTypeStepProps {
  data: Partial<RegisterData>;
  onChange: (data: Partial<RegisterData>) => void;
  onNext: () => void;
  headingRef?: RefObject<HTMLHeadingElement>;
}

const accountTypes = [
  {
    value: "student" as const,
    titleKey: "auth.student",
    descKey: "auth.studentDesc",
  },
  {
    value: "doctor" as const,
    titleKey: "auth.doctor",
    descKey: "auth.doctorDesc",
  },
  {
    value: "institution" as const,
    titleKey: "auth.institution",
    descKey: "auth.institutionDesc",
  },
];

export default function AccountTypeStep({
  data,
  onChange,
  onNext,
  headingRef,
}: AccountTypeStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-foreground mb-2 outline-none">
          {t("auth.selectAccountType")}
        </h3>
        <p className="text-default-500">{t("auth.selectAccountTypeDesc")}</p>
      </div>

      {/* Horizontal on desktop (md+), column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accountTypes.map((type) => {
          const isSelected = data.user_type === type.value;

          return (
            <Card
              key={type.value}
              isPressable
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-2 border-primary bg-primary-50"
                  : "border border-default-200 hover:border-primary-300"
              }`}
              data-testid={`account-type-${type.value}`}
              onPress={() => onChange({ user_type: type.value })}
            >
              {isSelected && (
                <div className="absolute top-2 end-2 bg-primary text-white rounded-full p-0.5 z-10">
                  <FiCheck size={12} />
                </div>
              )}
              <CardBody className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 text-center min-h-[90px] sm:min-h-[120px]">
                <h4
                  className={`font-semibold text-lg ${isSelected ? "text-primary" : "text-foreground"}`}
                >
                  {t(type.titleKey)}
                </h4>
                <p className="text-sm text-default-500">{t(type.descKey)}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Button
        className="w-full font-semibold"
        color="primary"
        isDisabled={!data.user_type}
        size="lg"
        data-testid="account-type-continue"
        onPress={onNext}
      >
        {t("auth.continue")}
      </Button>

      <div className="pb-4 sm:pb-0" />
    </div>
  );
}
