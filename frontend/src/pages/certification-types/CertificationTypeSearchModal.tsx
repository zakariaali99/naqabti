import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Pagination,
} from "@heroui/react";
import { FiSearch, FiAward, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import certificationTypesApi from "@/api/certificationTypesApi";
import { CertificationType } from "@/models/certificationTypes";
import { PaginatedResponse } from "@/api/client";

interface CertificationTypeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (certificationType: CertificationType) => void;
  selectedCertificationTypeId?: number;
}

const CertificationTypeSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedCertificationTypeId,
}: CertificationTypeSearchModalProps) => {
  const { t } = useTranslation();
  const [certificationTypes, setCertificationTypes] = useState<
    CertificationType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCertificationTypes = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = {
        page,
        search: search || undefined,
        page_size: 10,
      };

      const response = await certificationTypesApi.getAll(params);
      const data: PaginatedResponse<CertificationType> = response.data;

      setCertificationTypes(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching certification types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCertificationTypes(currentPage, searchTerm);
    }
  }, [isOpen, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCertificationTypes(1, searchTerm);
  };

  const handleSelect = (certificationType: CertificationType) => {
    onSelect(certificationType);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            {t("certificationTypes.selectType", "Select Certification Type")}
          </h3>
          <p className="text-sm text-default-500">
            {t(
              "certificationTypes.selectTypeDesc",
              "Choose a certification type from the list below",
            )}
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Search Input with label */}
          <div className="mb-4">
            <div className="flex gap-4 items-end">
              <Input
                className="flex-1"
                id="certification-type-search"
                label={t("certificationTypes.search.label", "Search")}
                labelPlacement="outside"
                placeholder={t(
                  "certificationTypes.search.placeholder",
                  "Search certification types...",
                )}
                startContent={<FiSearch />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button color="primary" onPress={handleSearch}>
                {t("common.search", "Search")}
              </Button>
            </div>
          </div>

          {/* Certification Types Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner label={t("common.loading", "Loading...")} size="lg" />
            </div>
          ) : (
            <>
              <Table
                aria-label="Certification types table"
                selectionMode="single"
                shadow="none"
              >
                <TableHeader>
                  <TableColumn>
                    {t("certificationTypes.fields.name", "Name")}
                  </TableColumn>
                  <TableColumn>
                    {t("certificationTypes.fields.description", "Description")}
                  </TableColumn>
                  <TableColumn>{t("common.status", "Status")}</TableColumn>
                  <TableColumn>{t("common.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t(
                    "certificationTypes.noData",
                    "No certification types found",
                  )}
                >
                  {certificationTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FiAward className="text-default-400" />
                          <span>{type.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600">
                          {type.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={type.is_renewable ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {type.is_renewable
                            ? t("certificationTypes.renewable", "Renewable")
                            : t(
                                "certificationTypes.nonRenewable",
                                "Non-Renewable",
                              )}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          color={
                            selectedCertificationTypeId === type.id
                              ? "success"
                              : "primary"
                          }
                          size="sm"
                          startContent={
                            selectedCertificationTypeId === type.id ? (
                              <FiCheck />
                            ) : null
                          }
                          variant={
                            selectedCertificationTypeId === type.id
                              ? "solid"
                              : "light"
                          }
                          onPress={() => handleSelect(type)}
                        >
                          {selectedCertificationTypeId === type.id
                            ? t("common.selected", "Selected")
                            : t("common.select", "Select")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    showControls
                    page={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CertificationTypeSearchModal;
