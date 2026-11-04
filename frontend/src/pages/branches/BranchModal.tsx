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

import branchesApi from "@/api/branchesApi";
import { Branch } from "@/models/branch";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (branches: Branch[]) => void;
  selectedBranches?: Branch[];
  mode?: "single" | "multiple";
  title?: string;
}

export default function BranchModal({
  isOpen,
  onClose,
  onSelect,
  selectedBranches = [],
  mode = "single",
  title,
}: BranchModalProps) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Branch[]>(selectedBranches);

  const modalTitle =
    title ||
    (mode === "single"
      ? t("branches.modal.selectSingle")
      : t("branches.modal.selectMultiple"));

  useEffect(() => {
    setSelected(selectedBranches);
  }, [selectedBranches]);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesApi.getActiveBranches();

      setBranches(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.prefix.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRemoveChip = (branchId: number) => {
    setSelected(selected.filter((b) => b.id !== branchId));
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
                placeholder={t("branches.modal.searchPlaceholder")}
                size="sm"
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                variant="flat"
                onValueChange={setSearchQuery}
              />

              {/* Selected Chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-default-100 rounded-lg">
                  {selected.map((branch) => (
                    <Chip
                      key={branch.id}
                      color="primary"
                      endContent={
                        <FiX
                          className="cursor-pointer ml-1"
                          onClick={() => handleRemoveChip(branch.id)}
                        />
                      }
                      variant="flat"
                      onClose={() => handleRemoveChip(branch.id)}
                    >
                      {branch.name} ({branch.prefix})
                    </Chip>
                  ))}
                </div>
              )}

              {/* Branch List as Table */}
              <ScrollShadow className="h-80">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner label={t("branches.modal.loading")} size="sm" />
                  </div>
                ) : filteredBranches.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-default-400">
                    {searchQuery
                      ? t("branches.modal.noResults")
                      : t("branches.modal.noBranches")}
                  </div>
                ) : (
                  <Table
                    aria-label="Branches table"
                    classNames={{
                      base: "max-h-80 overflow-auto",
                      table: "min-h-[200px]",
                    }}
                    selectedKeys={new Set(selected.map((b) => b.id.toString()))}
                    selectionMode={mode === "multiple" ? "multiple" : "single"}
                    onSelectionChange={(keys) => {
                      if (keys === "all") {
                        setSelected(filteredBranches);
                      } else {
                        const selectedIds = Array.from(keys) as string[];
                        const newSelected = filteredBranches.filter((b) =>
                          selectedIds.includes(b.id.toString()),
                        );

                        setSelected(newSelected);
                      }
                    }}
                  >
                    <TableHeader>
                      <TableColumn key="name">
                        {t("branches.table.name")}
                      </TableColumn>
                      <TableColumn key="prefix">
                        {t("branches.table.prefix")}
                      </TableColumn>
                      <TableColumn key="city">
                        {t("branches.table.city")}
                      </TableColumn>
                      <TableColumn key="phone">
                        {t("branches.table.phone")}
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredBranches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell>
                            <p className="font-medium">{branch.name}</p>
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat">
                              {branch.prefix}
                            </Chip>
                          </TableCell>
                          <TableCell>{branch.city || "-"}</TableCell>
                          <TableCell>{branch.phone || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
