"use client";

import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  console.log("Layout component rendering"); // Debugging log for Layout render
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Temporarily not rendering children to isolate the issue */}
          <h2 className="text-2xl font-bold text-center mt-8">
            Layout and Sidebar are rendering!
          </h2>
          {/* {children} */} {/* Commented out children */}
        </div>
      </main>
    </div>
  );
};