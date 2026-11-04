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
} from '@heroui/react';
import { FiSearch, FiPackage, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import membershipTypesApi from '@/api/membershipTypesApi';
import { MembershipTypeModel } from '@/models/membershipTypes';
import { PaginatedResponse } from '@/api/client';
import { formatCurrency } from '@/misc/formatCurrency';

interface MembershipTypeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (membershipType: MembershipTypeModel) => void;
  selectedMembershipTypeId?: number;
  // undefined = no degree filtering; null = doctor has no degree (only
  // degree-agnostic types); number = doctor's academic degree id.
  degreeFilter?: number | null;
}

const MembershipTypeSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedMembershipTypeId,
  degreeFilter,
}: MembershipTypeSearchModalProps) => {
  const { t } = useTranslation();
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeModel[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMembershipTypes = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = {
        page,
        search: search || undefined,
        page_size: 10,
        for_degree:
          degreeFilter === undefined
            ? undefined
            : degreeFilter === null
              ? "null"
              : degreeFilter,
      };

      const response = await membershipTypesApi.getAll(params);
      const data: PaginatedResponse<MembershipTypeModel> = response.data;

      setMembershipTypes(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching membership types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembershipTypes(currentPage, searchTerm);
    }
  }, [isOpen, currentPage, degreeFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembershipTypes(1, searchTerm);
  };

  const handleSelect = (membershipType: MembershipTypeModel) => {
    onSelect(membershipType);
    onClose();
  };

  const formatPrice = (price: string) => {
    return formatCurrency(parseFloat(price));
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            {t("membershipTypes.selectType", "Select Membership Type")}
          </h3>
          <p className="text-sm text-default-500">
            {t(
              "membershipTypes.selectTypeDesc",
              "Choose a membership type from the list below",
            )}
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Search Input with label */}
          <div className="mb-4">
            <div className="flex gap-4 items-end">
              <Input
                className="flex-1"
                id="membership-type-search"
                label={t("membershipTypes.search.label")}
                labelPlacement="outside"
                placeholder={t("membershipTypes.search.placeholder")}
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

          {/* Membership Types Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner label={t("common.loading", "Loading...")} size="lg" />
            </div>
          ) : (
            <>
              <Table
                aria-label="Membership types table"
                selectionMode="single"
                shadow="none"
              >
                <TableHeader>
                  <TableColumn>
                    {t("membershipTypes.fields.name", "Name")}
                  </TableColumn>
                  <TableColumn>
                    {t("membershipTypes.fields.duration", "Duration")}
                  </TableColumn>
                  <TableColumn>
                    {t("membershipTypes.fields.price", "Price")}
                  </TableColumn>
                  <TableColumn>
                    {t("membershipTypes.fields.academicDegree", "Academic Degree")}
                  </TableColumn>
                  <TableColumn>{t("common.status", "Status")}</TableColumn>
                  <TableColumn>{t("common.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={t(
                    "membershipTypes.noData",
                    "No membership types found",
                  )}
                >
                  {membershipTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <FiPackage className="text-default-400" />
                            <span>{type.name}</span>
                          </div>
                          {type.description && (
                            <span className="text-sm text-default-500 ml-6">
                              {type.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {type.duration_months}{" "}
                          {t("membershipTypes.months", "months")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-success">
                          {formatPrice(type.price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-500">
                          {type.academic_degree_name ||
                            t("membershipTypes.allDegrees", "All degrees")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={type.is_active ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {type.is_active
                            ? t("common.active", "Active")
                            : t("common.inactive", "Inactive")}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          color={
                            selectedMembershipTypeId === type.id
                              ? "success"
                              : "primary"
                          }
                          isDisabled={!type.is_active}
                          size="sm"
                          startContent={
                            selectedMembershipTypeId === type.id ? (
                              <FiCheck />
                            ) : null
                          }
                          variant={
                            selectedMembershipTypeId === type.id
                              ? "solid"
                              : "light"
                          }
                          onPress={() => handleSelect(type)}
                        >
                          {selectedMembershipTypeId === type.id
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

export default MembershipTypeSearchModal;
