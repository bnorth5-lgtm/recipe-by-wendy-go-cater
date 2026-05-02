/**
 * LiveMarketBadge — displays a live market rate for a single ingredient.
 *
 * Reads from the `competitor_pricing` Supabase table via `useMarketRates`.
 * Premium ingredients (lobster, wagyu, truffle, etc.) render in amber;
 * standard market rates render in green.
 *
 * Usage — pass the CompetitorPrice row returned by getIngredientRate():
 *   const { getIngredientRate } = useMarketRates();
 *   const rate = getIngredientRate(ing.name);
 *   {rate && <LiveMarketBadge rate={rate} />}
 */

import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CompetitorPrice } from "@/lib/competitorPricing";

// Ingredient keywords that warrant the "premium" amber color treatment
const PREMIUM_KEYWORDS = [
  "lobster",
  "crab",
  "truffle",
  "wagyu",
  "kobe",
  "filet",
  "tenderloin",
  "foie",
  "caviar",
  "saffron",
  "scallop",
  "prosciutto",
  "wagyu",
  "venison",
  "bison",
  "veal",
  "morel",
  "chanterelle",
  "porcini",
  "microgreen",
  "burrata",
  "halibut",
  "swordfish",
  "branzino",
];

function isPremium(itemName: string): boolean {
  const lower = itemName.toLowerCase();
  return PREMIUM_KEYWORDS.some((kw) => lower.includes(kw));
}

function formatPrice(price: number, unit: string): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${fmt}/${unit}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface LiveMarketBadgeProps {
  rate: CompetitorPrice;
  className?: string;
}

export function LiveMarketBadge({ rate, className }: LiveMarketBadgeProps) {
  const premium = isPremium(rate.item_name);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 cursor-help select-none inline-flex items-center gap-1",
              "text-[10px] font-semibold px-1.5 py-0.5 border",
              premium
                ? [
                    "bg-amber-50 text-amber-700 border-amber-300",
                    "dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700",
                  ]
                : [
                    "bg-emerald-50 text-emerald-700 border-emerald-300",
                    "dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700",
                  ],
              className
            )}
          >
            <Zap
              className={cn(
                "h-2.5 w-2.5 shrink-0",
                premium ? "fill-amber-500 text-amber-500" : "fill-emerald-500 text-emerald-500"
              )}
            />
            {formatPrice(rate.price_per_unit, rate.unit)}
          </Badge>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="p-3 max-w-[240px] space-y-1.5 text-left"
        >
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <Zap className="h-3 w-3 text-primary shrink-0" />
            Live Market Rate
          </div>

          <p className="text-xs font-medium">{rate.item_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(rate.price_per_unit, rate.unit)}
          </p>

          {rate.competitor_name && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Source:</span>{" "}
              {rate.competitor_name}
            </p>
          )}

          {rate.region && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Region:</span>{" "}
              {rate.region}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Captured:</span>{" "}
            {formatDate(rate.captured_at)}
          </p>

          {rate.notes && (
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-1.5 mt-1">
              {rate.notes}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
