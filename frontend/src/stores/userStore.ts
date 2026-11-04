import type { User } from "@/models/auth";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AuthAPI } from "@/api";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (username, password) => {
        try {
          set({ isLoading: true, error: null });

          const response = await AuthAPI.login({ username, password });

          AuthAPI.storeTokens(response);

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.error ||
            error.message ||
            "Login failed. Please try again.";

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          AuthAPI.clearTokens();
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });

          const refreshToken = AuthAPI.getRefreshToken();

          if (refreshToken) {
            try {
              await AuthAPI.logout({ refresh_token: refreshToken });
            } catch (error) {
              // Continue with logout even if API call fails
              console.warn("Logout API call failed:", error);
            }
          }

          AuthAPI.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Even if logout fails, clear local state
          AuthAPI.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchUserProfile: async () => {
        // try {
        set({ isLoading: true, error: null });

        // if (!AuthAPI.isAuthenticated()) {
        //   throw new Error('Not authenticated');
        // }

        const profileResponse = await AuthAPI.getUserProfile();

        set({
          user: profileResponse,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      initialize: async () => {
        try {
          if (AuthAPI.isAuthenticated()) {
            await get().fetchUserProfile();
          }
        } catch (error) {
          // If initialization fails, user will need to login again
          console.warn("Failed to initialize user state:", error);
          get().logout();
        }
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
