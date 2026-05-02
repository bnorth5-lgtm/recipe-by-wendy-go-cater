/**
 * agentLogs.ts
 *
 * Fetches and unifies activity logs from the two NBS agents:
 *   Dash   — ingredient/display/market-rate events (BEO generation, market syncs)
 *   Albert — pricing engine events (price adjustments, competitor analysis)
 *
 * Data is pulled from:
 *   event_orders        → Dash log entries  (BEO creation / quote delivery)
 *   menu_price_history  → Albert log entries (price rule applications)
 *
 * The `is_admin` gate lives in the component layer (useSubscription.isExec).
 * This module is pure data — no auth checks.
 */

// ── Shared Supabase fetch ─────────────────────────────────────────────────────

function normalizeEnv(v: unknown) {
  return String(v ?? "").trim().replace(/^["']|["']$/g, "");
}

function sbBase(): string {
  const url = normalizeEnv(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/supabase`;
  }
  return url;
}

function sbHeaders(): HeadersInit {
  const anonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };
}

async function sbFetch(path: string): Promise<unknown[]> {
  const res = await fetch(`${sbBase()}${path}`, { headers: sbHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentName = "Dash" | "Albert";

export type AlbertFlag = "Opportunity" | "Cost Alert" | "No Change" | "Initial Price";

export type LogCategory =
  | "beo_generated"
  | "beo_saved"
  | "beo_signed"
  | "price_updated"
  | "price_analysed"
  | "market_sync"
  | "quote_delivered";

export interface AgentLogEntry {
  id: string;
  agent: AgentName;
  category: LogCategory;
  /** Short headline shown prominently */
  title: string;
  /** Optional one-line detail */
  detail: string | null;
  /** ISO timestamp string */
  timestamp: string;
  /**
   * Albert's DB-trigger classification. Only present on price_updated entries.
   * "Opportunity" = price decreased · "Cost Alert" = price increased
   */
  albertFlag?: AlbertFlag | null;
  /** Optional numeric value (revenue, price delta, guest count, etc.) */
  metric?: {
    label: string;
    value: string;
    positive?: boolean;
  };
}

// ── Relative time helper ──────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Dash logs (from event_orders) ────────────────────────────────────────────

interface OrderRow {
  id: string;
  beo_number: string;
  event_name: string;
  guest_count: number;
  venue_name: string | null;
  venue_zip: string | null;
  service_style: string;
  total: number;
  per_person_rate: number;
  cogs_total: number;
  status: string;
  recipe_names: string[];
  created_at: string;
}

async function fetchDashLogs(): Promise<AgentLogEntry[]> {
  const rows = await sbFetch(
    "/rest/v1/event_orders?select=id,beo_number,event_name,guest_count,venue_name,venue_zip,service_style,total,per_person_rate,cogs_total,status,recipe_names,created_at&order=created_at.desc&limit=50"
  ) as OrderRow[];

  return rows.map((r): AgentLogEntry => ({
    id: `dash-${r.id}`,
    agent: "Dash",
    category: "beo_generated",
    title: `BEO ${r.beo_number} — ${r.event_name || "Unnamed Event"}`,
    detail: [
      r.guest_count ? `${r.guest_count} guests` : null,
      r.venue_name ?? (r.venue_zip ? `ZIP ${r.venue_zip}` : null),
      r.service_style ? r.service_style.replace(/_/g, " ") : null,
    ]
      .filter(Boolean)
      .join(" · "),
    timestamp: r.created_at,
    metric: {
      label: "Total",
      value: `$${Number(r.total ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      positive: true,
    },
  }));
}

// ── Albert logs (from menu_price_history) ────────────────────────────────────

interface PriceHistRow {
  id: string;
  item_name: string;
  item_type: string;
  old_price: number | null;
  new_price: number;
  price_type: string;
  multiplier_used: number;
  competitor_avg: number | null;
  adjustment_reason: string;
  applied_by: string;
  applied_at: string;
  price_delta: number | null;
  albert_flag: string | null;
}

async function fetchAlbertLogs(): Promise<AgentLogEntry[]> {
  const rows = await sbFetch(
    "/rest/v1/menu_price_history?select=id,item_name,item_type,old_price,new_price,price_type,multiplier_used,competitor_avg,adjustment_reason,applied_by,applied_at,price_delta,albert_flag&order=applied_at.desc&limit=50"
  ) as PriceHistRow[];

  return rows.map((r): AgentLogEntry => {
    // Prefer the trigger-computed delta; fall back to app-level calculation
    const dbDelta = r.price_delta != null ? Number(r.price_delta) : null;
    const oldPrice = Number(r.old_price ?? 0);
    const newPrice = Number(r.new_price ?? 0);
    const delta = dbDelta ?? (oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0);
    const positive = newPrice >= oldPrice;

    const flag = r.albert_flag as AgentLogEntry["albertFlag"];

    return {
      id: `albert-${r.id}`,
      agent: "Albert",
      category: "price_updated",
      title: `Price updated — ${r.item_name}`,
      detail: [
        r.price_type,
        r.adjustment_reason ? `"${r.adjustment_reason}"` : null,
        r.applied_by ? `by ${r.applied_by}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      timestamp: r.applied_at,
      albertFlag: flag ?? null,
      metric: {
        label: delta !== 0 ? `${positive ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}%` : "No change",
        value: `$${newPrice.toFixed(2)}`,
        positive,
      },
    };
  });
}

// ── Market sync sentinel entries ──────────────────────────────────────────────
// These are generated from the competitor_pricing table's updated_at timestamps
// to give Dash "heartbeat" entries even when no BEOs have been created.

interface CompetitorRow {
  id: string;
  item_name: string;
  category: string;
  captured_at?: string;
  created_at?: string;
}

async function fetchMarketSyncLogs(): Promise<AgentLogEntry[]> {
  const rows = await sbFetch(
    "/rest/v1/competitor_pricing?select=id,item_name,category,captured_at,created_at&order=captured_at.desc&limit=5"
  ) as CompetitorRow[];

  if (rows.length === 0) return [];

  // Collapse into a single "market sync" sentinel entry
  const ts = rows[0].captured_at ?? rows[0].created_at ?? new Date().toISOString();
  return [
    {
      id: `dash-market-sync-${ts}`,
      agent: "Dash",
      category: "market_sync",
      title: "Market Rate Sync",
      detail: `${rows.length} ingredient rates refreshed from live distributor feeds`,
      timestamp: ts,
      metric: {
        label: "Rates live",
        value: `${rows.length}`,
        positive: true,
      },
    },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AgentLogResult {
  entries: AgentLogEntry[];
  dashCount: number;
  albertCount: number;
  lastSynced: string;
}

/**
 * Fetches all agent logs from Supabase, combines them into a single
 * chronological feed, and returns summary counts.
 */
export async function fetchAgentLogs(): Promise<AgentLogResult> {
  const [dashBEOs, albertPrices, marketSync] = await Promise.all([
    fetchDashLogs(),
    fetchAlbertLogs(),
    fetchMarketSyncLogs(),
  ]);

  const all = [...dashBEOs, ...marketSync, ...albertPrices].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    entries: all,
    dashCount: dashBEOs.length + marketSync.length,
    albertCount: albertPrices.length,
    lastSynced: new Date().toISOString(),
  };
}
