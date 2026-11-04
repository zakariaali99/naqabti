import React from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { FiAlertCircle, FiHome, FiShield } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface DoctorNotFoundProps {
  username?: string;
  message?: string;
}

export const DoctorNotFound: React.FC<DoctorNotFoundProps> = ({
  username,
  message,
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-slate-200/80 shadow-lg text-center p-8 bg-white rounded-3xl">
        <CardBody className="space-y-5 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shadow-xs">
            <FiAlertCircle className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <FiShield className="text-slate-400" />
              <span>{t("site.name", "منظومة نقابتي")}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0a2540]">
              {t("publicProfile.notFoundTitle", "الملف المهني غير متاح")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              {message ||
                t(
                  "publicProfile.notFoundDesc",
                  "لم يتم العثور على الطبيب المطلوب أو أن حسابه غير نشط / قيد المراجعة حالياً لدى النقابة."
                )}
            </p>
            {username && (
              <p className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-600 inline-block">
                @{username}
              </p>
            )}
          </div>
          <Button
            as={Link}
            className="font-bold mt-2 bg-[#0a2540] text-white shadow-md hover:bg-[#0f3b60]"
            size="md"
            startContent={<FiHome />}
            to="/"
            variant="solid"
          >
            {t("common.backToHome", "العودة للرئيسية")}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default DoctorNotFound;
