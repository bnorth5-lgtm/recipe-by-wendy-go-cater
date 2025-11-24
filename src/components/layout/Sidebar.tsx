"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export const Sidebar = () => {
  console.log("Sidebar.tsx is rendering without LucideIcons!");
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      // icon: LayoutDashboard, // Temporarily removed icon
      children: [],
    },
    {
      name: "Inventory",
      href: "/menu/inventory",
      // icon: Warehouse, // Temporarily removed icon
      children: [],
    },
    {
      name: "Ingredients",
      href: "/menu/ingredients",
      // icon: Leaf, // Temporarily removed icon
      children: [],
    },
    {
      name: "Recipes",
      href: "/menu/recipes",
      // icon: BookText, // Temporarily removed icon
      children: [],
    },
    {
      name: "Menus",
      href: "/menu/menus",
      // icon: MenuIcon, // Temporarily removed icon
      children: [],
    },
    {
      name: "Quoting & Proposals",
      href: "/quoting",
      // icon: DollarSign, // Temporarily removed icon
      children: [
        { name: "Clients", href: "/quoting/clients" },
        { name: "Proposals", href: "/quoting/proposals" },
        { name: "Estimates", href: "/quoting/estimates" },
      ],
    },
    {
      name: "Events & Planning",
      href: "/events",
      // icon: CalendarCheck, // Temporarily removed icon
      children: [
        { name: "Calendar", href: "/events/calendar" },
        { name: "Bookings", href: "/events/bookings" },
        { name: "BEOs", href: "/events/beos" },
      ],
    },
    {
      name: "Settings",
      href: "/settings",
      // icon: Settings, // Temporarily removed icon
      children: [
        { name: "General", href: "/settings/general" },
        { name: "Users", href: "/settings/users" },
        { name: "Branding", href: "/settings/branding" },
        { name: "Catering Averages", href: "/settings/catering-averages" },
      ],
    },
  ];

  return (
    <aside className="flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-center h-16 border-b px-4">
        <h1 className="text-xl font-serif font-semibold text-sidebar-primary-foreground">
          Catering by Cronkhite
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
                    {/* {item.icon && <item.icon className="mr-3 h-5 w-5" />} */} {/* Temporarily removed icon rendering */}
                    {item.name}
                    {hasChildren && (isActiveParent ? <span className="ml-auto h-4 w-4">▼</span> : <span className="ml-auto h-4 w-4">▶</span>)} {/* Placeholder for chevron icons */}
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