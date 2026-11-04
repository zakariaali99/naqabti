import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { FiDownload, FiX } from "react-icons/fi";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null | undefined;
  title?: string;
}

function isPdf(url: string): boolean {
  return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("/pdf");
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  url,
  title,
}: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const heading = title || t("payments.documentPreview");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <span>{heading}</span>
        </ModalHeader>

        <ModalBody className="p-0">
          {!url ? (
            <div className="flex items-center justify-center h-64 text-default-400">
              {t("payments.noDocument")}
            </div>
          ) : isPdf(url) ? (
            <iframe
              src={url}
              title={heading}
              className="w-full"
              style={{ height: "70vh", border: "none" }}
            />
          ) : (
            <div className="flex items-center justify-center p-4 bg-default-50 min-h-64">
              <img
                src={url}
                alt={heading}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {url && (
            <Button
              as="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              variant="flat"
              startContent={<FiDownload size={16} />}
            >
              {t("common.download")}
            </Button>
          )}
          <Button
            variant="light"
            startContent={<FiX size={16} />}
            onPress={onClose}
          >
            {t("common.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
