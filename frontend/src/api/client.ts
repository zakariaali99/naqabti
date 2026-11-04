import axios, { AxiosInstance, AxiosResponse } from "axios";

const isProd = process.env.NODE_ENV === "production";
// VITE_API_URL lets a non-default backend be targeted (the E2E stack runs its
// own Django on a spare port so it never touches the dev database).
const configuredApiUrl = import.meta.env?.VITE_API_URL;
let BASE_URL = configuredApiUrl
  ? configuredApiUrl
  : isProd
    ? `${window.location.protocol}//${window.location.host}/api/`
    : "http://localhost:8000/api/";

// Base API configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 100000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Don't add auth header to token refresh requests
    if (!config.url?.includes("auth/token/refresh")) {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh endpoint itself
    if (originalRequest.url?.includes("auth/token/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post(BASE_URL + "auth/token/refresh/", {
            refresh: refreshToken,
          });

          const { access } = response.data;

          localStorage.setItem("access_token", access);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user-store");
          window.location.href = "/auth/login";

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  },
);

// Generic interfaces for CRUD operations
export interface PaginatedResponse<T> {
  count: number;
  // backend returns page numbers for next/previous (or null)
  next: number | null;
  previous: number | null;
  // last_page (total pages) is provided by backend pagination
  last_page?: number;
  results: T[];
}

export interface FilterParams {
  search?: string;
  ordering?: string;
  page?: number;
  [key: string]: any;
}

// Base API Client class with generic CRUD operations
export class BaseApiClient<T, CreateRequest, UpdateRequest = CreateRequest> {
  protected client: AxiosInstance;
  protected endpoint: string;
  BASE_URL: string = BASE_URL;

  constructor(endpoint: string, client: AxiosInstance = apiClient) {
    this.client = client;
    this.endpoint = BASE_URL + endpoint;
  }

  // Get all items with optional filters
  async getAll(
    filters?: FilterParams,
  ): Promise<AxiosResponse<PaginatedResponse<T>>> {
    return this.client.get<PaginatedResponse<T>>(this.endpoint, {
      params: filters,
    });
  }

  // Get item by ID
  async getById(id: number): Promise<AxiosResponse<T>> {
    return this.client.get<T>(`${this.endpoint}${id}/`);
  }

  // Create new item
  async create(data: CreateRequest): Promise<AxiosResponse<T>> {
    return this.client.post<T>(this.endpoint, data);
  }

  // Update item (full update)
  async update(id: number, data: UpdateRequest): Promise<AxiosResponse<T>> {
    return this.client.put<T>(`${this.endpoint}${id}/`, data);
  }

  // Partially update item
  async patch(
    id: number,
    data: Partial<UpdateRequest>,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(`${this.endpoint}${id}/`, data);
  }

  // Delete item
  async delete(id: number): Promise<AxiosResponse<void>> {
    return this.client.delete(`${this.endpoint}${id}/`);
  }

  // Custom action on an item
  async action(
    id: number,
    action: string,
    data?: any,
  ): Promise<AxiosResponse<any>> {
    return this.client.post(`${this.endpoint}${id}/${action}/`, data);
  }

  // Custom action on the collection
  async collectionAction(
    action: string,
    data?: any,
  ): Promise<AxiosResponse<any>> {
    return this.client.post(`${this.endpoint}${action}/`, data);
  }
}

// File upload API Client for endpoints that handle file uploads
export class FileUploadApiClient<
  T,
  CreateRequest,
  UpdateRequest = CreateRequest,
> extends BaseApiClient<T, CreateRequest, UpdateRequest> {
  // Create with file upload
  async create(data: CreateRequest): Promise<AxiosResponse<T>> {
    const formData = this.createFormData(data);

    return this.client.post<T>(this.endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Update with file upload
  async update(id: number, data: UpdateRequest): Promise<AxiosResponse<T>> {
    const formData = this.createFormData(data);

    return this.client.put<T>(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Patch with file upload
  async patch(
    id: number,
    data: Partial<UpdateRequest>,
  ): Promise<AxiosResponse<T>> {
    const formData = this.createFormData(data);

    return this.client.patch<T>(`${this.endpoint}${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Helper method to create FormData from object
  protected createFormData(data: any): FormData {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key];

      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        // Handle array values (like parents)
        value.forEach((item) => {
          formData.append(key, item.toString());
        });
      } else if (value instanceof File) {
        // Handle file uploads
        formData.append(key, value);
      } else {
        // Handle primitive values
        formData.append(key, value.toString());
      }
    });

    return formData;
  }
}

export default apiClient;
