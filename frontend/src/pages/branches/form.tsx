import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Switch,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Textarea,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { FiSave, FiSearch, FiArrowLeft, FiHome, FiGitBranch } from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { branchesApi } from "@/api";
import usersApi from "@/api/usersApi";
import { PermissionField } from "@/components/PermissionField";
import { PERMISSIONS } from "@/types/permissions";
import { Branch, BranchCreateInput, UserMinimal } from "@/models/branch";

import DynamicFieldsManager from "./DynamicFieldsManager";

export default function BranchFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<BranchCreateInput>({
    name: "",
    prefix: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    manager: undefined,
    parent_id: undefined,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [users, setUsers] = useState<UserMinimal[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [branchType, setBranchType] = useState<"main" | "child">("main");
  const [parentBranches, setParentBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    // Fetch parent branches for selection
    const fetchParentBranches = async () => {
      try {
        setLoadingParents(true);
        const res = await branchesApi.getParentBranches();

        setParentBranches(res.data.results ?? []);
      } catch (err) {
        console.error("Failed to fetch parent branches", err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParentBranches();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const fetchBranch = async () => {
        try {
          setLoading(true);
          const res = await branchesApi.getById(parseInt(id));
          const branch = res.data;

          setCurrentBranch(branch);
          setBranchType(branch.parent ? "child" : "main");
          setFormData({
            name: branch.name,
            prefix: branch.prefix,
            address: branch.address || "",
            city: branch.city || "",
            phone: branch.phone || "",
            email: branch.email || "",
            manager: branch.manager,
            parent_id: branch.parent,
            is_active: branch.is_active,
          });
          if (branch.manager_details) {
            setUsers([branch.manager_details]);
          }
        } catch (err) {
          console.error("Failed to fetch branch", err);
        } finally {
          setLoading(false);
        }
      };

      fetchBranch();
    }
  }, [id, isEdit]);

  const handleInputChange = (field: keyof BranchCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUserSearch = async (search: string) => {
    if (!search) return;
    try {
      setSearchingUsers(true);
      const res = await usersApi.getAll({ search, page_size: 10 });

      setUsers(res.data.results);
    } catch (err) {
      console.error("Failed to search users", err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
      newErrors.name = t("branches.errors.nameRequired");
    if (!formData.prefix.trim())
      newErrors.prefix = t("branches.errors.prefixRequired");
    if (branchType === "child" && !formData.parent_id) {
      newErrors.parent_id = t("branches.form.parentRequired");
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaveLoading(true);
      if (isEdit && id) {
        await branchesApi.update(parseInt(id), formData);
      } else {
        await branchesApi.create(formData);
      }
      navigate("/branches");
    } catch (err: any) {
      console.error("Failed to save branch", err);
      if (err.response?.data) {
        const apiErrors: Record<string, string> = {};

        Object.keys(err.response.data).forEach((key) => {
          apiErrors[key] = Array.isArray(err.response.data[key])
            ? err.response.data[key][0]
            : err.response.data[key];
        });
        setErrors(apiErrors);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-64">
          {t("common.loading")}
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/branches")}
          >
            <FiArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? t("branches.edit") : t("branches.add")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEdit ? t("branches.edit") : t("branches.add")}
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Branch Type: Main vs Sub */}
              <div className="bg-default-50 p-4 rounded-xl">
                <p className="text-sm font-semibold text-foreground/80 mb-3">
                  {t("branches.form.branchType")}
                </p>
                <RadioGroup
                  isDisabled={currentBranch?.children_count ? true : false}
                  orientation="horizontal"
                  value={branchType}
                  onValueChange={(value) => {
                    setBranchType(value as "main" | "child");
                    if (value === "main") {
                      setFormData((prev) => ({ ...prev, parent_id: undefined }));
                    }
                  }}
                >
                  <Radio
                    description={t("branches.form.mainBranchDesc")}
                    value="main"
                  >
                    <div className="flex items-center gap-2">
                      <FiHome className="text-primary" />
                      {t("branches.form.mainBranch")}
                    </div>
                  </Radio>
                  <Radio
                    description={t("branches.form.childBranchDesc")}
                    value="child"
                  >
                    <div className="flex items-center gap-2">
                      <FiGitBranch className="text-warning" />
                      {t("branches.form.childBranch")}
                    </div>
                  </Radio>
                </RadioGroup>
                {currentBranch?.children_count ? (
                  <p className="text-warning text-xs mt-2">
                    {t("branches.form.hasChildrenWarning")}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isRequired
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  label={t("branches.form.name")}
                  placeholder={t("branches.form.namePlaceholder")}
                  value={formData.name}
                  onValueChange={(v: string) => handleInputChange("name", v)}
                />
                <PermissionField
                  editPermission={PERMISSIONS.BRANCH.CHANGE}
                  field="prefix"
                  label={t("branches.form.prefix")}
                  value={formData.prefix}
                  viewPermission={PERMISSIONS.BRANCH.VIEW}
                >
                  <Input
                    isRequired
                    errorMessage={errors.prefix}
                    isInvalid={!!errors.prefix}
                    label={t("branches.form.prefix")}
                    placeholder={t("branches.form.prefixPlaceholder")}
                    value={formData.prefix}
                    onValueChange={(v: string) =>
                      handleInputChange("prefix", v)
                    }
                  />
                </PermissionField>
              </div>

              <Textarea
                errorMessage={errors.address}
                isInvalid={!!errors.address}
                label={t("branches.form.address")}
                minRows={3}
                placeholder={t("branches.form.addressPlaceholder")}
                value={formData.address}
                onValueChange={(v: string) => handleInputChange("address", v)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  errorMessage={errors.city}
                  isInvalid={!!errors.city}
                  label={t("branches.form.city")}
                  placeholder={t("branches.form.cityPlaceholder")}
                  value={formData.city}
                  onValueChange={(v) => handleInputChange("city", v)}
                />
                <Input
                  errorMessage={errors.phone}
                  isInvalid={!!errors.phone}
                  label={t("branches.form.phone")}
                  placeholder={t("branches.form.phonePlaceholder")}
                  value={formData.phone}
                  onValueChange={(v) => handleInputChange("phone", v)}
                />
              </div>

              <Input
                errorMessage={errors.email}
                isInvalid={!!errors.email}
                label={t("branches.form.email")}
                placeholder={t("branches.form.emailPlaceholder")}
                type="email"
                value={formData.email}
                onValueChange={(v) => handleInputChange("email", v)}
              />

              {branchType === "child" && (
                <Autocomplete
                  isRequired
                  description={
                    currentBranch?.children_count
                      ? t("branches.form.hasChildrenWarning")
                      : undefined
                  }
                  errorMessage={
                    errors.parent_id ||
                    errors.parent ||
                    (branchType === "child" && !formData.parent_id
                      ? t("branches.form.parentRequired")
                      : undefined)
                  }
                  isDisabled={currentBranch?.children_count ? true : false}
                  isInvalid={
                    !!errors.parent_id ||
                    !!errors.parent ||
                    (branchType === "child" && !formData.parent_id)
                  }
                  isLoading={loadingParents}
                  items={parentBranches.filter(
                    (b) => b.id !== currentBranch?.id,
                  )}
                  label={t("branches.form.parentBranch")}
                  placeholder={t("branches.form.parentBranchPlaceholder")}
                  selectedKey={formData.parent_id?.toString()}
                  onSelectionChange={(key) =>
                    handleInputChange(
                      "parent_id",
                      key ? parseInt(key as string) : null,
                    )
                  }
                >
                  {(branch) => (
                    <AutocompleteItem
                      key={branch.id}
                      textValue={branch.name}
                    >
                      <div className="flex flex-col">
                        <span className="text-small font-medium">
                          {branch.name}
                        </span>
                        <span className="text-tiny text-default-400">
                          {branch.prefix}
                        </span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              )}

              <Autocomplete
                errorMessage={errors.manager}
                isInvalid={!!errors.manager}
                isLoading={searchingUsers}
                items={users}
                label={t("branches.form.manager")}
                placeholder={t("branches.form.managerSearch")}
                selectedKey={formData.manager?.toString()}
                startContent={<FiSearch className="text-default-400" />}
                onInputChange={handleUserSearch}
                onSelectionChange={(key) =>
                  handleInputChange(
                    "manager",
                    key ? parseInt(key as string) : null,
                  )
                }
              >
                {(user) => (
                  <AutocompleteItem
                    key={user.id}
                    textValue={user.full_name || user.username}
                  >
                    <div className="flex gap-2 items-center">
                      <Avatar
                        alt={user.username}
                        className="flex-shrink-0"
                        size="sm"
                        src={user.profile_image}
                      />
                      <div className="flex flex-col">
                        <span className="text-small">
                          {user.full_name || user.username}
                        </span>
                        <span className="text-tiny text-default-400">
                          {user.username}
                        </span>
                      </div>
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>

              <PermissionField
                editPermission={PERMISSIONS.BRANCH.CHANGE}
                field="is_active"
                label={t("branches.form.active")}
                value={
                  formData.is_active ? t("common.active") : t("common.inactive")
                }
                viewPermission={PERMISSIONS.BRANCH.VIEW}
              >
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(v) => handleInputChange("is_active", v)}
                >
                  {t("branches.form.active")}
                </Switch>
              </PermissionField>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  disabled={saveLoading}
                  variant="light"
                  onPress={() => navigate("/branches")}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={saveLoading}
                  startContent={<FiSave />}
                  type="submit"
                >
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {isEdit && id && (
          <div className="mt-6">
            <DynamicFieldsManager branchId={parseInt(id)} />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
