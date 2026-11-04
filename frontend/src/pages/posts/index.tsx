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
  FiStar,
  FiArchive,
  FiCheckCircle,
  FiBell,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal, SendNotificationModal } from "@/components/modals";
import postsApi from "@/api/postsApi";
import { Post, PostType, PostStatus } from "@/models/posts";

export default function PostsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PostType | "">("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [postForNotification, setPostForNotification] = useState<Post | null>(null);

  const pageSize = 10;
  const [ordering, setOrdering] = useState("-created_at");

  // Helper function to format date
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

  // Fetch posts data
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.getAll({
        search: searchQuery,
        post_type: typeFilter || undefined,
        status: statusFilter || undefined,
        ordering: ordering,
        page: currentPage,
        page_size: pageSize,
      });

      setPosts(response.data.results);
      setTotalCount(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchQuery, typeFilter, statusFilter, ordering]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleTypeFilter = (type: string) => {
    setTypeFilter(type as PostType | "");
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as PostStatus | "");
    setCurrentPage(1);
  };

  // Handle delete
  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      setDeleteLoading(true);
      await postsApi.delete(postToDelete.id);
      setDeleteModalOpen(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle publish
  const handlePublish = async (post: Post) => {
    try {
      setActionLoading(post.id);
      await postsApi.publish(post.id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to publish post:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle archive
  const handleArchive = async (post: Post) => {
    try {
      setActionLoading(post.id);
      await postsApi.archive(post.id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to archive post:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (post: Post) => {
    try {
      setActionLoading(post.id);
      await postsApi.toggleFeatured(post.id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle send notification
  const handleSendNotification = async (data: any) => {
    if (!postForNotification) return;
    await postsApi.sendNotification(postForNotification.id, data);
  };

  const openNotificationModal = (post: Post) => {
    setPostForNotification(post);
    setNotificationModalOpen(true);
  };

  // Get status color
  const getStatusColor = (status: PostStatus) => {
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

  // Get type color
  const getTypeColor = (type: PostType) => {
    switch (type) {
      case "news":
        return "primary";
      case "announcement":
        return "secondary";
      case "article":
        return "success";
      default:
        return "default";
    }
  };

  // Helper to build dropdown items
  const getDropdownItems = (post: Post) => {
    const items: JSX.Element[] = [
      <DropdownItem
        key="view"
        startContent={<FiEye />}
        onPress={() => window.open(`/posts/${post.id}?view=true`, '_blank')}
      >
        {t("posts.actions.view", "View")}
      </DropdownItem>,
      <DropdownItem
        key="edit"
        startContent={<FiEdit />}
        onPress={() => navigate(`/posts/${post.id}/edit`)}
      >
        {t("posts.actions.edit")}
      </DropdownItem>,
    ];

    if (post.status === "draft") {
      items.push(
        <DropdownItem
          key="publish"
          startContent={<FiCheckCircle />}
          onPress={() => handlePublish(post)}
        >
          {t("posts.actions.publish")}
        </DropdownItem>,
      );
    }

    if (post.status === "published") {
      items.push(
        <DropdownItem
          key="archive"
          startContent={<FiArchive />}
          onPress={() => handleArchive(post)}
        >
          {t("posts.actions.archive")}
        </DropdownItem>,
      );
    }

    items.push(
      <DropdownItem
        key="featured"
        startContent={<FiStar />}
        onPress={() => handleToggleFeatured(post)}
      >
        {post.is_featured
          ? t("posts.actions.unfeature")
          : t("posts.actions.feature")}
      </DropdownItem>,
    );

    items.push(
      <DropdownItem
        key="notification"
        startContent={<FiBell />}
        onPress={() => openNotificationModal(post)}
      >
        {t('posts.actions.sendNotification', 'Send Notification')}
      </DropdownItem>
    );

    items.push(
      <DropdownItem
        key="delete"
        className="text-danger"
        color="danger"
        startContent={<FiTrash2 />}
        onPress={() => handleDeleteClick(post)}
      >
        {t("posts.actions.delete")}
      </DropdownItem>,
    );

    return items;
  };

  // Table columns
  const columns = [
    { key: "title", label: t("posts.table.title") },
    { key: "type", label: t("posts.table.type") },
    { key: "status", label: t("posts.table.status") },
    { key: "author", label: t("posts.table.author") },
    { key: "published_at", label: t("posts.table.published") },
    { key: "views", label: t("posts.table.views") },
    { key: "actions", label: t("posts.table.actions") },
  ];

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("posts.title")}</h1>
            <p className="text-default-600 mt-1">
              {t("posts.totalPosts", { count: totalCount })}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<FiPlus />}
            onPress={() => navigate("/posts/add")}
          >
            {t("posts.createPost")}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                isClearable
                className="md:max-w-sm"
                placeholder={t("posts.filters.search")}
                startContent={<FiSearch />}
                value={searchQuery}
                onValueChange={handleSearch}
              />

              <Select
                className="md:max-w-xs"
                placeholder={t("posts.filters.allTypes")}
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(keys) =>
                  handleTypeFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">{t("posts.filters.allTypes")}</SelectItem>
                <SelectItem key="news">{t("posts.types.news")}</SelectItem>
                <SelectItem key="announcement">
                  {t("posts.types.announcement")}
                </SelectItem>
                <SelectItem key="article">
                  {t("posts.types.article")}
                </SelectItem>
              </Select>

              <Select
                className="md:max-w-xs"
                placeholder={t("posts.filters.allStatus")}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) =>
                  handleStatusFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">{t("posts.filters.allStatus")}</SelectItem>
                <SelectItem key="published">
                  {t("posts.status.published")}
                </SelectItem>
                <SelectItem key="draft">{t("posts.status.draft")}</SelectItem>
                <SelectItem key="archived">
                  {t("posts.status.archived")}
                </SelectItem>
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
                  <Table aria-label="Posts table">
                    <TableHeader>
                      {columns.map((column) => (
                        <TableColumn key={column.key}>
                          {column.label}
                        </TableColumn>
                      ))}
                    </TableHeader>
                    <TableBody emptyContent={t("posts.noPostsFound")}>
                      {posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-semibold">
                                  {post.title}
                                </div>
                                {post.is_featured && (
                                  <Chip
                                    color="warning"
                                    size="sm"
                                    startContent={<FiStar size={12} />}
                                    variant="flat"
                                  >
                                    {t("posts.featured")}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={getTypeColor(post.post_type)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`posts.types.${post.post_type}`)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={getStatusColor(post.status)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`posts.status.${post.status}`)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {post.author?.full_name || post.author?.username}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-default-600">
                              {formatDate(post.published_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FiEye size={14} />
                              <span className="text-sm">
                                {post.views_count}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  disabled={actionLoading === post.id}
                                  size="sm"
                                  variant="light"
                                >
                                  <FiMoreVertical />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                {getDropdownItems(post)}
                              </DropdownMenu>
                            </Dropdown>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {posts.length === 0 ? (
                    <p className="text-center text-default-500 py-8">
                      {t("posts.noPostsFound")}
                    </p>
                  ) : (
                    posts.map((post) => (
                      <Card key={post.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">
                                {post.title}
                              </h3>
                              <p className="text-xs text-default-600 mt-1">
                                {post.author?.full_name ||
                                  post.author?.username}
                              </p>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  disabled={actionLoading === post.id}
                                  size="sm"
                                  variant="light"
                                >
                                  <FiMoreVertical />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                {getDropdownItems(post)}
                              </DropdownMenu>
                            </Dropdown>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Chip
                              color={getTypeColor(post.post_type)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`posts.types.${post.post_type}`)}
                            </Chip>
                            <Chip
                              color={getStatusColor(post.status)}
                              size="sm"
                              variant="flat"
                            >
                              {t(`posts.status.${post.status}`)}
                            </Chip>
                            {post.is_featured && (
                              <Chip
                                color="warning"
                                size="sm"
                                startContent={<FiStar size={12} />}
                                variant="flat"
                              >
                                {t("posts.featured")}
                              </Chip>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-default-500">
                            <div className="flex items-center gap-1">
                              <FiEye size={12} />
                              <span>
                                {t("posts.views", { count: post.views_count })}
                              </span>
                            </div>
                            <span>{formatDate(post.published_at)}</span>
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
        itemName={postToDelete?.title || ""}
        message={t("posts.deleteConfirm")}
        title={t("posts.deletePost")}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />


      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onSend={handleSendNotification}
        title={t('posts.actions.sendNotification', 'Send Notification')}
        defaultTitle={postForNotification ? postForNotification.title : ''}
        defaultMessage={postForNotification ? (postForNotification.excerpt || postForNotification.title) : ''}
        showBroadcastOption={true}
      />
    </DefaultLayout>
  );
}
