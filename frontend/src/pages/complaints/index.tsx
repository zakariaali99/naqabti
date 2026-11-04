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
    FiMessageSquare,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { Pagination } from "@/components/Pagination";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { complaintsApi, Complaint } from "@/api/complaintsApi";
import { useUserStore } from "@/stores/userStore";

export default function ComplaintsListPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useUserStore();

    // State
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [ordering, setOrdering] = useState("-created_at");
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const pageSize = 10;

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

    // Fetch complaints data
    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await complaintsApi.getAll({
                search: searchQuery,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                page: currentPage,
                page_size: pageSize,
                ordering: ordering,
            });

            setComplaints(response.data.results);
            setTotalCount(response.data.count);
            setTotalPages(Math.ceil(response.data.count / pageSize));
        } catch (error) {
            console.error("Failed to fetch complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [currentPage, searchQuery, statusFilter, priorityFilter, ordering]);

    // Handle search
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    // Handle delete
    const handleDeleteClick = (complaint: Complaint) => {
        setComplaintToDelete(complaint);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!complaintToDelete) return;

        try {
            setDeleteLoading(true);
            await complaintsApi.delete(complaintToDelete.id);
            setDeleteModalOpen(false);
            setComplaintToDelete(null);
            fetchComplaints();
        } catch (error) {
            console.error("Failed to delete complaint:", error);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "resolved":
            case "closed":
                return "success";
            case "in_progress":
                return "primary";
            case "pending":
                return "warning";
            default:
                return "default";
        }
    };

    // Get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "danger";
            case "high":
                return "warning";
            case "medium":
                return "primary";
            case "low":
                return "default";
            default:
                return "default";
        }
    };

    // Table columns
    const columns = [
        { key: "subject", label: t("complaints.table.subject", "Subject") },
        { key: "user", label: t("complaints.table.user", "User") },
        { key: "status", label: t("complaints.table.status", "Status") },
        { key: "priority", label: t("complaints.table.priority", "Priority") },
        { key: "created_at", label: t("complaints.table.date", "Date") },
        { key: "sent_to_branch", label: t("complaints.table.sentToBranch", "Sent To Branch") },
        { key: "actions", label: t("complaints.table.actions", "Actions") },
    ];

    return (
        <DefaultLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{t("complaints.title", "Complaints & Suggestions")}</h1>
                        <p className="text-default-600 mt-1">
                            {t("complaints.totalComplaints", "Total complaints: {{count}}", { count: totalCount })}
                        </p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<FiPlus />}
                        onPress={() => navigate("/complaints/add")}
                    >
                        {t("complaints.create", "Submit Complaint")}
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardBody>
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                isClearable
                                className="md:max-w-sm"
                                placeholder={t("complaints.filters.search", "Search complaints...")}
                                startContent={<FiSearch />}
                                value={searchQuery}
                                onValueChange={handleSearch}
                            />

                            <Select
                                className="md:max-w-xs"
                                placeholder={t("complaints.filters.status", "Filter by status")}
                                selectedKeys={statusFilter ? [statusFilter] : []}
                                onSelectionChange={(keys) => {
                                    setStatusFilter(Array.from(keys)[0] as string || "");
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectItem key="">{t("complaints.status.all", "All Statuses")}</SelectItem>
                                <SelectItem key="pending">{t("complaints.status.pending", "Pending")}</SelectItem>
                                <SelectItem key="in_progress">{t("complaints.status.in_progress", "In Progress")}</SelectItem>
                                <SelectItem key="resolved">{t("complaints.status.resolved", "Resolved")}</SelectItem>
                                <SelectItem key="closed">{t("complaints.status.closed", "Closed")}</SelectItem>
                            </Select>

                            <Select
                                className="md:max-w-xs"
                                placeholder={t("complaints.filters.priority", "Filter by priority")}
                                selectedKeys={priorityFilter ? [priorityFilter] : []}
                                onSelectionChange={(keys) => {
                                    setPriorityFilter(Array.from(keys)[0] as string || "");
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectItem key="">{t("complaints.priority.all", "All Priorities")}</SelectItem>
                                <SelectItem key="low">{t("complaints.priority.low", "Low")}</SelectItem>
                                <SelectItem key="medium">{t("complaints.priority.medium", "Medium")}</SelectItem>
                                <SelectItem key="high">{t("complaints.priority.high", "High")}</SelectItem>
                                <SelectItem key="urgent">{t("complaints.priority.urgent", "Urgent")}</SelectItem>
                            </Select>

                            <Select
                                className="md:max-w-xs"
                                placeholder={t("common.sortBy", "Sort By")}
                                selectedKeys={[ordering]}
                                onSelectionChange={(keys) => {
                                    setOrdering(Array.from(keys)[0] as string || "-created_at");
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectItem key="-created_at">{t("complaints.sort.newest", "Newest Created")}</SelectItem>
                                <SelectItem key="created_at">{t("complaints.sort.oldest", "Oldest Created")}</SelectItem>
                                <SelectItem key="-priority">{t("complaints.sort.priorityHigh", "Highest Priority")}</SelectItem>
                                <SelectItem key="priority">{t("complaints.sort.priorityLow", "Lowest Priority")}</SelectItem>
                                <SelectItem key="-status">{t("complaints.sort.statusDesc", "Status (Closed-Open)")}</SelectItem>
                                <SelectItem key="status">{t("complaints.sort.statusAsc", "Status (Open-Closed)")}</SelectItem>
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
                            <Table aria-label="Complaints table">
                                <TableHeader>
                                    {columns.map((column) => (
                                        <TableColumn key={column.key}>{column.label}</TableColumn>
                                    ))}
                                </TableHeader>
                                <TableBody emptyContent={t("complaints.noComplaintsFound", "No complaints found")}>
                                    {complaints.map((complaint) => (
                                        <TableRow key={complaint.id}>
                                            <TableCell>
                                                <div className="font-semibold">{complaint.subject}</div>
                                                <div className="text-xs text-default-500 truncate max-w-xs">
                                                    {complaint.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {complaint.user_detail?.full_name || complaint.user_detail?.username || complaint.user}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getStatusColor(complaint.status)}
                                                    size="sm"
                                                    variant="flat"
                                                >
                                                    {statusFilter ? complaint.status_display : t(`complaints.status.${complaint.status}`, complaint.status_display)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getPriorityColor(complaint.priority)}
                                                    size="sm"
                                                    variant="dot"
                                                >
                                                    {priorityFilter ? complaint.priority_display : t(`complaints.priority.${complaint.priority}`, complaint.priority_display)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-default-600">
                                                    {formatDate(complaint.created_at)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium text-default-600">
                                                    {complaint.sent_to_branch_detail?.name || t("complaints.global", "Global / General")}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => navigate(`/complaints/${complaint.id}/edit`)}
                                                    >
                                                        {user?.is_staff ? <FiMessageSquare /> : <FiEye />}
                                                    </Button>
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button isIconOnly size="sm" variant="light">
                                                                <FiMoreVertical />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu aria-label="Action menu">
                                                            <DropdownItem
                                                                key="edit"
                                                                startContent={<FiEdit />}
                                                                onPress={() => navigate(`/complaints/${complaint.id}/edit`)}
                                                            >
                                                                {t("complaints.actions.edit", "Edit/Details")}
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="delete"
                                                                className="text-danger"
                                                                color="danger"
                                                                startContent={<FiTrash2 />}
                                                                onPress={() => handleDeleteClick(complaint)}
                                                                showDivider={false}
                                                            >
                                                                {t("complaints.actions.delete", "Delete")}
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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

            <DeleteConfirmModal
                isLoading={deleteLoading}
                isOpen={deleteModalOpen}
                itemName={complaintToDelete?.subject || ""}
                message={t("complaints.deleteConfirm", "Are you sure you want to delete this complaint?")}
                title={t("complaints.deleteTitle", "Delete Complaint")}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </DefaultLayout>
    );
}
