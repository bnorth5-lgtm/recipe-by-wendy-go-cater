import { createRoot } from "react-dom/client";
import App from "./App"; // Import the main App component
import "./globals.css"; // Re-enable global styles

console.log("main.tsx executing, attempting to render App"); // Debugging log

createRoot(document.getElementById("root")!).render(<App />);