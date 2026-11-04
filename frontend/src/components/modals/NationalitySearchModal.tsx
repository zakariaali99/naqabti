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

import nationalitiesApi from "@/api/nationalitiesApi";
import { Nationality } from "@/models/nationality";

interface NationalitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (nationalities: Nationality[]) => void;
  selectedNationalityName?: string;
  selectedNationalities?: Nationality[];
  mode?: "single" | "multiple";
  title?: string;
}

const EMPTY_ARRAY: Nationality[] = [];

export default function NationalitySearchModal({
  isOpen,
  onClose,
  onSelect,
  selectedNationalityName,
  selectedNationalities = EMPTY_ARRAY,
  mode = "single",
  title,
}: NationalitySearchModalProps) {
  const { t } = useTranslation();
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Nationality[]>(selectedNationalities);

  const modalTitle =
    title ||
    (mode === "single"
      ? t("nationalities.modal.selectSingle", "Select Nationality")
      : t("nationalities.modal.selectMultiple", "Select Nationalities"));

  useEffect(() => {
    if (isOpen) {
      if (selectedNationalityName && nationalities.length > 0) {
        const match = nationalities.find(
          (n) => n.name.toLowerCase() === selectedNationalityName.toLowerCase()
        );
        setSelected(match ? [match] : []);
      } else {
        setSelected(selectedNationalities);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchNationalities();
    }
  }, [isOpen]);

  const fetchNationalities = async () => {
    try {
      setLoading(true);
      const response = await nationalitiesApi.getAll();
      const results: Nationality[] = response.data.results || response.data || [];
      setNationalities(results);
      if (selectedNationalityName && results.length > 0) {
        const match = results.find(
          (n: Nationality) => n.name.toLowerCase() === selectedNationalityName.toLowerCase()
        );
        if (match) setSelected([match]);
      }
    } catch (error) {
      console.error("Error fetching nationalities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTranslatedName = (name: string) => {
    return t(`nationalities.list.${name}`, name);
  };

  const filteredNationalities = nationalities.filter((nationality) => {
    const translatedName = getTranslatedName(nationality.name);
    return (
      translatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nationality.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nationality.code && nationality.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleRemoveChip = (nationalityId: number) => {
    setSelected(selected.filter((n) => n.id !== nationalityId));
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
                placeholder={t("nationalities.modal.searchPlaceholder", "Search by name or code...")}
                size="sm"
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                variant="flat"
                onValueChange={setSearchQuery}
              />

              {/* Selected Chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-default-100 rounded-lg">
                  {selected.map((nationality) => (
                    <Chip
                      key={nationality.id}
                      color="primary"
                      endContent={
                        <FiX
                          className="cursor-pointer ml-1"
                          onClick={() => handleRemoveChip(nationality.id)}
                        />
                      }
                      variant="flat"
                      onClose={() => handleRemoveChip(nationality.id)}
                    >
                      {getTranslatedName(nationality.name)} {nationality.code ? `(${nationality.code})` : ""}
                    </Chip>
                  ))}
                </div>
              )}

              {/* Nationality List as Table */}
              <ScrollShadow className="h-80">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner label={t("nationalities.modal.loading", "Loading...")} size="sm" />
                  </div>
                ) : filteredNationalities.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-default-400">
                    {searchQuery
                      ? t("nationalities.modal.noResults", "No results found")
                      : t("nationalities.modal.noNationalities", "No nationalities found")}
                  </div>
                ) : (
                  <Table
                    aria-label="Nationalities table"
                    classNames={{
                      base: "max-h-80 overflow-auto",
                      table: "min-h-[200px]",
                    }}
                    selectedKeys={new Set(selected.map((n) => n.id.toString()))}
                    selectionMode={mode === "multiple" ? "multiple" : "single"}
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        setSelected(filteredNationalities);
                      } else {
                        const selectedIds = Array.from(keys) as string[];
                        const newSelected = filteredNationalities.filter((n) =>
                          selectedIds.includes(n.id.toString()),
                        );

                        setSelected(newSelected);
                      }
                    }}
                    onRowAction={(key) => {
                      const matched = filteredNationalities.find(
                        (n) => n.id.toString() === key.toString()
                      );
                      if (matched) {
                        if (mode === "single") {
                          setSelected((prev) => {
                            const isAlreadySelected = prev.some((n) => n.id === matched.id);
                            return isAlreadySelected ? [] : [matched];
                          });
                        } else {
                          setSelected((prev) => {
                            const isAlreadySelected = prev.some((n) => n.id === matched.id);
                            if (isAlreadySelected) {
                              return prev.filter((n) => n.id !== matched.id);
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
                        {t("nationalities.table.name", "Name")}
                      </TableColumn>
                      <TableColumn key="code">
                        {t("nationalities.table.code", "ISO Code")}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredNationalities.map((nationality) => (
                        <TableRow key={nationality.id}>
                          <TableCell>
                            <p className="font-medium">{getTranslatedName(nationality.name)}</p>
                          </TableCell>
                          <TableCell>
                            {nationality.code ? (
                              <Chip size="sm" variant="flat">
                                {nationality.code}
                              </Chip>
                            ) : "-"}
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
