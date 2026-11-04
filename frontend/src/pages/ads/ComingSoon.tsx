import { useTranslation } from "react-i18next";
import { FiMonitor, FiArrowLeft } from "react-icons/fi";
import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";

export default function AdsComingSoonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] gap-6 p-8 font-sans">
      <div className="w-24 h-24 bg-primary-50 text-primary rounded-full flex items-center justify-center shadow-lg border border-primary-100 animate-pulse">
        <FiMonitor size={48} />
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
          {t("ads.title", "Syndicate Ads")}
        </h1>
        <p className="text-default-500 font-medium max-w-md">
          {t("ads.comingSoonDesc", "This feature is currently under development and will be available soon.")}
        </p>
      </div>

      <div className="bg-content1 rounded-[32px] p-8 text-center border border-default-200 shadow-sm max-w-lg w-full">
        <p className="text-default-600 font-semibold mb-6">
          {t("ads.underConstruction", "Our advertising platform is being integrated with branches and cities targeting.")}
        </p>
        <Button
          color="default"
          variant="flat"
          className="font-bold rounded-2xl"
          startContent={<FiArrowLeft />}
          onPress={() => navigate(-1)}
        >
          {t("common.goBack", "Go Back")}
        </Button>
      </div>
    </div>
  );
}
