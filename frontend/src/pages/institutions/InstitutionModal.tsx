import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  ScrollShadow,
  Chip,
  Spinner,
} from "@heroui/react";
import { FiSearch, FiX } from "react-icons/fi";

import institutionsApi from "@/api/institutionsApi";
import { Institution } from "@/models/institution";

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (institutions: Institution[]) => void;
  selectedInstitutions?: Institution[];
  mode?: "single" | "multiple";
  title?: string;
}

export default function InstitutionModal({
  isOpen,
  onClose,
  onSelect,
  selectedInstitutions = [],
  mode = "multiple",
  title,
}: InstitutionModalProps) {
  const { t } = useTranslation();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Institution[]>(selectedInstitutions);

  const modalTitle =
    title || (t("institutions.modal.select") || "Select Institutions");

  useEffect(() => {
    setSelected(selectedInstitutions);
  }, [selectedInstitutions]);

  useEffect(() => {
    if (isOpen) {
      fetchInstitutions();
    }
  }, [isOpen]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await institutionsApi.getAll();

      setInstitutions(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRemoveChip = (institutionId: number) => {
    setSelected(selected.filter((b) => b.id !== institutionId));
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const isSelected = (id: number) => selected.some((s) => s.id === id);

  const toggleSelect = (institution: Institution) => {
    if (mode === "single") {
      setSelected([institution]);
      return;
    }
    if (isSelected(institution.id)) {
      setSelected(selected.filter((s) => s.id !== institution.id));
    } else {
      setSelected([...selected, institution]);
    }
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      scrollBehavior="inside"
      size="lg"
      onClose={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {modalTitle}
            </ModalHeader>

            <ModalBody>
              <Input
                placeholder="Search institutions..."
                size="sm"
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                variant="flat"
                onValueChange={setSearchQuery}
              />

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-default-100 rounded-lg">
                  {selected.map((inst) => (
                    <Chip
                      key={inst.id}
                      color="primary"
                      endContent={
                        <FiX
                          className="cursor-pointer ml-1"
                          onClick={() => handleRemoveChip(inst.id)}
                        />
                      }
                      variant="flat"
                      onClose={() => handleRemoveChip(inst.id)}
                    >
                      {inst.name}
                    </Chip>
                  ))}
                </div>
              )}

              <ScrollShadow className="h-80">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner label="Loading..." size="sm" />
                  </div>
                ) : filteredInstitutions.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-default-400">
                    {searchQuery
                      ? "No results found"
                      : "No institutions available"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredInstitutions.map((inst) => (
                      <div
                        key={inst.id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected(inst.id)
                            ? "bg-primary-50 border border-primary-200"
                            : "hover:bg-default-100 border border-transparent"
                        }`}
                        onClick={() => toggleSelect(inst)}
                      >
                        <div>
                          <p className="font-medium">{inst.name}</p>
                          <p className="text-xs text-default-400">
                            {inst.email || inst.phone || "-"}
                          </p>
                        </div>
                        {isSelected(inst.id) && (
                          <Chip color="primary" size="sm" variant="flat">
                            Selected
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                {t("branches.modal.cancel")}
              </Button>
              <Button
                color="primary"
                disabled={selected.length === 0}
                onPress={handleConfirm}
              >
                {t("branches.modal.select")} ({selected.length})
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
