import { useState, useEffect } from "react";
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
  Card,
  CardBody,
  Spinner,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  FiTrash2,
  FiSearch,
  FiMoreVertical,
  FiPlus,
  FiEdit,
  FiEye,
  FiArchive,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
} from "react-icons/fi";

import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals";
import adsApi from "@/api/adsApi";
import { Ad } from "@/models/ad";
import { useUserStore } from "@/stores/userStore";

export default function AdsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const isStaffOrManager = user?.is_staff || user?.user_type === "manager";

  // State
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("-created_at");

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(dateString));
  };

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await adsApi.getAll({
        search: searchQuery || undefined,
        status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
        ordering: ordering,
        page: currentPage,
        page_size: pageSize,
      });

      const data = response.data;
      const results = data?.results || (Array.isArray(data) ? data : []);
      const count = data?.count || (Array.isArray(data) ? data.length : 0);

      setAds(results);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [currentPage, searchQuery, statusFilter, ordering]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDeleteClick = (ad: Ad) => {
    setAdToDelete(ad);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adToDelete) return;
    try {
      setDeleteLoading(true);
      await adsApi.delete(adToDelete.id);
      setDeleteModalOpen(false);
      setAdToDelete(null);
      fetchAds();
    } catch (error) {
      console.error("Failed to delete ad:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePublish = async (ad: Ad) => {
    try {
      setActionLoading(ad.id);
      await adsApi.publish(ad.id);
      fetchAds();
    } catch (error) {
      console.error("Failed to publish ad:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (ad: Ad) => {
    try {
      setActionLoading(ad.id);
      await adsApi.unpublish(ad.id);
      fetchAds();
    } catch (error) {
      console.error("Failed to unpublish ad:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (ad: Ad) => {
    try {
      setActionLoading(ad.id);
      await adsApi.archive(ad.id);
      fetchAds();
    } catch (error) {
      console.error("Failed to archive ad:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "archived":
        return "warning";
      case "draft":
      default:
        return "default";
    }
  };

  const visibleColumns = [
    { key: "title", label: t("ads.table.title", "Campaign Title") },
    ...(isStaffOrManager ? [{ key: "advertiser", label: t("ads.table.advertiser", "Advertiser") }] : []),
    { key: "status", label: t("ads.table.status", "Status") },
    { key: "targeting", label: t("ads.table.targeting", "Targeting") },
    { key: "audience", label: t("ads.table.audience", "Audience Size") },
    { key: "views", label: t("ads.table.views", "Views") },
    { key: "published_at", label: t("ads.table.publishedAt", "Published Date") },
    { key: "actions", label: t("ads.table.actions", "Actions") },
  ];

  const renderCell = (ad: Ad, columnKey: React.Key) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex items-center gap-3">
            {ad.featured_image && (
              <img
                alt={ad.title}
                className="w-12 h-12 object-cover rounded"
                src={ad.featured_image as string}
              />
            )}
            <div>
              <div className="font-semibold">{ad.title}</div>
              <div className="text-xs text-default-500 truncate max-w-xs">
                {ad.content}
              </div>
            </div>
          </div>
        );
      case "advertiser":
        return (
          <span className="text-sm">
            {ad.advertiser_detail?.full_name || ad.advertiser_detail?.username || ad.advertiser}
          </span>
        );
      case "status":
        return (
          <Chip
            color={getStatusColor(ad.status)}
            size="sm"
            variant="flat"
          >
            {ad.status_display}
          </Chip>
        );
      case "targeting":
        return (
          <div className="flex flex-col gap-1 text-xs text-default-600">
            {ad.target_branches && ad.target_branches.length > 0 && (
              <span>📍 {ad.target_branches.length} Branches</span>
            )}
            {ad.target_cities && ad.target_cities.length > 0 && (
              <span>🏙️ {ad.target_cities.length} Cities</span>
            )}
            {ad.target_specialties && ad.target_specialties.length > 0 && (
              <span>🔬 {ad.target_specialties.length} Specialties</span>
            )}
            {(!ad.target_branches?.length && !ad.target_cities?.length && !ad.target_specialties?.length) && (
              <span>🌍 Global</span>
            )}
          </div>
        );
      case "audience":
        return (
          <span className="font-semibold text-sm">
            {(ad.expected_audience_count ?? 0).toLocaleString()}
          </span>
        );
      case "views":
        return (
          <span className="text-sm">
            {(ad.views_count ?? 0).toLocaleString()}
          </span>
        );
      case "published_at":
        return (
          <span className="text-xs text-default-600">
            {formatDate(ad.published_at)}
          </span>
        );
      case "actions": {
        const dropdownItems = [];

        if (isStaffOrManager && ad.status !== "published") {
          dropdownItems.push({
            key: "publish",
            label: t("ads.actions.publish", "Publish"),
            icon: <FiCheckCircle className="text-success" />,
            action: () => handlePublish(ad),
          });
        }

        if (isStaffOrManager && ad.status === "published") {
          dropdownItems.push({
            key: "unpublish",
            label: t("ads.actions.unpublish", "Set to Draft"),
            icon: <FiXCircle className="text-warning" />,
            action: () => handleUnpublish(ad),
          });
        }

        if (ad.status !== "archived") {
          dropdownItems.push({
            key: "archive",
            label: t("ads.actions.archive", "Archive"),
            icon: <FiArchive />,
            action: () => handleArchive(ad),
          });
        }

        dropdownItems.push({
          key: "analytics",
          label: t("ads.actions.analytics", "View Analytics"),
          icon: <FiBarChart2 />,
          action: () => navigate(`/ads/${ad.id}`),
        });

        dropdownItems.push({
          key: "delete",
          label: t("ads.actions.delete", "Delete"),
          icon: <FiTrash2 />,
          className: "text-danger",
          color: "danger" as const,
          action: () => handleDeleteClick(ad),
        });

        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => navigate(`/ads/${ad.id}`)}
            >
              <FiEye />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => navigate(`/ads/${ad.id}/edit`)}
            >
              <FiEdit />
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" isLoading={actionLoading === ad.id}>
                  <FiMoreVertical />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Ad Actions" items={dropdownItems}>
                {(item) => (
                  <DropdownItem
                    key={item.key}
                    startContent={item.icon}
                    className={item.className}
                    color={item.color}
                    onPress={item.action}
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      }
      default:
        return "-";
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("ads.title", "Ad Campaigns")}</h1>
            <p className="text-default-600 mt-1">
              {t("ads.totalCount", "Total campaigns: {{count}}", { count: totalCount })}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/ads/add")}
          >
            {t("ads.create", "Create Ad Campaign")}
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="md:max-w-sm"
                placeholder={t("ads.filters.search", "Search campaigns...")}
                startContent={<FiSearch />}
                value={searchQuery}
                onValueChange={handleSearch}
              />

              <Select
                className="md:max-w-xs"
                placeholder={t("ads.filters.status", "Filter by status")}
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => handleStatusFilter(Array.from(keys)[0] as string || "all")}
              >
                <SelectItem key="all">{t("ads.status.all", "All Statuses")}</SelectItem>
                <SelectItem key="draft">{t("ads.status.draft", "Draft")}</SelectItem>
                <SelectItem key="published">{t("ads.status.published", "Published")}</SelectItem>
                <SelectItem key="archived">{t("ads.status.archived", "Archived")}</SelectItem>
              </Select>

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

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <Table aria-label="Advertisements Table">
              <TableHeader columns={visibleColumns}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody items={ads} emptyContent={t("ads.noCampaignsFound", "No campaigns found")}>
                {(ad) => (
                  <TableRow key={ad.id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(ad, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        isLoading={deleteLoading}
        title={t("ads.deleteTitle", "Delete Campaign")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
