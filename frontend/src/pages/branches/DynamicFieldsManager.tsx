import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
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
  Switch,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@heroui/react";
import { FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";

import { useFieldPermission } from "@/hooks/useFieldPermission";
import { PERMISSIONS } from "@/types/permissions";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import branchDynamicFieldsApi from "@/api/branchDynamicFieldsApi";
import {
  BranchDynamicField,
  BranchDynamicFieldCreateInput,
  DynamicFieldOption,
  DynamicFieldType,
} from "@/models/dynamicField";

interface DynamicFieldsManagerProps {
  branchId: number;
}

const EMPTY_FORM: BranchDynamicFieldCreateInput = {
  branch: 0,
  label_ar: "",
  label_en: "",
  placeholder_ar: "",
  placeholder_en: "",
  field_type: "text",
  options: [],
  is_required: false,
  is_active: true,
  order: 0,
};

export default function DynamicFieldsManager({ branchId }: DynamicFieldsManagerProps) {
  const { t } = useTranslation();
  const permissionLevel = useFieldPermission({
    field: "dynamic_fields",
    viewPermission: PERMISSIONS.BRANCH.VIEW,
    editPermission: PERMISSIONS.BRANCH.CHANGE,
  });
  const canEdit = permissionLevel === "edit";

  const [fields, setFields] = useState<BranchDynamicField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<BranchDynamicField | null>(null);
  const [formData, setFormData] = useState<BranchDynamicFieldCreateInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<BranchDynamicField | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await branchDynamicFieldsApi.getByBranch(branchId);
      setFields(res.data.results ?? []);
    } catch (err) {
      console.error("Failed to fetch dynamic fields", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const openAddModal = () => {
    setEditingField(null);
    setFormData({ ...EMPTY_FORM, branch: branchId, order: fields.length });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (field: BranchDynamicField) => {
    setEditingField(field);
    setFormData({
      branch: branchId,
      label_ar: field.label_ar,
      label_en: field.label_en || "",
      placeholder_ar: field.placeholder_ar || "",
      placeholder_en: field.placeholder_en || "",
      field_type: field.field_type,
      options: field.options || [],
      is_required: field.is_required,
      is_active: field.is_active,
      order: field.order,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleFieldChange = (field: keyof BranchDynamicFieldCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleOptionChange = (index: number, key: keyof DynamicFieldOption, value: string) => {
    const options = [...(formData.options || [])];
    options[index] = { ...options[index], [key]: value };
    handleFieldChange("options", options);
  };

  const addOption = () => {
    const options = [...(formData.options || []), { value: "", label_ar: "", label_en: "" }];
    handleFieldChange("options", options);
  };

  const removeOption = (index: number) => {
    const options = (formData.options || []).filter((_, i) => i !== index);
    handleFieldChange("options", options);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.label_ar.trim()) newErrors.label_ar = t("branches.errors.nameRequired");
    if (formData.field_type === "select" && (!formData.options || formData.options.length === 0)) {
      newErrors.options = t("branches.dynamicFields.optionsRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        ...formData,
        options: formData.field_type === "select" ? formData.options : null,
      };
      if (editingField) {
        await branchDynamicFieldsApi.update(editingField.id, payload);
      } else {
        await branchDynamicFieldsApi.create(payload);
      }
      setModalOpen(false);
      await fetchFields();
    } catch (err: any) {
      console.error("Failed to save dynamic field", err);
      if (err.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(err.response.data).forEach((key) => {
          apiErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key][0]
            : String(err.response.data[key]);
        });
        setErrors(apiErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await branchDynamicFieldsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchFields();
    } catch (err) {
      console.error("Failed to delete dynamic field", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const typeLabel = (type: DynamicFieldType) =>
    t(`branches.dynamicFields.type${type.charAt(0).toUpperCase()}${type.slice(1)}`);

  if (permissionLevel === "hidden") return null;

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("branches.dynamicFields.title")}</h3>
            <p className="text-sm text-default-500">{t("branches.dynamicFields.subtitle")}</p>
          </div>
          {canEdit && (
            <Button color="primary" size="sm" startContent={<FiPlus />} onPress={openAddModal}>
              {t("branches.dynamicFields.add")}
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <Table removeWrapper aria-label={t("branches.dynamicFields.title")}>
              <TableHeader>
                <TableColumn>{t("branches.dynamicFields.labelAr")}</TableColumn>
                <TableColumn>{t("branches.dynamicFields.fieldType")}</TableColumn>
                <TableColumn>{t("branches.dynamicFields.required")}</TableColumn>
                <TableColumn>{t("branches.dynamicFields.active")}</TableColumn>
                <TableColumn>{canEdit ? t("branches.table.actions") : ""}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={t("branches.dynamicFields.noFields")} items={fields}>
                {(field) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.label_ar}</TableCell>
                    <TableCell>{typeLabel(field.field_type)}</TableCell>
                    <TableCell>
                      {field.is_required && (
                        <Chip color="warning" size="sm" variant="flat">
                          {t("branches.dynamicFields.required")}
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip color={field.is_active ? "success" : "default"} size="sm" variant="flat">
                        {field.is_active ? t("branches.form.active") : t("common.inactive")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button isIconOnly size="sm" variant="light" onPress={() => openEditModal(field)}>
                            <FiEdit />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => setDeleteTarget(field)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} placement="center" size="lg" onClose={() => setModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            {editingField ? t("branches.dynamicFields.edit") : t("branches.dynamicFields.add")}
          </ModalHeader>
          <ModalBody className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                errorMessage={errors.label_ar}
                isInvalid={!!errors.label_ar}
                label={t("branches.dynamicFields.labelAr")}
                placeholder={t("branches.dynamicFields.labelArPlaceholder")}
                value={formData.label_ar}
                onValueChange={(v) => handleFieldChange("label_ar", v)}
              />
              <Input
                label={t("branches.dynamicFields.labelEn")}
                placeholder={t("branches.dynamicFields.labelEnPlaceholder")}
                value={formData.label_en}
                onValueChange={(v) => handleFieldChange("label_en", v)}
              />
              <Input
                label={t("branches.dynamicFields.placeholderAr")}
                placeholder={t("branches.dynamicFields.placeholderArPlaceholder")}
                value={formData.placeholder_ar}
                onValueChange={(v) => handleFieldChange("placeholder_ar", v)}
              />
              <Input
                label={t("branches.dynamicFields.placeholderEn")}
                placeholder={t("branches.dynamicFields.placeholderEnPlaceholder")}
                value={formData.placeholder_en}
                onValueChange={(v) => handleFieldChange("placeholder_en", v)}
              />
            </div>

            <Select
              label={t("branches.dynamicFields.fieldType")}
              selectedKeys={[formData.field_type]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as DynamicFieldType;
                handleFieldChange("field_type", selected);
              }}
            >
              <SelectItem key="text">{t("branches.dynamicFields.typeText")}</SelectItem>
              <SelectItem key="boolean">{t("branches.dynamicFields.typeBoolean")}</SelectItem>
              <SelectItem key="select">{t("branches.dynamicFields.typeSelect")}</SelectItem>
              <SelectItem key="file">{t("branches.dynamicFields.typeFile")}</SelectItem>
            </Select>

            {formData.field_type === "select" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-default-600">
                    {t("branches.dynamicFields.options")}
                  </p>
                  <Button size="sm" startContent={<FiPlus />} variant="flat" onPress={addOption}>
                    {t("branches.dynamicFields.addOption")}
                  </Button>
                </div>
                {errors.options && <p className="text-tiny text-danger">{errors.options}</p>}
                {(formData.options || []).map((option, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <Input
                      label={t("branches.dynamicFields.optionValue")}
                      size="sm"
                      value={option.value}
                      onValueChange={(v) => handleOptionChange(index, "value", v)}
                    />
                    <Input
                      label={t("branches.dynamicFields.optionLabelAr")}
                      size="sm"
                      value={option.label_ar}
                      onValueChange={(v) => handleOptionChange(index, "label_ar", v)}
                    />
                    <div className="flex gap-2 items-end">
                      <Input
                        className="flex-1"
                        label={t("branches.dynamicFields.optionLabelEn")}
                        size="sm"
                        value={option.label_en || ""}
                        onValueChange={(v) => handleOptionChange(index, "label_en", v)}
                      />
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => removeOption(index)}
                      >
                        <FiX />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-6">
              <Switch
                isSelected={formData.is_required}
                onValueChange={(v) => handleFieldChange("is_required", v)}
              >
                {t("branches.dynamicFields.required")}
              </Switch>
              <Switch
                isSelected={formData.is_active}
                onValueChange={(v) => handleFieldChange("is_active", v)}
              >
                {t("branches.dynamicFields.active")}
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setModalOpen(false)}>
              {t("branches.dynamicFields.cancel")}
            </Button>
            <Button color="primary" isLoading={saving} onPress={handleSave}>
              {t("branches.dynamicFields.save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <DeleteConfirmModal
        isLoading={deleteLoading}
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.label_ar}
        title={t("branches.dynamicFields.delete")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
