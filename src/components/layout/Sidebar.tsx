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
  ChefHat
} from "lucide-react";

export const Sidebar = () => {
  const location = useLocation();

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
      name: "Quoting & Proposals",
      href: "/quoting/clients",
      icon: DollarSign,
      children: [
        { name: "Clients", href: "/quoting/clients" },
        { name: "Proposals", href: "/quoting/proposals" },
        { name: "Estimates", href: "/quoting/estimates" },
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
    <aside className="flex flex-col h-screen w-64 bg-sidebar-background text-sidebar-foreground">
      <div className="relative h-32 w-full overflow-hidden border-b border-primary-foreground/20 flex flex-col items-center justify-center px-4 bg-sidebar-accent text-white">
        <ChefHat className="h-8 w-8 text-black mb-2" />
        <h1 className="text-xl font-serif font-semibold text-black">
          Catering by Cronkhite
        </h1>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActiveParent = location.pathname.startsWith(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const Icon = item.icon;

            // Styling for all nav items against the light background
            const baseTextColor = "text-sidebar-foreground";
            const hoverBg = "hover:bg-sidebar-accent"; // Lighter blue for hover
            const activeBg = "bg-sidebar-accent"; // Lighter blue for active background
            const activeTextColor = "text-sidebar-accent-foreground"; // Primary blue for active text

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