import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user_id", res.data.user_id);
    await useAuthStore.getState().loadUser();
  },

  register: async (data) => {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user_id", res.data.user_id);
    await useAuthStore.getState().loadUser();
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get("/auth/me");
      set({
        user: res.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
