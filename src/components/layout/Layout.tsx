"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAgentRealtime } from "@/hooks/useAgentRealtime";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProvenanceBio } from "@/components/ProvenanceBio";
import { LanguageToggle } from "@/components/LanguageToggle";

interface LayoutProps {
  children: React.ReactNode;
}

const APP_DOCUMENT_TITLE = "Delicious Catering & Events by Wendy";

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Start the Realtime subscription once for the whole app lifetime.
  useAgentRealtime();

  useEffect(() => {
    document.title = APP_DOCUMENT_TITLE;
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div key={Date.now()} className="flex min-h-screen bg-background text-foreground max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <ProvenanceBio />
      
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

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

      {/* Click-to-close overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-45"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "overflow-auto bg-background transition-transform duration-300 ease-in-out relative z-40 min-h-screen",
          // Desktop: flex-1 to take remaining space
          !isMobile && "flex-1",
          // Mobile: full screen, extra bottom padding for the tab bar.
          // pb-32 (128 px) clears the nav bar height + safe-area inset on
          // tall-screen devices like the Samsung S25 Ultra.
          isMobile && "fixed inset-0 w-full pb-32",
          isMobile && isSidebarOpen && "translate-x-64"
        )}
      >
        {children}
      </main>

      {/* Bottom tab navigation — mobile only */}
      <BottomNav />
    </div>
  );
};