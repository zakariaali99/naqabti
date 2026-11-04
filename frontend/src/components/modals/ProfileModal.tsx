import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

import { User } from "@/models/auth";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ProfileModal = ({ isOpen, onClose, user }: ProfileModalProps) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLanguageLabel = (lang: string) => {
    return lang === "ar" ? "العربية" : "English";
  };

  return (
    <Modal isOpen={isOpen} placement="center" size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {t("profile.title")}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("profile.username")}
              </label>
              <p className="text-base font-medium">{user.username}</p>
            </div>

            <Divider />

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("profile.fullname")}
              </label>
              <p className="text-base font-medium">{user.full_name}</p>
            </div>

            <Divider />

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("profile.email")}
              </label>
              <p className="text-base font-medium">{user.email}</p>
            </div>

            <Divider />

            {user.phone_number && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("profile.phone")}
                  </label>
                  <p className="text-base font-medium">{user.phone_number}</p>
                </div>
                <Divider />
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("profile.language")}
              </label>
              <p className="text-base font-medium">
                {getLanguageLabel(user.language)}
              </p>
            </div>

            <Divider />

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("profile.dateJoined")}
              </label>
              <p className="text-base font-medium">
                {formatDate(user.date_joined)}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {t("profile.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
