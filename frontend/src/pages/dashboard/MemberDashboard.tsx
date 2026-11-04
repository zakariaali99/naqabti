import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Spinner,
} from "@heroui/react";
import {
  FiAward,
  FiCalendar,
  FiBell,
  FiTrendingUp,
  FiUser,
  FiCreditCard,
  FiClock,
  FiArrowRight,
  FiAlertCircle,
  FiUpload,
} from "react-icons/fi";

import DefaultLayout from "@/layouts/default";
import { useUserStore } from "@/stores/userStore";
import { useLanguageStore } from "@/stores/languageStore";

import certificationsApi from "@/api/certificationsApi";
import notificationsApi from "@/api/notificationsApi";
import doctorsMembershipApi, { PaymentStatus } from "@/api/doctorsMembershipApi";
import {
  calculateProfileCompletion,
  calculateNameCompletion,
} from "@/utils/profileCompletion";
import CompleteProfileModal from "@/components/modals/CompleteProfileModal";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const m = d.getMonth() + months;
  d.setFullYear(d.getFullYear() + Math.floor(m / 12));
  d.setMonth(m % 12);
  return d;
}

export const MemberDashboard = () => {
  const user = useUserStore((state) => state.user);
  const { isRTL } = useLanguageStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeCerts, setActiveCerts] = useState(0);
  const [pendingCerts, setPendingCerts] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [membershipInfo, setMembershipInfo] = useState<{
    expiryDate: string;
    status: string;
    membershipType: string;
  } | null>(null);
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [pendingMembershipDate, setPendingMembershipDate] = useState<string | null>(null);
  const [membershipPaymentStatus, setMembershipPaymentStatus] = useState<PaymentStatus | null>(null);
  const [membershipRemainingAmount, setMembershipRemainingAmount] = useState<number | null>(null);
  const [membershipActiveStatus, setMembershipActiveStatus] = useState<string | null>(null);

  const {
    percentage: completionPercentage,
    missingFields,
    completedFields,
  } = calculateProfileCompletion(
    { ...user, branch_id: user?.branches?.[0]?.id },
    user?.user_type === "doctor",
  );

  const {
    missingFields: nameMissingFields,
    completedFields: nameCompletedFields,
  } = calculateNameCompletion(user || {}, user?.user_type === "institution");

  const [completeProfileModalOpen, setCompleteProfileModalOpen] =
    useState(false);

  useEffect(() => {
    if (user?.user_type === "doctor" && missingFields.length > 0) {
      setCompleteProfileModalOpen(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch unread count & notifications
        let unread = 0;
        let recent: any[] = [];
        try {
          const countRes = await notificationsApi.getUnreadCount();
          unread = countRes.data.unread_count ?? 0;

          const notificationsRes = await notificationsApi.getAll({
            page_size: 3,
          });
          recent = notificationsRes.data.results;
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }

        // 2. Fetch certifications
        let activeCount = 0;
        let pendingCount = 0;
        try {
          const certsRes = await certificationsApi.getAll({ page_size: 100 });
          const certs = certsRes.data.results;

          certs.forEach((cert: any) => {
            if (!cert.expiry_date) {
              activeCount++;
            } else {
              const isExpired = new Date(cert.expiry_date) <= new Date();
              if (!isExpired) {
                activeCount++;
              }
            }
          });
        } catch (err) {
          console.error("Failed to fetch certifications:", err);
        }

        // 3. Fetch membership (only for doctors)
        let expiryDate = "N/A";
        let mStatus = "pending";
        let mType = "N/A";

        if (user?.user_type === "doctor") {
          try {
            const membershipsRes = await doctorsMembershipApi.getAll();
            const memberships = membershipsRes.data.results;
            const count = membershipsRes.data.count ?? 0;
            if (memberships && count > 0) {
              const latest = memberships[0];
              mStatus = latest.status || "pending";
              mType = latest.membership_type?.name || "N/A";

              // Compute end_date: use API value or calculate from start + duration
              if (latest.end_date) {
                expiryDate = latest.end_date;
              } else if (latest.start_date && latest.membership_type?.duration_months) {
                const computed = addMonths(
                  new Date(latest.start_date),
                  latest.membership_type.duration_months,
                );
                expiryDate = computed.toISOString().split("T")[0];
              }

              if (isMounted) {
                setHasMembership(true);
                setMembershipPaymentStatus(latest.payment_status);
                setMembershipActiveStatus(latest.status);

                const remaining =
                  latest.remaining_amount != null
                    ? Number(latest.remaining_amount)
                    : Number(latest.total_amount ?? 0) - Number(latest.paid_amount ?? 0);
                setMembershipRemainingAmount(remaining);

                if (latest.status === "pending" && latest.created_at) {
                  setPendingMembershipDate(latest.created_at);
                }
                if (expiryDate !== "N/A") {
                  const days = Math.ceil(
                    (new Date(expiryDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  setDaysRemaining(days);
                }
              }
            } else {
              if (isMounted) setHasMembership(false);
            }
          } catch (err) {
            console.error("Failed to fetch memberships:", err);
          }
        } else if (user?.user_type === "student") {
          expiryDate = t("common.permanent", "Permanent");
          mStatus = user.is_active ? "active" : "pending";
          mType = t("member.student", "Student");
        }

        if (!isMounted) return;

        setUnreadCount(unread);
        setRecentNotifications(recent);
        setActiveCerts(activeCount);
        setPendingCerts(pendingCount);
        setMembershipInfo({
          expiryDate,
          status: mStatus,
          membershipType: mType,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, i18n.language]);

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

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Spinner
            color="primary"
            label={t("dashboard.ui.loading")}
            size="lg"
          />
        </div>
      </DefaultLayout>
    );
  }

  const membershipStatus = membershipInfo?.status || "pending";
  const membershipExpiry = membershipInfo?.expiryDate || "N/A";
  const membershipType = membershipInfo?.membershipType || "N/A";

  // Determine which context-aware cards to show in the first two slots
  const showPaymentCard =
    user?.user_type === "doctor" &&
    membershipActiveStatus === "active" &&
    membershipPaymentStatus === "unpaid";
  const showDocUploadCard =
    user?.user_type === "doctor" && !user?.passport_image;

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t("member.welcome")}, {user?.full_name || t("member.member")}!
          </h1>
          <p className="text-default-500 text-sm">
            {t(
              "member.welcomeMessage",
              "Welcome to your syndicate portal dashboard.",
            )}
          </p>
        </div>

        {/* Account approval status banner (doctors only) */}
        {user?.user_type === "doctor" && user?.approval_status === "pending" && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-xl shrink-0 mt-0.5">
              <FiClock className="text-primary-700 text-lg" />
            </div>
            <div>
              <p className="font-bold text-primary-800">
                {t("member.accountPendingTitle")}
              </p>
              <p className="text-sm text-primary-600">
                {t("member.accountPendingDesc")}
              </p>
            </div>
          </div>
        )}
        {user?.user_type === "doctor" && user?.approval_status === "rejected" && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-danger-100 rounded-xl shrink-0 mt-0.5">
              <FiAlertCircle className="text-danger-700 text-lg" />
            </div>
            <div>
              <p className="font-bold text-danger-800">
                {t("member.accountRejectedTitle")}
              </p>
              <p className="text-sm text-danger-600">
                {t("member.accountRejectedDesc")}
              </p>
            </div>
          </div>
        )}

        {/* Membership banners (doctors only) */}
        {user?.user_type === "doctor" && hasMembership !== null && (
          <div>
            {hasMembership === false && (
              <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-warning-800">
                    {t("member.noMembershipBannerTitle")}
                  </p>
                  <p className="text-sm text-warning-600">
                    {t("member.noMembershipBannerDesc")}
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/member/membership"
                  color="warning"
                  size="sm"
                  className="shrink-0 font-bold"
                  radius="full"
                >
                  {t("member.applyForMembership")}
                </Button>
              </div>
            )}
            {hasMembership && membershipStatus === "pending" && (
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 rounded-xl shrink-0 mt-0.5">
                    <FiClock className="text-primary-700 text-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-800">
                      {t("member.pendingBannerTitle")}
                    </p>
                    <p className="text-sm text-primary-600">
                      {membershipType !== "N/A" && (
                        <span>{t("member.pendingBannerType", { type: membershipType })} </span>
                      )}
                      {pendingMembershipDate && (
                        <span>
                          {t("member.pendingBannerDate", {
                            date: new Date(pendingMembershipDate).toLocaleDateString(
                              i18n.language === "ar" ? "ar-LY" : "en-US",
                            ),
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  as={Link}
                  to="/member/membership"
                  color="primary"
                  size="sm"
                  className="shrink-0 font-bold"
                  radius="full"
                  endContent={<FiArrowRight />}
                >
                  {t("member.viewApplicationDetails")}
                </Button>
              </div>
            )}
            {hasMembership &&
              membershipStatus === "active" &&
              daysRemaining !== null &&
              daysRemaining < 30 && (
                <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-warning-800">
                      {t("member.expiringBannerTitle")}
                    </p>
                    <p className="text-sm text-warning-600">
                      {t("member.expiringBannerDesc", { days: daysRemaining })}
                    </p>
                  </div>
                  <Button
                    as={Link}
                    to="/member/membership/renew"
                    color="warning"
                    size="sm"
                    className="shrink-0 font-bold"
                    radius="full"
                  >
                    {t("member.renewNowCTA")}
                  </Button>
                </div>
              )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Payment Due (when unpaid active) OR Active Certs fallback */}
          {showPaymentCard ? (
            <Card
              as={Link}
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-warning-50 overflow-hidden"
              to="/member/membership"
            >
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3.5 bg-warning/20 text-warning-700 rounded-2xl">
                  <FiAlertCircle className="text-2xl" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-2xl font-black text-warning-800 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <span className={isRTL ? "font-arabic-numerals" : ""}>
                      {Number(membershipRemainingAmount ?? 0).toFixed(0)} LYD
                    </span>
                  </p>
                  <p
                    className={`text-xs font-bold text-warning-600 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("member.paymentDueCard")}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card
              as={Link}
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-content1 overflow-hidden"
              to="/member/certifications"
            >
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3.5 bg-primary/10 text-primary rounded-2xl">
                  <FiAward className="text-2xl" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-2xl font-black text-foreground ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <span className={isRTL ? "font-arabic-numerals" : ""}>
                      {activeCerts}
                    </span>
                  </p>
                  <p
                    className={`text-xs font-bold text-default-400 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("member.activeCertifications")}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Card 2: Doc Upload (when passport missing) OR Pending Certs fallback */}
          {showDocUploadCard ? (
            <Card
              as={Link}
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-warning-50 overflow-hidden"
              to="/member/profile"
            >
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3.5 bg-warning/20 text-warning-700 rounded-2xl">
                  <FiUpload className="text-2xl" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-black text-warning-800 leading-tight ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("member.uploadDocCard")}
                  </p>
                  <p
                    className={`text-xs font-bold text-warning-600 mt-1 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("member.uploadDocCardDesc")}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card
              as={Link}
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-content1 overflow-hidden"
              to="/member/certifications"
            >
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3.5 bg-warning/10 text-warning rounded-2xl">
                  <FiCalendar className="text-2xl" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-2xl font-black text-foreground ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <span className={isRTL ? "font-arabic-numerals" : ""}>
                      {pendingCerts}
                    </span>
                  </p>
                  <p
                    className={`text-xs font-bold text-default-400 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("member.pendingCertifications")}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Unread Notifications Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-content1 overflow-hidden"
            to="/member/notifications"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3.5 bg-danger/10 text-danger rounded-2xl">
                <FiBell className="text-2xl" />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-black text-foreground ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {unreadCount}
                  </span>
                </p>
                <p
                  className={`text-xs font-bold text-default-400 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.unreadNotifications")}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Profile Completion Card */}
          <Card
            as={Link}
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 rounded-[24px] border-none bg-content1 overflow-hidden"
            to="/member/profile"
          >
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3.5 bg-success/10 text-success rounded-2xl">
                <FiTrendingUp className="text-2xl" />
              </div>
              <div className="flex-1">
                <p
                  className={`text-2xl font-black text-foreground ${isRTL ? "text-right" : "text-left"}`}
                >
                  <span className={isRTL ? "font-arabic-numerals" : ""}>
                    {completionPercentage}%
                  </span>
                </p>
                <p
                  className={`text-xs font-bold text-default-400 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                >
                  {t("member.profileCompletion")}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Membership Status card */}
          <Card className="lg:col-span-2 rounded-[32px] border-none shadow-sm bg-content1 p-6">
            <CardHeader className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <FiUser className="text-primary text-xl" />
                <h3 className="text-lg font-bold">
                  {t("member.membershipStatus")}
                </h3>
              </div>
            </CardHeader>
            <CardBody className="px-4 space-y-6">
              <div className="flex items-center justify-between border-b border-divider/50 pb-3">
                <span className="text-default-500 font-medium">
                  {t("member.status")}
                </span>
                <Chip
                  color={getStatusColor(membershipStatus) as any}
                  variant="flat"
                  className="font-bold"
                >
                  {t(`member.status.${membershipStatus}`)}
                </Chip>
              </div>
              {user?.user_type === "doctor" ? (
                (user.full_doctor_number || user.doctor_number) ? (
                  <div className="flex items-center justify-between border-b border-divider/50 pb-3">
                    <span className="text-default-500 font-medium">
                      {t("users.form.doctorNumber", "Doctor Number")}
                    </span>
                    <span className="font-mono font-bold">
                      {user.full_doctor_number || user.doctor_number}
                    </span>
                  </div>
                ) : null
              ) : user?.membership_number ? (
                <div className="flex items-center justify-between border-b border-divider/50 pb-3">
                  <span className="text-default-500 font-medium">
                    {t("member.memberNumber", "Membership Number")}
                  </span>
                  <span className="font-mono font-bold">
                    {user.membership_number}
                  </span>
                </div>
              ) : null}
              {user?.user_type && (
                <div className="flex items-center justify-between border-b border-divider/50 pb-3">
                  <span className="text-default-500 font-medium">
                    {t("member.membershipType", "Role")}
                  </span>
                  <span className="font-bold text-primary capitalize">
                    {membershipType}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-divider/50 pb-3">
                <span className="text-default-500 font-medium">
                  {t("member.expiryDate")}
                </span>
                <span
                  className={`font-bold ${isRTL ? "font-arabic-numerals" : ""}`}
                >
                  {membershipExpiry !== "N/A"
                    ? new Date(membershipExpiry).toLocaleDateString(
                        i18n.language === "ar" ? "ar-LY" : "en-US",
                      )
                    : "N/A"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-default-500 font-medium">
                    {t("member.profileCompletion")}
                  </span>
                  <span
                    className={`font-bold ${isRTL ? "font-arabic-numerals" : ""}`}
                  >
                    {completionPercentage}%
                  </span>
                </div>
                <Progress
                  color="primary"
                  value={completionPercentage}
                  className="w-full"
                  size="md"
                  radius="full"
                />
                {missingFields.length > 0 && (
                  <Button
                    as={Link}
                    className="font-bold mt-1"
                    color="primary"
                    endContent={<FiArrowRight />}
                    radius="full"
                    size="sm"
                    to="/member/profile/edit"
                    variant="flat"
                  >
                    {t("member.completeProfileModalCta")}
                  </Button>
                )}
              </div>
              <div className="pt-4">
                <Button
                  as={Link}
                  color="primary"
                  radius="full"
                  className="font-bold shadow-lg shadow-primary/20 px-8"
                  startContent={<FiCreditCard />}
                  to="/member/membership"
                >
                  {hasMembership === false
                    ? t("member.applyMembershipCTA")
                    : membershipStatus === "pending"
                      ? t("member.followupMembershipCTA")
                      : t("member.viewMembership")}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions Card */}
          <Card className="rounded-[32px] border-none shadow-sm bg-content1 p-6">
            <CardHeader className="px-4 pb-4">
              <h3 className="text-lg font-bold">{t("member.quickActions")}</h3>
            </CardHeader>
            <CardBody className="px-4 space-y-4">
              <Button
                as={Link}
                className="w-full justify-start h-12 font-medium bg-default-50 hover:bg-primary-50 rounded-2xl"
                startContent={
                  <FiAward className="text-primary text-lg shrink-0" />
                }
                to="/member/certifications"
                variant="flat"
              >
                {t("member.myCertifications")}
              </Button>
              <Button
                as={Link}
                className="w-full justify-start h-12 font-medium bg-default-50 hover:bg-danger-50 rounded-2xl"
                endContent={
                  unreadCount > 0 && (
                    <Chip color="danger" size="sm" className="font-bold">
                      {unreadCount}
                    </Chip>
                  )
                }
                startContent={
                  <FiBell className="text-danger text-lg shrink-0" />
                }
                to="/member/notifications"
                variant="flat"
              >
                {t("member.notifications")}
              </Button>
              <Button
                as={Link}
                className="w-full justify-start h-12 font-medium bg-default-50 hover:bg-success-50 rounded-2xl"
                startContent={
                  <FiCreditCard className="text-success text-lg shrink-0" />
                }
                to="/member/membership"
                variant="flat"
              >
                {t("member.paymentHistory")}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card className="rounded-[32px] border-none shadow-sm bg-content1 p-6">
          <CardHeader className="px-4 pb-4">
            <h3 className="text-lg font-bold">{t("member.recentActivity")}</h3>
          </CardHeader>
          <CardBody className="px-4 space-y-4">
            {recentNotifications.map((notif) => {
              const getTypeIcon = (type: string) => {
                switch (type) {
                  case "success":
                    return <FiAward size={20} />;
                  case "warning":
                    return <FiCalendar size={20} />;
                  case "error":
                    return <FiCreditCard size={20} />;
                  default:
                    return <FiBell size={20} />;
                }
              };
              const getTypeColorClass = (type: string) => {
                switch (type) {
                  case "success":
                    return "bg-success/10 text-success";
                  case "warning":
                    return "bg-warning/10 text-warning";
                  case "error":
                    return "bg-danger/10 text-danger";
                  default:
                    return "bg-primary/10 text-primary";
                }
              };

              return (
                <div
                  key={notif.id}
                  className="flex items-center gap-4 p-4 bg-default-50 rounded-2xl hover:bg-default-100 transition-colors border border-transparent"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTypeColorClass(notif.notification_type)}`}
                  >
                    {getTypeIcon(notif.notification_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">
                      {notif.title}
                    </p>
                    <p className="text-xs text-default-500 line-clamp-1 mt-0.5">
                      {notif.message}
                    </p>
                    <p
                      className={`text-[10px] text-default-400 mt-1 ${isRTL ? "font-arabic-numerals" : ""}`}
                    >
                      {new Date(notif.created_at).toLocaleDateString(
                        i18n.language === "ar" ? "ar-LY" : "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            {recentNotifications.length === 0 && (
              <p className="text-center text-default-400 text-sm py-4">
                {t("member.noRecentActivity", "No recent activity")}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <CompleteProfileModal
        completedFields={completedFields}
        isOpen={completeProfileModalOpen}
        missingFields={missingFields}
        nameCompletedFields={nameCompletedFields}
        nameMissingFields={nameMissingFields}
        percentage={completionPercentage}
        onClose={() => setCompleteProfileModalOpen(false)}
        onConfirm={() => {
          setCompleteProfileModalOpen(false);
          navigate("/member/profile/edit");
        }}
      />
    </DefaultLayout>
  );
};

export default MemberDashboard;
