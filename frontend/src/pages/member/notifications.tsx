import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Input,
  Pagination,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  FiSearch,
  FiEye,
  FiClock,
  FiBell,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiXCircle,
  FiActivity,
} from "react-icons/fi";

import { useLanguageStore } from "@/stores/languageStore";
import notificationsApi from "@/api/notificationsApi";

interface MemberNotification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high";
}

export default function MemberNotificationsPage() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguageStore();

  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationsApi.getAll({ page_size: 100 });
        const items = response.data?.results || [];
        const mapped: MemberNotification[] = items.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: mapNotificationType(n.notification_type),
          isRead: n.is_read || false,
          createdAt: n.created_at,
          priority: mapNotificationPriority(n.notification_type),
        }));
        setNotifications(mapped);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const mapNotificationType = (type?: string): MemberNotification["type"] => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  const mapNotificationPriority = (type?: string): MemberNotification["priority"] => {
    switch (type) {
      case "warning":
        return "high";
      case "error":
        return "high";
      case "success":
        return "medium";
      default:
        return "low";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      case "info":
        return "primary";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-success text-lg" />;
      case "warning":
        return <FiAlertTriangle className="text-warning text-lg" />;
      case "error":
        return <FiXCircle className="text-danger text-lg" />;
      default:
        return <FiInfo className="text-primary text-lg" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-success/10";
      case "warning":
        return "bg-warning/10";
      case "error":
        return "bg-danger/10";
      default:
        return "bg-primary/10";
    }
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return (
      date.toLocaleDateString(i18n.language === "ar" ? "ar-LY" : "en-US") +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("common.today");
    if (diffDays === 1) return t("common.yesterday");
    if (diffDays < 7) return t("common.daysAgo", { count: diffDays });
    if (diffDays < 30)
      return t("common.weeksAgo", { count: Math.floor(diffDays / 7) });

    return t("common.monthsAgo", { count: Math.floor(diffDays / 30) });
  };

  return (
    <div className="min-h-screen bg-background font-sans space-y-8 p-6 lg:p-10">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-default-500 bg-clip-text text-transparent">
            {t("member.notifications")}
          </h1>
          <p className="text-default-500 text-sm font-medium mt-1">
            {t("member.notificationsDescription")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            className="font-bold shadow-lg shadow-primary/20 px-6 rounded-2xl"
            color="primary"
            startContent={<FiBell className="animate-bounce" />}
            variant="shadow"
            onPress={handleMarkAllAsRead}
          >
            {t("member.markAllAsRead")} ({unreadCount})
          </Button>
        )}
      </div>

      {/* Top Stats Overview Row (ManagerDashboard Inspiration) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Unread Notifications (Gradient Dark Blue) */}
        <div className="bg-navy-500 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl group cursor-pointer transition-transform hover:-translate-y-1">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 p-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-navy-500 transition-colors shadow-lg">
              <FiBell size={20} />
            </div>
          </div>
          <p className="text-gray-400 font-medium mb-1 text-sm">
            {t("member.unread")}
          </p>
          <h3 className="text-4xl font-bold mb-1 tracking-tight">
            {unreadCount}
          </h3>
          <div className="absolute -bottom-10 ltr:-right-10 rtl:-left-10 w-36 h-36 bg-[#2B95E8] opacity-20 rounded-full blur-3xl" />
        </div>

        {/* Card 2: Read Notifications (Premium Content1) */}
        <div className="bg-content1 rounded-[32px] p-6 relative shadow-sm border border-default-200 group cursor-pointer hover:shadow-md transition-all">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 p-4">
            <div className="w-10 h-10 rounded-xl bg-content2 flex items-center justify-center text-foreground group-hover:bg-navy-500 group-hover:text-white transition-colors">
              <FiEye size={20} />
            </div>
          </div>
          <p className="text-default-500 font-medium mb-1 text-sm">
            {t("common.read", "Read")}
          </p>
          <h3 className="text-4xl font-bold text-foreground mb-1">
            {readCount}
          </h3>
        </div>

        {/* Card 3: Total Notifications (Purple Gradient) */}
        <div className="bg-gradient-to-br from-[#5468D4] to-[#4353AA] rounded-[32px] p-6 text-white relative overflow-hidden shadow-lg group cursor-pointer hover:shadow-xl transition-all">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 p-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-[#5468D4] transition-colors">
              <FiActivity size={20} />
            </div>
          </div>
          <p className="text-blue-100 font-medium mb-1 text-sm">
            {t("common.total")}
          </p>
          <h3 className="text-4xl font-bold mb-1">{notifications.length}</h3>
        </div>
      </div>

      {/* Search Input Card */}
      <Card className="rounded-[24px] shadow-sm border border-default-200">
        <CardBody className="p-4">
          <Input
            isClearable
            classNames={{
              inputWrapper:
                "bg-default-50 hover:bg-default-100 transition-colors border-default-200 rounded-xl",
            }}
            placeholder={t("member.searchNotifications")}
            startContent={<FiSearch className="text-default-400" />}
            value={searchTerm}
            variant="bordered"
            onValueChange={setSearchTerm}
          />
        </CardBody>
      </Card>

      {/* Notifications Main List */}
      <Card className="rounded-[32px] shadow-sm border border-default-200 overflow-hidden min-h-[400px] relative">
        {loading ? (
          <div className="absolute inset-0 flex justify-center items-center bg-content1/50 z-10 backdrop-blur-sm">
            <Spinner color="primary" size="lg" />
          </div>
        ) : null}

        <CardHeader className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-default-100">
          <h3 className="text-xl font-bold text-foreground">
            {t("member.notificationsList")}
          </h3>
        </CardHeader>

        <CardBody className="p-6 md:p-8">
          {!loading && paginatedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-3xl bg-default-100 flex items-center justify-center mb-4 text-default-400">
                <FiBell size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t("member.noNotifications")}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                    notification.isRead
                      ? "bg-default-50 border-default-200"
                      : `bg-content1 border-primary-200 dark:border-primary-900/40 shadow-sm ${
                          isRTL
                            ? "border-r-4 border-r-primary-500"
                            : "border-l-4 border-l-primary-500"
                        }`
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getNotificationBg(
                        notification.type,
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`font-bold text-base ${
                            notification.isRead
                              ? "text-default-600"
                              : "text-foreground"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <Chip
                          color={getTypeColor(notification.type) as any}
                          size="sm"
                          variant="flat"
                          className="font-semibold"
                        >
                          {t(`member.notificationType.${notification.type}`)}
                        </Chip>
                        <Chip
                          color={getPriorityColor(notification.priority) as any}
                          size="sm"
                          variant="dot"
                          className="font-medium"
                        >
                          {t(`member.priority.${notification.priority}`)}
                        </Chip>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          notification.isRead
                            ? "text-default-500"
                            : "text-default-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-default-400 pt-1">
                        <FiClock />
                        <span>{getRelativeTime(notification.createdAt)}</span>
                        <span>•</span>
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0 ltr:md:ml-4 rtl:md:mr-4 shrink-0 w-full md:w-auto justify-end">
                    {!notification.isRead && (
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<FiEye size={14} />}
                        variant="light"
                        className="font-semibold rounded-xl"
                        onPress={() => handleMarkAsRead(notification.id)}
                      >
                        {t("member.markAsRead")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 pt-4 border-t border-default-100">
              <Pagination
                showControls
                classNames={{
                  cursor: "bg-primary text-white font-bold",
                }}
                page={currentPage}
                total={totalPages}
                variant="light"
                onChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
