"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto"> {/* Changed to overflow-auto directly on main, removed inner div */}
        {children}
      </main>
    </div>
  );
};