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
    Select,
    SelectItem,
    Switch,
    Spinner,
    Progress,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiFile } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { apiClient } from "@/api/client";
import { libraryApi, LibraryItemCreateRequest, LibraryItemType, MAX_FILE_SIZE } from "@/api/libraryApi";

const FILE_SIZE_LIMIT_MSG = "File size must be under 250MB. Only PDF files are accepted.";

const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);

interface SpecialtyOption {
    id: number;
    name: string;
}

export default function LibraryFormPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [formData, setFormData] = useState<LibraryItemCreateRequest>({
        title: "",
        description: "",
        category: "",
        item_type: "pdf",
        external_link: "",
        publication_year: new Date().getFullYear(),
        is_public: true,
    });

    const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchSpecialties = async () => {
            try {
                const res = await apiClient.get("/doctor-specialties/");
                setSpecialties(res.data);
            } catch {
                setSpecialties([]);
            }
        };
        fetchSpecialties();
    }, []);

    useEffect(() => {
        if (isEditMode && id) {
            const fetchItem = async () => {
                try {
                    setLoading(true);
                    const response = await libraryApi.getById(Number(id));
                    const item = response.data;

                    setFormData({
                        title: item.title,
                        description: item.description || "",
                        category: item.category || "",
                        item_type: item.item_type,
                        external_link: item.external_link || "",
                        publication_year: item.publication_year || new Date().getFullYear(),
                        is_public: item.is_public,
                        specialty: item.specialty,
                    });
                } catch (error) {
                    console.error("Failed to fetch library item:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchItem();
        }
    }, [id, isEditMode]);

    const handleInputChange = (field: keyof LibraryItemCreateRequest, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > MAX_FILE_SIZE) {
                setErrors((prev) => ({ ...prev, file: FILE_SIZE_LIMIT_MSG }));
                return;
            }
            if (!selected.name.toLowerCase().endsWith('.pdf')) {
                setErrors((prev) => ({ ...prev, file: "Only PDF files are accepted." }));
                return;
            }
            setFile(selected);
            setErrors((prev) => ({ ...prev, file: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = t("library.form.titleRequired", "Title is required");
        if (formData.item_type === 'link' && !formData.external_link?.trim()) {
            newErrors.external_link = t("library.form.linkRequired", "External link is required");
        }
        if (formData.item_type !== 'link' && !file && !isEditMode) {
            newErrors.file = t("library.form.fileRequired", "File is required");
        }
        if (file && file.size > MAX_FILE_SIZE) {
            newErrors.file = FILE_SIZE_LIMIT_MSG;
        }
        if (file && !file.name.toLowerCase().endsWith('.pdf')) {
            newErrors.file = "Only PDF files are accepted.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setSaveLoading(true);
            setUploadProgress(0);

            if (isEditMode && id) {
                const data: any = { ...formData };
                if (file) data.file = file;
                await libraryApi.updateWithProgress(Number(id), data, (percent: number) => setUploadProgress(percent));
            } else if (file && formData.item_type !== 'link') {
                await libraryApi.createChunked(file, {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    specialty: formData.specialty,
                    author_name: formData.author_name,
                    publication_year: formData.publication_year,
                    is_public: formData.is_public,
                }, (percent: number) => setUploadProgress(percent));
            } else {
                const data: any = { ...formData };
                if (file) data.file = file;
                await libraryApi.createWithProgress(data, (percent: number) => setUploadProgress(percent));
            }

            navigate("/library");
        } catch (error: any) {
            console.error("Failed to save library item:", error);
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        } finally {
            setSaveLoading(false);
            setUploadProgress(null);
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

    return (
        <DefaultLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button isIconOnly variant="light" onPress={() => navigate("/library")}>
                        <FiArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isEditMode ? t("library.form.editTitle", "Edit Resource") : t("library.form.createTitle", "Add New Resource")}
                        </h1>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">{t("library.form.basicInfo", "General Information")}</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                isRequired
                                errorMessage={errors.title}
                                isInvalid={!!errors.title}
                                label={t("library.form.titleLabel", "Title")}
                                value={formData.title}
                                onValueChange={(value) => handleInputChange("title", value)}
                            />

                            <Input
                                label={t("library.form.authorLabel", "Author")}
                                value={formData.author_name}
                                onValueChange={(value) => handleInputChange("author_name", value)}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label={t("library.form.itemTypeLabel", "Resource Type")}
                                    selectedKeys={[formData.item_type]}
                                    onSelectionChange={(keys) => handleInputChange("item_type", Array.from(keys)[0] as LibraryItemType)}
                                >
                                    <SelectItem key="pdf">PDF</SelectItem>
                                    <SelectItem key="image" className="hidden">Image</SelectItem>
                                    <SelectItem key="video" className="hidden">Video</SelectItem>
                                    <SelectItem key="link">External Link</SelectItem>
                                    <SelectItem key="other" className="hidden">Other</SelectItem>
                                </Select>

                                <Input
                                    type="number"
                                    label={t("library.form.yearLabel", "Year")}
                                    value={formData.publication_year?.toString()}
                                    onValueChange={(value) => handleInputChange("publication_year", value ? parseInt(value) : undefined)}
                                />
                            </div>

                            <Input
                                label={t("library.form.categoryLabel", "Category")}
                                value={formData.category}
                                onValueChange={(value) => handleInputChange("category", value)}
                            />

                            <Select
                                label={t("library.form.specialtyLabel", "Specialty")}
                                selectedKeys={formData.specialty ? [String(formData.specialty)] : []}
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0];
                                    handleInputChange("specialty", val ? Number(val) : undefined);
                                }}
                            >
                                {specialties.map((s) => (
                                    <SelectItem key={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </Select>

                            <Textarea
                                label={t("library.form.descriptionLabel", "Description")}
                                minRows={4}
                                value={formData.description}
                                onValueChange={(value) => handleInputChange("description", value)}
                            />

                            <Switch
                                isSelected={formData.is_public}
                                onValueChange={(val) => handleInputChange("is_public", val)}
                            >
                                {t("library.form.isPublicLabel", "Public Visibility")}
                            </Switch>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">{t("library.form.filesTitle", "Resource Content")}</h2>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            {formData.item_type !== 'link' ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">{t("library.form.fileLabel", "Main File")}</p>
                                    <p className="text-xs text-default-400">
                                        {t("library.form.maxSizeInfo", `Maximum file size: ${MAX_FILE_SIZE_MB} MB. Only PDF files are accepted.`)}
                                    </p>
                                    <div className="flex items-center gap-4">
                                    <Button
                                        as="label"
                                        color="primary"
                                        variant="flat"
                                        htmlFor="library-file-upload"
                                        startContent={<FiFile />}
                                    >
                                        {t("library.form.chooseFile", "Upload PDF")}
                                        <input
                                            type="file"
                                            id="library-file-upload"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                    {file && <span className="text-sm italic">{file.name}</span>}
                                    {errors.file && <p className="text-xs text-danger">{errors.file}</p>}
                                    {isEditMode && !file && <span className="text-sm text-default-400 italic">{t("library.form.filePreserved", "Keep existing file or upload new one")}</span>}
                                </div>
                                {uploadProgress !== null && (
                                    <Progress
                                        aria-label="Uploading..."
                                        className="max-w-md"
                                        color="primary"
                                        showValueLabel
                                        size="md"
                                        value={uploadProgress}
                                    />
                                )}
                                </div>
                            ) : (
                                <Input
                                    label={t("library.form.urlLabel", "External URL")}
                                    placeholder="https://..."
                                    value={formData.external_link}
                                    onValueChange={(value) => handleInputChange("external_link", value)}
                                />
                            )}
                        </CardBody>
                    </Card>

                    <div className="flex gap-4 justify-end pt-4">
                        <Button variant="light" onPress={() => navigate("/library")}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            color="primary"
                            isLoading={saveLoading}
                            startContent={<FiSave />}
                            type="submit"
                        >
                            {isEditMode ? t("library.form.update", "Update") : t("library.form.create", "Add to Library")}
                        </Button>
                    </div>
                </form>
            </div>
        </DefaultLayout>
    );
}
