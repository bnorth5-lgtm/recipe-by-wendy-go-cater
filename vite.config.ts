import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command }) => ({
  base: '/', // Always use absolute path for Vercel deployments
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['lucide-react'], // Explicitly include lucide-react for pre-bundling
  },
}));