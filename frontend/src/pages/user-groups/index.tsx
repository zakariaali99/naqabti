import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiUsers,
  FiShield,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import userGroupsApi from "@/api/userGroupsApi";
import { UserGroup } from "@/models/userGroups";

export default function UserGroupsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 12;
  const [ordering, setOrdering] = useState("-created_at");

  // Fetch groups data
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchQuery,
        page: currentPage,
        page_size: pageSize,
        ordering: ordering,
      };

      const response = await userGroupsApi.getAll(params);

      setGroups(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [currentPage, searchQuery, ordering]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle delete
  const handleDeleteClick = (group: UserGroup) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    try {
      setDeleteLoading(true);
      await userGroupsApi.delete(groupToDelete.id);
      setDeleteModalOpen(false);
      setGroupToDelete(null);
      fetchGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-default-900">
              {t("permissionGroups.title")}
            </h1>
            <p className="text-sm text-default-600 mt-1">
              {t("common.total", "Total")}: {totalCount}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/user-groups/add")}
          >
            {t("permissionGroups.add")}
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="flex-1"
                placeholder={t("permissionGroups.searchPlaceholder")}
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                onClear={() => handleSearch("")}
                onValueChange={handleSearch}
              />
              <Select
                className="w-40"
                label={t("common.sortBy", "Sort By")}
                labelPlacement="outside"
                selectedKeys={[ordering]}
                size="sm"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  if (key) setOrdering(key);
                  setCurrentPage(1);
                }}
              >
                <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
                <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Groups Cards */}
        <Card>
          <CardBody className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-default-400">
                <FiUsers className="mb-4" size={48} />
                <p>{t("permissionGroups.noRecords")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Card
                    key={group.id}
                    className="border hover:border-default-400 border-default-100"
                  >
                    <CardBody className="p-4">
                      <div className="space-y-3">
                        {/* Header with icon and actions */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                              <FiShield className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-default-900 truncate">
                                {group.name}
                              </h3>
                            </div>
                          </div>

                          {/* Actions dropdown */}
                          <Dropdown>
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <FiMoreVertical />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                startContent={<FiEdit />}
                                onPress={() =>
                                  navigate(`/user-groups/${group.id}/edit`)
                                }
                              >
                                {t("common.edit")}
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<FiTrash2 />}
                                onPress={() => handleDeleteClick(group)}
                              >
                                {t("common.delete")}
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        {/* Description */}
                        {group.description && (
                          <p className="text-sm text-default-600 line-clamp-2">
                            {group.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 pt-2 border-t border-default-100">
                          <div className="flex items-center gap-2">
                            <FiUsers className="text-default-400" size={16} />
                            <span className="text-sm text-default-600">
                              <span className="font-semibold text-default-900">
                                {group.member_count || 0}
                              </span>{" "}
                              {t("permissionGroups.table.members")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiShield className="text-default-400" size={16} />
                            <span className="text-sm text-default-600">
                              <span className="font-semibold text-default-900">
                                {group.permissions?.length || 0}
                              </span>{" "}
                              {t("permissionGroups.table.permissions")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isLoading={deleteLoading}
        isOpen={deleteModalOpen}
        itemName={groupToDelete ? groupToDelete.name : ""}
        message={t("permissionGroups.messages.deleteConfirm")}
        title={t("permissionGroups.delete")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DefaultLayout>
  );
}
