import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import {
  ProfileCompletionField,
  PROFILE_FIELD_LABEL_KEYS,
} from "@/utils/profileCompletion";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  percentage?: number;
  missingFields?: ProfileCompletionField[];
  completedFields?: ProfileCompletionField[];
  nameMissingFields?: ProfileCompletionField[];
  nameCompletedFields?: ProfileCompletionField[];
}

const CompleteProfileModal = ({
  isOpen,
  onClose,
  onConfirm,
  percentage,
  missingFields = [],
  completedFields = [],
  nameMissingFields = [],
  nameCompletedFields = [],
}: CompleteProfileModalProps) => {
  const { t } = useTranslation();

  // Show the individual name fields (First/Father/Grandfather/Family Name)
  // in place of the single "Full Name" point.
  const displayedCompletedFields = [
    ...completedFields.filter((field) => field !== "full_name"),
    ...nameCompletedFields,
  ];
  const displayedMissingFields = [
    ...missingFields.filter((field) => field !== "full_name"),
    ...nameMissingFields,
  ];

  return (
    <Modal isOpen={isOpen} placement="center" size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-warning/10 text-warning">
            <FiAlertCircle size={20} />
          </div>
          {t("member.completeProfileModalTitle")}
        </ModalHeader>
        <ModalBody>
          <p className="text-default-600">
            {t("member.completeProfileModalMessage")}
          </p>

          {typeof percentage === "number" && (
            <div className="mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-default-500">
                  {t("member.profileCompletion")}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {percentage}%
                </span>
              </div>
              <Progress
                color="primary"
                radius="full"
                size="sm"
                value={percentage}
              />
            </div>
          )}

          {displayedCompletedFields.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-default-500 mb-2">
                {t("member.completedFieldsHint")}
              </p>
              <ul className="space-y-1.5">
                {displayedCompletedFields.map((field) => (
                  <li
                    key={field}
                    className="flex items-center gap-2 text-sm text-default-600"
                  >
                    <FiCheckCircle
                      className="text-success shrink-0"
                      size={14}
                    />
                    {t(PROFILE_FIELD_LABEL_KEYS[field])}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {displayedMissingFields.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-default-500 mb-2">
                {t("member.missingFieldsHint")}
              </p>
              <ul className="space-y-1.5">
                {displayedMissingFields.map((field) => (
                  <li
                    key={field}
                    className="flex items-center gap-2 text-sm text-default-600"
                  >
                    <FiAlertCircle className="text-warning shrink-0" size={14} />
                    {t(PROFILE_FIELD_LABEL_KEYS[field])}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onConfirm ?? onClose}>
            {t("member.completeProfileModalCta")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CompleteProfileModal;
