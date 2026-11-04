import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Chip, Progress, Spinner } from "@heroui/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiUser,
  FiAward,
  FiBell,
  FiCreditCard,
  FiCalendar,
  FiTrendingUp,
  FiCheck,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";
import { AdBanner } from "@/components/AdBanner";
import certificationsApi from "@/api/certificationsApi";
import notificationsApi from "@/api/notificationsApi";
import doctorsMembershipApi from "@/api/doctorsMembershipApi";

export default function MemberHomePage() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const { isRTL } = useLanguageStore();

  const [activeCertifications, setActiveCertifications] = useState(0);
  const [pendingCertifications, setPendingCertifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [membershipExpiry, setMembershipExpiry] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("active");
  const [membershipId, setMembershipId] = useState<number | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [certRes, notifRes, unreadRes, memRes] = await Promise.allSettled([
          certificationsApi.getAll({ page_size: 100 }),
          notificationsApi.getAll({ page_size: 5 }),
          notificationsApi.getUnreadCount(),
          doctorsMembershipApi.getAll({ page_size: 100 }),
        ]);

        if (certRes.status === "fulfilled") {
          const certs = certRes.value.data?.results || [];
          setActiveCertifications(
            certs.filter(
              (c: any) =>
                !c.expiry_date || new Date(c.expiry_date) >= new Date(),
            ).length,
          );
          setPendingCertifications(
            certs.filter(
              (c: any) =>
                c.expiry_date && new Date(c.expiry_date) < new Date(),
            ).length,
          );
        }

        if (notifRes.status === "fulfilled") {
          const items = notifRes.value.data?.results || [];
          setRecentNotifications(items.slice(0, 3));
        }

        if (unreadRes.status === "fulfilled") {
          setUnreadNotifications(unreadRes.value.data?.unread_count || 0);
        }

        if (memRes.status === "fulfilled" && user) {
          const memberships = memRes.value.data?.results || [];
          const userMembership = memberships.find(
            (m: any) => m.doctor_id === user.id || m.doctor?.id === user.id,
          );
          if (userMembership) {
            setMembershipExpiry(userMembership.end_date || "");
            setMembershipId(userMembership.id ?? null);
            setMembershipStatus(
              userMembership.status === "canceled"
                ? "suspended"
                : userMembership.status,
            );
          } else if (user.user_type === "student") {
            setMembershipStatus("active");
          }
        }
      } catch (error) {
        console.error("Failed to fetch member stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate profile completion
  useEffect(() => {
    if (!user) return;
    const fields = [
      user.email,
      user.phone_number,
      user.birthdate,
      user.city,
      user.nationality,
      user.passport_image,
      user.university_name,
      user.current_degree,
    ];
    const filled = fields.filter(Boolean).length;
    setCompletionPercentage(Math.round((filled / fields.length) * 100));
  }, [user]);

  const memberStats = {
    activeCertifications,
    pendingCertifications,
    unreadNotifications,
    membershipExpiry,
    membershipStatus,
    completionPercentage,
  };

  const handleApprove = async () => {
    if (!membershipId) return;
    try {
      setApproveLoading(true);
      await doctorsMembershipApi.approve(membershipId);
      toast.success(t("membership.approveSuccess"));
      setMembershipStatus("active");
    } catch {
      toast.error(t("membership.approveError"));
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!membershipId) return;
    try {
      setRejectLoading(true);
      await doctorsMembershipApi.reject(membershipId);
      toast.success(t("membership.rejectSuccess"));
      setMembershipStatus("suspended");
    } catch {
      toast.error(t("membership.rejectError"));
    } finally {
      setRejectLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "expired":
        return "danger";
      default:
        return "default";
    }
  };

  return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t("member.welcome")}, {user?.full_name || t("member.member")}!
          </h1>
          <p className="text-default-600">{t("member.welcomeMessage")}</p>
        </div>

        {/* Ad Banner */}
        <div className="mb-8">
          <AdBanner />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Certifications Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            to="/member/certifications"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <FiAward className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {memberStats.activeCertifications}
                  </span>
                </p>
                <p
                  className={`text-small text-default-600 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.activeCertifications")}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Pending Certifications Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            to="/member/certifications"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-warning-100 rounded-full">
                <FiCalendar className="text-warning" size={24} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {memberStats.pendingCertifications}
                  </span>
                </p>
                <p
                  className={`text-small text-default-600 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.pendingCertifications")}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Unread Notifications Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            to="/member/notifications"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-danger-100 rounded-full">
                <FiBell className="text-danger" size={24} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {memberStats.unreadNotifications}
                  </span>
                </p>
                <p
                  className={`text-small text-default-600 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.unreadNotifications")}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Profile Completion Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            to="/member/membership"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-success-100 rounded-full">
                <FiTrendingUp className="text-success" size={24} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-bold ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {memberStats.completionPercentage}%
                  </span>
                </p>
                <p
                  className={`text-small text-default-600 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.profileCompletion")}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Membership Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FiUser size={20} />
                <h3 className="text-lg font-semibold">
                  {t("member.membershipStatus")}
                </h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t("member.status")}</span>
                <Chip
                  color={getStatusColor(memberStats.membershipStatus) as any}
                  variant="flat"
                >
                  {t(`member.status.${memberStats.membershipStatus}`)}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("member.expiryDate")}</span>
                <span
                  className={`font-medium ${isRTL ? "font-arabic-numerals" : ""}`}
                >
                  {memberStats.membershipExpiry}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span>{t("member.profileCompletion")}</span>
                  <span
                    className={`font-medium ${isRTL ? "font-arabic-numerals" : ""}`}
                  >
                    {memberStats.completionPercentage}%
                  </span>
                </div>
                <Progress
                  className="max-w-md"
                  color="primary"
                  value={memberStats.completionPercentage}
                />
              </div>
              <div className="pt-4 flex flex-wrap gap-2">
                <Button
                  as={Link}
                  color="primary"
                  startContent={<FiCreditCard />}
                  to="/member/membership"
                >
                  {t("member.viewMembership")}
                </Button>
                {user?.is_staff && membershipStatus === "pending" && (
                  <>
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<FiCheck />}
                      isLoading={approveLoading}
                      onPress={handleApprove}
                    >
                      {t("membership.approve")}
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<FiX />}
                      isLoading={rejectLoading}
                      onPress={handleReject}
                    >
                      {t("membership.reject")}
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {t("member.quickActions")}
              </h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                as={Link}
                className="w-full justify-start"
                startContent={<FiAward />}
                to="/member/certifications"
                variant="flat"
              >
                {t("member.myCertifications")}
              </Button>
              <Button
                as={Link}
                className="w-full justify-start"
                endContent={
                  memberStats.unreadNotifications > 0 && (
                    <Chip color="danger" size="sm">
                      {memberStats.unreadNotifications}
                    </Chip>
                  )
                }
                startContent={<FiBell />}
                to="/member/notifications"
                variant="flat"
              >
                {t("member.notifications")}
              </Button>
              <Button
                as={Link}
                className="w-full justify-start"
                startContent={<FiCreditCard />}
                to="/member/membership"
                variant="flat"
              >
                {t("member.paymentHistory")}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {t("member.recentActivity")}
              </h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : recentNotifications.length === 0 ? (
                <p className="text-center text-default-500 py-4">
                  {t("member.noNotifications")}
                </p>
              ) : (
                <div className="space-y-4">
                  {recentNotifications.map((notif: any) => (
                    <div key={notif.id} className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                      <FiBell className="text-primary" />
                      <div className={isRTL ? "text-right flex-1" : "flex-1"}>
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-small text-default-600">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
  );
}
