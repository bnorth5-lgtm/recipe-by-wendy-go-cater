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
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 overflow-auto bg-background",
          isMobile && !isSidebarOpen && "pl-[72px] pt-4" // Add left padding to clear hamburger, and some top padding
        )}
        onClick={isMobile && !isSidebarOpen ? toggleSidebar : undefined} // Tap anywhere to open sidebar on mobile when closed
      >
        {children}
      </main>
    </div>
  );
};