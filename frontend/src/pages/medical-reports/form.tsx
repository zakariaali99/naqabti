import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Button,
    Textarea,
    Spinner,
    Chip,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiPrinter, FiPaperclip, FiX, FiCheck, FiXCircle, FiDownload } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { medicalReportsApi, MedicalReportCreateRequest } from "@/api/medicalReportsApi";
import type { DocumentStatus, MedicalReport } from "@/models/medicalReport";
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";

type ChipColor = "default" | "warning" | "success" | "danger";

const STATUS_CHIP: Record<DocumentStatus, { color: ChipColor; labelKey: string }> = {
    pending: { color: "warning", labelKey: "medicalReports.docStatus.pending" },
    approved: { color: "success", labelKey: "medicalReports.docStatus.approved" },
    rejected: { color: "danger", labelKey: "medicalReports.docStatus.rejected" },
};

export default function MedicalReportFormPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const { isRTL } = useLanguageStore();
    const { user } = useUserStore();

    const isManager = !!(user?.is_staff || user?.user_type === "manager");

    const [formData, setFormData] = useState<MedicalReportCreateRequest>({
        patient_name: "",
        patient_id: "",
        diagnosis: "",
        treatment: "",
        recommendations: "",
        notes: "",
    });

    const [report, setReport] = useState<MedicalReport | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchReport = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await medicalReportsApi.getById(Number(id));
            const data = response.data;
            setReport(data);
            setFormData({
                patient_name: data.patient_name,
                patient_id: data.patient_id || "",
                diagnosis: data.diagnosis,
                treatment: data.treatment || "",
                recommendations: data.recommendations || "",
                notes: data.notes || "",
            });
            if (data.document_url && data.document_status === "approved") {
                setAttachmentPreview(data.document_url);
            }
        } catch (error) {
            console.error("Failed to fetch medical report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && id) fetchReport();
    }, [id, isEditMode]);

    const handleInputChange = (field: keyof MedicalReportCreateRequest, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachment(file);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => setAttachmentPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview("");
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.patient_name?.trim()) newErrors.patient_name = t("common.form.required");
        if (!formData.diagnosis?.trim()) newErrors.diagnosis = t("common.form.required");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setSaveLoading(true);
            const data: MedicalReportCreateRequest = { ...formData };
            if (attachment) {
                data.upload_document = attachment;
            }

            if (isEditMode && id) {
                await medicalReportsApi.patch(Number(id), data as any);
            } else {
                await medicalReportsApi.create(data);
            }

            navigate("/medical-reports");
        } catch (error: any) {
            console.error("Failed to save report:", error);
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        } finally {
            setSaveLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!id) return;
        try {
            setApproveLoading(true);
            await medicalReportsApi.approveDocument(Number(id));
            await fetchReport();
        } catch (error) {
            console.error("Failed to approve document:", error);
        } finally {
            setApproveLoading(false);
        }
    };

    const handleReject = async () => {
        if (!id) return;
        try {
            setApproveLoading(true);
            await medicalReportsApi.rejectDocument(Number(id));
            await fetchReport();
        } catch (error) {
            console.error("Failed to reject document:", error);
        } finally {
            setApproveLoading(false);
        }
    };

    if (loading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </DefaultLayout>
        );
    }

    const docStatus = report?.document_status ?? "pending";
    const statusChip = STATUS_CHIP[docStatus];

    return (
        <DefaultLayout>
            <div className="p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button isIconOnly variant="light" onPress={() => navigate("/medical-reports")}>
                        <FiArrowLeft className={isRTL ? "rotate-180" : ""} />
                    </Button>
                    <h1 className="text-2xl font-bold">
                        {isEditMode ? t("medicalReports.editTitle") : t("medicalReports.createTitle")}
                    </h1>
                </div>

                {/* Manager review banner — shown whenever the report is pending */}
                {isEditMode && isManager && docStatus === "pending" && (
                    <Card className="border border-warning-300 bg-warning-50 mb-6">
                        <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <p className="font-semibold text-warning-800">
                                    {t("medicalReports.review.title")}
                                </p>
                                <p className="text-sm text-warning-700 mt-0.5">
                                    {t("medicalReports.review.subtitle")}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    color="success"
                                    startContent={<FiCheck />}
                                    isLoading={approveLoading}
                                    onPress={handleApprove}
                                >
                                    {t("common.approve")}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<FiXCircle />}
                                    isLoading={approveLoading}
                                    onPress={handleReject}
                                >
                                    {t("common.reject")}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Patient Info */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">{t("medicalReports.form.patientInfo")}</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    isRequired
                                    errorMessage={errors.patient_name}
                                    isInvalid={!!errors.patient_name}
                                    label={t("medicalReports.form.patientName")}
                                    value={formData.patient_name}
                                    onValueChange={(value) => handleInputChange("patient_name", value)}
                                />
                                <Input
                                    label={t("medicalReports.form.patientId")}
                                    value={formData.patient_id}
                                    onValueChange={(value) => handleInputChange("patient_id", value)}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    {/* Medical Details */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">{t("medicalReports.form.medicalDetails")}</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Textarea
                                isRequired
                                errorMessage={errors.diagnosis}
                                isInvalid={!!errors.diagnosis}
                                label={t("medicalReports.form.diagnosis")}
                                minRows={3}
                                value={formData.diagnosis}
                                onValueChange={(value) => handleInputChange("diagnosis", value)}
                            />
                            <Textarea
                                label={t("medicalReports.form.treatment")}
                                minRows={3}
                                value={formData.treatment}
                                onValueChange={(value) => handleInputChange("treatment", value)}
                            />
                            <Textarea
                                label={t("medicalReports.form.recommendations")}
                                minRows={2}
                                value={formData.recommendations}
                                onValueChange={(value) => handleInputChange("recommendations", value)}
                            />
                            <Textarea
                                label={t("medicalReports.form.notes")}
                                minRows={2}
                                value={formData.notes}
                                onValueChange={(value) => handleInputChange("notes", value)}
                            />
                        </CardBody>
                    </Card>

                    {/* Attachments */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">{t("medicalReports.form.attachments")}</h2>
                            {isEditMode && (
                                <Chip color={statusChip.color} variant="flat" size="sm">
                                    {t(statusChip.labelKey)}
                                </Chip>
                            )}
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {/* Approved document row */}
                            {isEditMode && report?.document_url && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success-200">
                                    <FiDownload className="text-success-600 shrink-0" />
                                    <span className="text-sm text-success-700 flex-1">
                                        {t("medicalReports.form.approvedDoc")}
                                    </span>
                                    <Button
                                        size="sm"
                                        color="success"
                                        variant="flat"
                                        as="a"
                                        href={report.document_url}
                                        target="_blank"
                                    >
                                        {t("common.download")}
                                    </Button>
                                </div>
                            )}

                            {/* Pending document row — shown to doctor and manager */}
                            {isEditMode && report?.pending_document_url && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning-50 border border-warning-200">
                                    <FiPaperclip className="text-warning-600 shrink-0" />
                                    <span className="text-sm text-warning-700 flex-1">
                                        {t("medicalReports.form.pendingDoc")}
                                    </span>
                                    <Button
                                        size="sm"
                                        color="warning"
                                        variant="flat"
                                        as="a"
                                        href={report.pending_document_url}
                                        target="_blank"
                                    >
                                        {t("common.preview")}
                                    </Button>
                                    {/* Manager approve / reject for the pending file */}
                                    {isManager && (
                                        <>
                                            <Button
                                                size="sm"
                                                color="success"
                                                variant="flat"
                                                startContent={<FiCheck />}
                                                isLoading={approveLoading}
                                                onPress={handleApprove}
                                            >
                                                {t("common.approve")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                startContent={<FiXCircle />}
                                                isLoading={approveLoading}
                                                onPress={handleReject}
                                            >
                                                {t("common.reject")}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Rejected notice for doctor */}
                            {isEditMode && report?.document_status === "rejected" && !report?.pending_document_url && (
                                <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger-700">
                                    {t("medicalReports.form.rejectedDoc")}
                                </div>
                            )}

                            {/* Upload control — always available so doctor can (re-)upload */}
                            {attachment ? (
                                <div className="relative inline-block">
                                    {attachment.type.startsWith("image/") && attachmentPreview ? (
                                        <img
                                            alt="Attachment"
                                            className="h-40 w-auto object-contain rounded-lg border"
                                            src={attachmentPreview}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-default-50">
                                            <FiPaperclip />
                                            <span className="text-sm">{attachment.name}</span>
                                        </div>
                                    )}
                                    <Button
                                        isIconOnly
                                        className="absolute -top-2 -right-2"
                                        color="danger"
                                        size="sm"
                                        onPress={() => {
                                            setAttachment(null);
                                            setAttachmentPreview("");
                                        }}
                                    >
                                        <FiX />
                                    </Button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                                    <FiPaperclip className="mx-auto text-4xl text-default-400 mb-2" />
                                    <p className="text-sm text-default-500 mb-3">
                                        {t("medicalReports.form.uploadHint")}
                                    </p>
                                    <input
                                        className="hidden"
                                        id="attachment-upload"
                                        type="file"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        as="label"
                                        color="primary"
                                        htmlFor="attachment-upload"
                                        variant="flat"
                                    >
                                        {t("common.chooseFile")}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end flex-wrap">
                        {isEditMode && id && !isNaN(parseInt(id)) && (
                            <Button
                                color="secondary"
                                variant="flat"
                                startContent={<FiPrinter />}
                                onPress={async () => {
                                    try {
                                        await medicalReportsApi.exportPdf(parseInt(id!));
                                    } catch {
                                        alert("Failed to export PDF. Please try again.");
                                    }
                                }}
                            >
                                {t("common.print")}
                            </Button>
                        )}

                        {/* Manager approve / reject in the footer */}
                        {isEditMode && isManager && docStatus === "pending" && (
                            <>
                                <Button
                                    color="success"
                                    variant="flat"
                                    startContent={<FiCheck />}
                                    isLoading={approveLoading}
                                    onPress={handleApprove}
                                >
                                    {t("common.approve")}
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<FiXCircle />}
                                    isLoading={approveLoading}
                                    onPress={handleReject}
                                >
                                    {t("common.reject")}
                                </Button>
                            </>
                        )}

                        <Button variant="light" onPress={() => navigate("/medical-reports")}>
                            {t("common.cancel")}
                        </Button>
                        <Button
                            color="primary"
                            isLoading={saveLoading}
                            startContent={<FiSave />}
                            type="submit"
                        >
                            {isEditMode ? t("medicalReports.updateReport") : t("medicalReports.add")}
                        </Button>
                    </div>
                </form>
            </div>
        </DefaultLayout>
    );
}
