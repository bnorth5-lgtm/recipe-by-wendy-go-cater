import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command }) => ({
  base: '/', // Always use absolute path for Vercel deployments
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy:
      command === "serve"
        ? {
            // Same-origin dev proxy to Supabase REST. Avoids browser CORS/preflight "Failed to fetch".
            "/supabase": {
              target: "https://apikvfhdiwgjtueeblxl.supabase.co",
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p.replace(/^\/supabase/, ""),
            },
          }
        : undefined,
    ...(command === "serve"
      ? {
          headers: {
            // Ensure browser CSP allows Supabase during local development.
            // (Headers take precedence over meta CSP if both are present.)
            "Content-Security-Policy":
              "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; connect-src 'self' https://apikvfhdiwgjtueeblxl.supabase.co wss://apikvfhdiwgjtueeblxl.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://googletagmanager.com https://www.googletagmanager.com http://127.0.0.1:18789 http://localhost:18789;",
          },
        }
      : {}),
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