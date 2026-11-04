import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const defaultTitle = title || t("common.confirmDelete");
  const defaultMessage =
    message ||
    (itemName
      ? t("common.confirmDeleteItem", { item: itemName })
      : t("common.confirmDeleteMessage"));

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      onOpenChange={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-danger">{defaultTitle}</h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-600">{defaultMessage}</p>
          <p className="text-sm text-default-500">
            {t("common.actionCannotBeUndone")}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button disabled={isLoading} variant="light" onPress={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            color="danger"
            disabled={isLoading}
            isLoading={isLoading}
            onPress={onConfirm}
          >
            {t("common.delete")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
