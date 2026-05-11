"use client";

import React from "react";
import { PACKET_01_12_GOLD_DATA_URI } from "@/branding/packet-01-12-gold-data-uri";

export interface HeaderProps {
  totalGuests: number;
  /** Omit (null) when guest count is 0 — no placeholder margin % */
  headerProfitMarginPct: number | null;
  heroImageError: boolean;
  onHeroImageError: () => void;
}

/**
 * Dashboard hero strip + optional profit stat. Profit is hidden entirely when there
 * are no guests (avoids bogus small-% placeholders from cost-without-revenue).
 */
export function Header({
  totalGuests,
  headerProfitMarginPct,
  heroImageError,
  onHeroImageError,
}: HeaderProps) {
  const showProfitMargin = totalGuests > 0 && headerProfitMarginPct !== null;

  return (
    <header
      className="dashboard-hero-header -mx-6 border-b border-[#081924] bg-[#0a1628] px-6 py-6"
      style={{ backgroundColor: "#0a1628" }}
    >
      <div className="flex w-full items-center justify-center">
        <div className="flex w-full max-w-5xl flex-col items-center justify-center leading-none">
          {!heroImageError ? (
            <img
              src={PACKET_01_12_GOLD_DATA_URI}
              alt="Delicious Catering & Events by Wendy"
              className="mx-auto block h-auto max-h-64 w-auto max-w-full object-contain object-center select-none"
              fetchPriority="high"
              decoding="async"
              onError={onHeroImageError}
            />
          ) : (
            <p
              className="w-full max-w-md text-center font-serif text-xl font-bold uppercase leading-snug tracking-wide text-[#fbbf24] drop-shadow-sm sm:text-2xl"
              aria-live="polite"
            >
              {"DELICIOUS CATERING & EVENTS ~ BY WENDY"}
            </p>
          )}
          {showProfitMargin && (
            <div className="mt-6 w-full max-w-md mx-auto border-t border-[#fbbf24]/20 pt-5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {headerProfitMarginPct < 0 ? "Development Phase" : "Profit Margin"}
              </p>
              <p
                className="mt-2 font-serif text-3xl font-bold tracking-tight tabular-nums sm:text-4xl"
                style={{
                  color:
                    headerProfitMarginPct < 0
                      ? "#fbbf24"
                      : headerProfitMarginPct >= 70
                        ? "#34d399"
                        : "#e2e8f0",
                }}
              >
                {Math.abs(headerProfitMarginPct).toFixed(1)}%
              </p>
              {headerProfitMarginPct < 0 && (
                <p className="mt-2 text-xs text-slate-500 leading-snug">
                  Investment gap vs. baseline quote — trajectory tracking
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
