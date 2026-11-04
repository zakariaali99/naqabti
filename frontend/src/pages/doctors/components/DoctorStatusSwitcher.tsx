import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonGroup, Tooltip } from "@heroui/react";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import toast from "react-hot-toast";

import usersApi from "@/api/usersApi";
import { UserEntity } from "@/models/users";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface DoctorStatusSwitcherProps {
  doctor: UserEntity;
  onUpdated: (updated: UserEntity) => void;
  size?: "sm" | "md" | "lg";
}

export default function DoctorStatusSwitcher({
  doctor,
  onUpdated,
  size = "sm",
}: DoctorStatusSwitcherProps) {
  const { t } = useTranslation();
  const [loadingStatus, setLoadingStatus] = useState<ApprovalStatus | null>(
    null,
  );

  if (doctor.user_type !== "doctor") return null;

  const hasBranch = !!doctor.branches?.length;
  const currentStatus = doctor.approval_status || "approved";

  const handleChange = async (status: ApprovalStatus) => {
    if (status === currentStatus || loadingStatus) return;

    const actions: Record<
      ApprovalStatus,
      { call: () => Promise<{ data: UserEntity }>; success: string; error: string }
    > = {
      pending: {
        call: () => usersApi.setPendingDoctor(doctor.id),
        success: t("doctors.pendingSuccess"),
        error: t("doctors.pendingError"),
      },
      approved: {
        call: () => usersApi.approveDoctor(doctor.id),
        success: t("doctors.approveSuccess"),
        error: t("doctors.approveError"),
      },
      rejected: {
        call: () => usersApi.rejectDoctor(doctor.id),
        success: t("doctors.rejectSuccess"),
        error: t("doctors.rejectError"),
      },
    };

    const { call, success, error } = actions[status];

    try {
      setLoadingStatus(status);
      const response = await call();

      onUpdated(response.data);
      toast.success(success);
    } catch (err: any) {
      console.error(`Failed to set doctor status to ${status}:`, err);
      toast.error(err?.response?.data?.detail || error);
    } finally {
      setLoadingStatus(null);
    }
  };

  const buttonProps = (status: ApprovalStatus) => ({
    isDisabled: status === currentStatus || !!loadingStatus,
    isLoading: loadingStatus === status,
    variant: status === currentStatus ? ("solid" as const) : ("flat" as const),
    onPress: () => handleChange(status),
  });

  return (
    <ButtonGroup size={size} data-testid="doctor-status-switcher">
      <Button
        {...buttonProps("pending")}
        color="warning"
        data-testid="doctor-status-pending"
        startContent={<FiClock />}
      >
        {t("doctors.status.pending")}
      </Button>
      <Tooltip
        content={t("doctors.approveNoBranch")}
        isDisabled={hasBranch || currentStatus === "approved"}
      >
        <span>
          <Button
            {...buttonProps("approved")}
            color="success"
            isDisabled={
              currentStatus === "approved" ||
              !!loadingStatus ||
              !hasBranch
            }
            data-testid="doctor-status-approved"
            startContent={<FiCheckCircle />}
          >
            {t("doctors.status.approved")}
          </Button>
        </span>
      </Tooltip>
      <Button
        {...buttonProps("rejected")}
        color="danger"
        data-testid="doctor-status-rejected"
        startContent={<FiXCircle />}
      >
        {t("doctors.status.rejected")}
      </Button>
    </ButtonGroup>
  );
}
