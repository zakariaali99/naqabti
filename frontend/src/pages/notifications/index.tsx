import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Card,
  CardBody,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiTrash2,
  FiSearch,
  FiBell,
  FiUsers,
  FiSend,
  FiClock,
  FiEye,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import notificationsApi from "@/api/notificationsApi";
import { AggregatedNotification } from "@/models/notifications";
import { formatDate, formatTime } from '@/misc/formatDate';

export default function NotificationsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AggregatedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState("-latest_created_at");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDeleteTitle, setNotificationToDeleteTitle] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [targetFilter, setTargetFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const pageSize = 10;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        search: searchQuery,
        source: sourceFilter || undefined,
        notification_type: typeFilter || undefined,
        send_to_all_devices: targetFilter === "broadcast" ? "true" : (targetFilter === "direct" ? "false" : undefined),
        created_after: dateFrom || undefined,
        created_before: dateTo ? `${dateTo}T23:59:59` : undefined,
        page: currentPage,
        page_size: pageSize,
        ordering: ordering,
      };

      const response = await notificationsApi.getAggregated(params);
      const data = response.data;

      setNotifications(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.max(1, Math.ceil((data.count || 0) / pageSize)));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, searchQuery, sourceFilter, typeFilter, targetFilter, dateFrom, dateTo, ordering]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSourceChange = (key: any) => {
    setSourceFilter(key as string);
    setCurrentPage(1);
  };

  const handleDeleteClick = (notification: AggregatedNotification) => {
    setNotificationToDeleteTitle(notification.title);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const notification = notifications.find(n => n.title === notificationToDeleteTitle);
      const batchId = notification?.batch_id;
      if (batchId) {
        await notificationsApi.collectionAction(
          "delete_by_batch",
          { batch_id: batchId }
        );
      } else if (notification?.id) {
        await notificationsApi.cancel(notification.id);
      }
      setDeleteModalOpen(false);
      setNotificationToDeleteTitle("");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'content', label: t('notifications.table.title') },
    { key: 'sender', label: t('notifications.table.sender', 'Sent By') },
    { key: 'delivery', label: t('notifications.table.delivery', 'Delivery') },
    { key: 'created_at', label: t('notifications.table.sentAt') },
    { key: 'actions', label: t('notifications.table.actions') },
  ];

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
            <p className="text-default-600 mt-1">
              {t("common.totalRecords", { count: totalCount })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              color="secondary"
              startContent={<FiUsers />}
              onPress={() => navigate("/notifications/bulk")}
            >
              {t("notifications.sendBulk")}
            </Button>
            <Button
              color="primary"
              startContent={<FiBell />}
              onPress={() => navigate("/notifications/send")}
            >
              {t("notifications.sendSingle")}
            </Button>
          </div>
        </div>

        {/* Search & Tabs */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs 
                  selectedKey={sourceFilter} 
                  onSelectionChange={handleSourceChange}
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12 text-base font-semibold",
                  }}
                >
                  <Tab key="" title={t("notifications.all", "All")} />
                  <Tab key="system" title={t("notifications.system", "System Generated")} />
                  <Tab key="manual" title={t("notifications.manual", "Admin/Manager sent")} />
                </Tabs>
                
                <div className="flex items-center gap-4">
                  <Input
                    placeholder={t('notifications.searchPlaceholder')}
                    startContent={<FiSearch />}
                    value={searchQuery}
                    onValueChange={handleSearch}
                    className="w-full md:w-72"
                    isClearable
                    variant="bordered"
                  />
                  <Select
                    className="w-full md:w-48"
                    placeholder={t("common.sortBy", "Sort By")}
                    selectedKeys={[ordering]}
                    variant="bordered"
                    onSelectionChange={(keys: any) => {
                      setOrdering((Array.from(keys)[0] as string) || "-latest_created_at");
                      setCurrentPage(1);
                    }}
                  >
                    <SelectItem key="-latest_created_at">{t("notifications.sort.newest", "Newest Sent")}</SelectItem>
                    <SelectItem key="latest_created_at">{t("notifications.sort.oldest", "Oldest Sent")}</SelectItem>
                    <SelectItem key="-recipient_count">{t("notifications.sort.recipientsDesc", "Most Recipients")}</SelectItem>
                    <SelectItem key="recipient_count">{t("notifications.sort.recipientsAsc", "Fewest Recipients")}</SelectItem>
                    <SelectItem key="-seen_count">{t("notifications.sort.seenDesc", "Most Read")}</SelectItem>
                    <SelectItem key="seen_count">{t("notifications.sort.seenAsc", "Fewest Read")}</SelectItem>
                  </Select>

                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => setShowAdvanced(!showAdvanced)}
                    title={t("common.advancedFilters", "Advanced Filters")}
                  >
                    {showAdvanced ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                  </Button>

                  {(searchQuery || typeFilter || targetFilter || dateFrom || dateTo) && (
                    <Button
                      variant="light"
                      color="danger"
                      onPress={() => {
                        setSearchQuery('');
                        setTypeFilter('');
                        setTargetFilter('');
                        setDateFrom('');
                        setDateTo('');
                        setCurrentPage(1);
                      }}
                      startContent={<FiX />}
                    >
                      {t('common.clearFilters', { defaultValue: 'Clear' })}
                    </Button>
                  )}
                </div>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-default-50 rounded-xl border border-default-200 animate-appearance-in">
                  <Select
                    label={t("notifications.filters.type", "Notification Type")}
                    selectedKeys={typeFilter ? [typeFilter] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      setTypeFilter(Array.from(keys)[0] as string || "");
                      setCurrentPage(1);
                    }}
                  >
                    <SelectItem key="info">{t("notifications.types.info", "Information")}</SelectItem>
                    <SelectItem key="warning">{t("notifications.types.warning", "Warning")}</SelectItem>
                    <SelectItem key="error">{t("notifications.types.error", "Error")}</SelectItem>
                    <SelectItem key="success">{t("notifications.types.success", "Success")}</SelectItem>
                  </Select>

                  <Select
                    label={t("notifications.filters.target", "Target Audience")}
                    selectedKeys={targetFilter ? [targetFilter] : []}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      setTargetFilter(Array.from(keys)[0] as string || "");
                      setCurrentPage(1);
                    }}
                  >
                    <SelectItem key="broadcast">{t("notifications.targets.broadcast", "All Devices")}</SelectItem>
                    <SelectItem key="direct">{t("notifications.targets.direct", "Specific Users")}</SelectItem>
                  </Select>

                  <Input
                    label={t("common.dateFrom", "Date From")}
                    placeholder=" "
                    type="date"
                    value={dateFrom}
                    variant="bordered"
                    onValueChange={(val) => {
                      setDateFrom(val);
                      setCurrentPage(1);
                    }}
                  />

                  <Input
                    label={t("common.dateTo", "Date To")}
                    placeholder=" "
                    type="date"
                    value={dateTo}
                    variant="bordered"
                    onValueChange={(val) => {
                      setDateTo(val);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table aria-label="Notifications table" removeWrapper>
                    <TableHeader>
                      {columns.map((column) => (
                        <TableColumn key={column.key}>
                          {column.label}
                        </TableColumn>
                      ))}
                    </TableHeader>
                    <TableBody emptyContent={t("notifications.noRecords")}>
                      {notifications.map((notification, i) => (
                        <TableRow key={notification.batch_id || i}>
                          <TableCell>
                            <div className="flex flex-col max-w-sm">
                              <span className="font-bold text-sm text-foreground">
                                {notification.title}
                              </span>
                              <p className="text-xs text-default-500 line-clamp-1" title={notification.message}>
                                {notification.message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-default-600">
                              {notification.created_by_name || t('notifications.system', 'System')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <FiSend size={14} className="text-default-400" />
                                <span className="text-sm font-semibold text-foreground">
                                  {notification.recipient_count}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FiEye size={14} className="text-default-400" />
                                <span className="text-sm text-default-500">
                                  {notification.seen_count}
                                </span>
                              </div>
                              {notification.send_to_all_devices && (
                                <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
                                  {t('notifications.form.sendToAllDevices', 'All')}
                                </Chip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="font-medium text-foreground">{formatDate(notification.created_at)}</span>
                              <span className="text-xs text-default-400">{formatTime(notification.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteClick(notification)}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-default-500 py-8">
                      {t("notifications.noRecords")}
                    </p>
                  ) : (
                    notifications.map((notification, i) => (
                      <Card key={notification.batch_id || i} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">
                                {notification.title}
                              </h3>
                              <p className="text-xs text-default-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDeleteClick(notification)}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-default-500">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <FiSend size={12} />
                                <span>{notification.recipient_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FiEye size={12} />
                                <span>{notification.seen_count}</span>
                              </div>
                              {notification.send_to_all_devices && (
                                <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
                                  All
                                </Chip>
                              )}
                            </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-default-400">
                                  {notification.created_by_name || "System"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FiClock size={12} />
                                <span>{formatDate(notification.created_at)} {formatTime(notification.created_at)}</span>
                              </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
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
        itemName={notificationToDeleteTitle || ""}
        message={t("notifications.confirmations.deleteMessage")}
        title={t("notifications.delete")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DefaultLayout>
  );
}