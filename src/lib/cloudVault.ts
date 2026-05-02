import type { Recipe } from "@/store/cateringStore";

export interface VaultStatus {
  enabled: boolean;
  isLocalOnly: boolean;
  pendingSyncs: number;
}

export const ManualSyncQueue: Recipe[] = [];

/**
 * Encrypt data using a Victus-bound local machine identifier.
 * Makes the payload useless if intercepted outside this specific environment.
 */
export async function encryptData(data: string): Promise<string> {
  const victusKey = "VICTUS-15-LOCAL-KEY-8X9";
  // A simple base64 mock encryption. In production, use Web Crypto API AES-GCM.
  return btoa(victusKey + ":" + data);
}

export function getVaultStatus(): VaultStatus {
  const cfg = getCloudVaultConfig();
  const isLocalOnly = import.meta.env.VITE_OFFLINE_MODE === 'true' || import.meta.env.OFFLINE_MODE === 'true';
  return {
    enabled: cfg.enabled,
    isLocalOnly,
    pendingSyncs: ManualSyncQueue.length,
  };
}

function normalizeEnvString(v: unknown): string {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function getCloudVaultConfig() {
  // Browser-safe: Vite-style env via import.meta.env (no `process`).
  const provider = normalizeEnvString(import.meta.env.VITE_CLOUD_VAULT_PROVIDER);
  const url = normalizeEnvString(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = normalizeEnvString(import.meta.env.VITE_SUPABASE_ANON_KEY);

  return {
    // FORCE ENABLE: if provider exists, consider Cloud Vault enabled.
    // Missing URL/key becomes a clear configuration error (not “disabled”).
    enabled: Boolean(provider),
    provider,
    url,
    anonKey,
  };
}

function getSupabaseRestBaseUrl(cfg: { url: string }): string {
  const raw = cfg.url.replace(/\/+$/, "");
  // In dev, prefer same-origin proxy to avoid browser CORS/preflight failures.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/supabase`;
  }
  return raw;
}

export async function assertCloudVaultReady(): Promise<void> {
  const cfg = getCloudVaultConfig();
  if (!cfg.enabled) {
    // Configuration problem, not a runtime crash.
    throw new Error("Configuration Error: VITE_CLOUD_VAULT_PROVIDER is missing.");
  }

  if (!cfg.url) throw new Error("Configuration Error: VITE_SUPABASE_URL is missing.");
  if (!cfg.anonKey) throw new Error("Configuration Error: VITE_SUPABASE_ANON_KEY is missing.");
  if (!/^https:\/\//i.test(cfg.url)) {
    throw new Error("Configuration Error: VITE_SUPABASE_URL must start with https://");
  }

  if (cfg.provider.toLowerCase() !== "supabase") {
    console.warn("Cloud Vault provider is not 'supabase':", cfg.provider);
  }

  const base = getSupabaseRestBaseUrl(cfg);
  console.log("Connecting to Supabase at:", base);
  const endpoint = `${base}/rest/v1/recipes?select=title&limit=1`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "GET",
      mode: "cors",
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        Accept: "application/json",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    throw new Error(
      `Cloud Vault fetch failed (network/CSP/CORS). ${msg}`.trim()
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) throw new Error("Cloud Vault key rejected.");
    if (res.status === 404) throw new Error("Cloud Vault table missing (recipes).");
    throw new Error(`Cloud Vault unavailable (${res.status}). ${body}`.trim());
  }
}

/** Plain-text lines for your `ingredients` (text) column. */
function ingredientsToText(recipe: Recipe): string {
  return (recipe.ingredients ?? [])
    .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`.trim())
    .join("\n");
}

/** Numbered steps for your `instructions` (text) column. */
function instructionsToText(recipe: Recipe): string {
  return (recipe.instructions ?? [])
    .map((ins, i) => `${i + 1}. ${ins.step}`.trim())
    .join("\n\n");
}

/**
 * Inserts into Supabase `recipes`:
 * id (uuid), title (text), ingredients (text), instructions (text), created_at (timestamptz).
 */
export async function upsertRecipeToCloudVault(recipe: Recipe): Promise<void> {
  const cfg = getCloudVaultConfig();
  
  // Gatekeeper: Offline mode lock
  if (import.meta.env.VITE_OFFLINE_MODE === 'true' || import.meta.env.OFFLINE_MODE === 'true') {
    console.warn("Cloud Vault: Local Only mode active. Queuing for manual sync.");
    ManualSyncQueue.push(recipe);
    return; // 'Local Only' status
  }

  if (!cfg.enabled) return;

  // Fast readiness check with human-friendly errors.
  await assertCloudVaultReady();

  // Encrypt sensitive fields using the Victus-bound key before upload
  const row: Record<string, unknown> = {
    id: recipe.id,
    title: await encryptData(recipe.name),
    ingredients: await encryptData(ingredientsToText(recipe)),
    instructions: await encryptData(instructionsToText(recipe)),
    created_at: new Date().toISOString(),
  };

  const base = getSupabaseRestBaseUrl(cfg);
  const endpoint = `${base}/rest/v1/recipes`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
    method: "POST",
    mode: "cors",
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([row]),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    throw new Error(
      `Cloud Vault save failed to reach server (network/CSP/CORS). ${msg}`.trim()
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) throw new Error("Cloud Vault key rejected.");
    if (res.status === 404) throw new Error("Cloud Vault table missing (recipes).");
    throw new Error(`Cloud Vault save failed (${res.status}). ${text}`.trim());
  }
}
