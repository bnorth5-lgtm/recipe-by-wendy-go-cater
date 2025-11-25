"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background text-foreground"> {/* Changed min-h-screen to h-screen */}
      <Sidebar />
      <main className="flex-1 overflow-auto bg-blue-200">
        {children}
      </main>
    </div>
  );
};