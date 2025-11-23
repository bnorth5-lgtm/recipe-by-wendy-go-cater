import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App"; // Import the App component
import "./globals.css";

console.log("main.tsx is executing!");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);