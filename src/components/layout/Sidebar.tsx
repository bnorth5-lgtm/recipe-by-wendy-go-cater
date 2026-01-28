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
  Menu, // Keep Menu icon for the sidebar itself if needed, but not for toggle
  DollarSign,
  CalendarCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ChefHat,
  User as UserIcon,
  X, // Import X icon for close button
  Timer, // Import Timer icon
} from "lucide-react";
import { useCateringStore } from "@/store/cateringStore";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile

interface SidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const businessName = useCateringStore((state) => state.businessName);
  const currentUser = useCateringStore((state) => state.currentUser);
  const logoUrl = useCateringStore((state) => state.logoUrl);

  const navItems = [
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
      ],
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
      <div className="relative h-32 w-full overflow-hidden border-b border-primary-foreground/20 flex flex-col items-center justify-center px-4 bg-sidebar-accent text-white">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-black"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        )}
        {logoUrl ? (
          <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain mb-2" />
        ) : (
          <ChefHat className="h-8 w-8 text-black mb-2" />
        )}
        <h1 className="text-xl font-serif font-semibold text-black">
          {businessName}
        </h1>
        {currentUser && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-black/80 bg-white/70 px-2 py-1 rounded-full">
            <UserIcon className="h-3 w-3" />
            <span>{currentUser.role}</span>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActiveParent = location.pathname.startsWith(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const Icon = item.icon;

            const baseTextColor = "text-sidebar-foreground";
            const hoverBg = "hover:bg-sidebar-accent";
            const activeBg = "bg-sidebar-accent";
            const activeTextColor = "text-sidebar-accent-foreground";

            return (
              <React.Fragment key={item.href}>
                <Button
                  asChild
                  variant="ghost"
                  className={cn(
                    "justify-start mb-1",
                    baseTextColor,
                    hoverBg,
                    isActiveParent ? cn(activeBg, activeTextColor) : ""
                  )}
                  onClick={isMobile ? onClose : undefined} // Close sidebar on mobile when a nav item is clicked
                >
                  <Link to={item.href}>
                    {Icon && <Icon className="mr-3 h-5 w-5" />}
                    {item.name}
                    {hasChildren && (isActiveParent ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
                  </Link>
                </Button>
                {hasChildren && isActiveParent && (
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
                          onClick={isMobile ? onClose : undefined} // Close sidebar on mobile when a nav item is clicked
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