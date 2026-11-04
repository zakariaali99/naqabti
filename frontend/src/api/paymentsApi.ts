import type {
  Payment,
  PaymentCreate,
  PaymentUpdate,
  PaymentFilters,
} from "@/models/payments";
import type { PaginatedResponse } from "./client";

import { apiClient, FileUploadApiClient } from "./client";

const fileUploadClient = new FileUploadApiClient<Payment, PaymentCreate, PaymentUpdate>(
  "payments/",
);

export const paymentsApi = {
  list: (
    filters?: PaymentFilters & {
      page?: number;
      page_size?: number;
      doctor_id?: number;
      membership_id?: number;
      payment_method?: string;
      payment_date_from?: string;
      payment_date_to?: string;
      amount_from?: number;
      amount_to?: number;
      search?: string;
      ordering?: string;
    },
  ) => {
    const params = new URLSearchParams();

    if (filters?.doctor_id)
      params.append("doctor_id", filters.doctor_id.toString());
    if (filters?.membership_id)
      params.append("membership_id", filters.membership_id.toString());
    if (filters?.payment_method)
      params.append("payment_method", filters.payment_method);
    if (filters?.payment_date_from)
      params.append("payment_date_from", filters.payment_date_from);
    if (filters?.payment_date_to)
      params.append("payment_date_to", filters.payment_date_to);
    if (filters?.amount_from)
      params.append("amount_from", filters.amount_from.toString());
    if (filters?.amount_to)
      params.append("amount_to", filters.amount_to.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.ordering) params.append("ordering", filters.ordering);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.page_size)
      params.append("page_size", filters.page_size.toString());

    const query = params.toString();

    return apiClient.get<PaginatedResponse<Payment>>(
      `/payments/${query ? `?${query}` : ""}`,
    );
  },

  get: (id: number) => apiClient.get<Payment>(`/payments/${id}/`),

  create: (data: PaymentCreate) => fileUploadClient.create(data),

  update: (id: number, data: PaymentUpdate) => fileUploadClient.update(id, data),

  delete: (id: number) => apiClient.delete(`/payments/${id}/`),

  approvePayment: (id: number) =>
    apiClient.post<Payment>(`/payments/${id}/approve/`),

  rejectPayment: (id: number) =>
    apiClient.post<Payment>(`/payments/${id}/reject/`),

  sendNotification: (id: number, data: {
    title: string;
    message: string;
    notification_type?: string;
  }) => apiClient.post(`/payments/${id}/send_notification_action/`, data),

  exportPdf: (id: number) =>
    apiClient.get(`/payments/${id}/export_pdf/`, {
      responseType: "blob",
    }),
};
