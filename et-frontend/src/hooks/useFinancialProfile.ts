"use client";
import { useEffect } from "react";
import { useProfileStore } from "@/store/profileStore";

export function useFinancialProfile() {
  const { profile, isLoading, fetchProfile, saveProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  return { profile, isLoading, saveProfile, refetch: fetchProfile };
}
