import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";

import { DoctorsMembershipData } from "@/api/doctorsMembershipApi";

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RenewMembershipData) => Promise<void>;
  membership: DoctorsMembershipData;
  isLoading?: boolean;
}

export interface RenewMembershipData {
  new_end_date: string;
  amount: number;
  notes?: string;
}

export function RenewMembershipModal({
  isOpen,
  onClose,
  onSubmit,
  membership,
  isLoading = false,
}: RenewMembershipModalProps) {
  const { t } = useTranslation();
  const [newEndDate, setNewEndDate] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && membership) {
      // Calculate default new end date (1 year from current end date or start date)
      const currentEndDate = membership.end_date
        ? new Date(membership.end_date)
        : new Date(membership.start_date);
      const calculatedEndDate = new Date(currentEndDate);

      calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);

      setNewEndDate(calculatedEndDate.toISOString().split("T")[0]);

      // Default amount from membership total amount
      setAmount(membership.total_amount.toString());
      setNotes("");
    }
  }, [isOpen, membership]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      new_end_date: newEndDate,
      amount: parseFloat(amount) || 0,
      notes,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              {t("membership.renewMembership")}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">
                    {t("membership.currentEndDate")}
                  </p>
                  <p className="font-semibold">
                    {membership.end_date
                      ? new Date(membership.end_date).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <Input
                  isRequired
                  label={t("membership.newEndDate")}
                  type="date"
                  value={newEndDate}
                  onValueChange={setNewEndDate}
                />

                <Input
                  isRequired
                  label={t("payment.amount")}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">LYD</span>
                    </div>
                  }
                  type="number"
                  value={amount}
                  onValueChange={setAmount}
                />

                <Textarea
                  label={t("common.notes")}
                  value={notes}
                  onValueChange={setNotes}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button color="primary" isLoading={isLoading} type="submit">
                {t("membership.renew")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
