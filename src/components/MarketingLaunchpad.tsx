"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Copy,
  Crown,
  Instagram,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBEOHistory, type EventOrderRow } from "@/lib/beoGenerator";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopRecipe {
  name: string;
  totalRevenue: number;
  grossProfit: number;
  eventCount: number;
  avgPerPerson: number;
  lastEventDate: string | null;
}

interface GeneratedContent {
  instagramCaption: string;
  imagePrompts: string[];
  generatedAt: string;
}

// ── Caption / Prompt generators ───────────────────────────────────────────────

function detectRecipeCategory(name: string): string {
  const n = name.toLowerCase();
  if (/lobster|shrimp|salmon|crab|scallop|seafood|fish|tuna|halibut/.test(n))
    return "seafood";
  if (/wagyu|beef|steak|tenderloin|brisket|prime rib|filet|ribeye/.test(n))
    return "premium beef";
  if (/chicken|poultry|duck|quail|turkey/.test(n)) return "poultry";
  if (/lamb|rack|chop/.test(n)) return "lamb";
  if (/truffle|foie gras|caviar|saffron/.test(n)) return "luxury";
  if (/pasta|risotto|gnocchi|polenta/.test(n)) return "Italian";
  if (/tart|cake|mousse|soufflé|dessert|chocolate|pastry/.test(n)) return "pastry";
  if (/salad|greens|arugula|beet|harvest/.test(n)) return "composed salad";
  if (/soup|bisque|chowder/.test(n)) return "refined soup";
  return "artisan cuisine";
}

function buildInstagramCaption(recipe: TopRecipe): string {
  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const category = detectRecipeCategory(recipe.name);
  const perPerson = `$${recipe.avgPerPerson.toFixed(0)}`;

  return `✨ ${recipe.name}

There is a quiet luxury in serving a plate that requires no explanation.

This month, Delicious Catering & Events brought ${recipe.name} to ${recipe.eventCount} ${recipe.eventCount === 1 ? "event" : "events"} — each one executed with the precision of a five-star kitchen and the warmth of a family table. At ${perPerson} per guest, every detail was deliberate. Every moment, effortless.

This is ${category} the way it was meant to be served.

Whether you are planning an intimate dinner for 20 or a grand reception for 300, we bring this level of care to every plate, every event, every time.

📅 Featured this month: ${month}
📍 Serving Greater Metro & Available Nationwide for Destination Events
📩 Inquiries & bookings: northbusinessservices@gmail.com

—

#CateringByWendy #LuxuryCatering #${recipe.name.replace(/[^a-zA-Z0-9]/g, "")} #EventDesign #FineDining #CateringLife #FoodStyling #WeddingCatering #CorporateDining #ChefLife #BanquetEventOrder #HospitalityLife #EventPro #FarmToTable #ElevatedCatering #NorthBusinessServices`;
}

function buildImagePrompts(recipe: TopRecipe): string[] {
  const category = detectRecipeCategory(recipe.name);

  const heroMap: Record<string, string> = {
    seafood: `${recipe.name} plated on hand-painted Limoges china, delicate micro-herbs, lemon beurre blanc sauce artfully streamed, shallow depth of field, soft candlelight from the right, Michelin-star restaurant aesthetic, editorial food photography, muted ocean-blue and cream tones`,
    "premium beef": `${recipe.name} sliced medium-rare, single plate on ivory bone china, micro-watercress, truffle jus pooling at the base, shallow depth of field, warm amber candlelight, luxury steakhouse aesthetic, editorial food photography`,
    poultry: `${recipe.name} resting on a slate platter, pan jus, fresh thyme sprig, roasted root vegetables fanned alongside, moody chiaroscuro lighting, fine dining food photography`,
    lamb: `Rack of lamb — ${recipe.name} — french-trimmed, herb crust, pomegranate reduction, white bone china, shallow depth of field, evening candlelight, Vogue editorial food photography`,
    luxury: `${recipe.name} garnished with edible gold leaf and black truffle shavings, Baccarat crystal service, deep jewel-tone background, chiaroscuro lighting, ultra-luxury editorial photography`,
    pastry: `${recipe.name} on a hand-thrown ceramic stand, organic rose petals, marble surface, soft natural window light from the left, minimal luxury aesthetic, Vogue Entertaining editorial style`,
  };

  const hero =
    heroMap[category] ??
    `${recipe.name} plated with architectural precision on premium white china, seasonal micro-herb garnish, professional food photography, luxury catering aesthetic, shallow depth of field, warm candlelight, muted earth tones`;

  const ambiance = `Elegant catering tablescape for ${recipe.eventCount > 1 ? "an intimate" : "a grand"} reception, full French service setup, ivory dupioni silk tablecloth, fresh garden rose and eucalyptus centerpieces in frosted crystal vessels, individual place cards with gold calligraphy, Waterford crystal stemware, evening candlelight, luxury event design photography, ultra-wide 24mm lens perspective`;

  const action = `Professional catering chef plating ${recipe.name} in a pristine commercial kitchen, immaculate white double-breasted chef coat, focused expression, elegant deliberate hand motion, warm overhead track lighting, clean stainless surfaces, documentary editorial photography, 85mm f/1.8 shallow depth of field, cinematic color grading`;

  return [hero, ambiance, action];
}

// ── Month filtering ───────────────────────────────────────────────────────────

function isThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function findTopRecipe(rows: EventOrderRow[]): TopRecipe | null {
  const thisMonth = rows.filter((r) => isThisMonth(r.created_at));
  const pool = thisMonth.length > 0 ? thisMonth : rows;

  if (pool.length === 0) return null;

  // Accumulate per-recipe totals across all orders
  const map = new Map<
    string,
    { revenue: number; profit: number; count: number; perPersonSum: number; lastDate: string | null }
  >();

  for (const row of pool) {
    const names = Array.isArray(row.recipe_names) ? row.recipe_names : [];
    const splitRevenue = names.length > 0 ? row.total / names.length : 0;
    const splitProfit =
      names.length > 0 ? (row.total - row.cogs_total) / names.length : 0;

    for (const name of names) {
      const key = name.trim();
      if (!key) continue;
      const existing = map.get(key) ?? {
        revenue: 0,
        profit: 0,
        count: 0,
        perPersonSum: 0,
        lastDate: null,
      };
      existing.revenue += splitRevenue;
      existing.profit += splitProfit;
      existing.count += 1;
      existing.perPersonSum += row.per_person_rate;
      if (
        !existing.lastDate ||
        (row.created_at && row.created_at > existing.lastDate)
      ) {
        existing.lastDate = row.created_at;
      }
      map.set(key, existing);
    }
  }

  if (map.size === 0) return null;

  const sorted = [...map.entries()].sort((a, b) => b[1].profit - a[1].profit);
  const [name, data] = sorted[0];

  return {
    name,
    totalRevenue: data.revenue,
    grossProfit: data.profit,
    eventCount: data.count,
    avgPerPerson: data.count > 0 ? data.perPersonSum / data.count : 0,
    lastEventDate: data.lastDate,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketingLaunchpad() {
  const [orders, setOrders] = useState<EventOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchBEOHistory()
      .then((rows) => {
        setOrders(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(String(e instanceof Error ? e.message : e));
      })
      .finally(() => setLoading(false));
  }, []);

  const topRecipe = useMemo(() => findTopRecipe(orders), [orders]);

  const generate = useCallback(() => {
    if (!topRecipe) return;
    setGenerating(true);
    // Simulate brief generation delay for UX
    setTimeout(() => {
      setContent({
        instagramCaption: buildInstagramCaption(topRecipe),
        imagePrompts: buildImagePrompts(topRecipe),
        generatedAt: new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
      setGenerating(false);
    }, 800);
  }, [topRecipe]);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success(`${label} copied to clipboard.`))
        .catch(() => toast.error("Copy failed — please select and copy manually."));
    },
    []
  );

  const shareToWendy = useCallback(() => {
    if (!content || !topRecipe) return;
    const subject = encodeURIComponent(
      `Marketing Brief — ${topRecipe.name} — ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`
    );
    const body = encodeURIComponent(
      [
        `Hi Wendy,`,
        ``,
        `Here is your Marketing Launchpad brief for this month's most profitable dish.`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `TOP DISH: ${topRecipe.name}`,
        `Events this month: ${topRecipe.eventCount}`,
        `Estimated Gross Profit: $${topRecipe.grossProfit.toFixed(2)}`,
        `Avg Per Person: $${topRecipe.avgPerPerson.toFixed(2)}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `INSTAGRAM CAPTION`,
        `─────────────────`,
        content.instagramCaption,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `AI IMAGE PROMPTS`,
        `─────────────────`,
        ``,
        `[1] Hero Dish Shot`,
        content.imagePrompts[0],
        ``,
        `[2] Ambiance / Tablescape`,
        content.imagePrompts[1],
        ``,
        `[3] Behind the Scenes`,
        content.imagePrompts[2],
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Generated by NBS Marketing Launchpad on ${content.generatedAt}`,
        `Delicious Catering & Events · northbusinessservices@gmail.com`,
      ].join("\n")
    );
    window.location.href = `mailto:northbusinessservices@gmail.com?subject=${subject}&body=${body}`;
  }, [content, topRecipe]);

  const currentMonthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading event history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <p className="font-semibold">Could not load event orders.</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <p className="mt-2 text-muted-foreground/60">
          Ensure your Supabase connection is configured and the{" "}
          <code>event_orders</code> table exists.
        </p>
      </div>
    );
  }

  if (!topRecipe) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-10 text-center">
        <ChefHat className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-muted-foreground">No event orders found.</p>
        <p className="mt-1.5 text-sm text-muted-foreground/60">
          Generate and save your first BEO to unlock the Marketing Launchpad.
        </p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Top-performing dish */}
      <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-background dark:from-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">
                Most Profitable Dish — {currentMonthLabel}
              </CardTitle>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
              <TrendingUp className="h-3 w-3 mr-1" /> Top Performer
            </Badge>
          </div>
          <CardDescription>
            Identified from {orders.length} event{orders.length !== 1 ? "s" : ""} in
            your BEO history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <p className="text-2xl font-bold tracking-tight">{topRecipe.name}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCell
                label="Events This Month"
                value={String(topRecipe.eventCount)}
              />
              <StatCell
                label="Est. Gross Profit"
                value={`$${topRecipe.grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                accent
              />
              <StatCell
                label="Avg Per Person"
                value={`$${topRecipe.avgPerPerson.toFixed(2)}`}
              />
              <StatCell
                label="Total Revenue"
                value={`$${topRecipe.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={generate}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {content ? "Regenerate Content" : "Generate Marketing Content"}
            </Button>
            {content && (
              <Button variant="outline" onClick={generate} disabled={generating}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {content && (
        <div className="space-y-4">
          {/* Instagram Caption */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    Instagram Caption
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() =>
                    copyToClipboard(content.instagramCaption, "Caption")
                  }
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <CardDescription className="text-[11px]">
                High-end tone · Luxury & Ease · Ready to post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans rounded-lg border bg-muted/30 p-4">
                {content.instagramCaption}
              </pre>
            </CardContent>
          </Card>

          {/* Image Prompts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-violet-500" />
                <CardTitle className="text-sm font-semibold">
                  AI Image Prompts
                </CardTitle>
              </div>
              <CardDescription className="text-[11px]">
                Paste these into Midjourney, DALL·E, or Stable Diffusion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.imagePrompts.map((prompt, i) => {
                const labels = [
                  "Hero Dish Shot",
                  "Ambiance / Tablescape",
                  "Behind the Scenes",
                ];
                return (
                  <div key={i} className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] h-5",
                          i === 0 &&
                            "border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-300",
                          i === 1 &&
                            "border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-300",
                          i === 2 &&
                            "border-sky-200 text-sky-700 bg-sky-50 dark:bg-sky-950/20 dark:text-sky-300"
                        )}
                      >
                        {i + 1}. {labels[i]}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-[11px]"
                        onClick={() =>
                          copyToClipboard(prompt, `Prompt ${i + 1}`)
                        }
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      "{prompt}"
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Share to Wendy */}
          <Separator />
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <p className="text-sm font-semibold">Share to Wendy</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Opens a pre-filled email with the caption, image prompts, and
                performance summary to{" "}
                <span className="text-primary">northbusinessservices@gmail.com</span>
              </p>
            </div>
            <Button onClick={shareToWendy} className="gap-2 shrink-0">
              <Mail className="h-4 w-4" />
              Send Brief
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Generated {content.generatedAt} · NBS Marketing Launchpad ·
            Content is AI-assisted and may be edited before posting.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-bold mt-0.5",
          accent && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
