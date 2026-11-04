import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
  useDisclosure,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useUserStore } from "@/stores/userStore";
import { ProfileModal, ChangePasswordModal } from "@/components/modals";

export const UserDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onClose: onProfileClose,
  } = useDisclosure();
  const {
    isOpen: isChangePasswordOpen,
    onOpen: onChangePasswordOpen,
    onClose: onChangePasswordClose,
  } = useDisclosure();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to login
      navigate("/auth/login");
    }
  };

  if (!user) return null;

  const getInitials = (fullname: string = "") => {
    if (!fullname) return "";

    return fullname
      .split(" ")
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            className="p-1 pr-3 h-10 min-w-0 gap-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            variant="light"
          >
            <Avatar
              isBordered
              className="text-tiny transition-transform"
              color="primary"
              name={getInitials(user.full_name || user.username)}
              size="sm"
              src={user.profile_image || undefined}
            />
            <div className="hidden sm:flex flex-col items-start gap-0.5 min-w-[80px]">
              <span className="font-semibold text-sm text-white leading-none">
                {user.full_name}
              </span>
              <span className="text-[10px] text-gray-300 uppercase tracking-wider font-medium leading-none">
                {user.is_staff ? t("common.staff") : t("member.member")}
              </span>
            </div>
            <div className="hidden sm:block text-gray-400">
              <svg
                className="opacity-70"
                fill="none"
                height="12"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="12"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu actions" className="p-2">
          <DropdownItem key="profile" className="h-14 gap-2">
            <div className="flex flex-col">
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-default-500">@{user.username}</p>
              <p className="text-xs text-default-400">
                {t(`users.userTypes.${user.user_type}`, user.user_type)}
              </p>
            </div>
          </DropdownItem>

          <DropdownItem key="view-profile" onPress={onProfileOpen}>
            {t("menu.profile")}
          </DropdownItem>
          {user.user_type === "doctor" ? (
            <DropdownItem
              key="doctor-account"
              onPress={() => navigate(`/doctors/${user.id}`)}
            >
              {t("menu.doctorAccount")}
            </DropdownItem>
          ) : null}
          <DropdownItem key="change-password" onPress={onChangePasswordOpen}>
            {t("changePassword.title")}
          </DropdownItem>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            onPress={handleLogout}
          >
            {t("menu.logout")}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <ProfileModal
        isOpen={isProfileOpen}
        user={user}
        onClose={onProfileClose}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={onChangePasswordClose}
      />
    </>
  );
};
