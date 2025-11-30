"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Hamburger Menu Button (only visible when sidebar is closed) */}
      {isMobile && !isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Overlay for mobile when sidebar is open */}
      {/* This overlay is behind the main content, allowing clicks to pass through to main */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar} // Clicking the overlay also closes the sidebar
        ></div>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 overflow-auto bg-background transition-transform duration-300 ease-in-out relative z-40 min-h-screen", // Added relative, z-40, and min-h-screen
          isMobile && isSidebarOpen && "translate-x-64" // Push content right by sidebar width (w-64 = 256px)
        )}
        onClick={isMobile && isSidebarOpen ? toggleSidebar : undefined} // Tap anywhere on main to close sidebar
      >
        {children}
      </main>
    </div>
  );
};