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
    <aside className="flex flex-col h-full w-64 bg-primary text-primary-foreground"> {/* Changed bg-sidebar to bg-primary and text-sidebar-foreground to text-primary-foreground */}
      <div className="relative h-32 w-full overflow-hidden border-b bg-primary flex flex-col items-center justify-center px-4 text-white">
        <ChefHat className="h-8 w-8 text-white mb-2" />
        <h1 className="text-xl font-serif font-semibold text-white">
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
                      ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" // Adjusted active state for primary background
                      : "text-primary-foreground hover:bg-primary-foreground/10" // Adjusted ghost state for primary background
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
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        asChild
                        variant={location.pathname === child.href ? "secondary" : "ghost"}
                        className={cn(
                          "justify-start w-full mb-1 text-xs",
                          location.pathname === child.href
                            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" // Adjusted active state for primary background
                            : "text-primary-foreground hover:bg-primary-foreground/10" // Adjusted ghost state for primary background
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