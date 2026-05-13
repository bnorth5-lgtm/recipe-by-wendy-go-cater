"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import {
  LayoutDashboard,
  Warehouse,
  Leaf,
  BookText,
  Menu,
  DollarSign,
  CalendarCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Timer,
  Sparkles,
  GraduationCap,
  Lock,
  FileText,
  Radar,
  ChevronLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/logic/supabaseClient";
import { useEventContext } from "@/context/EventContext";

interface SidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { can, isExec } = useSubscription();
  const { eventState } = useEventContext();

  const navItems = [
    {
      name: "Market Pulse",
      href: "/market-pulse",
      icon: Radar,
      children: [],
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      children: [],
    },
    {
      name: "Inventory",
      href: "/menu/inventory",
      icon: Warehouse,
      children: [],
    },
    {
      name: "Ingredients",
      href: "/menu/ingredients",
      icon: Leaf,
      children: [],
    },
    {
      name: "Delicious Menu",
      href: "/menu/recipes",
      icon: BookText,
      children: [],
    },
    {
      name: "Menus",
      href: "/menu/menus",
      icon: Menu,
      children: [],
    },
    {
      name: "Prep Schedule", // NEW ITEM
      href: "/menu/schedule",
      icon: Timer, // Using Timer icon
      children: [],
    },
    {
      name: "Live Story",
      href: "/live-story",
      icon: Sparkles,
      children: [],
    },
    {
      name: "Estimates & Proposals", // Changed from "Quoting & Proposals"
      href: "/quoting/clients",
      icon: DollarSign,
      children: [
        { name: "Clients", href: "/quoting/clients" },
        { name: "Proposals", href: "/quoting/proposals" },
        { name: "Estimates", href: "/quoting/estimates" },
        { name: "New Booking", href: "/events/bookings" }, // Added this line
      ],
    },
    {
      name: "Events & Planning",
      href: "/events/calendar",
      icon: CalendarCheck,
      children: [
        { name: "Calendar", href: "/events/calendar" },
        { name: "Bookings", href: "/events/bookings" },
        { name: "BEOs", href: "/events/beos" },
        { name: "BEO Generator", href: "/logistics/beo-generator" },
      ],
    },
    {
      name: "Visionary",
      href: "/venue-architect",
      icon: Radar,
      children: [],
    },
    {
      name: "Educational Bank",
      href: "/educational-bank",
      icon: GraduationCap,
      children: [],
      requiresEnterprise: true,
    },
    {
      name: "Settings",
      href: "/settings/general",
      icon: Settings,
      children: [
        { name: "General", href: "/settings/general" },
        { name: "Users", href: "/settings/users" },
        { name: "Branding", href: "/settings/branding" },
        { name: "Catering Averages", href: "/settings/catering-averages" },
        { name: "Pricing Engine", href: "/settings/pricing-engine" },
        { name: "Market Expansion", href: "/settings/market-expansion" },
        { name: "Subscription", href: "/settings/subscription" },
        ...(isExec
          ? [{ name: "Legal & Equity", href: "/settings/legal-equity" }]
          : []),
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar-background text-sidebar-foreground transition-all duration-300 ease-in-out z-50",
        isMobile
          ? "fixed inset-y-0 left-0 transform w-64"
          : cn("relative", isCollapsed ? "w-0 overflow-hidden" : "w-64"),
        isMobile && !isSidebarOpen && "-translate-x-full", // Hide on mobile when closed
        isMobile && isSidebarOpen && "translate-x-0", // Show on mobile when open
        !isMobile && "translate-x-0" // Always show on desktop
      )}
    >
      <div className="relative w-full shrink-0 z-40 flex justify-end p-2">
        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-[#fbbf24] transition-colors"
            onClick={onToggleCollapse}
            aria-label="Collapse menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        {isMobile && (
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 shadow-md"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActiveParent = location.pathname.startsWith(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const Icon = item.icon;
            const locked = item.requiresEnterprise && !can("educational_bank");

            const baseTextColor = "text-sidebar-foreground";
            const hoverBg = "hover:bg-sidebar-accent";
            const activeBg = "bg-sidebar-accent";
            const activeTextColor = "text-sidebar-accent-foreground";

            return (
              <React.Fragment key={item.href}>
                <Button
                  asChild={!locked}
                  variant="ghost"
                  className={cn(
                    "justify-start mb-1",
                    baseTextColor,
                    locked ? "opacity-50 cursor-not-allowed" : hoverBg,
                    isActiveParent && !locked ? cn(activeBg, activeTextColor) : ""
                  )}
                  {...(isMobile && !locked ? { onClick: onClose } : {})}
                  disabled={locked}
                >
                  {locked ? (
                    <span className="flex items-center w-full">
                      {Icon && <Icon className="mr-3 h-5 w-5 shrink-0" />}
                      {item.href === "/educational-bank" ? (
                        <span className="flex flex-col items-start gap-0.5 leading-snug font-serif">
                          <span className="text-[13px] font-semibold tracking-tight">Delicious Catering</span>
                          <span className="text-[11px] font-medium text-[#fbbf24]">&amp; Events · by Wendy</span>
                        </span>
                      ) : (
                        item.name
                      )}
                      <Lock className="ml-auto h-3.5 w-3.5 opacity-60" />
                    </span>
                  ) : (
                    <Link to={item.href}>
                      {Icon && <Icon className="mr-3 h-5 w-5 shrink-0" />}
                      {item.href === "/educational-bank" ? (
                        <span className="flex flex-col items-start gap-0.5 leading-snug font-serif">
                          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">Delicious Catering</span>
                          <span className="text-[11px] font-medium text-[#fbbf24]">&amp; Events · by Wendy</span>
                        </span>
                      ) : (
                        item.name
                      )}
                      {hasChildren && (isActiveParent ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
                    </Link>
                  )}
                </Button>
                {hasChildren && isActiveParent && !locked && (
                  <div className="ml-6 pl-2 mb-1">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.href;
                      return (
                        <Button
                          key={child.href}
                          asChild
                          variant="ghost"
                          className={cn(
                            "justify-start w-full mb-1 text-xs",
                            baseTextColor,
                            hoverBg,
                            isChildActive ? cn(activeBg, activeTextColor) : ""
                          )}
                          {...(isMobile ? { onClick: onClose } : {})}
                        >
                          <Link to={child.href}>
                            {child.name}
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </ScrollArea>
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-red-500 mb-2 pl-2">Danger Zone</div>
          <Button 
            variant="destructive"
            className="w-full bg-red-950 hover:bg-red-900 text-red-400 font-semibold text-xs border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
            onClick={async () => {
              if (confirm("Are you sure you want to wipe Harrison Field data?")) {
                localStorage.clear();
                try {
                  const eventId = eventState?.eventId || "demo-harrison";
                  await supabase.from('harrison_build_manifest').delete().eq('event_id', eventId);
                } catch (e) {
                  console.error("Failed to delete manifest from Supabase", e);
                }
                window.location.reload();
              }
            }}
          >
            EMERGENCY DATA WIPE
          </Button>
        </div>
      )}
    </aside>
  );
};