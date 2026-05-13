import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeEnv(v: unknown): string {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

const placeholders = new Set([
  "",
  "development",
  "placeholder-anon-key",
  "your_supabase_project_url_here",
  "your_supabase_anon_key_here",
]);

/** True when URL/key look like CI demo / unset — keeps local builds green without outbound calls. */
const urlPlaceholder =
  !supabaseUrl ||
  supabaseUrl.toLowerCase().includes("your_supabase") ||
  supabaseUrl.includes("placeholder-project");

const useMockChain =
  urlPlaceholder ||
  !supabaseAnonKey ||
  placeholders.has(supabaseAnonKey.toLowerCase()) ||
  supabaseAnonKey.toLowerCase().includes("your_supabase");

function createMockClient(): SupabaseClient {
  const mockChain = new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === "then") return (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
        if (prop === "subscribe" || prop === "unsubscribe" || prop === "removeChannel") return () => {};
        if (prop === "on") return () => mockChain;
        return () => mockChain;
      },
    },
  ) as unknown as SupabaseClient;

  return {
    from: () => mockChain as any,
    channel: () => mockChain as any,
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;
}

if (import.meta.env.PROD && useMockChain) {
  console.warn(
    "[DCE] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing or placeholder — Coordinate Lock inserts use mock Supabase.",
  );
} else if (import.meta.env.DEV && useMockChain) {
  console.info("[DCE] Supabase mock chain (set VITE_SUPABASE_* for live REST).");
}

/**
 * Harrison Coordinate Lock (`harrison_build_manifest`) + dashboard sync.
 * Production (Vercel): set **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** — the `VITE_` prefix is
 * required so Vite inlines them into the client bundle. Plain `SUPABASE_URL` is **not** used by this app.
 */
export const supabase: SupabaseClient = useMockChain
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfigured = !useMockChain;
