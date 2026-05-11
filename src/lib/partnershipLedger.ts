/**
 * partnershipLedger.ts
 *
 * Defines the NBS Role-Based Access Control (RBAC) system and the canonical
 * legal ownership record for the Delicious Catering & Events business entity.
 *
 * This is intentionally a separate module from subscriptionTiers.ts so that
 * business authority (who owns the entity and can touch legal/financial data)
 * never gets conflated with feature-access tiers (what capabilities each plan
 * unlocks).
 *
 * Hierarchy:
 *   system_admin   → William North — full system control + executive access
 *   executive_chef → Wendy         — full culinary operations, no legal/equity
 *   staff          → General staff — basic operational access
 */

// ── Role definitions ──────────────────────────────────────────────────────────

/**
 * NbsRole represents a user's authority level within the NBS business
 * structure. It controls access to legal, financial, and ownership settings.
 */
export type NbsRole = "system_admin" | "executive_chef" | "staff";

export interface NbsRoleDefinition {
  id: NbsRole;
  /** Human-readable title shown in the UI */
  displayTitle: string;
  /** Short descriptor for badge/pill display */
  badge: string;
  /** Tailwind badge colour classes */
  badgeClass: string;
  /** One-line summary of what this role can do */
  summary: string;
  /** Whether this role has executive (legal/financial) access */
  hasExecutiveAccess: boolean;
  /** Whether this role is a full system administrator */
  isSystemAdmin: boolean;
}

export const NBS_ROLE_DEFINITIONS: Record<NbsRole, NbsRoleDefinition> = {
  system_admin: {
    id: "system_admin",
    displayTitle: "System Administrator",
    badge: "Sys Admin",
    badgeClass:
      "bg-slate-900 text-white border-slate-700 dark:bg-slate-100 dark:text-slate-900",
    summary:
      "Full control over all application data, billing, legal settings, the Partnership Ledger, and every system configuration.",
    hasExecutiveAccess: true,
    isSystemAdmin: true,
  },
  executive_chef: {
    id: "executive_chef",
    displayTitle: "Executive Chef",
    badge: "Exec Chef",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
    summary:
      "Full access to the Delicious Vault, Menu Engineering, BEO Generation, and the Educational Bank. No access to legal, financial, or ownership settings.",
    hasExecutiveAccess: false,
    isSystemAdmin: false,
  },
  staff: {
    id: "staff",
    displayTitle: "Staff",
    badge: "Staff",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300",
    summary:
      "Operational access to menus, events, and day-of logistics. No access to settings, pricing, legal, or ownership data.",
    hasExecutiveAccess: false,
    isSystemAdmin: false,
  },
};

// ── Permission helpers ────────────────────────────────────────────────────────

/**
 * Returns true if the given NBS role carries executive-level access
 * (i.e. legal settings, Partnership Ledger, billing, equity data).
 * Currently only system_admin qualifies.
 */
export function hasExecutiveAccess(role: NbsRole | undefined | null): boolean {
  if (!role) return false;
  return NBS_ROLE_DEFINITIONS[role]?.hasExecutiveAccess ?? false;
}

/**
 * Returns true if the given NBS role is a full system administrator.
 */
export function isSystemAdmin(role: NbsRole | undefined | null): boolean {
  if (!role) return false;
  return NBS_ROLE_DEFINITIONS[role]?.isSystemAdmin ?? false;
}

/**
 * Returns the human-readable display title for an NBS role.
 */
export function nbsRoleLabel(role: NbsRole | undefined | null): string {
  if (!role) return "No Role";
  return NBS_ROLE_DEFINITIONS[role]?.displayTitle ?? role;
}

// ── Legal Ownership Record ────────────────────────────────────────────────────

/**
 * Canonical ownership record for the Delicious Catering & Events business entity.
 * This is the source of truth for the Partnership Ledger page and any
 * Supabase `legal_ownership` table entries.
 */
export interface LegalOwnershipRecord {
  entityName: string;
  entityType: string;
  ownerName: string;
  ownerEmail: string;
  ownershipPercentage: number;
  roleTitle: string;
  effectiveDate: string; // ISO date string YYYY-MM-DD
  notes: string;
}

export const PRIMARY_OWNERSHIP: LegalOwnershipRecord = {
  entityName: "Delicious Catering & Events",
  entityType: "Sole Proprietorship / DBA",
  ownerName: "William North",
  ownerEmail: "northbusinessservices@gmail.com",
  ownershipPercentage: 100,
  roleTitle: "Sole Owner & System Administrator",
  effectiveDate: "2024-01-01",
  notes:
    "William North holds 100% ownership of the Delicious Catering & Events business entity and the NBS Engine platform. All legal, financial, and system-level decisions require his Executive Access authorisation.",
};

// ── Canonical user seeds (authoritative NBS user definitions) ─────────────────

/**
 * These are the real named users of the NBS system.
 * Used as seeds in cateringStore.ts and for Supabase subscriber_profiles.
 */
export const NBS_CANONICAL_USERS = [
  {
    id: "bill-north-001",
    name: "William North",
    displayName: "Bill North",
    email: "northbusinessservices@gmail.com",
    nbsRole: "system_admin" as NbsRole,
    /** Legacy UserRole field for existing UI that reads .role */
    legacyRole: "Owner" as const,
    tier: "enterprise" as const,
    subscribedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "wendy-001",
    name: "Wendy",
    displayName: "Wendy",
    email: "wendy@cateringbywendy.com",
    nbsRole: "executive_chef" as NbsRole,
    legacyRole: "Caterer" as const,
    tier: "enterprise" as const,
    subscribedAt: "2024-01-01T00:00:00.000Z",
  },
] as const;
