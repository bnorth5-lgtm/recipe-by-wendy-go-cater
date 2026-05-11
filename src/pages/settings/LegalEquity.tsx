"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  CalendarDays,
  Crown,
  Lock,
  Mail,
  Percent,
  ShieldCheck,
  User,
  Users,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCateringStore } from "@/store/cateringStore";
import {
  PRIMARY_OWNERSHIP,
  NBS_ROLE_DEFINITIONS,
  nbsRoleLabel,
  type NbsRole,
} from "@/lib/partnershipLedger";
import { tierLabel } from "@/lib/subscriptionTiers";
import { cn } from "@/lib/utils";

// ── Access guard ──────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <Lock className="h-10 w-10 text-destructive/60" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold">Executive Access Required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Partnership Ledger and Legal &amp; Equity settings are restricted
          to the System Administrator. Your current role does not carry Executive
          Access.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Contact William North at{" "}
          <a
            href="mailto:northbusinessservices@gmail.com"
            className="text-primary hover:underline"
          >
            northbusinessservices@gmail.com
          </a>{" "}
          if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

// ── Role roster table ─────────────────────────────────────────────────────────

function RoleRosterTable({ users }: { users: ReturnType<typeof useCateringStore.getState>["users"] }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Name
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Email
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              NBS Role
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Subscription
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Exec Access
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => {
            const roleDef = NBS_ROLE_DEFINITIONS[u.nbsRole as NbsRole];
            return (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", roleDef?.badgeClass)}
                  >
                    {roleDef?.badge ?? u.nbsRole}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {tierLabel(u.tier)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {roleDef?.hasExecutiveAccess ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Lock className="h-3.5 w-3.5" /> No
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Role definition cards ──────────────────────────────────────────────────────

function RoleDefinitionCard({ role }: { role: NbsRole }) {
  const def = NBS_ROLE_DEFINITIONS[role];
  const permissionMap: Record<NbsRole, string[]> = {
    system_admin: [
      "Full access to all menus, dishes, and ingredient data",
      "Delicious Vault & Menu Engineering",
      "BEO Generator & event history",
      "Educational Bank",
      "Competitor Pricing Engine",
      "Market Expansion tools",
      "Legal & Equity / Partnership Ledger",
      "Billing & subscription management",
      "User management & role assignment",
      "All application data — read and write",
    ],
    executive_chef: [
      "Full access to all menus, dishes, and ingredient data",
      "Delicious Vault & Menu Engineering",
      "BEO Generator & event history",
      "Educational Bank",
      "Live Market Rate badges",
      "Market Expansion — Regional Sourcing",
      "Market Expansion — Marketing Launchpad",
    ],
    staff: [
      "Menu browsing & dish search",
      "Event calendar view",
      "Day-of logistics reference",
    ],
  };
  const restricted: Record<NbsRole, string[]> = {
    system_admin: [],
    executive_chef: [
      "Legal & Equity / Partnership Ledger",
      "Billing & subscription management",
      "Core financial settings",
      "User role assignment",
    ],
    staff: [
      "Legal & Equity settings",
      "Pricing Engine",
      "BEO Generator",
      "Educational Bank",
      "Any write operations",
    ],
  };

  return (
    <Card className={cn(role === "system_admin" && "border-slate-400/50 dark:border-slate-600")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{def.displayTitle}</CardTitle>
          <Badge variant="outline" className={cn("text-[10px]", def.badgeClass)}>
            {def.badge}
          </Badge>
        </div>
        <CardDescription className="text-xs">{def.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Granted Access
          </p>
          <ul className="space-y-0.5">
            {permissionMap[role].map((p) => (
              <li key={p} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        {restricted[role].length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-destructive/70 mb-1.5 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Restricted
              </p>
              <ul className="space-y-0.5">
                {restricted[role].map((r) => (
                  <li key={r} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-destructive/60 mt-0.5">✕</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LegalEquity() {
  const { isExec, currentUser } = useSubscription();
  const users = useCateringStore((state) => state.users);

  // Hard gate — redirect away if the user lacks executive access
  if (!isExec) {
    return <AccessDenied />;
  }

  const ownedSince = new Date(PRIMARY_OWNERSHIP.effectiveDate).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            Legal &amp; Equity
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Partnership Ledger · Ownership Record · Role-Based Access Control
          </p>
        </div>
        <Badge className="bg-slate-900 text-white border-slate-700 dark:bg-slate-100 dark:text-slate-900 text-xs gap-1 shrink-0">
          <ShieldCheck className="h-3 w-3" /> Executive Access
        </Badge>
      </div>

      {/* ── Security notice ── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20 p-4">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          This page contains confidential legal and ownership data. It is only
          visible to users with the <strong>System Administrator</strong> role
          (Executive Access). Changes to ownership or role assignments should be
          reflected in the Supabase <code>legal_ownership</code> and{" "}
          <code>subscriber_profiles</code> tables.
        </p>
      </div>

      {/* ── Partnership Ledger ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Partnership Ledger — Ownership Record
        </h2>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Entity */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Business Entity
                  </p>
                  <p className="text-xl font-bold mt-1">{PRIMARY_OWNERSHIP.entityName}</p>
                  <p className="text-xs text-muted-foreground">{PRIMARY_OWNERSHIP.entityType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Effective Date
                  </p>
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {ownedSince}
                  </p>
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Sole Owner
                  </p>
                  <p className="text-xl font-bold mt-1 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    {PRIMARY_OWNERSHIP.ownerName}
                  </p>
                  <p className="text-xs text-muted-foreground">{PRIMARY_OWNERSHIP.roleTitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Ownership
                    </p>
                    <p className="text-2xl font-black text-primary mt-0.5 flex items-center gap-0.5">
                      {PRIMARY_OWNERSHIP.ownershipPercentage}
                      <span className="text-sm font-semibold text-muted-foreground">%</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Contact
                    </p>
                    <a
                      href={`mailto:${PRIMARY_OWNERSHIP.ownerEmail}`}
                      className="text-xs text-primary hover:underline mt-0.5 flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      {PRIMARY_OWNERSHIP.ownerEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {PRIMARY_OWNERSHIP.notes}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── User Roster / RBAC ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Role-Based Access Control — User Roster
        </h2>
        <RoleRosterTable users={users} />
        <p className="text-xs text-muted-foreground/60">
          To modify role assignments, update the{" "}
          <code className="bg-muted px-1 rounded">nbs_role</code> column in the
          Supabase <code className="bg-muted px-1 rounded">subscriber_profiles</code>{" "}
          table and reload the session.
        </p>
      </section>

      {/* ── Role definitions ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Role Definitions &amp; Permissions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <RoleDefinitionCard role="system_admin" />
          <RoleDefinitionCard role="executive_chef" />
          <RoleDefinitionCard role="staff" />
        </div>
      </section>

      {/* ── Session info ── */}
      <section>
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Logged in as
                </p>
                <p className="font-semibold mt-0.5">{currentUser?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  NBS Role
                </p>
                <p className="font-semibold mt-0.5">
                  {nbsRoleLabel(currentUser?.nbsRole)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Subscription Tier
                </p>
                <p className="font-semibold mt-0.5">
                  {tierLabel(currentUser?.tier ?? "basic")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <MadeWithDyad />
    </div>
  );
}
