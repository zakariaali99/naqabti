import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Spinner, Avatar, Button, Chip } from "@heroui/react";
import {
  FiUsers,
  FiAward,
  FiCreditCard,
  FiArrowUpRight,
  FiActivity,
  FiMoreHorizontal,
  FiPieChart,
} from "react-icons/fi";
import { GiTakeMyMoney } from "react-icons/gi";

import { formatCurrency } from "@/misc/formatCurrency";
import {
  DashboardStats,
  DoctorsMembershipData,
  Payment,
  PendingCertification,
} from "@/models/dashboard";
import { dashboardApi } from "@/api/dashboardApi";
import DefaultLayout from "@/layouts/default";
import { AdBanner } from "@/components/AdBanner";
import { PieChart } from "./PieChart";

export const ManagerDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMembers, setRecentMembers] = useState<DoctorsMembershipData[]>(
    [],
  );
  const [pendingCertifications, setPendingCertifications] = useState<
    PendingCertification[]
  >([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data } = await dashboardApi.getSummary();

        if (!isMounted) return;
        setStats(data.stats);
        setRecentMembers(data.recentMembers);
        setPendingCertifications(data.pendingCertifications);
        setRecentPayments(data.recentPayments);
      } catch (e: any) {
        if (isMounted)
          setError(e?.response?.data?.detail || "Failed to load dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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

  if (error || !stats) {
    return (
      <DefaultLayout>
        <div className="p-12 max-w-xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiActivity size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("dashboard.ui.dashboard")}
          </h1>
          <p className="text-default-500">
            {error || t("dashboard.ui.noData")}
          </p>
          <Button
            className="px-8"
            color="primary"
            variant="shadow"
            onPress={() => window.location.reload()}
          >
            {t("dashboard.ui.retry")}
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-background font-sans space-y-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 lg:p-10 pb-0">
          {/* Card 1: Total Members (Dark Blue) */}
          <div className="bg-navy-500 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl group cursor-pointer transition-transform hover:-translate-y-1">
            <div className="absolute top-0 ltr:right-0 rtl:left-0 p-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-navy-500 transition-colors shadow-lg">
                <FiUsers size={24} />
              </div>
            </div>
            <p className="text-gray-400 font-medium mb-2 text-lg">
              {t("dashboard.stats.totalMembers")}
            </p>
            <h3 className="text-5xl font-bold mb-4 tracking-tight">
              {stats.totalDoctors +
                stats.totalStudents +
                stats.totalInstitutions}
            </h3>

            {/* Decorative blob */}
            <div className="absolute -bottom-10 ltr:-right-10 rtl:-left-10 w-48 h-48 bg-[#2B95E8] opacity-20 rounded-full blur-3xl" />
          </div>

          {/* Card 2: Active Members (White) */}
          <div className="bg-content1 rounded-[32px] p-8 relative shadow-sm border border-default-200 group cursor-pointer hover:shadow-md transition-all">
            <div className="absolute top-0 ltr:right-0 rtl:left-0 p-6">
              <div className="w-12 h-12 rounded-2xl bg-content2 flex items-center justify-center text-foreground group-hover:bg-navy-500 group-hover:text-white transition-colors">
                <FiActivity size={24} />
              </div>
            </div>
            <p className="text-default-500 font-medium mb-3 text-lg">
              {t("dashboard.stats.activeMembers", "Active Members")}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-5xl font-bold text-foreground">
                {stats.activeMemberships}
              </h3>
            </div>
          </div>

          {/* Card 3: Revenue (Blue/Purple Gradient or Solid Color) */}
          <div className="bg-gradient-to-br from-[#5468D4] to-[#4353AA] rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg group cursor-pointer hover:shadow-xl transition-all">
            <div className="absolute top-0 ltr:right-0 rtl:left-0 p-6">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-[#5468D4] transition-colors">
                <GiTakeMyMoney size={24} />
              </div>
            </div>
            <p className="text-blue-100 font-medium mb-2 text-lg">
              {t("dashboard.stats.revenue")}
            </p>
            <h3 className="text-4xl font-bold mb-1">
              {formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-blue-200 text-sm mb-6 opacity-80">
              {t("dashboard.labels.totalValues")}
            </p>
          </div>
        </div>

        {/* Middle Section: Visualization & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 lg:px-10">
          {/* Large Card: Member Composition (Replacing Sales Chart) */}
          <div className="lg:col-span-2 bg-[#2B95E8] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
            {/* Header */}
            <div className="flex justify-between items-start z-10 mb-8">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                    <FiPieChart size={24} />
                  </div>
                  {t(
                    "dashboard.labels.memberComposition",
                    "Member Composition",
                  )}
                </h2>
                <p className="text-blue-100 mt-3 text-base max-w-lg leading-relaxed opacity-90">
                  {t(
                    "dashboard.labels.distributionDesc",
                    "Distribution of doctors, students, and institutions within the syndicate system.",
                  )}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full p-1.5 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-navy-500 flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                  <FiMoreHorizontal size={20} />
                </div>
              </div>
            </div>

            {/* Content Split */}
            <div className="flex flex-col sm:flex-row items-center justify-around flex-1 z-10 gap-8">
              {/* Pie Chart */}
              <div className="shrink-0 drop-shadow-2xl">
                <PieChart
                  doctors={stats.totalDoctors}
                  institutions={stats.totalInstitutions}
                  size={220}
                  students={stats.totalStudents}
                />
              </div>

              {/* Legend / Stats */}
              <div className="flex flex-col gap-6 w-full sm:w-auto">
                {[
                  {
                    label: t("dashboard.labels.doctors", "Doctors"),
                    count: stats.totalDoctors,
                    icon: FiUsers,
                    opacity: "100%",
                  },
                  {
                    label: t("dashboard.labels.students", "Students"),
                    count: stats.totalStudents,
                    icon: FiAward,
                    opacity: "60%",
                  },
                  {
                    label: t("dashboard.labels.institutions", "Institutions"),
                    count: stats.totalInstitutions,
                    icon: FiUsers,
                    opacity: "30%",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-white border-2 border-transparent group-hover:border-white/50 text-[#2B95E8] flex items-center justify-center shadow-lg transition-all`}
                      style={{ opacity: idx === 0 ? 1 : idx === 1 ? 0.8 : 0.6 }}
                    >
                      <item.icon size={20} />
                    </div>
                    <div>
                      <div className="text-3xl font-bold leading-none mb-1">
                        {item.count}
                      </div>
                      <div className="text-sm opacity-80 font-medium uppercase tracking-wider">
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-0 ltr:right-0 rtl:left-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 ltr:-left-20 rtl:-right-20 w-96 h-96 bg-white rounded-full blur-[120px] opacity-20" />
          </div>

          {/* Right Column: Pending Activity */}
          <div className="flex flex-col gap-6">
            {/* Pending Requests */}
            <div className="bg-content1 rounded-[40px] p-6 shadow-sm border border-default-200 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-foreground">
                  {t("dashboard.stats.requests")}
                </h3>
                <div className="w-10 h-10 rounded-full bg-navy-500 text-white flex items-center justify-center cursor-pointer hover:bg-[#2B95E8] transition-colors shadow-lg">
                  <FiArrowUpRight className="rtl:-scale-x-100" size={20} />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="text-center p-4 bg-content2 rounded-3xl mb-4">
                  <span className="block text-4xl font-bold text-foreground mb-1">
                    {stats.openRequests}
                  </span>
                  <span className="text-sm text-default-500 font-medium">
                    {t("dashboard.labels.openRequests", "Open Requests")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-green-50 rounded-3xl text-center">
                    <span className="block text-xl font-bold text-green-700">
                      {stats.resolvedRequests}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      {t("dashboard.labels.resolved", "Resolved")}
                    </span>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-3xl text-center">
                    <span className="block text-xl font-bold text-orange-700">
                      {stats.pendingCertifications}
                    </span>
                    <span className="text-xs text-orange-600 font-medium">
                      {t("dashboard.labels.pendingCerts", "Pending Certs")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Certifications List */}
            <div className="bg-content1 rounded-[40px] p-6 shadow-sm border border-default-200 flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-foreground">
                  {t("dashboard.labels.certifications", "Certifications")}
                </h3>
              </div>

              <div className="space-y-3">
                {pendingCertifications.slice(0, 3).map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 hover:bg-content2 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <FiAward size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground line-clamp-1">
                          {cert.doctor}
                        </p>
                        <p className="text-xs text-default-400">
                          {cert.certification}
                        </p>
                      </div>
                    </div>
                    <Chip
                      className="h-6"
                      color="warning"
                      size="sm"
                      variant="flat"
                    >
                      {t("common.pending", "Pending")}
                    </Chip>
                  </div>
                ))}
                {pendingCertifications.length === 0 && (
                  <p className="text-center text-default-400 text-sm py-4">
                    {t(
                      "dashboard.labels.noPendingCerts",
                      "No pending certifications",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ad Banner */}
        <div className="px-6 lg:px-10 pb-2">
          <AdBanner />
        </div>

        {/* Bottom Lists: Recent Members & Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 lg:px-10 pb-6 lg:pb-10">
          {/* Recent Members */}
          <div className="bg-content1 rounded-[40px] p-8 shadow-sm border border-default-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-foreground">
                {t("dashboard.sections.recentMemberships")}
              </h3>
              <Button
                color="primary"
                size="sm"
                variant="light"
                onPress={() => navigate("/memberships")}
              >
                {t("dashboard.ui.viewAll")}
              </Button>
            </div>

            <div className="space-y-4">
              {recentMembers.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-3xl bg-content2 hover:bg-content1 hover:shadow-md transition-all border border-transparent hover:border-default-100"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      isBordered
                      className="w-12 h-12 text-large rounded-2xl"
                      name={member.doctor?.full_name ?? ""}
                      src={member.doctor?.profile_image ?? undefined}
                    />
                    <div>
                      <p className="font-bold text-foreground">
                        {member.doctor?.full_name}
                      </p>
                      <p className="text-sm text-default-500 flex items-center gap-1">
                        <FiUsers size={12} />{" "}
                        {
                          (member.membership_type as any)[
                            i18n.language === "ar" ? "name_ar" : "name_en"
                          ]
                        }
                      </p>
                    </div>
                  </div>
                  <div className="ltr:text-right rtl:text-left">
                    <Chip
                      className="mb-1"
                      color={member.is_active ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {member.is_active
                        ? t("common.active", "Active")
                        : t("common.inactive", "Inactive")}
                    </Chip>
                    <p className="text-xs text-default-400">
                      {new Date(member.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-content1 rounded-[40px] p-8 shadow-sm border border-default-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-foreground">
                {t("dashboard.sections.recentPayments")}
              </h3>
              <Button
                color="secondary"
                size="sm"
                variant="light"
                onPress={() => navigate("/payments")}
              >
                {t("dashboard.ui.viewAll")}
              </Button>
            </div>

            <div className="space-y-4">
              {recentPayments.slice(0, 4).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-3xl bg-content2 hover:bg-content1 hover:shadow-md transition-all border border-transparent hover:border-default-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl">
                      $
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {payment.user.full_name}
                      </p>
                      <p className="text-sm text-default-500 flex items-center gap-1">
                        <FiCreditCard size={12} /> {payment.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="ltr:text-right rtl:text-left">
                    <p className="font-bold text-lg text-foreground">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ManagerDashboard;
