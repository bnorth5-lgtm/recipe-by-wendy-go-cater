"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAgentRealtime } from "@/hooks/useAgentRealtime";
import { Menu, PanelLeftClose, PanelLeftOpen, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProvenanceBio } from "@/components/ProvenanceBio";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CrisisCommandMenu } from "@/components/CrisisCommandMenu";
import { saveToVault } from "@/logic/persistence";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

import { useEventContext } from "@/context/EventContext";

const APP_DOCUMENT_TITLE = "Delicious Catering & Events by Wendy";

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { eventState } = useEventContext();
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  // Watch for new kitchen notifications
  useEffect(() => {
    if (eventState.kitchenNotifications && eventState.kitchenNotifications.length > 0) {
      const latest = eventState.kitchenNotifications[eventState.kitchenNotifications.length - 1];
      // Only show if it's recent (within last 10 seconds) to avoid stale toasts on reload
      if (Date.now() - latest.timestamp < 10000) {
        toast(latest.message, {
          icon: '🛎️',
          style: {
            background: '#fbbf24',
            color: '#0f172a',
            fontWeight: 'bold',
            border: 'none',
            fontSize: '1.1rem'
          },
          duration: 10000,
        });
      }
    }
  }, [eventState.kitchenNotifications]);

  // Start the Realtime subscription once for the whole app lifetime.
  useAgentRealtime();

  useEffect(() => {
    document.title = APP_DOCUMENT_TITLE;
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLockAndSave = async () => {
    // Fire the toast instantly so the UI feels responsive
    toast.loading("Locking Masterpiece...", { id: "lock-save" });
    
    // Use requestAnimationFrame to yield to the browser's paint cycle
    // before doing the heavy JSON serialization
    requestAnimationFrame(async () => {
      try {
        const masterState = {
          timestamp: new Date().toISOString(),
          appVersion: "1.0.0",
          status: "LOCKED",
          // Add more global state here if needed
        };
        
        const success = await saveToVault(`MasterState_${Date.now()}.json`, masterState);
        
        if (success) {
          toast.success("Master state locked and saved to Vault!", { id: "lock-save" });
        } else {
          toast.error("Failed to save to Vault.", { id: "lock-save" });
        }
      } catch (error) {
        toast.error("Error saving to Vault.", { id: "lock-save" });
      }
    });
  };

  // Purge Service Worker to prevent caching issues
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <ProvenanceBio />
      
      <div className="pointer-events-none absolute right-3 top-3 z-[300] flex max-w-[min(100vw-1.5rem,28rem)] flex-nowrap items-center justify-end gap-2 sm:right-4 sm:top-4 sm:gap-3">
        <Button 
          className="pointer-events-auto shrink-0 bg-[#fbbf24] hover:bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.4)] gap-1.5 border border-amber-300 sm:gap-2"
          size="sm"
          onClick={() => {
            navigate('/venue-architect');
            setTimeout(() => {
              const canvas = document.getElementById('venue-map-canvas');
              if (canvas) {
                canvas.requestFullscreen().catch(err => {
                  console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
              }
            }, 500);
          }}
        >
          <Sparkles className="w-4 h-4" />
          Visionary Map
        </Button>
        <Button 
          onClick={handleLockAndSave}
          className="pointer-events-auto shrink-0 bg-slate-800 text-white hover:bg-slate-700 font-bold border border-slate-700 gap-1.5 sm:gap-2"
          size="sm"
        >
          <Lock className="w-4 h-4" />
          Lock & Save
        </Button>
        <span className="pointer-events-auto shrink-0">
          <CrisisCommandMenu />
        </span>
        <span className="pointer-events-auto shrink-0">
          <LanguageToggle />
        </span>
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

      {/* Desktop Floating Toggle Button (visible when sidebar is collapsed) */}
      {!isMobile && isSidebarCollapsed && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed top-4 left-4 z-[60] shadow-md bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-[#fbbf24] transition-colors"
          onClick={toggleSidebarCollapse}
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={toggleSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

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