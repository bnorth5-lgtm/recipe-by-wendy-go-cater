"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-blue-200 text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-green-200">
        <div className="flex-1 overflow-y-auto p-6 bg-yellow-100">
          {children}
        </div>
      </main>
    </div>
  );
};