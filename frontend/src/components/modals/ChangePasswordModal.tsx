import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

import { AuthAPI } from "@/api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({
  isOpen,
  onClose,
}: ChangePasswordModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      setError("");
      setSuccess(false);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      setError("New password and confirm password do not match");

      return;
    }

    if (formData.new_password.length < 8) {
      setError("New password must be at least 8 characters long");

      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await AuthAPI.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      setSuccess(true);
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        t("changePassword.error");

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} placement="center" size="md" onClose={handleClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {t("changePassword.title")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
                  {t("changePassword.success")}
                </div>
              )}

              <Input
                required
                isDisabled={isLoading}
                label={t("changePassword.currentPassword")}
                placeholder={t("changePassword.currentPasswordPlaceholder")}
                type="password"
                value={formData.current_password}
                onChange={handleInputChange("current_password")}
              />

              <Input
                required
                isDisabled={isLoading}
                label={t("changePassword.newPassword")}
                placeholder={t("changePassword.newPasswordPlaceholder")}
                type="password"
                value={formData.new_password}
                onChange={handleInputChange("new_password")}
              />

              <Input
                required
                isDisabled={isLoading}
                label={t("changePassword.confirmPassword")}
                placeholder={t("changePassword.confirmPasswordPlaceholder")}
                type="password"
                value={formData.confirm_password}
                onChange={handleInputChange("confirm_password")}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              isDisabled={isLoading}
              variant="light"
              onPress={handleClose}
            >
              {t("changePassword.cancel")}
            </Button>
            <Button
              color="primary"
              isDisabled={
                !formData.current_password ||
                !formData.new_password ||
                !formData.confirm_password
              }
              isLoading={isLoading}
              type="submit"
            >
              {isLoading
                ? t("changePassword.saving")
                : t("changePassword.save")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
