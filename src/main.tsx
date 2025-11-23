import { createRoot } from "react-dom/client";
import TestComponent from "./components/TestComponent"; // Import the new TestComponent
import "./globals.css";

console.log("main.tsx executing, attempting to render TestComponent"); // Debugging log

createRoot(document.getElementById("root")!).render(<TestComponent />);