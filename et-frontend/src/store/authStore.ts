import { create } from "zustand";
import api from "@/lib/api";
import { isLocalEngineMode } from "@/lib/config";
import { LOCAL_KEYS } from "@/lib/localKeys";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface LocalUser extends User {
  password: string;
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

function readLocalUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.users) || "[]");
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_KEYS.users, JSON.stringify(users));
}

function setLocalSession(user: User) {
  localStorage.setItem(LOCAL_KEYS.session, JSON.stringify({ user_id: user.id }));
  localStorage.setItem("access_token", "local-session");
  localStorage.setItem("refresh_token", "local-session");
  localStorage.setItem("user_id", user.id);
}

function withoutPassword(u: LocalUser): User {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    avatar_url: u.avatar_url,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    if (isLocalEngineMode()) {
      const users = readLocalUsers();
      const u = users.find((x) => x.email === email && x.password === password);
      if (!u) throw new Error("Invalid credentials");
      const safe = withoutPassword(u);
      setLocalSession(safe);
      set({ user: safe, isAuthenticated: true, isLoading: false });
      return;
    }
    const res = await api.post<{ access_token: string; refresh_token: string; user_id: string }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user_id", res.data.user_id);
    await useAuthStore.getState().loadUser();
  },

  register: async (data) => {
    if (isLocalEngineMode()) {
      const users = readLocalUsers();
      if (users.some((u) => u.email === data.email)) throw new Error("Email already registered");
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}`;
      const row: LocalUser = {
        id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        password: data.password,
      };
      writeLocalUsers([...users, row]);
      const safe = withoutPassword(row);
      setLocalSession(safe);
      set({ user: safe, isAuthenticated: true, isLoading: false });
      return;
    }
    const res = await api.post<{ access_token: string; refresh_token: string; user_id: string }>("/auth/register", data);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    localStorage.setItem("user_id", res.data.user_id);
    await useAuthStore.getState().loadUser();
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    if (isLocalEngineMode()) {
      localStorage.removeItem(LOCAL_KEYS.session);
    }
    set({ user: null, isAuthenticated: false });
    if (typeof window !== "undefined") window.location.href = "/login";
  },

  loadUser: async () => {
    if (isLocalEngineMode()) {
      try {
        const raw = localStorage.getItem(LOCAL_KEYS.session);
        if (!raw) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const { user_id } = JSON.parse(raw) as { user_id: string };
        const users = readLocalUsers();
        const u = users.find((x) => x.id === user_id);
        if (!u) {
          localStorage.removeItem(LOCAL_KEYS.session);
          localStorage.removeItem("access_token");
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const safe = withoutPassword(u);
        set({ user: safe, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get<User>("/auth/me");
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
