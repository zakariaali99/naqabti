import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiRefreshCw,
  FiArrowLeft,
  FiCreditCard,
  FiAlertTriangle,
} from "react-icons/fi";

import { useUserStore } from "@/stores/userStore";
import doctorsMembershipApi, {
  DoctorsMembershipData,
} from "@/api/doctorsMembershipApi";

export default function MembershipRenewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membership, setMembership] = useState<DoctorsMembershipData | null>(null);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        if (!user) return;
        const res = await doctorsMembershipApi.getAll({ page_size: 5 });
        const results = res.data?.results || [];
        if (results.length > 0) {
          setMembership(results[0]);
        } else {
          navigate("/member/membership", { replace: true });
        }
      } catch (err) {
        console.error("Failed to fetch membership for renewal:", err);
        navigate("/member/membership", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [user, navigate]);

  const computeNewEndDate = (currentEndDate: string): string => {
    const d = new Date(currentEndDate);
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().split("T")[0];
  };

  const handleConfirm = async () => {
    if (!membership?.id || !membership.end_date) return;
    setSubmitting(true);
    setError(null);
    try {
      const newEndDate = computeNewEndDate(membership.end_date);
      await doctorsMembershipApi.renew({
        membership: membership.id,
        new_end_date: newEndDate,
        amount: Number(membership.membership_type?.price ?? membership.total_amount ?? 0),
      });
      navigate("/member/membership");
    } catch (err) {
      console.error("Failed to renew membership:", err);
      setError(t("member.renewError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[40vh]">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (!membership) return null;

  const currentEndDate = membership.end_date
    ? new Date(membership.end_date).toLocaleDateString()
    : "-";
  const newEndDate = membership.end_date
    ? new Date(computeNewEndDate(membership.end_date)).toLocaleDateString()
    : "-";
  const renewalFee =
    Number(membership.membership_type?.price ?? membership.total_amount ?? 0);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          as={Link}
          to="/member/membership"
          variant="light"
          isIconOnly
          radius="full"
        >
          <FiArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {t("member.renewConfirmTitle")}
        </h1>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertTriangle className="text-danger shrink-0" />
          <span className="text-danger text-sm font-medium">{error}</span>
        </div>
      )}

      <Card className="rounded-[32px] border-none shadow-sm bg-content1">
        <CardHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <FiRefreshCw className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">
              {t("member.renewalSummary")}
            </h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-6 space-y-4">
          <p className="text-sm text-default-500 leading-relaxed">
            {t("member.renewConfirmDesc")}
          </p>

          <div className="bg-default-50 rounded-2xl p-4 space-y-3">
            {membership.membership_type && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-600">
                  {t("member.membershipType")}
                </span>
                <span className="font-bold">{membership.membership_type.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600 flex items-center gap-1">
                <FiCalendar size={13} />
                {t("member.currentEndDate")}
              </span>
              <span className="font-bold">{currentEndDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600 flex items-center gap-1">
                <FiCalendar size={13} />
                {t("member.newEndDate")}
              </span>
              <span className="font-bold text-success">{newEndDate}</span>
            </div>
            <div className="flex items-center justify-between border-t border-divider pt-3">
              <span className="text-sm font-semibold flex items-center gap-1">
                <FiCreditCard size={13} />
                {t("member.renewalAmount")}
              </span>
              <span className="text-xl font-black text-primary">
                {renewalFee.toLocaleString()} LYD
              </span>
            </div>
          </div>

          <p className="text-xs text-default-400 text-center">
            {t("member.paymentNote")}
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              as={Link}
              to="/member/membership"
              variant="flat"
              className="flex-1"
              radius="full"
            >
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              className="flex-1 font-bold shadow-lg shadow-primary/20"
              radius="full"
              isLoading={submitting}
              startContent={!submitting ? <FiRefreshCw /> : undefined}
              onPress={handleConfirm}
            >
              {t("member.confirmRenewal")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
