import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Textarea,
  Accordion,
  AccordionItem,
  Checkbox,
  Chip,
  Spinner,
} from "@heroui/react";
import { FiSave, FiArrowLeft, FiShield, FiCheck } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import userGroupsApi from "@/api/userGroupsApi";
import permissionsApi, { GroupedPermissions } from "@/api/permissionsApi";
import { UserGroupCreate } from "@/models/userGroups";

export default function UserGroupsFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // State
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupedPermissions, setGroupedPermissions] = useState<{
    [key: string]: GroupedPermissions;
  }>({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<UserGroupCreate>({
    name: "",
    description: "",
    permissions: [],
  });

  // Load grouped permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setPermissionsLoading(true);
        const response = await permissionsApi.getGrouped();

        setGroupedPermissions(response.data);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Load group data for editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchGroup = async () => {
        try {
          setLoading(true);
          const response = await userGroupsApi.getById(parseInt(id));
          const group = response.data;

          setFormData({
            name: group.name,
            description: group.description || "",
            permissions: group.permissions || [],
          });
        } catch (error) {
          console.error("Failed to fetch group:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchGroup();
    }
  }, [id, isEdit]);

  // Handle input changes
  const handleInputChange = (field: keyof UserGroupCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };

        delete newErrors[field];

        return newErrors;
      });
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionCodename: string) => {
    const currentPermissions = formData.permissions || [];
    const permissionFullName = `niqabaty.${permissionCodename}`;

    if (currentPermissions.includes(permissionFullName)) {
      handleInputChange(
        "permissions",
        currentPermissions.filter((p) => p !== permissionFullName),
      );
    } else {
      handleInputChange("permissions", [
        ...currentPermissions,
        permissionFullName,
      ]);
    }
  };

  // Handle select all for a model
  const handleSelectAllModel = (modelKey: string) => {
    const modelPerms = groupedPermissions[modelKey];

    if (!modelPerms) return;

    const currentPermissions = formData.permissions || [];
    const modelPermissionNames = modelPerms.permissions.map(
      (p) => `${modelPerms.app_label}.${p.codename}`,
    );

    const allSelected = modelPermissionNames.every((p) =>
      currentPermissions.includes(p),
    );

    if (allSelected) {
      // Deselect all
      handleInputChange(
        "permissions",
        currentPermissions.filter((p) => !modelPermissionNames.includes(p)),
      );
    } else {
      // Select all
      const newPermissions = Array.from(
        new Set([...currentPermissions, ...modelPermissionNames]),
      );

      handleInputChange("permissions", newPermissions);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("permissionGroups.form.required");
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaveLoading(true);
      if (isEdit && id) {
        await userGroupsApi.update(parseInt(id), formData as any);
      } else {
        await userGroupsApi.create(formData);
      }
      navigate("/user-groups");
    } catch (error: any) {
      console.error("Failed to save group:", error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // Filter permissions by search query
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce(
    (acc, [key, group]) => {
      if (!searchQuery) {
        acc[key] = group;

        return acc;
      }

      const filteredPermissions = group.permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.model_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (filteredPermissions.length > 0) {
        acc[key] = { ...group, permissions: filteredPermissions };
      }

      return acc;
    },
    {} as { [key: string]: GroupedPermissions },
  );

  // Calculate selected count
  const selectedCount = formData.permissions?.length || 0;

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/user-groups")}
          >
            <FiArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold text-default-900">
            {isEdit ? t("permissionGroups.edit") : t("permissionGroups.add")}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="flex gap-3 px-6 py-4 border-b border-default-100">
              <FiShield className="text-primary" size={24} />
              <div className="flex flex-col">
                <p className="text-lg font-semibold">
                  {isEdit
                    ? formData.name
                    : t("permissionGroups.form.basicInfo")}
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {t("permissionGroups.form.basicInfo")}
                </h3>

                <Input
                  isRequired
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  label={t("permissionGroups.form.name")}
                  placeholder={t("permissionGroups.form.namePlaceholder")}
                  value={formData.name}
                  onValueChange={(value) => handleInputChange("name", value)}
                />

                <Textarea
                  label={t("permissionGroups.form.description")}
                  minRows={3}
                  placeholder={t(
                    "permissionGroups.form.descriptionPlaceholder",
                  )}
                  value={formData.description}
                  onValueChange={(value) =>
                    handleInputChange("description", value)
                  }
                />
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {t("permissionGroups.form.permissionsSection")}
                  </h3>
                  <Chip color="primary" variant="flat">
                    {t("permissionGroups.form.selectedCount", {
                      count: selectedCount,
                    })}
                  </Chip>
                </div>

                {/* Search permissions */}
                <Input
                  isClearable
                  placeholder={t("permissionGroups.form.searchPermissions")}
                  value={searchQuery}
                  onClear={() => setSearchQuery("")}
                  onValueChange={setSearchQuery}
                />

                {/* Grouped Permissions Accordion */}
                {permissionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <Accordion selectionMode="multiple" variant="bordered">
                    {Object.entries(filteredGroupedPermissions).map(
                      ([modelKey, group]) => {
                        const modelPermissionNames = group.permissions.map(
                          (p) => `${group.app_label}.${p.codename}`,
                        );
                        const selectedInModel = modelPermissionNames.filter(
                          (p) => formData.permissions?.includes(p),
                        );
                        const allSelected =
                          selectedInModel.length ===
                          modelPermissionNames.length;
                        const someSelected =
                          selectedInModel.length > 0 && !allSelected;

                        return (
                          <AccordionItem
                            key={modelKey}
                            title={
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {group.model_name}
                                  </span>
                                  <Chip
                                    color="default"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {selectedInModel.length}/
                                    {group.permissions.length}
                                  </Chip>
                                </div>
                                {allSelected && (
                                  <FiCheck className="text-success" />
                                )}
                              </div>
                            }
                          >
                            <div className="space-y-2 pl-2">
                              {/* Select All checkbox */}
                              <div className="pb-2 border-b border-default-100">
                                <Checkbox
                                  isIndeterminate={someSelected}
                                  isSelected={allSelected}
                                  onValueChange={() =>
                                    handleSelectAllModel(modelKey)
                                  }
                                >
                                  <span className="font-medium">
                                    {allSelected
                                      ? t("permissionGroups.form.deselectAll")
                                      : t("permissionGroups.form.selectAll")}
                                  </span>
                                </Checkbox>
                              </div>

                              {/* Individual permissions */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {group.permissions.map((permission) => {
                                  const fullPermName = `${group.app_label}.${permission.codename}`;

                                  return (
                                    <Checkbox
                                      key={permission.id}
                                      isSelected={formData.permissions?.includes(
                                        fullPermName,
                                      )}
                                      onValueChange={() =>
                                        handlePermissionToggle(
                                          permission.codename,
                                        )
                                      }
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-sm">
                                          {permission.name}
                                        </span>
                                        <span className="text-xs text-default-400">
                                          {permission.codename}
                                        </span>
                                      </div>
                                    </Checkbox>
                                  );
                                })}
                              </div>
                            </div>
                          </AccordionItem>
                        );
                      },
                    )}
                  </Accordion>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-default-100">
                <Button
                  variant="light"
                  onPress={() => navigate("/user-groups")}
                >
                  {t("permissionGroups.form.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={saveLoading}
                  startContent={!saveLoading && <FiSave />}
                  type="submit"
                >
                  {t("permissionGroups.form.save")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      </div>
    </DefaultLayout>
  );
}
