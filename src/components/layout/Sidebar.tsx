"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import * as LucideIcons from "lucide-react";

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LucideIcons.LayoutDashboard,
      children: [],
    },
    {
      name: "Inventory",
      href: "/menu/inventory",
      icon: LucideIcons.Warehouse,
      children: [],
    },
    {
      name: "Ingredients",
      href: "/menu/ingredients",
      icon: LucideIcons.Leaf,
      children: [],
    },
    {
      name: "Recipes",
      href: "/menu/recipes",
      icon: LucideIcons.BookText,
      children: [],
    },
    {
      name: "Menus",
      href: "/menu/menus",
      icon: LucideIcons.Menu,
      children: [],
    },
    {
      name: "Quoting & Proposals",
      href: "/quoting/clients",
      icon: LucideIcons.DollarSign,
      children: [
        { name: "Clients", href: "/quoting/clients" },
        { name: "Proposals", href: "/quoting/proposals" },
        { name: "Estimates", href: "/quoting/estimates" },
      ],
    },
    {
      name: "Events & Planning",
      href: "/events/calendar",
      icon: LucideIcons.CalendarCheck,
      children: [
        { name: "Calendar", href: "/events/calendar" },
        { name: "Bookings", href: "/events/bookings" },
        { name: "BEOs", href: "/events/beos" },
      ],
    },
    {
      name: "Settings",
      href: "/settings/general",
      icon: LucideIcons.Settings,
      children: [
        { name: "General", href: "/settings/general" },
        { name: "Users", href: "/settings/users" },
        { name: "Branding", href: "/settings/branding" },
        { name: "Catering Averages", href: "/settings/catering-averages" },
      ],
    },
  ];

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground"> {/* Ensure no border-r here */}
      <div className="flex flex-col items-center justify-center h-32 border-b px-4">
        <LucideIcons.ChefHat className="h-8 w-8 text-primary mb-2" />
        <h1 className="text-xl font-serif font-semibold text-sidebar-primary-foreground">
          Catering by Cronkhite
        </h1>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActiveParent = location.pathname.startsWith(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const Icon = item.icon;

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
                    {Icon && <Icon className="mr-3 h-5 w-5" />}
                    {item.name}
                    {hasChildren && (isActiveParent ? <LucideIcons.ChevronDown className="ml-auto h-4 w-4" /> : <LucideIcons.ChevronRight className="ml-auto h-4 w-4" />)}
                  </Link>
                </Button>
                {hasChildren && isActiveParent && (
                  <div className="ml-6 pl-2 mb-1"> {/* Removed border-l border-sidebar-border */}
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