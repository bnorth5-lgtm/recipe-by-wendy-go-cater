"use client";

import React, { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Phone,
  Truck,
  Users,
  Package,
  UtensilsCrossed,
  MapPin,
  Instagram,
  Sparkles,
  Star,
} from "lucide-react";
import { TierGate } from "@/components/TierGate";
import { MarketingLaunchpad } from "@/components/MarketingLaunchpad";
import {
  getRegionalSourcing,
  type RegionalSourcing,
  type VendorCategory,
  type RegionalVendor,
} from "@/lib/nationalSourcing";
import { cn } from "@/lib/utils";

// ── Regional Sourcing Explorer ────────────────────────────────────────────────

function RegionalSourcingExplorer() {
  const [zipInput, setZipInput] = useState("");
  const [sourcing, setSourcing] = useState<RegionalSourcing | null>(null);

  const handleSearch = () => {
    const cleaned = zipInput.replace(/\D/g, "").slice(0, 5);
    if (cleaned.length < 3) return;
    setSourcing(getRegionalSourcing(cleaned));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Regional Sourcing Search</CardTitle>
          </div>
          <CardDescription>
            Enter any US venue ZIP code to discover the top wholesale food
            distributors, event rental companies, and staffing agencies for that
            region.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <div className="flex-1">
              <Label htmlFor="zip-input" className="sr-only">
                Venue ZIP Code
              </Label>
              <Input
                id="zip-input"
                placeholder="e.g. 90210"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={5}
                className="font-mono"
              />
            </div>
            <Button onClick={handleSearch} disabled={zipInput.replace(/\D/g, "").length < 3}>
              <MapPin className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {sourcing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold">
                Results for ZIP{" "}
                <span className="font-mono">{sourcing.zipCode}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {sourcing.region} · {sourcing.majorCity}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs">
              3 categories · 9 vendors
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {sourcing.categories.map((cat: VendorCategory) => (
              <div key={cat.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {cat.id === "wholesale_food" && (
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                  )}
                  {cat.id === "event_rentals" && (
                    <Package className="h-4 w-4 text-primary" />
                  )}
                  {cat.id === "staffing" && (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold">{cat.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
                <Separator />
                <div className="space-y-3">
                  {cat.vendors.map((v: RegionalVendor, vi: number) => (
                    <VendorCard key={vi} vendor={v} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/50 italic text-center">
            Vendor data is simulated for regional planning purposes. Always verify
            availability and pricing directly with each vendor before committing
            to any agreement.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!sourcing && (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 py-16 text-center">
          <Globe className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Enter a ZIP code to explore local vendors
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Covers all 50 US states · Works for any venue ZIP in the country
          </p>
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: RegionalVendor }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-xs space-y-1.5">
      <div className="flex items-start justify-between gap-1">
        <span className="font-semibold leading-tight">{vendor.name}</span>
        {vendor.isNational && (
          <Badge variant="outline" className="shrink-0 text-[10px] h-4 px-1">
            National
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground">{vendor.specialty}</p>
      <div className="flex flex-col gap-1 pt-0.5">
        <a
          href={`tel:${vendor.phone.replace(/\D/g, "")}`}
          className="flex items-center gap-1.5 text-primary hover:underline"
        >
          <Phone className="h-3 w-3 shrink-0" />
          {vendor.phone}
        </a>
        <a
          href={`https://${vendor.website}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-primary hover:underline truncate"
        >
          <Globe className="h-3 w-3 shrink-0" />
          {vendor.website}
        </a>
      </div>
      <div className="flex items-center gap-1 text-amber-500">
        <Star className="h-3 w-3 fill-amber-500" />
        <span className="text-[11px] font-medium">{vendor.rating.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketExpansion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Expansion</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Regional sourcing intelligence and AI-powered marketing tools to grow
          Catering By Wendy's reach.
        </p>
      </div>

      <Tabs defaultValue="sourcing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sourcing" className="gap-2">
            <Truck className="h-4 w-4" />
            Regional Sourcing
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2">
            <Instagram className="h-4 w-4" />
            Marketing Launchpad
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Regional Sourcing ── */}
        <TabsContent value="sourcing" className="space-y-6">
          <RegionalSourcingExplorer />
        </TabsContent>

        {/* ── Tab: Marketing Launchpad (Enterprise only) ── */}
        <TabsContent value="marketing" className="space-y-6">
          <TierGate feature="market_pricing">
            <Card className="border-amber-200/40 bg-gradient-to-br from-amber-50/20 to-background dark:from-amber-950/10 mb-4">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Marketing Launchpad</CardTitle>
                  <Badge
                    className={cn(
                      "ml-auto text-[10px]",
                      "bg-amber-100 text-amber-800 border-amber-200",
                      "dark:bg-amber-900/30 dark:text-amber-300"
                    )}
                  >
                    Enterprise
                  </Badge>
                </div>
                <CardDescription>
                  Analyzes your most profitable recipe of the month and generates
                  a ready-to-post Instagram caption, three professional AI image
                  prompts, and a one-click brief to send directly to Wendy.
                </CardDescription>
              </CardHeader>
            </Card>
            <MarketingLaunchpad />
          </TierGate>
        </TabsContent>
      </Tabs>

      <MadeWithDyad />
    </div>
  );
}
