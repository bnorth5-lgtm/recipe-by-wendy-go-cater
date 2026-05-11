/**
 * Competitor Pricing Engine — Delicious Catering & Events
 *
 * Connects to the Supabase `competitor_pricing`, `pricing_rules`, and
 * `menu_price_history` tables, applies the custom price multiplier to
 * calculate optimal per-serving prices, and records every adjustment to
 * the audit history.
 *
 * Pricing formula (per serving):
 *   costFloor        = baseCostPerServing / (1 - minMarginPct)
 *   marketTarget     = competitorAvg * competitorMultiplier
 *   suggestedPrice   = max(costFloor, marketTarget)
 *                      capped at competitorAvg * maxPremiumPct
 *
 * If no competitor match is found the formula falls back to costFloor.
 */

import type { Recipe } from "@/store/cateringStore";

// ── Supabase config ──────────────────────────────────────────────────────────

function normalizeEnv(v: unknown): string {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function getSupabaseCfg() {
  const url = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const base = (() => {
    const raw = url.replace(/\/+$/, "");
    if (import.meta.env.DEV && typeof window !== "undefined") {
      return `${window.location.origin}/supabase`;
    }
    return raw;
  })();
  return { url, anonKey, base, enabled: Boolean(url && anonKey) };
}

async function sbFetch(path: string, init?: RequestInit): Promise<Response> {
  const cfg = getSupabaseCfg();
  if (!cfg.enabled) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
  const res = await fetch(`${cfg.base}${path}`, {
    mode: "cors",
    ...init,
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompetitorPrice {
  id: string;
  item_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  competitor_name: string | null;
  source_url: string | null;
  region: string;
  captured_at: string;
  is_active: boolean;
  notes: string | null;
}

export interface PricingRules {
  /** Ratio of Wendy's price to competitor average. 1.15 = 15 % premium. */
  competitor_multiplier: number;
  /** Minimum gross margin. 0.30 = 30 %. */
  min_margin_pct: number;
  /** Maximum price as a multiple of competitor average. 2.0 = 2× comp avg. */
  max_premium_pct: number;
}

export const DEFAULT_PRICING_RULES: PricingRules = {
  competitor_multiplier: 1.15,
  min_margin_pct: 0.3,
  max_premium_pct: 2.0,
};

/** Result of running the pricing formula on one recipe. */
export interface PriceAnalysis {
  itemId: string;
  itemName: string;
  itemType: "recipe";
  currentPricePerServing: number;
  baseCost: number;
  servings: number;
  competitorAvg: number | null;
  competitorMin: number | null;
  competitorMax: number | null;
  competitorSampleSize: number;
  matchedCompetitorLabel: string | null;
  suggestedPricePerServing: number;
  delta: number;          // suggested − current
  deltaPercent: number;   // relative change %
  multiplierUsed: number;
}

/** Row written to `menu_price_history` in Supabase. */
export type AlbertFlag =
  | "Opportunity"
  | "Cost Alert"
  | "No Change"
  | "Initial Price";

export interface PriceHistoryEntry {
  id?: string;
  item_id: string;
  item_name: string;
  item_type: string;
  old_price: number | null;
  new_price: number;
  price_type: string;
  multiplier_used: number;
  competitor_avg: number | null;
  adjustment_reason: string;
  applied_by: string;
  applied_at?: string;
  /** Percentage change from the previous price (set by DB trigger). NULL on initial pricing. */
  price_delta: number | null;
  /** Albert's classification of this price movement (set by DB trigger). */
  albert_flag: AlbertFlag | null;
}

// ── Remote data ───────────────────────────────────────────────────────────────

/** Fetch all active competitor prices from Supabase. */
export async function fetchCompetitorPricing(): Promise<CompetitorPrice[]> {
  const res = await sbFetch(
    "/rest/v1/competitor_pricing?is_active=eq.true&order=item_name.asc,competitor_name.asc"
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Could not load competitor pricing (${res.status}). ${body}`.trim()
    );
  }
  const rows = await res.json();
  // Coerce price to number (PostgREST returns NUMERIC as string sometimes)
  return (rows as CompetitorPrice[]).map((r) => ({
    ...r,
    price_per_unit: Number(r.price_per_unit),
  }));
}

/** Fetch the active pricing rule from Supabase, falling back to defaults. */
export async function fetchPricingRules(): Promise<PricingRules> {
  try {
    const res = await sbFetch(
      "/rest/v1/pricing_rules?is_active=eq.true&order=created_at.desc&limit=1"
    );
    if (!res.ok) return DEFAULT_PRICING_RULES;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return DEFAULT_PRICING_RULES;
    const r = rows[0];
    return {
      competitor_multiplier: Number(r.competitor_multiplier ?? 1.15),
      min_margin_pct: Number(r.min_margin_pct ?? 0.3),
      max_premium_pct: Number(r.max_premium_pct ?? 2.0),
    };
  } catch {
    return DEFAULT_PRICING_RULES;
  }
}

/** Write a batch of price adjustments to `menu_price_history`. */
export async function logPriceAdjustments(
  entries: Omit<PriceHistoryEntry, "id" | "applied_at">[]
): Promise<void> {
  if (!entries.length) return;
  const rows = entries.map((e) => ({
    ...e,
    applied_at: new Date().toISOString(),
  }));
  const res = await sbFetch("/rest/v1/menu_price_history", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to log price adjustments (${res.status}). ${body}`.trim()
    );
  }
}

/** Fetch price history, optionally filtered to one item. */
export async function fetchPriceHistory(
  itemId?: string
): Promise<PriceHistoryEntry[]> {
  const filter = itemId
    ? `?item_id=eq.${encodeURIComponent(itemId)}&order=applied_at.desc&limit=300`
    : "?order=applied_at.desc&limit=300";
  try {
    const res = await sbFetch(`/rest/v1/menu_price_history${filter}`);
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows as PriceHistoryEntry[]).map((r) => ({
      ...r,
      old_price: r.old_price != null ? Number(r.old_price) : null,
      new_price: Number(r.new_price),
      multiplier_used: Number(r.multiplier_used),
      competitor_avg: r.competitor_avg != null ? Number(r.competitor_avg) : null,
      price_delta: r.price_delta != null ? Number(r.price_delta) : null,
      albert_flag: (r.albert_flag ?? null) as PriceHistoryEntry["albert_flag"],
    }));
  } catch {
    return [];
  }
}

// ── Pure pricing logic ────────────────────────────────────────────────────────

/**
 * Finds competitor rows that best match a recipe by name.
 * Priority: exact item_name match → any word overlap (words > 3 chars).
 */
export function matchCompetitorRows(
  itemName: string,
  competitorData: CompetitorPrice[]
): CompetitorPrice[] {
  const needle = itemName.toLowerCase();

  const exact = competitorData.filter(
    (c) => c.item_name.toLowerCase() === needle
  );
  if (exact.length) return exact;

  const words = needle.split(/\s+/).filter((w) => w.length > 3);
  return competitorData.filter((c) => {
    const h = c.item_name.toLowerCase();
    return words.some((w) => h.includes(w) || needle.includes(c.item_name.toLowerCase()));
  });
}

/**
 * Core pricing formula.
 *
 * suggestedPrice = clamp(
 *   max(costFloor, marketTarget),
 *   -Infinity,
 *   cap
 * )
 * where:
 *   costFloor    = baseCostPerServing / (1 − minMarginPct)
 *   marketTarget = competitorAvg × competitorMultiplier
 *   cap          = competitorAvg × maxPremiumPct
 */
export function calculateOptimalPrice(opts: {
  baseCostPerServing: number;
  competitorAvg: number | null;
  rules: PricingRules;
}): number {
  const { baseCostPerServing, competitorAvg, rules } = opts;
  const safeMargin = Math.min(Math.max(rules.min_margin_pct, 0), 0.99);
  const costFloor = baseCostPerServing / (1 - safeMargin);

  if (!competitorAvg || competitorAvg <= 0) return round2(costFloor);

  const marketTarget = competitorAvg * rules.competitor_multiplier;
  const cap = competitorAvg * rules.max_premium_pct;

  return round2(Math.min(Math.max(costFloor, marketTarget), cap));
}

/**
 * Runs the pricing formula over every recipe in the list and returns a
 * `PriceAnalysis` row for each.
 *
 * @param recipes           All recipes from the store
 * @param competitorData    Rows fetched from `competitor_pricing`
 * @param rules             Active `PricingRules` (from Supabase or defaults)
 * @param currentOverrides  Existing price overrides keyed by recipe.id
 */
export function analyzeRecipePrices(
  recipes: Recipe[],
  competitorData: CompetitorPrice[],
  rules: PricingRules,
  currentOverrides: Record<string, number> = {}
): PriceAnalysis[] {
  return recipes.map((recipe) => {
    const servings = parseServings(recipe.servings) ?? 1;
    const baseCostPerServing = servings > 0 ? recipe.baseCost / servings : recipe.baseCost;

    // Current effective price: override → costPerServing → cost + 20 % markup
    const currentPricePerServing =
      currentOverrides[recipe.id] ??
      recipe.costPerServing ??
      round2(baseCostPerServing * 1.2);

    const matched = matchCompetitorRows(recipe.name, competitorData);
    const prices = matched.map((c) => c.price_per_unit).filter((p) => p > 0);

    const competitorAvg =
      prices.length > 0
        ? round2(prices.reduce((s, p) => s + p, 0) / prices.length)
        : null;
    const competitorMin = prices.length > 0 ? Math.min(...prices) : null;
    const competitorMax = prices.length > 0 ? Math.max(...prices) : null;

    const suggestedPricePerServing = calculateOptimalPrice({
      baseCostPerServing,
      competitorAvg,
      rules,
    });

    const delta = round2(suggestedPricePerServing - currentPricePerServing);
    const deltaPercent =
      currentPricePerServing > 0
        ? round2((delta / currentPricePerServing) * 100)
        : 0;

    return {
      itemId: recipe.id,
      itemName: recipe.name,
      itemType: "recipe",
      currentPricePerServing: round2(currentPricePerServing),
      baseCost: recipe.baseCost,
      servings,
      competitorAvg,
      competitorMin,
      competitorMax,
      competitorSampleSize: matched.length,
      matchedCompetitorLabel: matched.length > 0 ? matched[0].item_name : null,
      suggestedPricePerServing,
      delta,
      deltaPercent,
      multiplierUsed: rules.competitor_multiplier,
    };
  });
}

// ── Ingredient-level market rate matching ─────────────────────────────────────

/**
 * Finds the single best `CompetitorPrice` match for one recipe ingredient name.
 *
 * Priority order (returns the first hit):
 *   1. Exact name match within `ingredient_rate` category rows
 *   2. Ingredient name contains the competitor item_name (substring, length > 3)
 *   3. Competitor item_name contains the ingredient name (substring, length > 3)
 *   4. Any significant word (> 3 chars) overlap within `ingredient_rate` rows
 *   5. Same word overlap but across ALL categories (fallback to per_person dishes)
 *
 * Returns the row with the highest `price_per_unit` when multiple rows tie at
 * the same priority level — this surfaces the premium market signal rather than
 * the economy floor.
 */
export function matchIngredientMarketRate(
  ingredientName: string,
  competitorData: CompetitorPrice[]
): CompetitorPrice | null {
  if (!ingredientName || !competitorData.length) return null;

  const needle = ingredientName.toLowerCase().trim();

  // Prefer ingredient_rate rows; fall back to all rows if none exist
  const ingredientRates = competitorData.filter(
    (c) => c.category === "ingredient_rate"
  );
  const pool = ingredientRates.length > 0 ? ingredientRates : competitorData;

  // 1. Exact match (case-insensitive)
  const exact = pool.filter((c) => c.item_name.toLowerCase() === needle);
  if (exact.length) return highestPrice(exact);

  // 2. Ingredient name contains the competitor item_name
  //    e.g. "fresh lobster tail" contains "lobster tail"
  const contained = pool.filter(
    (c) => c.item_name.length > 3 && needle.includes(c.item_name.toLowerCase())
  );
  if (contained.length) return highestPrice(contained);

  // 3. Competitor item_name contains the ingredient name
  //    e.g. "beef tenderloin whole" contains "beef tenderloin"
  if (needle.length > 3) {
    const reverse = pool.filter((c) =>
      c.item_name.toLowerCase().includes(needle)
    );
    if (reverse.length) return highestPrice(reverse);
  }

  // 4. Significant-word overlap (words > 3 chars)
  const words = needle.split(/\s+/).filter((w) => w.length > 3);
  if (words.length) {
    const wordMatch = pool.filter((c) => {
      const h = c.item_name.toLowerCase();
      return words.some((w) => h.includes(w));
    });
    if (wordMatch.length) return highestPrice(wordMatch);
  }

  // 5. If pool was restricted to ingredient_rate, try full dataset
  if (pool !== competitorData && words.length) {
    const fallback = competitorData.filter((c) => {
      const h = c.item_name.toLowerCase();
      return words.some((w) => h.includes(w));
    });
    if (fallback.length) return highestPrice(fallback);
  }

  return null;
}

/** Returns the CompetitorPrice with the highest price_per_unit from a set. */
function highestPrice(rows: CompetitorPrice[]): CompetitorPrice {
  return rows.reduce((best, r) =>
    r.price_per_unit > best.price_per_unit ? r : best
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseServings(q: import("@/store/cateringStore").Quantity | undefined): number | null {
  if (!q) return null;
  return Number.isFinite(q.value) && q.value > 0 ? q.value : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
