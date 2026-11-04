import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Card,
    CardBody,
    Chip,
    Input,
    Button,
    Spinner,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tooltip,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    FiSearch,
    FiPlus,
    FiPrinter,
    FiEye,
    FiEdit,
    FiTrash2,
    FiFileText,
    FiCheck,
    FiXCircle,
    FiX,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { medicalReportsApi, MedicalReport } from "@/api/medicalReportsApi";
import type { DocumentStatus } from "@/models/medicalReport";
import { formatDate } from "@/misc/formatDate";
import { useUserStore } from "@/stores/userStore";
import doctorsMembershipApi from "@/api/doctorsMembershipApi";

type ChipColor = "default" | "warning" | "success" | "danger";

const DOC_STATUS_CHIP: Record<DocumentStatus, { color: ChipColor; labelKey: string }> = {
    pending: { color: "warning", labelKey: "medicalReports.docStatus.pending" },
    approved: { color: "success", labelKey: "medicalReports.docStatus.approved" },
    rejected: { color: "danger", labelKey: "medicalReports.docStatus.rejected" },
};

export default function MedicalReportsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useUserStore();

    const isManager = user?.user_type === "manager";

    const [reports, setReports] = useState<MedicalReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPendingMembership, setIsPendingMembership] = useState(false);
    const [noticeDismissed, setNoticeDismissed] = useState(false);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [approveLoadingId, setApproveLoadingId] = useState<number | null>(null);
    const [ordering, setOrdering] = useState("-created_at");

    const fetchReports = async (params?: {
        search?: string;
        document_status?: string;
        date_from?: string;
        date_to?: string;
    }) => {
        try {
            setLoading(true);
            const response = await medicalReportsApi.getAll({
                search: params?.search ?? searchQuery,
                ordering: ordering,
                ...(params?.document_status || statusFilter
                    ? { document_status: params?.document_status ?? statusFilter }
                    : {}),
                ...(params?.date_from || dateFrom ? { date_from: params?.date_from ?? dateFrom } : {}),
                ...(params?.date_to || dateTo ? { date_to: params?.date_to ?? dateTo } : {}),
            });
            setReports(response.data.results);
        } catch (error) {
            console.error("Failed to fetch medical reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchReports();
    }, [ordering]);

    useEffect(() => {
        if (user?.user_type !== "doctor") return;
        doctorsMembershipApi.getAll().then((res) => {
            const memberships = res.data?.results || [];
            if (memberships.length > 0 && memberships[0].status === "pending") {
                setIsPendingMembership(true);
            }
        }).catch(() => {});
    }, [user]);

    const handleSearch = () => fetchReports();

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
        // Fetch with cleared values immediately
        fetchReports({ search: "", document_status: "", date_from: "", date_to: "" });
    };

    const hasActiveFilters = !!(searchQuery || statusFilter || dateFrom || dateTo);

    const handleDelete = async (id: number) => {
        if (window.confirm(t("medicalReports.deleteConfirm"))) {
            try {
                await medicalReportsApi.delete(id);
                fetchReports();
            } catch (error) {
                console.error("Failed to delete report:", error);
            }
        }
    };

    const handlePrint = async (report: MedicalReport) => {
        try {
            await medicalReportsApi.exportPdf(report.id);
        } catch {
            alert(t("medicalReports.exportFailed"));
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setApproveLoadingId(id);
            const response = await medicalReportsApi.approveDocument(id);
            setReports((prev) => prev.map((r) => (r.id === id ? response.data : r)));
        } catch (error) {
            console.error("Failed to approve document:", error);
        } finally {
            setApproveLoadingId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            setApproveLoadingId(id);
            const response = await medicalReportsApi.rejectDocument(id);
            setReports((prev) => prev.map((r) => (r.id === id ? response.data : r)));
        } catch (error) {
            console.error("Failed to reject document:", error);
        } finally {
            setApproveLoadingId(null);
        }
    };

    return (
        <DefaultLayout>
            <div className="p-6 space-y-6">
                {isPendingMembership && !noticeDismissed && (
                    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-primary-700">{t("member.pendingServiceNotice")}</p>
                        <button className="text-primary-500 hover:text-primary-700 shrink-0" onClick={() => setNoticeDismissed(true)}>
                            <FiX size={16} />
                        </button>
                    </div>
                )}
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{t("medicalReports.title")}</h1>
                        <p className="text-default-600 mt-1">{t("medicalReports.subtitle")}</p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<FiPlus />}
                        onPress={() => navigate("/medical-reports/add")}
                    >
                        {t("medicalReports.add")}
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardBody className="space-y-3">
                        {/* Row 1: search + button */}
                        <div className="flex gap-3">
                            <Input
                                className="flex-1"
                                placeholder={t("medicalReports.searchPlaceholder")}
                                startContent={<FiSearch className="text-default-400" />}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button color="primary" startContent={<FiSearch />} onPress={handleSearch}>
                                {t("medicalReports.filter.search")}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant="flat" startContent={<FiX />} onPress={handleClearFilters}>
                                    {t("medicalReports.filter.clearFilters")}
                                </Button>
                            )}
                        </div>

                        {/* Row 2: status + date range + sort */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <Select
                                className="md:w-56"
                                placeholder={t("medicalReports.filter.allStatuses")}
                                selectedKeys={statusFilter ? new Set([statusFilter]) : new Set()}
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0] as string ?? "";
                                    setStatusFilter(val);
                                }}
                                aria-label={t("medicalReports.filter.status")}
                            >
                                <SelectItem key="pending">{t("medicalReports.docStatus.pending")}</SelectItem>
                                <SelectItem key="approved">{t("medicalReports.docStatus.approved")}</SelectItem>
                                <SelectItem key="rejected">{t("medicalReports.docStatus.rejected")}</SelectItem>
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
                                }}
                            >
                                <SelectItem key="-created_at">{t("common.sortNewest", "Newest")}</SelectItem>
                                <SelectItem key="created_at">{t("common.sortOldest", "Oldest")}</SelectItem>
                            </Select>

                            <Input
                                type="date"
                                className="md:w-48"
                                label={t("medicalReports.filter.dateFrom")}
                                labelPlacement="outside-left"
                                value={dateFrom}
                                onValueChange={setDateFrom}
                            />
                            <Input
                                type="date"
                                className="md:w-48"
                                label={t("medicalReports.filter.dateTo")}
                                labelPlacement="outside-left"
                                value={dateTo}
                                onValueChange={setDateTo}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Reports Table */}
                <Card>
                    <CardBody>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <Table aria-label={t("medicalReports.title")}>
                                <TableHeader>
                                    <TableColumn>{t("medicalReports.patient")}</TableColumn>
                                    <TableColumn>{t("medicalReports.doctorColumn")}</TableColumn>
                                    <TableColumn>{t("medicalReports.date")}</TableColumn>
                                    <TableColumn>{t("medicalReports.diagnosis")}</TableColumn>
                                    <TableColumn>{t("medicalReports.statusColumn")}</TableColumn>
                                    <TableColumn>{t("common.actions")}</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={t("medicalReports.noReports")}>
                                    {reports.map((report) => {
                                        const chip = DOC_STATUS_CHIP[report.document_status ?? "pending"];
                                        const isPendingApproval = report.document_status === "pending";
                                        const isApproving = approveLoadingId === report.id;
                                        const doctorName =
                                            report.doctor_detail?.full_name ||
                                            report.doctor_detail?.username ||
                                            "—";

                                        return (
                                            <TableRow key={report.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{report.patient_name}</span>
                                                        <span className="text-xs text-default-400">{report.patient_id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{doctorName}</span>
                                                </TableCell>
                                                <TableCell>{formatDate(report.report_date)}</TableCell>
                                                <TableCell>
                                                    <span className="line-clamp-1 max-w-xs">{report.diagnosis}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {report.document_status ? (
                                                        <Chip color={chip.color} variant="flat" size="sm">
                                                            {t(chip.labelKey)}
                                                        </Chip>
                                                    ) : (
                                                        <span className="text-default-400 text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <Tooltip content={t("common.view")}>
                                                            <Button isIconOnly size="sm" variant="light" onPress={() => navigate(`/medical-reports/${report.id}/edit`)}>
                                                                <FiEye />
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip content={t("common.print")}>
                                                            <Button isIconOnly size="sm" variant="light" color="secondary" onPress={() => handlePrint(report)}>
                                                                <FiPrinter />
                                                            </Button>
                                                        </Tooltip>
                                                        {report.document_url && (
                                                            <Tooltip content={t("common.attachment")}>
                                                                <Button isIconOnly size="sm" variant="light" as="a" href={report.document_url} target="_blank">
                                                                    <FiFileText />
                                                                </Button>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip content={t("common.edit")}>
                                                            <Button isIconOnly size="sm" variant="light" onPress={() => navigate(`/medical-reports/${report.id}/edit`)}>
                                                                <FiEdit />
                                                            </Button>
                                                        </Tooltip>

                                                        {/* Manager-only: approve / reject when report is pending */}
                                                        {isManager && isPendingApproval && (
                                                            <>
                                                                <Tooltip color="success" content={t("common.approve")}>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        color="success"
                                                                        variant="flat"
                                                                        isLoading={isApproving}
                                                                        onPress={() => handleApprove(report.id)}
                                                                    >
                                                                        <FiCheck />
                                                                    </Button>
                                                                </Tooltip>
                                                                <Tooltip color="danger" content={t("common.reject")}>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        color="danger"
                                                                        variant="flat"
                                                                        isLoading={isApproving}
                                                                        onPress={() => handleReject(report.id)}
                                                                    >
                                                                        <FiXCircle />
                                                                    </Button>
                                                                </Tooltip>
                                                            </>
                                                        )}

                                                        <Tooltip color="danger" content={t("common.delete")}>
                                                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(report.id)}>
                                                                <FiTrash2 />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </DefaultLayout>
    );
}
