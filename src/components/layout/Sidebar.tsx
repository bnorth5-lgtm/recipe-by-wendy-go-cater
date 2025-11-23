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
} from "lucide-react";
import React from "react";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Menu & Recipes",
    href: "/menu",
    icon: Utensils,
  },
  {
    name: "Quoting & Proposals",
    href: "/quoting",
    icon: DollarSign,
  },
  {
    name: "Events & Planning",
    href: "/events",
    icon: CalendarCheck,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
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
            return (
              <Button
                key={item.href}
                asChild
                variant={location.pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "justify-start mb-1",
                  location.pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Link to={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};