import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from "@heroui/react";
import {
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiPlus,
  FiEdit,
  FiEye,
  FiStar,
  FiArchive,
  FiSend,
  FiCheckCircle,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import eventsApi from "@/api/eventsApi";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Event } from "@/models/event";

export default function EventsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("-created_at");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getAll({
        search: searchQuery,
        status: statusFilter || undefined,
        ordering: ordering,
        page: currentPage,
        page_size: pageSize,
      });

      setEvents(response.data.results);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, ordering]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      await eventsApi.delete(eventToDelete.id);
      setDeleteModalOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handlePublish = async (event: Event) => {
    try {
      await eventsApi.publish(event.id);
      fetchEvents();
    } catch (error) {
      console.error("Failed to publish event:", error);
    }
  };

  const handleArchive = async (event: Event) => {
    try {
      await eventsApi.archive(event.id);
      fetchEvents();
    } catch (error) {
      console.error("Failed to archive event:", error);
    }
  };

  const handleToggleFeatured = async (event: Event) => {
    try {
      await eventsApi.toggleFeatured(event.id);
      fetchEvents();
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("events.title")}</h1>
            <p className="text-default-500 text-sm">{t("events.subtitle")}</p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/events/add")}
          >
            {t("events.add")}
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                className="sm:max-w-xs"
                placeholder={t("events.search")}
                startContent={<FiSearch className="text-default-400" />}
                value={searchQuery}
                onValueChange={handleSearch}
              />
              <div className="flex gap-2">
                {["", "published", "draft", "archived"].map((status) => (
                  <Chip
                    key={status}
                    color={statusFilter === status ? "primary" : "default"}
                    variant={statusFilter === status ? "solid" : "flat"}
                    className="cursor-pointer"
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                  >
                    {status
                      ? t(`events.status.${status}`)
                      : t("common.all")}
                  </Chip>
                ))}
              </div>
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

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-default-400">
                {t("events.noData")}
              </div>
            ) : (
              <Table aria-label="Events table">
                <TableHeader>
                  <TableColumn>{t("events.table.title")}</TableColumn>
                  <TableColumn>{t("events.table.eventDate")}</TableColumn>
                  <TableColumn>{t("events.table.location")}</TableColumn>
                  <TableColumn>{t("events.table.status")}</TableColumn>
                  <TableColumn>{t("events.table.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          {event.excerpt && (
                            <p className="text-xs text-default-400 line-clamp-1">
                              {event.excerpt}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">
                          {formatDate(event.event_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{event.location || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(event.status) as any}
                          size="sm"
                          variant="flat"
                        >
                          {t(`events.status.${event.status}`)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <FiMoreVertical />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Event actions">
                            {[
                              <DropdownItem
                                key="view"
                                startContent={<FiEye />}
                                onPress={() => navigate(`/events/${event.id}/edit`)}
                              >
                                {t("events.actions.view")}
                              </DropdownItem>,
                              <DropdownItem
                                key="edit"
                                startContent={<FiEdit />}
                                onPress={() => navigate(`/events/${event.id}/edit`)}
                              >
                                {t("events.actions.edit")}
                              </DropdownItem>,
                              event.status !== "published" ? (
                                <DropdownItem
                                  key="publish"
                                  startContent={<FiCheckCircle />}
                                  onPress={() => handlePublish(event)}
                                >
                                  {t("events.actions.publish")}
                                </DropdownItem>
                              ) : null,
                              event.status !== "archived" ? (
                                <DropdownItem
                                  key="archive"
                                  startContent={<FiArchive />}
                                  onPress={() => handleArchive(event)}
                                >
                                  {t("events.actions.archive")}
                                </DropdownItem>
                              ) : null,
                              <DropdownItem
                                key="featured"
                                startContent={
                                  <FiStar
                                    className={
                                      event.is_featured
                                        ? "text-warning"
                                        : undefined
                                    }
                                  />
                                }
                                onPress={() => handleToggleFeatured(event)}
                              >
                                {t("events.actions.toggleFeatured")}
                              </DropdownItem>,
                              <DropdownItem
                                key="notify"
                                startContent={<FiSend />}
                                onPress={() => {}}
                              >
                                {t("events.actions.sendNotification")}
                              </DropdownItem>,
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<FiTrash2 />}
                                onPress={() => {
                                  setEventToDelete(event);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                {t("events.actions.delete")}
                              </DropdownItem>,
                            ]}
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  page={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          itemName={eventToDelete?.title || ""}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      </div>
    </DefaultLayout>
  );
}
