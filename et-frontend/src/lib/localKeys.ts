/** localStorage keys for offline / no-backend mode */
export const LOCAL_KEYS = {
  users: "et_finance_local_users",
  session: "et_finance_local_session",
  profile: "et_finance_local_profile",
  coupleInvite: "et_finance_couple_invite",
  coupleLinked: "et_finance_couple_linked",
  couplePlan: "et_finance_couple_plan",
  currentUserId: "et_finance_current_user_id",
} as const;

const WIZARD_STORAGE_KEY = "et_finance_money_wizard_v1";
const TAX_HISTORY_KEY = "tax_history";

/**
 * Removes all user-specific localStorage entries.
 * Call on logout and before login to prevent cross-user data leakage.
 */
export function clearAllUserLocalData() {
  if (typeof window === "undefined") return;
  const keysToRemove = [
    LOCAL_KEYS.profile,
    LOCAL_KEYS.couplePlan,
    LOCAL_KEYS.coupleInvite,
    LOCAL_KEYS.coupleLinked,
    WIZARD_STORAGE_KEY,
    TAX_HISTORY_KEY,
    "access_token",
    "refresh_token",
    "user_id",
  ];
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

/**
 * Checks if the currently stored localStorage data belongs to the given user.
 * If it belongs to a different user, wipes everything and stores the new user ID.
 */
export function ensureLocalDataBelongsToUser(userId: string) {
  if (typeof window === "undefined") return;
  const storedUserId = localStorage.getItem(LOCAL_KEYS.currentUserId);
  if (storedUserId && storedUserId !== userId) {
    clearAllUserLocalData();
  }
  localStorage.setItem(LOCAL_KEYS.currentUserId, userId);
}
