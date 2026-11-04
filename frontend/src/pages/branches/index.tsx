import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Input,
  Avatar,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiPlus,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiChevronRight,
  FiChevronDown,
  FiHome,
  FiGitBranch,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import branchesApi from "@/api/branchesApi";
import { Branch } from "@/models/branch";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Pagination } from "@/components/Pagination";

export default function BranchesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(
    new Set(),
  );
  const pageSize = 10;
  const [ordering, setOrdering] = useState("name");

  const fetchBranches = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: pageSize,
        ordering: ordering,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      const res = await branchesApi.getAll(params);

      setBranches(res.data.results);
      setTotalPages(Math.ceil(res.data.count / pageSize));
    } catch (err) {
      console.error("Failed to fetch branches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches(currentPage);
  }, [currentPage, searchQuery, ordering]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;
    try {
      setDeleteLoading(true);
      await branchesApi.delete(branchToDelete.id);
      setDeleteModalOpen(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (err) {
      console.error("Failed to delete branch", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleExpand = (branchId: number) => {
    setExpandedBranches((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(branchId)) {
        newSet.delete(branchId);
      } else {
        newSet.add(branchId);
      }

      return newSet;
    });
  };

  // Build tree structure from flat list
  const buildTree = (flatList: Branch[]): Branch[] => {
    return branchesApi.buildBranchTree(flatList);
  };

  // Flatten tree for rendering with proper order
  const flattenForDisplay = (tree: Branch[]): Branch[] => {
    const result: Branch[] = [];

    const flatten = (branches: Branch[], level: number = 0) => {
      branches.forEach((branch) => {
        const branchWithLevel = { ...branch, level };

        result.push(branchWithLevel);

        // If branch is expanded and has children, add them
        if (
          expandedBranches.has(branch.id) &&
          branch.children &&
          branch.children.length > 0
        ) {
          flatten(branch.children, level + 1);
        }
      });
    };

    flatten(tree);

    return result;
  };

  const tree = buildTree(branches);
  const displayBranches = flattenForDisplay(tree);

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">{t("branches.title")}</h1>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/branches/add")}
          >
            {t("branches.add")}
          </Button>
        </div>

        <Card className="mb-4">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                placeholder={t("branches.search")}
                startContent={<FiSearch />}
                value={searchQuery}
                onClear={() => handleSearch("")}
                onValueChange={handleSearch}
              />
              <Select
                label={t("common.sortBy", "Sort By")}
                labelPlacement="outside"
                selectedKeys={[ordering]}
                size="sm"
                className="w-40"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  if (key) setOrdering(key);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="name">{t("common.sortNameAsc", "Name (A-Z)")}</SelectItem>
                <SelectItem key="-name">{t("common.sortNameDesc", "Name (Z-A)")}</SelectItem>
                <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
                <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : displayBranches.length === 0 ? (
          <Card>
            <CardBody>
              <div className="flex justify-center items-center h-32 text-default-400">
                {t("branches.noData")}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayBranches.map((branch) => {
              const hasChildren = (branch.children_count ?? 0) > 0;
              const isExpanded = expandedBranches.has(branch.id);
              const level = branch.level ?? 0;

              return (
                <Card
                  key={branch.id}
                  className={level > 0 ? "ms-6 sm:ms-10 border-s-2 border-default-200" : ""}
                >
                  <CardBody className="p-4 sm:p-5">
                    {/* Header row: icon + name/prefix on the start, status + actions on the end */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {hasChildren ? (
                          <button
                            className="p-1 hover:bg-default-100 rounded transition-colors shrink-0"
                            onClick={() => toggleExpand(branch.id)}
                          >
                            {isExpanded ? (
                              <FiChevronDown className="w-4 h-4" />
                            ) : (
                              <FiChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-6 shrink-0" />
                        )}

                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            level > 0
                              ? "bg-warning-50 text-warning"
                              : "bg-primary-50 text-primary"
                          }`}
                        >
                          {level > 0 ? <FiGitBranch size={18} /> : <FiHome size={18} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={level > 0 ? "text-sm" : "font-semibold"}>
                              {branch.name}
                            </span>
                            {hasChildren && (
                              <Chip color="default" size="sm" variant="flat">
                                {branch.children_count}
                              </Chip>
                            )}
                          </div>
                          <Chip className="mt-1" size="sm" variant="flat">
                            {branch.prefix}
                          </Chip>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Chip
                          color={branch.is_active ? "success" : "danger"}
                          size="sm"
                          variant="flat"
                        >
                          {branch.is_active ? t("common.active") : t("common.inactive")}
                        </Chip>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <FiMoreVertical />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key={`edit-${branch.id}`}
                              startContent={<FiEdit />}
                              onPress={() => navigate(`/branches/${branch.id}/edit`)}
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            <DropdownItem
                              key={`delete-${branch.id}`}
                              className="text-danger"
                              color="danger"
                              startContent={<FiTrash2 />}
                              onPress={() => handleDeleteClick(branch)}
                            >
                              {t("common.delete")}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>

                    {/* Contact info: label-beside-value pairs that wrap naturally */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-default-400">
                          {t("branches.table.manager")}:
                        </span>
                        {branch.manager_details ? (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Avatar
                              className="shrink-0"
                              name={
                                branch.manager_details.full_name ||
                                branch.manager_details.username
                              }
                              size="sm"
                              src={branch.manager_details.profile_image}
                            />
                            <span className="truncate">
                              {branch.manager_details.full_name ||
                                branch.manager_details.username}
                            </span>
                          </span>
                        ) : (
                          <span className="text-default-400">
                            {t("branches.form.noManager")}
                          </span>
                        )}
                      </div>

                      {branch.city && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-default-400">{t("branches.table.city")}:</span>
                          <span className="truncate">{branch.city}</span>
                        </div>
                      )}

                      {branch.phone && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-default-400">{t("branches.table.phone")}:</span>
                          <span className="truncate">{branch.phone}</span>
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-default-400">{t("branches.table.email")}:</span>
                          <span className="truncate">{branch.email}</span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        <DeleteConfirmModal
          isLoading={deleteLoading}
          isOpen={deleteModalOpen}
          itemName={branchToDelete ? branchToDelete.name : ""}
          title={t("branches.delete")}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
