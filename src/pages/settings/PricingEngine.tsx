"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Check,
  AlertCircle,
  History,
  Building2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCateringStore, type MenuPriceOverride } from "@/store/cateringStore";
import {
  type CompetitorPrice,
  type PriceAnalysis,
  type PriceHistoryEntry,
  type PricingRules,
  DEFAULT_PRICING_RULES,
  fetchCompetitorPricing,
  fetchPricingRules,
  fetchPriceHistory,
  logPriceAdjustments,
  analyzeRecipePrices,
} from "@/lib/competitorPricing";
import { TierGate } from "@/components/TierGate";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, prefix = "$"): string {
  if (n == null) return "—";
  return `${prefix}${Number(n).toFixed(2)}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} %`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PricingEngine = () => {
  const recipes = useCateringStore((s) => s.recipes);
  const currentUser = useCateringStore((s) => s.currentUser);
  const competitorPriceMultiplier = useCateringStore(
    (s) => s.competitorPriceMultiplier
  );
  const menuPriceOverrides = useCateringStore((s) => s.menuPriceOverrides);
  const setCompetitorPriceMultiplier = useCateringStore(
    (s) => s.setCompetitorPriceMultiplier
  );
  const setMenuPriceOverrides = useCateringStore(
    (s) => s.setMenuPriceOverrides
  );

  // ── Remote data ──
  const [competitorData, setCompetitorData] = useState<CompetitorPrice[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRules>({
    ...DEFAULT_PRICING_RULES,
    competitor_multiplier: competitorPriceMultiplier,
  });
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);

  // ── Analysis ──
  const [analysis, setAnalysis] = useState<PriceAnalysis[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Loading states ──
  const [loadingComp, setLoadingComp] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [applyingPrices, setApplyingPrices] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);

  // ── Multiplier local edit ──
  const [multiplierInput, setMultiplierInput] = useState(
    String(competitorPriceMultiplier)
  );
  const [minMarginInput, setMinMarginInput] = useState(
    String(pricingRules.min_margin_pct)
  );

  // Sync multiplier from store when it changes externally
  useEffect(() => {
    setMultiplierInput(String(competitorPriceMultiplier));
    setPricingRules((r) => ({
      ...r,
      competitor_multiplier: competitorPriceMultiplier,
    }));
  }, [competitorPriceMultiplier]);

  // ── Load competitor prices ──
  const loadCompetitorData = useCallback(async () => {
    setLoadingComp(true);
    setCompError(null);
    try {
      const [comp, rules] = await Promise.all([
        fetchCompetitorPricing(),
        fetchPricingRules(),
      ]);
      setCompetitorData(comp);
      // Merge remote rules with local multiplier preference
      setPricingRules({
        ...rules,
        competitor_multiplier: competitorPriceMultiplier,
      });
      toast.success(`Loaded ${comp.length} competitor price records.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? "");
      setCompError(msg);
      toast.error(msg);
    } finally {
      setLoadingComp(false);
    }
  }, [competitorPriceMultiplier]);

  // ── Run analysis ──
  const runAnalysis = useCallback(() => {
    if (!recipes.length) {
      toast.warning("No dishes in the menu library to analyze.");
      return;
    }
    const currentOverrides: Record<string, number> = {};
    Object.entries(menuPriceOverrides).forEach(([id, ov]) => {
      currentOverrides[id] = ov.pricePerServing;
    });
    const result = analyzeRecipePrices(
      recipes,
      competitorData,
      pricingRules,
      currentOverrides
    );
    setAnalysis(result);
    // Pre-select all items where suggested differs from current by > 1 %
    setSelected(
      new Set(
        result
          .filter((r) => Math.abs(r.deltaPercent) > 1)
          .map((r) => r.itemId)
      )
    );
    toast.success(`Analyzed ${result.length} dishes.`);
  }, [recipes, competitorData, pricingRules, menuPriceOverrides]);

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const h = await fetchPriceHistory();
      setHistory(h);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Apply selected prices ──
  const applySelected = useCallback(async () => {
    const toApply = analysis.filter((a) => selected.has(a.itemId));
    if (!toApply.length) {
      toast.warning("No items selected.");
      return;
    }
    setApplyingPrices(true);
    try {
      // Build history entries
      const entries: Omit<PriceHistoryEntry, "id" | "applied_at">[] =
        toApply.map((a) => ({
          item_id: a.itemId,
          item_name: a.itemName,
          item_type: a.itemType,
          old_price: a.currentPricePerServing,
          new_price: a.suggestedPricePerServing,
          price_type: "per_serving",
          multiplier_used: a.multiplierUsed,
          competitor_avg: a.competitorAvg,
          adjustment_reason: `Competitor analysis — ${a.multiplierUsed}× multiplier${a.matchedCompetitorLabel ? ` (matched "${a.matchedCompetitorLabel}")` : ""}`,
          applied_by: currentUser?.id ?? "unknown",
        }));

      // Persist to Supabase history
      await logPriceAdjustments(entries);

      // Update store overrides
      const newOverrides: Record<string, MenuPriceOverride> = {};
      toApply.forEach((a) => {
        newOverrides[a.itemId] = {
          pricePerServing: a.suggestedPricePerServing,
          multiplierUsed: a.multiplierUsed,
          competitorAvg: a.competitorAvg,
          updatedAt: new Date().toISOString(),
        };
      });
      setMenuPriceOverrides(newOverrides);

      toast.success(
        `Applied optimal pricing to ${toApply.length} recipe${toApply.length !== 1 ? "s" : ""}.`
      );
      setSelected(new Set());

      // Refresh history tab
      await loadHistory();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Apply failed.");
    } finally {
      setApplyingPrices(false);
    }
  }, [analysis, selected, currentUser, setMenuPriceOverrides, loadHistory]);

  // ── Multiplier commit ──
  const commitMultiplier = () => {
    const v = parseFloat(multiplierInput);
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Multiplier must be a positive number (e.g. 1.15).");
      return;
    }
    setCompetitorPriceMultiplier(v);
    setPricingRules((r) => ({ ...r, competitor_multiplier: v }));
    toast.success(`Competitor multiplier set to ${v}×`);
  };

  const commitMinMargin = () => {
    const v = parseFloat(minMarginInput);
    if (!Number.isFinite(v) || v < 0 || v >= 1) {
      toast.error("Minimum margin must be between 0 and 0.99 (e.g. 0.30 for 30%).");
      return;
    }
    setPricingRules((r) => ({ ...r, min_margin_pct: v }));
    toast.success(`Minimum margin set to ${(v * 100).toFixed(0)}%`);
  };

  // ── Competitor data grouped by item ──
  const groupedCompetitorData = useMemo(() => {
    const map = new Map<string, CompetitorPrice[]>();
    competitorData.forEach((c) => {
      const list = map.get(c.item_name) ?? [];
      list.push(c);
      map.set(c.item_name, list);
    });
    return map;
  }, [competitorData]);

  // ── Select all / none ──
  const allSelected = analysis.length > 0 && selected.size === analysis.length;
  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(analysis.map((a) => a.itemId))
    );
  };

  const selectedCount = selected.size;
  const selectedAnalysis = analysis.filter((a) => selected.has(a.itemId));

  return (
    <TierGate feature="local_market_pricing" className="m-6">
      <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3 gap-6">
        {/* Header */}
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl font-bold mb-1">Pricing Engine</h1>
          <p className="text-muted-foreground text-lg">
            Pull competitor pricing from Supabase, apply the custom multiplier, and
            auto-update master menu prices — with a full history of every change.
          </p>
        </div>

        {/* Multiplier Controls */}
        <div className="w-full max-w-5xl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Pricing Rules
              </CardTitle>
              <CardDescription>
                Configure the custom multiplier and minimum margin. These values
                drive every suggested price in the analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Competitor Multiplier */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Competitor Price Multiplier
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {pricingRules.competitor_multiplier.toFixed(2)}×
                  </Badge>
                </div>
                <Slider
                  min={0.8}
                  max={2.0}
                  step={0.01}
                  value={[pricingRules.competitor_multiplier]}
                  onValueChange={([v]) => {
                    setPricingRules((r) => ({ ...r, competitor_multiplier: v }));
                    setMultiplierInput(String(v));
                  }}
                  onValueCommit={([v]) => {
                    setCompetitorPriceMultiplier(v);
                  }}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-24 font-mono text-sm"
                    value={multiplierInput}
                    onChange={(e) => setMultiplierInput(e.target.value)}
                    onBlur={commitMultiplier}
                    onKeyDown={(e) => e.key === "Enter" && commitMultiplier()}
                  />
                  <span className="text-xs text-muted-foreground">
                    ={" "}
                    {(
                      (pricingRules.competitor_multiplier - 1) *
                      100
                    ).toFixed(0)}
                    % above competitor average
                  </span>
                </div>
              </div>

              {/* Min Margin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Minimum Gross Margin
                  </Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {(pricingRules.min_margin_pct * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  min={0.1}
                  max={0.7}
                  step={0.01}
                  value={[pricingRules.min_margin_pct]}
                  onValueChange={([v]) => {
                    setPricingRules((r) => ({ ...r, min_margin_pct: v }));
                    setMinMarginInput(String(v));
                  }}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-24 font-mono text-sm"
                    value={minMarginInput}
                    onChange={(e) => setMinMarginInput(e.target.value)}
                    onBlur={commitMinMargin}
                    onKeyDown={(e) => e.key === "Enter" && commitMinMargin()}
                  />
                  <span className="text-xs text-muted-foreground">
                    Price floor = cost ÷ (1 − margin)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs */}
        <div className="w-full max-w-5xl">
          <Tabs defaultValue="analysis">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">
                <Play className="mr-2 h-4 w-4" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="competitor">
                <Building2 className="mr-2 h-4 w-4" />
                Competitor Data
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Price History
              </TabsTrigger>
            </TabsList>

            {/* ── Analysis tab ── */}
            <TabsContent value="analysis" className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={loadCompetitorData}
                  disabled={loadingComp}
                  variant="outline"
                  size="sm"
                >
                  {loadingComp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {competitorData.length > 0
                    ? `${competitorData.length} Competitor Prices Loaded`
                    : "Load Competitor Prices"}
                </Button>
                <Button onClick={runAnalysis} size="sm" disabled={!recipes.length}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Analysis ({recipes.length} dishes)
                </Button>
                {analysis.length > 0 && selectedCount > 0 && (
                  <Button
                    onClick={applySelected}
                    disabled={applyingPrices}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {applyingPrices ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Apply {selectedCount} Price{selectedCount !== 1 ? "s" : ""} to Master Menu
                  </Button>
                )}
              </div>

              {compError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Could not reach Supabase</p>
                    <p className="text-xs mt-0.5">{compError}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Analysis will run using cost-floor formula only (no competitor
                      comparison).
                    </p>
                  </div>
                </div>
              )}

              {analysis.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                    <Play className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground text-center">
                      Load competitor prices (optional), then click{" "}
                      <strong>Run Analysis</strong> to see optimal pricing for
                      every recipe.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-lg">
                        {analysis.length} Menu dishes analyzed
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          id="selectAll"
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                        />
                        <label htmlFor="selectAll" className="cursor-pointer">
                          Select all
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 pl-4" />
                            <TableHead>Dish</TableHead>
                            <TableHead className="text-right">Cost/Serving</TableHead>
                            <TableHead className="text-right">Current Price</TableHead>
                            <TableHead className="text-right">Comp. Avg</TableHead>
                            <TableHead className="text-right">Suggested</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.map((a) => {
                            const isUp = a.delta > 0;
                            const isDown = a.delta < 0;
                            const isFlat = a.delta === 0;
                            const isSelected = selected.has(a.itemId);
                            return (
                              <TableRow
                                key={a.itemId}
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
                                )}
                                onClick={() => {
                                  const next = new Set(selected);
                                  isSelected
                                    ? next.delete(a.itemId)
                                    : next.add(a.itemId);
                                  setSelected(next);
                                }}
                              >
                                <TableCell className="pl-4">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => {}}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm leading-tight">
                                      {a.itemName}
                                    </p>
                                    {a.matchedCompetitorLabel && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        matched "{a.matchedCompetitorLabel}" (
                                        {a.competitorSampleSize} comp
                                        {a.competitorSampleSize !== 1 ? "s" : ""})
                                      </p>
                                    )}
                                    {!a.matchedCompetitorLabel && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        no competitor match — cost floor only
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {fmt(a.baseCost / a.servings)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {fmt(a.currentPricePerServing)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                  {fmt(a.competitorAvg)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">
                                  {fmt(a.suggestedPricePerServing)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isFlat ? (
                                    <span className="text-xs text-muted-foreground">
                                      no change
                                    </span>
                                  ) : (
                                    <span
                                      className={cn(
                                        "flex items-center justify-end gap-0.5 text-xs font-semibold",
                                        isUp && "text-green-600",
                                        isDown && "text-red-500"
                                      )}
                                    >
                                      {isUp ? (
                                        <ChevronUp className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      )}
                                      {fmtPct(a.deltaPercent)}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>

                  {selectedAnalysis.length > 0 && (
                    <div className="border-t px-4 py-3 bg-muted/30 flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-semibold">
                        {selectedCount} selected
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-muted-foreground">
                        Avg. change:{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            selectedAnalysis.reduce(
                              (s, a) => s + a.deltaPercent,
                              0
                            ) /
                              selectedCount >=
                              0
                              ? "text-green-600"
                              : "text-red-500"
                          )}
                        >
                          {fmtPct(
                            selectedAnalysis.reduce(
                              (s, a) => s + a.deltaPercent,
                              0
                            ) / selectedCount
                          )}
                        </span>
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-muted-foreground">
                        Multiplier:{" "}
                        <span className="font-semibold font-mono">
                          {pricingRules.competitor_multiplier.toFixed(2)}×
                        </span>
                      </span>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* ── Competitor Data tab ── */}
            <TabsContent value="competitor" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={loadCompetitorData}
                  disabled={loadingComp}
                  variant="outline"
                  size="sm"
                >
                  {loadingComp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh from Supabase
                </Button>
                {competitorData.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {competitorData.length} active records ·{" "}
                    {groupedCompetitorData.size} unique items
                  </span>
                )}
              </div>

              {competitorData.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground text-center">
                      Click <strong>Refresh from Supabase</strong> to load the
                      competitor_pricing table.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {Array.from(groupedCompetitorData.entries()).map(
                    ([itemName, rows]) => {
                      const prices = rows.map((r) => r.price_per_unit);
                      const avg =
                        prices.reduce((s, p) => s + p, 0) / prices.length;
                      return (
                        <Card key={itemName}>
                          <CardHeader className="pb-1 pt-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <CardTitle className="text-sm font-semibold">
                                {itemName}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  Avg:{" "}
                                  <strong className="text-foreground">
                                    {fmt(avg)}
                                  </strong>
                                </span>
                                <span>·</span>
                                <span>
                                  Wendy target:{" "}
                                  <strong className="text-blue-600">
                                    {fmt(
                                      avg *
                                        pricingRules.competitor_multiplier
                                    )}
                                  </strong>
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {rows.length} comp
                                  {rows.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="grid gap-1">
                              {rows.map((r) => (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-xs text-muted-foreground px-1"
                                >
                                  <span className="font-medium text-foreground">
                                    {r.competitor_name ?? "Unknown"}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {r.notes && (
                                      <span className="italic">{r.notes}</span>
                                    )}
                                    <span className="font-mono font-semibold text-foreground">
                                      {fmt(r.price_per_unit)}/{r.unit}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── History tab ── */}
            <TabsContent value="history" className="mt-4 space-y-4">
              <Button
                onClick={loadHistory}
                disabled={loadingHistory}
                variant="outline"
                size="sm"
              >
                {loadingHistory ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Load History from Supabase
              </Button>

              {history.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                    <History className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground text-center">
                      No price adjustment history loaded yet. Click{" "}
                      <strong>Load History</strong> to pull from Supabase, or
                      apply pricing from the Analysis tab first.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {history.length} Price Adjustments
                    </CardTitle>
                    <CardDescription>
                      Complete audit trail of every pricing change applied to the
                      master menu.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dish</TableHead>
                            <TableHead className="text-right">Old Price</TableHead>
                            <TableHead className="text-right">New Price</TableHead>
                            <TableHead className="text-right">Comp. Avg</TableHead>
                            <TableHead className="text-right">Mult.</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Applied</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((h) => {
                            const changed =
                              h.old_price != null
                                ? h.new_price - h.old_price
                                : null;
                            return (
                              <TableRow key={h.id}>
                                <TableCell className="font-medium text-sm">
                                  {h.item_name}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                  {fmt(h.old_price)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">
                                  {fmt(h.new_price)}
                                  {changed != null && (
                                    <span
                                      className={cn(
                                        "ml-1 text-xs",
                                        changed >= 0
                                          ? "text-green-600"
                                          : "text-red-500"
                                      )}
                                    >
                                      ({changed >= 0 ? "+" : ""}
                                      {fmt(changed, "")})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {fmt(h.competitor_avg)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {h.multiplier_used.toFixed(2)}×
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {h.adjustment_reason}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  {h.applied_at
                                    ? new Date(h.applied_at).toLocaleString()
                                    : "—"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Info footer */}
        <div className="w-full max-w-5xl">
          <Card className="border-dashed bg-muted/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <strong>Formula:</strong> suggestedPrice = max(cost ÷ (1 −
                    minMargin), competitorAvg × {pricingRules.competitor_multiplier.toFixed(2)}
                    ×), capped at competitorAvg × {pricingRules.max_premium_pct.toFixed(1)}×
                  </p>
                  <p>
                    Applied prices are written to <code>menu_price_history</code>{" "}
                    in Supabase and stored locally in the browser as{" "}
                    <code>menuPriceOverrides</code>. They are used by Estimates &
                    Proposals as the per-serving selling price.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <MadeWithDyad />
      </div>
    </TierGate>
  );
};

export default PricingEngine;
