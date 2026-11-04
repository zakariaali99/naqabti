import client, { PaginatedResponse } from "./client";

import {
  ProfessionalDevelopment,
  ProfessionalDevelopmentType,
  ProfessionalDevelopmentCategory,
  ProfessionalDevelopmentRegistration,
} from "@/models/professionalDevelopment";

const professionalDevelopmentApi = {
  // Types
  getTypes: (params?: any) =>
    client.get<PaginatedResponse<ProfessionalDevelopmentType>>(
      "/professional-development-types/",
      { params },
    ),
  getType: (id: number) =>
    client.get<ProfessionalDevelopmentType>(
      `/professional-development-types/${id}/`,
    ),
  createType: (data: Partial<ProfessionalDevelopmentType>) =>
    client.post<ProfessionalDevelopmentType>(
      "/professional-development-types/",
      data,
    ),
  updateType: (id: number, data: Partial<ProfessionalDevelopmentType>) =>
    client.patch<ProfessionalDevelopmentType>(
      `/professional-development-types/${id}/`,
      data,
    ),
  deleteType: (id: number) =>
    client.delete(`/professional-development-types/${id}/`),

  // Categories
  getCategories: (params?: any) =>
    client.get<PaginatedResponse<ProfessionalDevelopmentCategory>>(
      "/professional-development-categories/",
      { params },
    ),
  getCategory: (id: number) =>
    client.get<ProfessionalDevelopmentCategory>(
      `/professional-development-categories/${id}/`,
    ),
  createCategory: (data: Partial<ProfessionalDevelopmentCategory>) =>
    client.post<ProfessionalDevelopmentCategory>(
      "/professional-development-categories/",
      data,
    ),
  updateCategory: (
    id: number,
    data: Partial<ProfessionalDevelopmentCategory>,
  ) =>
    client.patch<ProfessionalDevelopmentCategory>(
      `/professional-development-categories/${id}/`,
      data,
    ),
  deleteCategory: (id: number) =>
    client.delete(`/professional-development-categories/${id}/`),

  // Professional Development Items
  getAll: (params?: any) =>
    client.get<PaginatedResponse<ProfessionalDevelopment>>(
      "/professional-development/",
      { params },
    ),
  getById: (id: number) =>
    client.get<ProfessionalDevelopment>(`/professional-development/${id}/`),
  create: (data: FormData) =>
    client.post<ProfessionalDevelopment>("/professional-development/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData) =>
    client.patch<ProfessionalDevelopment>(
      `/professional-development/${id}/`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    ),
  delete: (id: number) => client.delete(`/professional-development/${id}/`),

    // Registration
    register: (id: number, data?: { payment_method: string }) => client.post<ProfessionalDevelopmentRegistration>(`/professional-development/${id}/register/`, data),
    getPDRegistrations: (id: number, params?: any) => client.get<PaginatedResponse<ProfessionalDevelopmentRegistration>>(`/professional-development/${id}/registrations/`, { params }),
    addPDRegistration: (id: number, data: { doctor_id: number, status?: string, payment_status?: string, send_notification?: boolean }) => client.post<ProfessionalDevelopmentRegistration>(`/professional-development/${id}/add-registration/`, data),
    updatePDRegistration: (regId: number, data: Partial<ProfessionalDevelopmentRegistration>) => client.patch<ProfessionalDevelopmentRegistration>(`/professional-development-registrations/${regId}/`, data),
    deletePDRegistration: (regId: number) => client.delete(`/professional-development-registrations/${regId}/`),
    sendPDRegistrationNotification: (regId: number) => client.post(`/professional-development-registrations/${regId}/send_notification/`),
    addPDRegistrationPayment: (regId: number, data: { amount: number, payment_method?: string, reference_number?: string, description?: string }) => client.post<ProfessionalDevelopmentRegistration>(`/professional-development-registrations/${regId}/add_payment/`, data),
    exportPDRegistrations: (id: number) => client.get(`/professional-development/${id}/export_registrations/`, { responseType: 'blob' }),

  // Registrations List
  getRegistrations: (params?: any) =>
    client.get<PaginatedResponse<ProfessionalDevelopmentRegistration>>(
      "/professional-development-registrations/",
      { params },
    ),
};

export default professionalDevelopmentApi;
