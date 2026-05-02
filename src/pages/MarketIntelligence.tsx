import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar, RefreshCw, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useMarketRates } from "@/hooks/useMarketRates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MarketIntelligence = () => {
  const { data: competitorData, loading: ratesLoading } = useMarketRates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate scraping logic execution
    await new Promise((resolve) => setTimeout(resolve, 2500));
    toast.success("Intelligence Vault Updated: Local Scrape Complete.");
    setIsRefreshing(false);
  };

  const avgCompetitorPrice = 42.50; // Simulated average
  const regionalDelta = "+$5.50"; // Simulated delta

  return (
    <div className="min-h-full bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 relative">
        {isRefreshing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-xl">
            <div className="text-xl font-semibold text-[#fbbf24] animate-pulse drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
              Scanning Local Market Squares...
            </div>
          </div>
        )}

        <div className={cn("transition-opacity duration-500", isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100")}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radar className="h-8 w-8 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 font-serif">
                  Market Pulse
                </h1>
              </div>
              <p className="text-muted-foreground max-w-xl">
                Real-time competitive intelligence. Scraped locally, analyzed privately, and deployed directly into your BEOs to ensure you never leave money on the table.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || ratesLoading}
              className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-sm group"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin text-[#fbbf24]")} />
              <span className="group-hover:text-[#fbbf24] transition-colors">Refresh Market Data</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-[#fbbf24]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Competitor Average Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">${avgCompetitorPrice.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per-person standard dinner plate</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-[#fbbf24]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Seashore Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">Rising</div>
                <p className="text-xs text-emerald-600 mt-1">+12% surge in premium seafood demand</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-[#fbbf24]/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Regional Delta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#fbbf24]">{regionalDelta}</div>
                <p className="text-xs text-muted-foreground mt-1">Your margin vs local average</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100 font-serif">Recent Local Competitor Data</h2>
            <div className="space-y-3">
              {ratesLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading local market data...</p>
              ) : competitorData.length > 0 ? (
                competitorData.slice(0, 5).map((comp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-card border rounded-md">
                    <div>
                      <div className="font-medium text-sm">{comp.ingredient_name || comp.item_name || 'Market Item'}</div>
                      <div className="text-xs text-muted-foreground">Scraped Source</div>
                    </div>
                    <div className="text-right font-semibold text-sm">
                      ${comp.market_rate?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active competitor data found in the local cache. Click Refresh.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default MarketIntelligence;