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
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";

interface SidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { can, isExec } = useSubscription();

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
      name: "Recipes",
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
        "flex flex-col h-screen w-64 bg-sidebar-background text-sidebar-foreground transition-transform duration-300 ease-in-out",
        isMobile
          ? "fixed inset-y-0 left-0 z-50 transform"
          : "relative",
        isMobile && !isSidebarOpen && "-translate-x-full", // Hide on mobile when closed
        isMobile && isSidebarOpen && "translate-x-0", // Show on mobile when open
        !isMobile && "translate-x-0" // Always show on desktop
      )}
    >
      <div className="relative w-full shrink-0 border-b border-sidebar-border bg-muted/40 z-40">
        <Link to="/" className="flex w-full items-center justify-start gap-3 px-3 py-4 sm:px-4 sm:py-5 relative group cursor-pointer transition-colors duration-300 hover:text-[#fbbf24]">
          <img
            src="/wendylogo.jpg"
            alt="Catering By Wendy Logo"
            className="max-h-12 w-auto drop-shadow-sm object-contain"
            fetchPriority="high"
          />
          <h1 
            className="font-serif font-bold text-slate-800 dark:text-slate-200 transition-colors duration-300 group-hover:text-[#fbbf24] text-xl md:text-2xl lg:text-3xl"
            style={{ fontSize: "clamp(1.125rem, 4vw, 1.875rem)" }}
          >
            Catering by Wendy
          </h1>
        </Link>
        {isMobile && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 z-20 h-9 w-9 shadow-md"
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
                  onClick={locked ? undefined : isMobile ? onClose : undefined}
                  disabled={locked}
                >
                  {locked ? (
                    <span className="flex items-center w-full">
                      {Icon && <Icon className="mr-3 h-5 w-5" />}
                      {item.name}
                      <Lock className="ml-auto h-3.5 w-3.5 opacity-60" />
                    </span>
                  ) : (
                    <Link to={item.href}>
                      {Icon && <Icon className="mr-3 h-5 w-5" />}
                      {item.name}
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
                          onClick={isMobile ? onClose : undefined}
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
    </aside>
  );
};