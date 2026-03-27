"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export function useAuth(requireAuth: boolean = true) {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  return { user, isAuthenticated, isLoading, logout };
}
