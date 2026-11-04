import type { DoctorsMembershipData } from "@/api/doctorsMembershipApi";
import type { Payment } from "./payments";

export type { DoctorsMembershipData, Payment };

export interface DashboardStats {
  totalMembers: number;
  totalDoctors: number;
  totalStudents: number;
  totalInstitutions: number;
  activeMemberships: number;
  pendingCertifications: number;
  completedCertifications: number;
  totalRevenue: number;
  pendingPayments: number;
  openRequests: number;
  resolvedRequests: number;
}

export interface PendingCertification {
  id: number;
  doctor: string;
  certification: string;
  dueDate: string;
  progress: number;
}

export type RecentPayment = Payment;

export interface RecentRequest {
  id: number;
  doctor: string;
  type: string;
  subject: string;
  priority: string;
  status: string;
  date: string;
}

export interface DashboardSummaryResponse {
  stats: DashboardStats;
  recentMembers: DoctorsMembershipData[];
  pendingCertifications: PendingCertification[];
  recentPayments: RecentPayment[];
  recentRequests: RecentRequest[];
}

export interface DoctorDistributionItem {
  city_id: number;
  city_name: string;
  city_name_ar: string | null;
  region: string | null;
  area: string | null;
  lat: number;
  lng: number;
  count: number;
}
