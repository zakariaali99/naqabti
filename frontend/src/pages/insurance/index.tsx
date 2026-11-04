import { useTranslation } from "react-i18next";
import { FiShield } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";

export default function InsurancePage() {
  const { t } = useTranslation();

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="w-24 h-24 bg-content2 rounded-full flex items-center justify-center text-default-400">
          <FiShield size={48} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {t("insurance.title", "Insurance")}
        </h1>
        <div className="bg-content1 rounded-[32px] p-12 text-center border border-default-200 shadow-sm max-w-lg">
          <p className="text-xl text-default-500">
            {t("insurance.underConstruction", "This section is under construction")}
          </p>
        </div>
      </div>
    </DefaultLayout>
  );
}
