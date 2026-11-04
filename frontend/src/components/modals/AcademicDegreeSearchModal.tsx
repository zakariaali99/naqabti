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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { FiSearch, FiX } from "react-icons/fi";

import academicDegreesApi from "@/api/academicDegreesApi";
import { AcademicDegree } from "@/models/academicDegree";

interface AcademicDegreeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (academicDegrees: AcademicDegree[]) => void;
  selectedAcademicDegreeName?: string;
  selectedAcademicDegrees?: AcademicDegree[];
  mode?: "single" | "multiple";
  title?: string;
}

const EMPTY_ARRAY: AcademicDegree[] = [];

export default function AcademicDegreeSearchModal({
  isOpen,
  onClose,
  onSelect,
  selectedAcademicDegreeName,
  selectedAcademicDegrees = EMPTY_ARRAY,
  mode = "single",
  title,
}: AcademicDegreeSearchModalProps) {
  const { t } = useTranslation();
  const [academicDegrees, setAcademicDegrees] = useState<AcademicDegree[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<AcademicDegree[]>(selectedAcademicDegrees);

  const modalTitle =
    title ||
    (mode === "single"
      ? t("academicDegrees.modal.selectSingle", "Select Academic Degree")
      : t("academicDegrees.modal.selectMultiple", "Select Academic Degrees"));

  useEffect(() => {
    if (isOpen) {
      if (selectedAcademicDegreeName && academicDegrees.length > 0) {
        const match = academicDegrees.find(
          (d) => d.name.toLowerCase() === selectedAcademicDegreeName.toLowerCase()
        );
        setSelected(match ? [match] : []);
      } else {
        setSelected(selectedAcademicDegrees);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchAcademicDegrees();
    }
  }, [isOpen]);

  const fetchAcademicDegrees = async () => {
    try {
      setLoading(true);
      const response = await academicDegreesApi.getAll();
      const results: AcademicDegree[] = response.data.results || response.data || [];
      setAcademicDegrees(results);
      if (selectedAcademicDegreeName && results.length > 0) {
        const match = results.find(
          (d: AcademicDegree) => d.name.toLowerCase() === selectedAcademicDegreeName.toLowerCase()
        );
        if (match) setSelected([match]);
      }
    } catch (error) {
      console.error("Error fetching academic degrees:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedName = (name: string) => {
    return t(`academicDegrees.list.${name.toLowerCase()}`, name);
  };

  const filteredAcademicDegrees = academicDegrees.filter((degree) => {
    const translatedName = getTranslatedName(degree.name);
    return (
      translatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      degree.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleRemoveChip = (degreeId: number) => {
    setSelected(selected.filter((d) => d.id !== degreeId));
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
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
              {/* Search Input */}
              <Input
                placeholder={t("academicDegrees.modal.searchPlaceholder", "Search by name...")}
                size="sm"
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                variant="flat"
                onValueChange={setSearchQuery}
              />

              {/* Selected Chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-default-100 rounded-lg">
                  {selected.map((degree) => (
                    <Chip
                      key={degree.id}
                      color="primary"
                      endContent={
                        <FiX
                          className="cursor-pointer ml-1"
                          onClick={() => handleRemoveChip(degree.id)}
                        />
                      }
                      variant="flat"
                      onClose={() => handleRemoveChip(degree.id)}
                    >
                      {getTranslatedName(degree.name)}
                    </Chip>
                  ))}
                </div>
              )}

              {/* Academic Degree List as Table */}
              <ScrollShadow className="h-80">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner label={t("academicDegrees.modal.loading", "Loading...")} size="sm" />
                  </div>
                ) : filteredAcademicDegrees.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-default-400">
                    {searchQuery
                      ? t("academicDegrees.modal.noResults", "No results found")
                      : t("academicDegrees.modal.noDegrees", "No academic degrees found")}
                  </div>
                ) : (
                  <Table
                    aria-label="Academic degrees table"
                    classNames={{
                      base: "max-h-80 overflow-auto",
                      table: "min-h-[200px]",
                    }}
                    selectedKeys={new Set(selected.map((d) => d.id.toString()))}
                    selectionMode={mode === "multiple" ? "multiple" : "single"}
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        setSelected(filteredAcademicDegrees);
                      } else {
                        const selectedIds = Array.from(keys) as string[];
                        const newSelected = filteredAcademicDegrees.filter((d) =>
                          selectedIds.includes(d.id.toString()),
                        );

                        setSelected(newSelected);
                      }
                    }}
                    onRowAction={(key) => {
                      const matched = filteredAcademicDegrees.find(
                        (d) => d.id.toString() === key.toString()
                      );
                      if (matched) {
                        if (mode === "single") {
                          setSelected((prev) => {
                            const isAlreadySelected = prev.some((d) => d.id === matched.id);
                            return isAlreadySelected ? [] : [matched];
                          });
                        } else {
                          setSelected((prev) => {
                            const isAlreadySelected = prev.some((d) => d.id === matched.id);
                            if (isAlreadySelected) {
                              return prev.filter((d) => d.id !== matched.id);
                            } else {
                              return [...prev, matched];
                            }
                          });
                        }
                      }
                    }}
                  >
                    <TableHeader>
                      <TableColumn key="name">
                        {t("academicDegrees.table.name", "Name")}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredAcademicDegrees.map((degree) => (
                        <TableRow key={degree.id}>
                          <TableCell>
                            <p className="font-medium">{getTranslatedName(degree.name)}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollShadow>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                color="primary"
                disabled={selected.length === 0}
                onPress={handleConfirm}
              >
                {t("common.select", "Select")} ({selected.length})
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
