import type {
  LoginRequest,
  LoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  LogoutRequest,
  ChangePasswordRequest,
  User,
} from "@/models/auth";

import { apiClient } from "./client";

function omitBlank<T extends object>(data: T): Partial<T> {
  const result: Partial<T> = {};

  (Object.keys(data) as (keyof T)[]).forEach((key) => {
    const value = data[key];

    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  });

  return result;
}

export interface RegisterData {
  username?: string;
  email?: string;
  password: string;
  full_name?: string;
  first_name?: string;
  father_name?: string;
  grandfather_name?: string;
  family_name?: string;
  phone_number?: string;
  user_type: "doctor" | "student" | "institution";
  birthdate?: string;
  city?: string;
  address?: string;
  nationality?: string;
  passport_image?: File | string;
  university_name?: string;
  current_degree?: string;
  specialty?: string;
  bio?: string;
  branches?: number[];
  membership_number?: string;
  branch_id?: number;
  language?: "ar" | "en";
  gender?: "male" | "female" | "";
  _branch_name?: string;
  _city_name?: string;
  _nationality_name?: string;
  _degree_display?: string;
  _specialty_display?: string;
}

export interface VerifyEmailData {
  user_id: number;
  code: string;
}

export interface ResendVerificationData {
  user_id?: number;
  email?: string;
}

export interface RequestPasswordResetData {
  email?: string;
  username?: string;
}

export interface VerifyPasswordResetData {
  user_id: number;
  code: string;
}

export interface ConfirmPasswordResetData {
  user_id: number;
  code: string;
  new_password: string;
  confirm_password: string;
}

export class AuthAPI {
  /**
   * Login user and get JWT tokens
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "auth/login/",
      omitBlank(credentials),
    );

    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(
    data: TokenRefreshRequest,
  ): Promise<TokenRefreshResponse> {
    const response = await apiClient.post<TokenRefreshResponse>(
      "auth/token/refresh/",
      omitBlank(data),
    );

    return response.data;
  }

  /**
   * Logout user and blacklist refresh token
   */
  static async logout(data: LogoutRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "auth/logout/",
      omitBlank(data),
    );

    AuthAPI.clearTokens();

    return response.data;
  }

  /**
   * Change user password
   */
  static async changePassword(
    data: ChangePasswordRequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "auth/change-password/",
      omitBlank(data),
    );

    return response.data;
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(): Promise<User> {
    const response = await apiClient.get<User>("users/me/");

    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem("access_token");

    return !!token;
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  /**
   * Get stored refresh token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  /**
   * Store tokens in localStorage
   */
  static storeTokens(tokens: LoginResponse): void {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
  }

  /**
   * Clear stored tokens
   */
  static clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData | FormData) {
    const response = await apiClient.post("auth/register/", data, {
      headers: data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
    });

    return response.data;
  }

  /**
   * Verify email with code
   */
  static async verifyEmail(data: VerifyEmailData) {
    const response = await apiClient.post("auth/verify-email/", data);

    return response.data;
  }

  /**
   * Resend verification code
   */
  static async resendVerification(data: ResendVerificationData) {
    const response = await apiClient.post("auth/resend-verification/", data);

    return response.data;
  }

  /**
   * Request password reset - sends OTP to user's email
   */
  static async requestPasswordReset(data: RequestPasswordResetData) {
    const response = await apiClient.post("auth/reset-password/", data);

    return response.data;
  }

  /**
   * Verify OTP code for password reset
   */
  static async verifyPasswordReset(data: VerifyPasswordResetData) {
    const response = await apiClient.post("auth/verify-password-reset/", data);

    return response.data;
  }

  /**
   * Confirm password reset with new password
   */
  static async confirmPasswordReset(data: ConfirmPasswordResetData) {
    const response = await apiClient.post("auth/confirm-password-reset/", data);

    return response.data;
  }
}

export default AuthAPI;
