import { Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiLock } from "react-icons/fi";

export default function Forbidden() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-24 h-24 mb-6 text-danger/80 bg-danger/10 rounded-full flex items-center justify-center">
        <FiLock size={48} />
      </div>

      <h1 className="text-4xl font-bold text-default-900 mb-2">403</h1>
      <h2 className="text-2xl font-semibold text-default-700 mb-4">
        {t("error.forbidden", "This route not permitted")}
      </h2>

      <p className="text-default-500 text-center max-w-md mb-8">
        {t(
          "error.forbiddenDescription",
          "You don't have permission to access this page. Please contact your system administrator if you believe this is an error.",
        )}
      </p>

      <Button
        color="primary"
        size="lg"
        variant="shadow"
        onPress={() => navigate("/")}
      >
        {t("common.backToHome", "Back to Home")}
      </Button>
    </div>
  );
}
