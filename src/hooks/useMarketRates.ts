/**
 * useMarketRates — shared hook for live ingredient market rate lookups.
 *
 * All agents (Recipes page, PricingEngine, BEO) that call this hook share the
 * same module-level fetch promise so Supabase is hit only once per tab session.
 *
 * Usage:
 *   const { getIngredientRate, loading } = useMarketRates();
 *   const rate = getIngredientRate("Lobster Tail");
 *   // rate is CompetitorPrice | null
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchCompetitorPricing,
  matchIngredientMarketRate,
  type CompetitorPrice,
} from "@/lib/competitorPricing";

// ── Module-level cache — shared across all hook instances in the tab ───────────

let _cache: CompetitorPrice[] | null = null;
let _inflight: Promise<CompetitorPrice[]> | null = null;
const _listeners: Array<(data: CompetitorPrice[]) => void> = [];

function requestData(): Promise<CompetitorPrice[]> {
  if (_cache) return Promise.resolve(_cache);

  if (!_inflight) {
    _inflight = fetchCompetitorPricing()
      .then((rows) => {
        _cache = rows;
        // Notify all waiting hook instances
        _listeners.forEach((fn) => fn(rows));
        _listeners.length = 0;
        return rows;
      })
      .catch((err) => {
        _inflight = null; // allow retry on next mount
        throw err;
      });
  }

  return _inflight;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface MarketRatesState {
  /** All active competitor pricing rows (ingredient_rate + per_person). */
  data: CompetitorPrice[];
  /** True while the first fetch is in flight. */
  loading: boolean;
  /** Error message if the fetch failed; null otherwise. */
  error: string | null;
  /**
   * Returns the best market-rate row for a given ingredient name, or null
   * when no match is found.  Matches ingredient_rate category rows first,
   * then falls back to per-person dish entries.
   */
  getIngredientRate: (ingredientName: string) => CompetitorPrice | null;
}

export function useMarketRates(): MarketRatesState {
  const [data, setData] = useState<CompetitorPrice[]>(_cache ?? []);
  const [loading, setLoading] = useState<boolean>(_cache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache) {
      setData(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;

    requestData()
      .then((rows) => {
        if (!cancelled) {
          setData(rows);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load market rates");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getIngredientRate = useCallback(
    (ingredientName: string): CompetitorPrice | null =>
      matchIngredientMarketRate(ingredientName, data),
    [data]
  );

  return { data, loading, error, getIngredientRate };
}
