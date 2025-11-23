"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Utensils,
  DollarSign,
  CalendarCheck,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import React from "react";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    children: [],
  },
  {
    name: "Menu & Recipes",
    href: "/menu",
    icon: Utensils,
    children: [
      { name: "Inventory", href: "/menu/inventory" },
      { name: "Ingredients", href: "/menu/ingredients" },
      { name: "Recipes", href: "/menu/recipes" },
      { name: "Menus", href: "/menu/menus" },
    ],
  },
  {
    name: "Quoting & Proposals",
    href: "/quoting",
    icon: DollarSign,
    children: [
      { name: "Clients", href: "/quoting/clients" },
      { name: "Proposals", href: "/quoting/proposals" },
      { name: "Estimates", href: "/quoting/estimates" },
    ],
  },
  {
    name: "Events & Planning",
    href: "/events",
    icon: CalendarCheck,
    children: [
      { name: "Calendar", href: "/events/calendar" },
      { name: "Bookings", href: "/events/bookings" },
      { name: "BEOs", href: "/events/beos" },
    ],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { name: "General", href: "/settings/general" },
      { name: "Users", href: "/settings/users" },
      { name: "Branding", href: "/settings/branding" },
      { name: "Catering Averages", href: "/settings/catering-averages" }, // New sub-item
    ],
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-center h-16 border-b px-4">
        <h1 className="text-xl font-semibold text-sidebar-primary-foreground">
          Caterer's Planner
        </h1>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActiveParent = location.pathname.startsWith(item.href);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <React.Fragment key={item.href}>
                <Button
                  asChild
                  variant={isActiveParent && !hasChildren ? "secondary" : "ghost"}
                  className={cn(
                    "justify-start mb-1",
                    isActiveParent && !hasChildren
                      ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {hasChildren && (isActiveParent ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />)}
                  </Link>
                </Button>
                {hasChildren && isActiveParent && (
                  <div className="ml-6 border-l border-sidebar-border pl-2 mb-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        asChild
                        variant={location.pathname === child.href ? "secondary" : "ghost"}
                        className={cn(
                          "justify-start w-full mb-1 text-xs",
                          location.pathname === child.href
                            ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Link to={child.href}>
                          {child.name}
                        </Link>
                      </Button>
                    ))}
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