import { createRoot } from "react-dom/client";
import React from "react"; // Import React for JSX
import "./globals.css";

console.log("main.tsx is executing!"); // Check if this log appears in your browser's console

const TestRootComponent = () => (
  <div className="bg-red-500 text-white p-8 text-center text-3xl font-bold min-h-screen flex items-center justify-center">
    MAIN.TSX IS RENDERING THIS!
  </div>
);

createRoot(document.getElementById("root")!).render(<TestRootComponent />);