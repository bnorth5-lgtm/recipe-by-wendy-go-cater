import { createRoot } from "react-dom/client";
import TestComponent from "./components/TestComponent"; // Import the new TestComponent
// import "./globals.css"; // Temporarily commented out to debug styling

console.log("main.tsx executing, attempting to render TestComponent"); // Debugging log

createRoot(document.getElementById("root")!).render(<TestComponent />);