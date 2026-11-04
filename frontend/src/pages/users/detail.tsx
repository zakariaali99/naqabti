import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Divider,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/react";
import {
  FiArrowLeft,
  FiEdit,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";

import DefaultLayout from "@/layouts/default";
import usersApi from "@/api/usersApi";
import { UserEntity } from "@/models/users";
import { formatDate } from "@/misc/formatDate";

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [user, setUser] = useState<UserEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleActiveLoading, setToggleActiveLoading] = useState(false);
  const [verifyingLoading, setVerifyingLoading] = useState(false);

  // Modal states
  const {
    isOpen: isPassportModalOpen,
    onOpen: onPassportModalOpen,
    onClose: onPassportModalClose,
  } = useDisclosure();
  const {
    isOpen: isToggleActiveModalOpen,
    onOpen: onToggleActiveModalOpen,
    onClose: onToggleActiveModalClose,
  } = useDisclosure();

  // Fetch user details
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getById(parseInt(id));

        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleToggleActive = () => {
    onToggleActiveModalOpen();
  };

  const handleManualVerification = async () => {
    if (!user) return;
    try {
      setVerifyingLoading(true);
      await usersApi.verifyEmail(user.id);
      // Refresh user details
      const response = await usersApi.getById(user.id);

      setUser(response.data);
      toast.success(
        t("common.verifiedSuccessfully", "Email verified successfully"),
      );
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error(t("common.verifyFailed", "Failed to verify email"));
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!user) return;

    try {
      setToggleActiveLoading(true);
      await usersApi.toggleActive(user.id);

      // Refresh user details
      const response = await usersApi.getById(user.id);

      setUser(response.data);

      onToggleActiveModalClose();
    } catch (error) {
      console.error("Failed to toggle active status:", error);
    } finally {
      setToggleActiveLoading(false);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!user) {
    return (
      <DefaultLayout>
        <div className="p-6">
          <Card>
            <CardBody>
              <p className="text-center text-default-500">
                {t("common.notFound")}
              </p>
            </CardBody>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div
        className="p-6 space-y-6"
        dir={user.language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate("/users")}
            >
              <FiArrowLeft className="text-xl" />
            </Button>
            <h1 className="text-2xl font-bold">
              {t("users.details", "User Details")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!user.email_verified && (
              <Button
                color="success"
                isLoading={verifyingLoading}
                startContent={<FiCheck />}
                variant="flat"
                onPress={handleManualVerification}
              >
                {t("common.verifyManually", "Verify Manually")}
              </Button>
            )}
            <Button
              color={user.passport_image ? "primary" : "warning"}
              startContent={
                user.passport_image ? <FiFileText /> : <FiAlertCircle />
              }
              variant="flat"
              onPress={onPassportModalOpen}
            >
              {user.passport_image
                ? t("doctors.viewPassport")
                : t("doctors.noPassport")}
            </Button>
            <Button
              color={user.is_active ? "danger" : "success"}
              startContent={user.is_active ? <FiXCircle /> : <FiCheckCircle />}
              variant="flat"
              onPress={handleToggleActive}
            >
              {user.is_active
                ? t("common.deactivate")
                : t("common.activate")}
            </Button>
            <Button
              color="primary"
              startContent={<FiEdit />}
              onPress={() => navigate(`/users/${id}/edit`)}
            >
              {t("common.edit")}
            </Button>
          </div>
        </div>

        {/* User Details Card */}
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Profile Image Side - fills card height */}
            <div className="h-40 md:h-auto md:w-56 lg:w-64 flex-shrink-0 bg-default-100 dark:bg-default-50/5">
              {user.profile_image ? (
                <img
                  alt={user.full_name || user.username}
                  className="w-full h-full object-cover"
                  src={user.profile_image}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiUser className="text-5xl text-default-400" />
                </div>
              )}
            </div>

            {/* Details Side */}
            <div className="flex-1">
              <CardHeader className="px-4 py-3 block">
                <div className=" w-full items-center justify-between gap-4 mb-2">
                  <div className="min-w-0 flex-1">
                    <h2
                      className={`text-base font-semibold truncate ${user.language === "ar" ? "text-right" : "text-left"}`}
                    >
                      {user.first_name_field && user.family_name
                        ? `${user.first_name_field} ${user.father_name || ""} ${user.grandfather_name || ""} ${user.family_name}`.trim()
                        : user.full_name || user.username}
                    </h2>
                    {/* English name if available */}
                    {user.first_name_en && user.family_name_en && (
                      <p
                        className={`text-xs text-default-400 truncate ${user.language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {`${user.first_name_en} ${user.father_name_en || ""} ${user.grandfather_name_en || ""} ${user.family_name_en}`.trim()}
                      </p>
                    )}
                    <p
                      className={`text-xs text-default-400 truncate ${user.language === "ar" ? "text-right" : "text-left"}`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    color={user.email_verified ? "success" : "warning"}
                    size="sm"
                    startContent={
                      user.email_verified ? (
                        <FiCheck size={12} />
                      ) : (
                        <FiAlertCircle size={12} />
                      )
                    }
                    variant="flat"
                  >
                    {user.email_verified
                      ? t("common.verified", "Verified")
                      : t("common.unverified", "Unverified")}
                  </Chip>
                  <Chip
                    color={user.is_active ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {user.is_active ? t("common.active") : t("common.inactive")}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {t("users.form.language")}:{" "}
                    {user.language === "ar"
                      ? t("users.languages.ar")
                      : t("users.languages.en")}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    {t("users.form.userType")}:{" "}
                    {t(`users.userTypes.${user.user_type}`)}
                  </Chip>
                  {user.is_staff && (
                    <Chip color="secondary" size="sm" variant="flat">
                      {t("users.form.isStaff", "Staff")}
                    </Chip>
                  )}

                </div>
              </CardHeader>
              <Divider className="m-0" />
              <CardBody className="gap-3 px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                  {/* Username */}
                  <div
                    className={
                      user.language === "ar" ? "text-right" : "text-left"
                    }
                  >
                    <p className="text-xs text-default-400">
                      {t("users.form.username")}
                    </p>
                    <p className="text-sm font-medium">{user.username}</p>
                  </div>

                  {/* Arabic Name */}
                  <div
                    className={
                      user.language === "ar" ? "text-right" : "text-left"
                    }
                  >
                    <p className="text-xs text-default-400">
                      {t("users.form.arabicName", "Arabic Name")}
                    </p>
                    <p className="text-sm font-medium">
                      {user.first_name_field && user.family_name
                        ? `${user.first_name_field} ${user.father_name || ""} ${user.grandfather_name || ""} ${user.family_name}`.trim()
                        : user.full_name || "-"}
                    </p>
                  </div>

                  {/* English Name */}
                  {user.first_name_en && user.family_name_en && (
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400">
                        {t("users.form.englishName", "English Name")}
                      </p>
                      <p className="text-sm font-medium">
                        {`${user.first_name_en} ${user.father_name_en || ""} ${user.grandfather_name_en || ""} ${user.family_name_en}`.trim()}
                      </p>
                    </div>
                  )}

                  {/* Phone Number */}
                  <div
                    className={
                      user.language === "ar" ? "text-right" : "text-left"
                    }
                  >
                    <p className="text-xs text-default-400">
                      {t("users.form.phone")}
                    </p>
                    <p className="text-sm font-medium">
                      {user.phone_number || "-"}
                    </p>
                  </div>

                  {/* Date Joined */}
                  <div
                    className={
                      user.language === "ar" ? "text-right" : "text-left"
                    }
                  >
                    <p className="text-xs text-default-400">
                      {t("users.table.dateJoined")}
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(user.date_joined)}
                    </p>
                  </div>

                  {/* Last Login */}
                  {user.last_login && (
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400">
                        {t("users.form.lastLogin")}
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(user.last_login)}
                      </p>
                    </div>
                  )}

                  {/* City */}
                  {user.city && (
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400">
                        {t("users.form.city", "City")}
                      </p>
                      <p className="text-sm font-medium">{user.city}</p>
                    </div>
                  )}

                  {/* Nationality */}
                  {user.nationality && (
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400">
                        {t("users.form.nationality", "Nationality")}
                      </p>
                      <p className="text-sm font-medium">{user.nationality}</p>
                    </div>
                  )}

                  {/* Gender */}
                  {user.gender && (
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400">
                        {t("users.form.gender", "Gender")}
                      </p>
                      <p className="text-sm font-medium">
                        {user.gender === "male"
                          ? t("users.genders.male", "Male")
                          : t("users.genders.female", "Female")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Address */}
                {user.address && (
                  <>
                    <Divider className="my-2" />
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400 mb-1">
                        {t("users.form.address", "Address")}
                      </p>
                      <p className="text-sm text-default-600">{user.address}</p>
                    </div>
                  </>
                )}

                {/* Bio */}
                {user.bio && (
                  <>
                    <Divider className="my-2" />
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400 mb-1">
                        {t("users.form.bio")}
                      </p>
                      <p className="text-sm text-default-600">{user.bio}</p>
                    </div>
                  </>
                )}

                {/* Groups */}
                {user.group_names && user.group_names.length > 0 && (
                  <>
                    <Divider className="my-2" />
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400 mb-1">
                        {t("users.form.groups")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {user.group_names.map((group, index) => (
                          <Chip key={index} size="sm" variant="flat">
                            {group}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Branches */}
                {user.branches && user.branches.length > 0 && (
                  <>
                    <Divider className="my-2" />
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400 mb-1">Branches</p>
                      <div className="flex flex-wrap gap-1">
                        {user.branches.map((branch) => (
                          <Chip key={branch.id} size="sm" variant="flat">
                            {branch.name} ({branch.prefix})
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Managed Branches */}
                {user.managed_branches && user.managed_branches.length > 0 && (
                  <>
                    <Divider className="my-2" />
                    <div
                      className={
                        user.language === "ar" ? "text-right" : "text-left"
                      }
                    >
                      <p className="text-xs text-default-400 mb-1">
                        {t("users.managedBranches", "Managed Branches")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {user.managed_branches.map((branch) => (
                          <Chip key={branch.id} size="sm" variant="flat" color="primary">
                            {branch.name} {branch.prefix ? `(${branch.prefix})` : ""}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardBody>
            </div>
          </div>
        </Card>

        {/* Passport Modal */}
        <Modal
          isOpen={isPassportModalOpen}
          scrollBehavior="inside"
          size="2xl"
          onClose={onPassportModalClose}
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("doctors.fields.passportImage")}
                </ModalHeader>
                <ModalBody>
                  {user.passport_image ? (
                    <div className="flex justify-center pb-6">
                      <img
                        alt="Passport"
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        src={user.passport_image}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-default-500">{t("common.notFound")}</p>
                    </div>
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Toggle Active Confirmation Modal */}
        <Modal
          isOpen={isToggleActiveModalOpen}
          onClose={onToggleActiveModalClose}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {user?.is_active
                    ? t("doctors.deactivateAccount", "Deactivate Account")
                    : t("doctors.activateAccount", "Activate Account")}
                </ModalHeader>
                <ModalBody>
                  <p>
                    {user?.is_active
                      ? t(
                          "doctors.deactivateConfirm",
                          "Are you sure you want to deactivate this user's account? They will no longer be able to log in.",
                        )
                      : t(
                          "doctors.activateConfirm",
                          "Are you sure you want to activate this user's account? They will be able to log in again.",
                        )}
                  </p>
                </ModalBody>
                <div className="flex justify-end gap-2 p-4">
                  <Button variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color={user?.is_active ? "danger" : "success"}
                    isLoading={toggleActiveLoading}
                    onPress={handleConfirmToggleActive}
                  >
                    {user?.is_active
                      ? t("common.deactivate")
                      : t("common.activate")}
                  </Button>
                </div>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
