"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { clearAllUserLocalData, ensureLocalDataBelongsToUser } from "@/lib/localKeys";
import { useProfileStore } from "@/store/profileStore";
import { useTaxWizardStore } from "@/store/taxWizardStore";
import { useFirePlannerStore } from "@/store/firePlannerStore";
import { useAuthStore } from "@/store/authStore";

/**
 * Invisible component mounted at the root layout.
 * Listens for Supabase auth state changes and resets all user-specific
 * stores + localStorage when a different user signs in.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;
      const prevUserId = prevUserIdRef.current;

      if (prevUserId && newUserId && prevUserId !== newUserId) {
        clearAllUserLocalData();
        useProfileStore.getState().resetProfile();
        useTaxWizardStore.getState().resetTaxState();
        useFirePlannerStore.getState().resetFireState();
      }

      if (!newUserId && prevUserId) {
        clearAllUserLocalData();
        useProfileStore.getState().resetProfile();
        useTaxWizardStore.getState().resetTaxState();
        useFirePlannerStore.getState().resetFireState();
        useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      }

      if (newUserId) {
        ensureLocalDataBelongsToUser(newUserId);
      }

      prevUserIdRef.current = newUserId;
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
