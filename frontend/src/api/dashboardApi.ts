import { apiClient } from "./client";

import { DashboardSummaryResponse, DoctorDistributionItem } from "@/models/dashboard";

class DashboardApi {
  async getSummary() {
    return apiClient.get<DashboardSummaryResponse>("dashboard/summary/");
  }

  async getDoctorDistribution(filters?: Record<string, string>, signal?: AbortSignal) {
    return apiClient.get<DoctorDistributionItem[]>("dashboard/doctor-distribution/", { params: filters, signal });
  }
}

export const dashboardApi = new DashboardApi();
