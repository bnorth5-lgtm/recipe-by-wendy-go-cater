import { useCateringStore } from "@/store/cateringStore";
import {
  hasFeature,
  type TierFeature,
  type SubscriptionTier,
} from "@/lib/subscriptionTiers";
import {
  hasExecutiveAccess,
  isSystemAdmin,
  nbsRoleLabel,
  type NbsRole,
} from "@/lib/partnershipLedger";
import { logUsage } from "@/lib/recipeDb";

/**
 * Returns the current user's subscription tier, NBS role helpers, and
 * functions to check feature access and record usage events.
 *
 * Two orthogonal permission axes:
 *   can(feature)  — subscription-tier gating (Basic / Professional / Enterprise)
 *   hasRole(role) — NBS business-authority gating (system_admin / executive_chef / staff)
 *
 * The Legal & Equity / Partnership Ledger sections use hasRole("system_admin")
 * so that even an Enterprise subscriber without executive access cannot reach them.
 */
export function useSubscription() {
  const currentUser = useCateringStore((state) => state.currentUser);

  const tier: SubscriptionTier = currentUser?.tier ?? "basic";
  const nbsRole: NbsRole = currentUser?.nbsRole ?? "staff";

  /** Returns true if the current tier includes access to `feature`. */
  function can(feature: TierFeature): boolean {
    return hasFeature(tier, feature);
  }

  /**
   * Returns true if the current user's NBS role matches the given role
   * OR is a higher-authority role (system_admin implies all roles).
   */
  function hasRole(role: NbsRole): boolean {
    if (!currentUser) return false;
    // system_admin has access to everything
    if (nbsRole === "system_admin") return true;
    return nbsRole === role;
  }

  /** True if the current user has executive-level authority (legal / financial / ownership). */
  const isExec: boolean = hasExecutiveAccess(nbsRole);

  /** True if the current user is the system administrator. */
  const isSysAdmin: boolean = isSystemAdmin(nbsRole);

  /** Human-readable label for the current user's NBS role. */
  const nbsRoleName: string = nbsRoleLabel(nbsRole);

  /**
   * Records a feature access event in the local subscriber_usage table.
   * Non-fatal — errors are silently swallowed so they never block UI.
   */
  async function track(feature: TierFeature): Promise<void> {
    if (!currentUser) return;
    try {
      await logUsage(currentUser.id, feature, tier);
    } catch {
      // intentionally non-fatal
    }
  }

  return {
    tier,
    nbsRole,
    nbsRoleName,
    isExec,
    isSysAdmin,
    can,
    hasRole,
    track,
    currentUser,
  };
}
