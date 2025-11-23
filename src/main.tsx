import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

console.log("main.tsx executing"); // Debugging log

createRoot(document.getElementById("root")!).render(<App />);