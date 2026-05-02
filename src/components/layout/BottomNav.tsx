"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookText, CalendarCheck, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgentUpdatesStore } from "@/store/agentUpdates";
import { cn } from "@/lib/utils";

// ── Tab definitions ───────────────────────────────────────────────────────────

interface Tab {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPrefix: string;
  adminOnly: boolean;
}

const TABS: Tab[] = [
  {
    label: "Events",
    href: "/events/calendar",
    icon: <CalendarCheck className="h-5 w-5" />,
    matchPrefix: "/events",
    adminOnly: false,
  },
  {
    label: "Recipes",
    href: "/menu/recipes",
    icon: <BookText className="h-5 w-5" />,
    matchPrefix: "/menu",
    adminOnly: false,
  },
  {
    label: "Executive",
    href: "/executive",
    icon: <Crown className="h-5 w-5" />,
    matchPrefix: "/executive",
    adminOnly: true,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Mobile-only bottom tab bar.
 * Hidden on md+ breakpoints where the sidebar handles navigation.
 *
 * The "Executive" tab is conditionally rendered based on the user's
 * NBS role. This maps to the `is_admin` flag in Supabase `subscriber_profiles`
 * (nbs_role = 'system_admin' → isExec = true).
 */
export function BottomNav() {
  const location = useLocation();
  const { isExec } = useSubscription();
  const hasNewUpdate = useAgentUpdatesStore((s) => s.hasNewUpdate);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isExec);

  return (
    /* Safe-area-aware fixed bar — only visible below md breakpoint */
    <nav
      aria-label="Bottom navigation"
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 md:hidden",
        "border-t border-border/60",
        "bg-background/95 backdrop-blur-md",
        /*
         * pb-10 provides a generous 40 px tap-zone above the gesture pill
         * on Samsung Galaxy (S25 Ultra etc.) and Android devices.
         * The calc() expression adds safe-area-inset-bottom ON TOP of that
         * base padding so iOS home-bar devices get the sum of both.
         */
        "[padding-bottom:calc(2.5rem+env(safe-area-inset-bottom,0px))]"
      )}
    >
      {/* items-center so icons stay vertically centred within the taller bar */}
      <ul className="flex items-center" role="tablist">
        {visibleTabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.matchPrefix);
          const isExecTab = tab.adminOnly;

          return (
            <li key={tab.href} className="flex-1" role="none">
              <Link
                to={tab.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  /* pt-3 anchors the icon/label near the top of the bar so the
                     extra bottom padding (safe-area) feels like dead space below,
                     not a visual shift of the icon upward. */
                  "flex flex-col items-center justify-start gap-1 w-full pt-3 pb-1 px-1",
                  "text-[10px] font-semibold uppercase tracking-widest",
                  "transition-colors duration-150 select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",

                  /* Default (inactive) */
                  "text-muted-foreground/70",

                  /* Active — events / recipes */
                  !isExecTab && isActive && "text-foreground",

                  /* Active — executive (amber luxury accent) */
                  isExecTab && isActive && "text-amber-500",

                  /* Hover */
                  !isExecTab && !isActive && "hover:text-foreground/80",
                  isExecTab && !isActive && "hover:text-amber-400/80"
                )}
              >
                {/* Icon wrapper with active indicator dot */}
                <span className="relative">
                  {tab.icon}
                  {isActive && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full",
                        isExecTab ? "bg-amber-500" : "bg-foreground"
                      )}
                    />
                  )}
                  {/* Gold ping overlay — fires when a new agent event arrives
                      and the user is NOT currently on the Executive tab */}
                  {isExecTab && hasNewUpdate && !isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Top accent line for active executive tab */}
      {location.pathname.startsWith("/executive") && (
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent pointer-events-none"
        />
      )}
    </nav>
  );
}
