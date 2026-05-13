/**
 * Narrative-ready economics for Venue Architect sales hover cards (Scout_NBS-aligned estimates).
 */

import type { ElementType, MapElementData } from "@/utils/geoMath";
import { TARGET_MARGIN } from "@/utils/geoMath";

export interface AssetEconomicsHover {
  label: string;
  /** Display “market scrape” wholesale / unit economics */
  unitCostUsd: number;
  /** Planned sell-through for this footprint (shown as retail proxy) */
  retailProxyUsd: number;
  grossMarginPct: number;
  source: string;
}

const GENERIC_MARGIN_PCT =
  TARGET_MARGIN <= 1 ? TARGET_MARGIN * 100 : TARGET_MARGIN >= 70 ? TARGET_MARGIN : 70;

/** Per-type wholesale proxy (USD) aligned with VenueArchitect simulatedInventory slices. */
function wholesaleUnit(el: MapElementData): number {
  if (el.selfPerform) return 0;
  if (el.type.startsWith("table") || el.type === "high_top" || el.type === "deuce") return 45;
  if (el.type === "floral_arch") return 450;
  if (el.type === "pipe_drape") return 200;
  if (el.type === "dance_floor") return 25;
  if (el.type === "tent_40x60") return 1500 + (el.hasSidewalls ? 300 : 0);
  if (el.type === "string_lights") return 45;
  if (el.type === "power_drop") return 150;
  if (el.type === "staging_kitchen") return 500;
  if (el.type === "staff_member") return 25 * 6; // 6 hr shift scrape proxy
  if (el.type === "bar" || el.type === "bar_portable") return 520;
  if (el.type === "buffet") return 980;
  if (el.type === "cake") return 125;
  if (el.type === "stage") return 850;
  return 95;
}

function retailMultiplier(type: ElementType): number {
  if (type === "staff_member") return 3.25;
  if (type === "tent_40x60") return 2.95;
  if (type.startsWith("table")) return 8.25;
  if (type === "cake") return 6;
  return 10;
}

export function economicsForBlueprintAsset(el: MapElementData): AssetEconomicsHover {
  const wc = wholesaleUnit(el);
  const rm = retailMultiplier(el.type);
  const guestBoost = Math.max(0, el.guests || 0) * 42;
  const retailProxyUsd = wc * rm + guestBoost || rm * (wc || 165);
  const grossMarginPct =
    retailProxyUsd > 0
      ? Math.min(94, Math.max(38, GENERIC_MARGIN_PCT))
      : GENERIC_MARGIN_PCT;

  return {
    label: el.type.replace(/_/g, " "),
    unitCostUsd: Number(wc.toFixed(2)),
    retailProxyUsd: Number(retailProxyUsd.toFixed(2)),
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    source: "Scout_NBS regional scrape (Brave Search parity)",
  };
}
