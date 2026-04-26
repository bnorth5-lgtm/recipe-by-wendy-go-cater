import type { Recipe } from "@/store/cateringStore";

function getCloudVaultConfig() {
  const provider = process.env.NEXT_PUBLIC_CLOUD_VAULT_PROVIDER ?? "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return {
    enabled: provider.toLowerCase() === "supabase" && Boolean(url) && Boolean(anonKey),
    provider,
    url,
    anonKey,
  };
}

export async function assertCloudVaultReady(): Promise<void> {
  const cfg = getCloudVaultConfig();
  if (!cfg.enabled) {
    throw new Error("Cloud Vault is disabled.");
  }

  const base = cfg.url.replace(/\/+$/, "");
  const endpoint = `${base}/rest/v1/recipes?select=name&limit=1`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("Cloud Vault offline (network).");
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
 * Inserts into Supabase `recipes` (text columns):
 * name, yield, prep_time, ingredients, instructions, source, comments.
 */
export async function upsertRecipeToCloudVault(recipe: Recipe): Promise<void> {
  const cfg = getCloudVaultConfig();
  if (!cfg.enabled) return;

  // Fast readiness check with human-friendly errors.
  await assertCloudVaultReady();

  const row: Record<string, string> = {
    name: recipe.name,
    ["yield"]: recipe.servings,
    prep_time: recipe.prepTime,
    ingredients: ingredientsToText(recipe),
    instructions: instructionsToText(recipe),
    source: recipe.source ?? "",
    comments: recipe.comments ?? "",
  };

  const base = cfg.url.replace(/\/+$/, "");
  const endpoint = `${base}/rest/v1/recipes`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([row]),
    });
  } catch {
    throw new Error("Cloud Vault offline (network).");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) throw new Error("Cloud Vault key rejected.");
    if (res.status === 404) throw new Error("Cloud Vault table missing (recipes).");
    throw new Error(`Cloud Vault save failed (${res.status}). ${text}`.trim());
  }
}
