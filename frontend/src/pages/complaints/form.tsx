import { useState, useEffect, useMemo } from "react";
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
  Spinner,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiPaperclip, FiX } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { complaintsApi, ComplaintCreateRequest } from "@/api/complaintsApi";
import { useUserStore } from "@/stores/userStore";

interface BranchOption {
  id: number;
  name: string;
  isParent?: boolean;
}

export default function ComplaintsFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useUserStore();

  // Form state
  const [formData, setFormData] = useState<ComplaintCreateRequest>({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    sent_to_branch: undefined,
  });

  const [existingBranchDetail, setExistingBranchDetail] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>("");
  const [adminResponse, setAdminResponse] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available branches derived from the authenticated user's assigned branch and its parent branch
  const availableBranches = useMemo<BranchOption[]>(() => {
    const branchMap = new Map<number, BranchOption>();

    if (user?.branches && Array.isArray(user.branches)) {
      user.branches.forEach((b) => {
        // User's own branch
        if (b.id && !branchMap.has(b.id)) {
          branchMap.set(b.id, {
            id: b.id,
            name: b.name,
            isParent: false,
          });
        }
        // Parent branch
        if (
          b.parent_details &&
          b.parent_details.id &&
          !branchMap.has(b.parent_details.id)
        ) {
          branchMap.set(b.parent_details.id, {
            id: b.parent_details.id,
            name: b.parent_details.name,
            isParent: true,
          });
        }
      });
    }

    // If editing an existing complaint with a branch not in branchMap, retain it
    if (existingBranchDetail && !branchMap.has(existingBranchDetail.id)) {
      branchMap.set(existingBranchDetail.id, {
        id: existingBranchDetail.id,
        name: existingBranchDetail.name,
        isParent: false,
      });
    }

    return Array.from(branchMap.values());
  }, [user?.branches, existingBranchDetail]);

  // Pre-select user's own branch when creating a new complaint
  useEffect(() => {
    if (
      !isEditMode &&
      formData.sent_to_branch === undefined &&
      availableBranches.length > 0
    ) {
      const defaultBranch =
        availableBranches.find((b) => !b.isParent) || availableBranches[0];

      if (defaultBranch) {
        setFormData((prev) => ({ ...prev, sent_to_branch: defaultBranch.id }));
      }
    }
  }, [isEditMode, availableBranches, formData.sent_to_branch]);

  // Load complaint data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchComplaint = async () => {
        try {
          setLoading(true);
          const response = await complaintsApi.getById(Number(id));
          const complaint = response.data;

          setFormData({
            subject: complaint.subject,
            description: complaint.description,
            priority: complaint.priority,
            category: complaint.category || "",
            sent_to_branch: complaint.sent_to_branch,
          });

          if (complaint.sent_to_branch_detail) {
            setExistingBranchDetail(complaint.sent_to_branch_detail);
          }

          setAdminResponse(complaint.admin_response || "");
          setStatus(complaint.status);

          if (complaint.attachment) {
            setAttachmentPreview(complaint.attachment as string);
          }
        } catch (error) {
          console.error("Failed to fetch complaint:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchComplaint();
    }
  }, [id, isEditMode]);

  // Handle form field changes
  const handleInputChange = (
    field: keyof ComplaintCreateRequest,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview("");
      }
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject?.trim()) newErrors.subject = "Subject is required";
    if (!formData.description?.trim())
      newErrors.description = "Description is required";
    if (availableBranches.length > 0 && !formData.sent_to_branch) {
      newErrors.sent_to_branch = t(
        "complaints.form.selectBranch",
        "Please select a branch",
      );
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      const data = { ...formData };

      if (attachment) {
        data.attachment = attachment;
      }

      if (isEditMode && id) {
        if (user?.is_staff) {
          // Admin can update status and response
          await complaintsApi.addResponse(Number(id), adminResponse);
          if (status === "resolved") {
            await complaintsApi.resolve(Number(id), adminResponse);
          } else {
            await complaintsApi.patch(Number(id), { ...data, status } as any);
          }
        } else {
          // User can update basic info
          await complaintsApi.patch(Number(id), data as any);
        }
      } else {
        // Create new
        await complaintsApi.create(data);
      }

      navigate("/complaints");
    } catch (error: any) {
      console.error("Failed to save complaint:", error);
      if (error.response?.data) {
        const rawErrors = error.response.data;
        const fieldErrors: Record<string, string> = {};

        for (const [key, value] of Object.entries(rawErrors)) {
          if (Array.isArray(value)) {
            fieldErrors[key] = value.join(" ");
          } else if (typeof value === "string") {
            fieldErrors[key] = value;
          }
        }
        setErrors(fieldErrors);
      }
    } finally {
      setSaveLoading(false);
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/complaints")}
          >
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode
                ? t("complaints.editTitle", "Complaint Details")
                : t("complaints.createTitle", "Submit New Complaint")}
            </h1>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("complaints.form.info", "Basic Information")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                isRequired
                disabled={isEditMode && user?.is_staff}
                errorMessage={errors.subject}
                isInvalid={!!errors.subject}
                label={t("complaints.form.subject", "Subject")}
                value={formData.subject}
                onValueChange={(value) => handleInputChange("subject", value)}
              />

              <Input
                disabled={isEditMode && user?.is_staff}
                label={t("complaints.form.category", "Category")}
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              />

              <Select
                disabled={isEditMode && user?.is_staff}
                label={t("complaints.form.priority", "Priority")}
                selectedKeys={[formData.priority!]}
                onSelectionChange={(keys) =>
                  handleInputChange("priority", Array.from(keys)[0])
                }
              >
                <SelectItem key="low">
                  {t("complaints.priority.low", "Low")}
                </SelectItem>
                <SelectItem key="medium">
                  {t("complaints.priority.medium", "Medium")}
                </SelectItem>
                <SelectItem key="high">
                  {t("complaints.priority.high", "High")}
                </SelectItem>
                <SelectItem key="urgent">
                  {t("complaints.priority.urgent", "Urgent")}
                </SelectItem>
              </Select>

              <Select
                disabled={isEditMode && user?.is_staff}
                errorMessage={errors.sent_to_branch}
                isInvalid={!!errors.sent_to_branch}
                isRequired={availableBranches.length > 0}
                label={t("complaints.form.sentToBranch", "Send To Branch")}
                placeholder={
                  availableBranches.length === 0
                    ? t(
                        "complaints.form.noBranchesAvailable",
                        "No branch associated with your account",
                      )
                    : t(
                        "complaints.form.selectBranch",
                        "Select syndicate branch",
                      )
                }
                selectedKeys={
                  formData.sent_to_branch
                    ? [formData.sent_to_branch.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];

                  handleInputChange(
                    "sent_to_branch",
                    selected ? Number(selected) : undefined,
                  );
                }}
              >
                {availableBranches.map((b) => (
                  <SelectItem
                    key={b.id.toString()}
                    description={
                      b.isParent
                        ? t(
                            "complaints.form.parentBranch",
                            "General Syndicate (Parent Branch)",
                          )
                        : t("complaints.form.userBranch", "My Branch")
                    }
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </Select>

              <Textarea
                isRequired
                disabled={isEditMode && user?.is_staff}
                errorMessage={errors.description}
                isInvalid={!!errors.description}
                label={t("complaints.form.description", "Description")}
                minRows={6}
                value={formData.description}
                onValueChange={(value) =>
                  handleInputChange("description", value)
                }
              />
            </CardBody>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("complaints.form.attachments", "Attachments")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {attachmentPreview ? (
                <div className="relative">
                  <img
                    alt="Attachment"
                    className="max-w-full h-48 object-contain rounded-lg border"
                    src={attachmentPreview}
                  />
                  {!isEditMode && (
                    <Button
                      isIconOnly
                      className="absolute top-2 right-2"
                      color="danger"
                      size="sm"
                      onPress={() => {
                        setAttachment(null);
                        setAttachmentPreview("");
                      }}
                    >
                      <FiX />
                    </Button>
                  )}
                </div>
              ) : (
                !isEditMode && (
                  <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                    <FiPaperclip className="mx-auto text-4xl text-default-400 mb-2" />
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
                      {t("complaints.form.chooseFile", "Choose File")}
                    </Button>
                  </div>
                )
              )}
              {isEditMode && !attachmentPreview && !attachment && (
                <p className="text-default-500 text-sm italic">
                  {t(
                    "complaints.form.noAttachment",
                    "No attachments provided.",
                  )}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Admin Response Section */}
          {(user?.is_staff || (isEditMode && adminResponse)) && (
            <Card className={user?.is_staff ? "border-primary border-2" : ""}>
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  {t("complaints.form.adminSection", "Admin Response")}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {user?.is_staff ? (
                  <>
                    <Select
                      label={t("complaints.form.status", "Change Status")}
                      selectedKeys={[status]}
                      onSelectionChange={(keys) =>
                        setStatus(Array.from(keys)[0] as string)
                      }
                    >
                      <SelectItem key="pending">
                        {t("complaints.status.pending", "Pending")}
                      </SelectItem>
                      <SelectItem key="in_progress">
                        {t("complaints.status.in_progress", "In Progress")}
                      </SelectItem>
                      <SelectItem key="resolved">
                        {t("complaints.status.resolved", "Resolved")}
                      </SelectItem>
                      <SelectItem key="closed">
                        {t("complaints.status.closed", "Closed")}
                      </SelectItem>
                    </Select>
                    <Textarea
                      label={t(
                        "complaints.form.adminResponse",
                        "Response Message",
                      )}
                      minRows={4}
                      value={adminResponse}
                      onValueChange={setAdminResponse}
                    />
                  </>
                ) : (
                  <div className="bg-default-100 p-4 rounded-lg">
                    <p className="font-semibold text-sm mb-1">
                      {t(
                        "complaints.form.responseFromAdmin",
                        "Response from Admin:",
                      )}
                    </p>
                    <p className="whitespace-pre-wrap">{adminResponse}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <div className="flex gap-4 justify-end">
            <Button variant="light" onPress={() => navigate("/complaints")}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={saveLoading}
              startContent={<FiSave />}
              type="submit"
            >
              {isEditMode
                ? t("complaints.updateSubmit", "Update")
                : t("complaints.createSubmit", "Submit")}
            </Button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
}
