// Subscription tier definitions for Delicious Catering & Events
// Basic → Professional → Enterprise feature ladder

export type SubscriptionTier = "basic" | "professional" | "enterprise";

export type TierFeature =
  | "menu_browse"           // View menus, dish library & search — everyone
  | "recipe_search"         // Full search & filter — everyone
  | "price_scraping"        // URL JSON-LD scrape, OCR import, local market price pull
  | "local_market_pricing"  // Ingredient cost comparisons from local sources
  | "agent_tools"           // NBS AI agent / LLM tools (Ollama, chat widget)
  | "market_pricing"        // Broad market pricing analysis across regions
  | "educational_bank";     // Educational Bank content & curriculum

export interface TierDefinition {
  id: SubscriptionTier;
  label: string;
  tagline: string;
  description: string;
  badge: string;
  features: TierFeature[];
}

// Inclusive feature sets — each higher tier includes all lower features
const TIER_FEATURE_MAP: Record<SubscriptionTier, ReadonlySet<TierFeature>> = {
  basic: new Set<TierFeature>([
    "menu_browse",
    "recipe_search",
  ]),
  professional: new Set<TierFeature>([
    "menu_browse",
    "recipe_search",
    "price_scraping",
    "local_market_pricing",
  ]),
  enterprise: new Set<TierFeature>([
    "menu_browse",
    "recipe_search",
    "price_scraping",
    "local_market_pricing",
    "agent_tools",
    "market_pricing",
    "educational_bank",
  ]),
};

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    id: "basic",
    label: "Basic",
    tagline: "Browse & Explore",
    description:
      "Read-only access to all menus and dish library. Perfect for clients and staff who need to browse offerings.",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    features: ["menu_browse", "recipe_search"],
  },
  {
    id: "professional",
    label: "Professional",
    tagline: "Price Intelligence",
    description:
      "Everything in Basic plus URL/OCR dish import and local market ingredient price lookups.",
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    features: [
      "menu_browse",
      "recipe_search",
      "price_scraping",
      "local_market_pricing",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    tagline: "Full Agent Suite",
    description:
      "All Professional features plus AI agent tools, broad market pricing analysis, and the Educational Bank.",
    badge: "bg-amber-100 text-amber-700 border-amber-300",
    features: [
      "menu_browse",
      "recipe_search",
      "price_scraping",
      "local_market_pricing",
      "agent_tools",
      "market_pricing",
      "educational_bank",
    ],
  },
];

export const ALL_FEATURES: TierFeature[] = [
  "menu_browse",
  "recipe_search",
  "price_scraping",
  "local_market_pricing",
  "agent_tools",
  "market_pricing",
  "educational_bank",
];

export const FEATURE_LABELS: Record<TierFeature, string> = {
  menu_browse: "Browse menus & dish library",
  recipe_search: "Menu search & filtering",
  price_scraping: "Dish import (URL, OCR, paste) & local price scraping",
  local_market_pricing: "Local market ingredient price comparisons",
  agent_tools: "AI agent tools (NBS chat, local LLM)",
  market_pricing: "Broad market pricing analysis",
  educational_bank: "Educational Bank",
};

export const FEATURE_DESCRIPTIONS: Record<TierFeature, string> = {
  menu_browse: "View all menus, dishes, and ingredient lists.",
  recipe_search: "Full-text fuzzy search across all dishes and categories.",
  price_scraping:
    "Import dishes from URLs (JSON-LD), PDF/image OCR, and magic paste — with local market price scraping.",
  local_market_pricing:
    "Compare ingredient costs against local supplier price feeds.",
  agent_tools:
    "NBS AI chat assistant, local Ollama LLM for menu parsing and Q&A.",
  market_pricing:
    "Aggregate market pricing analysis across regional suppliers and platforms.",
  educational_bank:
    "Access the Educational Bank: culinary training, cost-control modules, and catering best practices.",
};

/** Returns true if the given tier includes access to a feature. */
export function hasFeature(tier: SubscriptionTier, feature: TierFeature): boolean {
  return TIER_FEATURE_MAP[tier].has(feature);
}

/** Returns the minimum tier required to access a feature. */
export function requiredTierFor(feature: TierFeature): SubscriptionTier {
  if (TIER_FEATURE_MAP.basic.has(feature)) return "basic";
  if (TIER_FEATURE_MAP.professional.has(feature)) return "professional";
  return "enterprise";
}

/** Returns the label for a tier. */
export function tierLabel(tier: SubscriptionTier): string {
  return TIER_DEFINITIONS.find((d) => d.id === tier)?.label ?? tier;
}
