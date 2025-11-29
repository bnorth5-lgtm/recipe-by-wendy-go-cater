"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile"; // Import the useIsMobile hook
import { Menu } from "lucide-react"; // Import Menu icon for hamburger button
import { Button } from "@/components/ui/button"; // Import Button component

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
      {/* Mobile Hamburger Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] lg:hidden" // Higher z-index than sidebar
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
      <main className="flex-1 overflow-auto bg-background"> {/* Removed p-4 lg:p-0 */}
        {children}
      </main>
    </div>
  );
};