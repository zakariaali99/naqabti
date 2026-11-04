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
  Select,
  SelectItem,
} from "@heroui/react";
import { FiSearch, FiUser, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import usersApi from "@/api/usersApi";
import { UserEntity } from "@/models/users";
import { PaginatedResponse } from "@/api/client";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: UserEntity) => void;
  selectedUserId?: number;
  userTypeFilter?: "doctor" | "manager" | "all";
  title?: string;
  description?: string;
}

const UserSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedUserId,
  userTypeFilter = "all",
  title,
  description,
}: UserSearchModalProps) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userType, setUserType] = useState<string>(
    userTypeFilter === "all" ? "" : userTypeFilter,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (page = 1, search = "", type = "") => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: 10,
      };

      if (search) {
        params.search = search;
      }

      if (type && type !== "all") {
        params.user_type = type;
      }

      const response = await usersApi.getAll(params);
      const data: PaginatedResponse<UserEntity> = response.data;

      setUsers(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers(currentPage, searchTerm, userType);
    }
  }, [isOpen, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, userType);
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    setCurrentPage(1);
    fetchUsers(1, searchTerm, value);
  };

  const handleSelect = (user: UserEntity) => {
    onSelect(user);
    onClose();
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case "doctor":
        return "primary";
      case "manager":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            {title || t("users.selectUser", "Select User")}
          </h3>
          <p className="text-sm text-default-500">
            {description ||
              t("users.selectUserDesc", "Choose a user from the list below")}
          </p>
        </ModalHeader>

        <ModalBody>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <Input
              className="flex-1"
              placeholder={t(
                "users.search",
                "Search by name, email, or username...",
              )}
              startContent={<FiSearch />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />

            {userTypeFilter === "all" && (
              <Select
                className="w-48"
                placeholder={t("users.userType", "User Type")}
                selectedKeys={userType ? [userType] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  handleUserTypeChange(value || "");
                }}
              >
                <SelectItem key="">
                  {t("users.allTypes", "All Types")}
                </SelectItem>
                <SelectItem key="doctor">
                  {t("users.doctor", "Doctor")}
                </SelectItem>
                <SelectItem key="manager">
                  {t("users.manager", "Manager")}
                </SelectItem>
              </Select>
            )}

            <Button color="primary" onPress={handleSearch}>
              {t("common.search", "Search")}
            </Button>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner label={t("common.loading", "Loading...")} size="lg" />
            </div>
          ) : (
            <>
              <Table aria-label="Users table" selectionMode="single">
                <TableHeader>
                  <TableColumn>{t("users.name", "Name")}</TableColumn>
                  <TableColumn>{t("users.email", "Email")}</TableColumn>
                  <TableColumn>{t("users.userType", "Type")}</TableColumn>
                  <TableColumn>{t("users.specialty", "Specialty")}</TableColumn>
                  <TableColumn>{t("common.status", "Status")}</TableColumn>
                  <TableColumn>{t("common.actions", "Actions")}</TableColumn>
                </TableHeader>
                <TableBody emptyContent={t("users.noData", "No users found")}>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <FiUser className="text-default-400" />
                            <span>{user.full_name || user.username}</span>
                          </div>
                          {user.username !== user.full_name && (
                            <span className="text-sm text-default-500 ml-6">
                              @{user.username}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getUserTypeColor(user.user_type)}
                          size="sm"
                          variant="flat"
                        >
                          {t(`users.${user.user_type}`, user.user_type)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {user.specialty ? (
                          <span className="text-sm">{user.specialty}</span>
                        ) : (
                          <span className="text-sm text-default-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={user.is_active ? "success" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {user.is_active
                            ? t("common.active", "Active")
                            : t("common.inactive", "Inactive")}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          color={
                            selectedUserId === user.id ? "success" : "primary"
                          }
                          isDisabled={!user.is_active}
                          size="sm"
                          startContent={
                            selectedUserId === user.id ? <FiCheck /> : null
                          }
                          variant={
                            selectedUserId === user.id ? "solid" : "light"
                          }
                          onPress={() => handleSelect(user)}
                        >
                          {selectedUserId === user.id
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

export default UserSearchModal;
