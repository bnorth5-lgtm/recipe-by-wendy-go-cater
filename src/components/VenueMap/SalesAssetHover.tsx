import React from "react";
import type { MapElementData } from "@/utils/geoMath";
import { economicsForBlueprintAsset } from "@/logic/salesLayerPricing";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Wraps draggable motion nodes with Prospect Mode economics overlays. */
export function SalesAssetEconomicsHover({
  salesMode,
  el,
  children,
}: {
  salesMode: boolean;
  el: MapElementData;
  children: React.ReactElement;
}) {
  if (!salesMode) return children;

  const e = economicsForBlueprintAsset(el);
  const marginColor =
    e.grossMarginPct >= 68 ? "text-emerald-300" : e.grossMarginPct >= 55 ? "text-amber-300" : "text-rose-300";

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn(
          "z-[80] max-w-[min(100vw,17rem)] border border-amber-500/40 bg-slate-950/97 px-3 py-3 text-xs",
          "shadow-[0_20px_55px_rgba(0,0,0,0.55)]",
        )}
      >
        <p className="font-serif font-bold text-[#fbbf24] text-[11px] uppercase tracking-[0.2em]">
          {el.type.replace(/_/g, " ")}
        </p>
        <div className="mt-2 space-y-1 text-slate-200">
          <div className="flex justify-between gap-3 tabular-nums">
            <span className="text-slate-500">Scouted cost</span>
            <span className="font-mono">${e.unitCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between gap-3 tabular-nums border-t border-slate-800 pt-1">
            <span className="text-slate-500">Retail story</span>
            <span className="font-mono text-white">${e.retailProxyUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between gap-3 tabular-nums pt-1">
            <span className="text-slate-500">Target margin</span>
            <span className={cn("font-black", marginColor)}>{e.grossMarginPct}%</span>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500 leading-snug border-t border-slate-800/80 pt-2">{e.source}</p>
      </TooltipContent>
    </Tooltip>
  );
}
