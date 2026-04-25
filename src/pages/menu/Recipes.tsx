"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as z from "zod";
import { AlertCircle, ExternalLink, Search, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useCateringStore, Recipe } from "@/store/cateringStore";
import { Badge } from "@/components/ui/badge"; // Import Badge for visual cues
import type { ParsedRecipeDraft } from "@/lib/localAi";
import { UniversalRecipeImporter } from "@/components/recipes/UniversalRecipeImporter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { parseRecipeWithLocalAi } from "@/lib/localAi";
import { cn } from "@/lib/utils";

// Define the main schema for a recipe
const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  prepTime: z.string().min(1, "Preparation time is required"),
  cookTime: z.string().min(1, "Cook time is required"),
  servings: z.string().min(1, "Servings is required"),
  category: z.enum(["Appetizer", "Main Course", "Dessert", "Alcoholic Beverage", "Non-Alcoholic Beverage", "Side Dish", "Breakfast", "Vegetarian Main", "Other"], {
    required_error: "Please select a category.",
  }),
  ingredients: z.array(z.object({
    name: z.string().min(1, "Ingredient name is required"),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
    unit: z.string().min(1, "Unit is required"),
  })).min(1, "At least one ingredient is required"),
  instructions: z.array(z.object({
    step: z.string().min(1, "Instruction step is required"),
  })).min(1, "At least one instruction step is required"),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type RecipeDraft = z.infer<typeof recipeFormSchema>;

function parseYieldToNumber(servings: string | undefined): number | null {
  if (!servings) return null;
  const cleaned = String(servings).trim();
  // common: "8", "8 servings", "Serves 8", "8-10"
  const range = cleaned.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const a = Number.parseFloat(range[1]);
    const b = Number.parseFloat(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) return (a + b) / 2;
  }
  const single = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (single) {
    const n = Number.parseFloat(single[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

const Recipes = () => {
  const recipes = useCateringStore((state) => state.recipes);
  const addRecipe = useCateringStore((state) => state.addRecipe);
  const deleteRecipe = useCateringStore((state) => state.deleteRecipe);
  const inventory = useCateringStore((state) => state.inventory);
  const hydrateRecipesFromDb = useCateringStore((state) => state.hydrateRecipesFromDb);

  const [parsed, setParsed] = useState<ParsedRecipeDraft | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [currentServings, setCurrentServings] = useState<number>(0);
  const [quickServingsById, setQuickServingsById] = useState<Record<string, number>>({});
  const [bulkText, setBulkText] = useState("");
  const [isBulkParsing, setIsBulkParsing] = useState(false);
  const [query, setQuery] = useState("");
  const [importMode, setImportMode] = useState<"paste" | "website" | "scan">("paste");

  useEffect(() => {
    void hydrateRecipesFromDb();
  }, [hydrateRecipesFromDb]);

  const canSave = useMemo(() => Boolean(parsed), [parsed]);
  const hasAnyParsedDraft = useMemo(() => parsed !== null, [parsed]);

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;

    const norm = (s: string) => s.toLowerCase();
    const score = (text: string, pattern: string) => {
      // lightweight fuzzy: subsequence match with compactness bonus
      const t = norm(text);
      let ti = 0;
      let first = -1;
      let last = -1;
      for (let pi = 0; pi < pattern.length; pi++) {
        const ch = pattern[pi];
        ti = t.indexOf(ch, ti);
        if (ti === -1) return -1;
        if (first === -1) first = ti;
        last = ti;
        ti++;
      }
      const span = last - first + 1;
      // higher is better
      return pattern.length * 10 - span;
    };

    return [...recipes]
      .map((r) => ({
        r,
        s: Math.max(
          score(r.name, q),
          score(`${r.name} ${r.description} ${r.category}`, q),
        ),
      }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name))
      .map((x) => x.r);
  }, [recipes, query]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r.id === selectedRecipeId) ?? null;
  }, [recipes, selectedRecipeId]);

  const originalYield = useMemo(() => {
    return parseYieldToNumber(selectedRecipe?.servings) ?? 1;
  }, [selectedRecipe?.servings]);

  const factor = useMemo(() => {
    const denom = originalYield || 1;
    return denom > 0 ? currentServings / denom : 1;
  }, [currentServings, originalYield]);

  const effectiveCostPerServing = useMemo(() => {
    if (!selectedRecipe) return 0;
    if (typeof selectedRecipe.costPerServing === "number" && Number.isFinite(selectedRecipe.costPerServing)) {
      return selectedRecipe.costPerServing;
    }
    const oy = parseYieldToNumber(selectedRecipe.servings);
    if (oy && oy > 0) return selectedRecipe.baseCost / oy;
    return 0;
  }, [selectedRecipe]);

  const totalEstimatedCost = useMemo(() => {
    return currentServings * effectiveCostPerServing;
  }, [currentServings, effectiveCostPerServing]);

  const saveParsed = () => {
    if (!parsed) return;

    const validation = recipeFormSchema.safeParse(parsed as any);
    if (!validation.success) {
      toast.error("Parsed recipe is incomplete. Try again or add more detail.");
      return;
    }

    const data: RecipeDraft = validation.data;
    const missingIngredients: string[] = [];
    data.ingredients.forEach((ing) => {
      const found = inventory.some(
        (item) =>
          item.name.toLowerCase() === ing.name.toLowerCase() &&
          item.unit.toLowerCase() === ing.unit.toLowerCase()
      );
      if (!found) missingIngredients.push(`${ing.name} (${ing.unit})`);
    });

    if (missingIngredients.length > 0) {
      toast.warning(
        `Missing in inventory: ${missingIngredients.join(", ")}. You can still save the recipe.`,
        { duration: 8000 }
      );
    }

    addRecipe(data as Omit<Recipe, "id" | "baseCost">);
    setParsed(null);
    toast.success("Added to your Local Vault.");
  };

  const bulkPasteAndParse: React.ClipboardEventHandler<HTMLTextAreaElement> = async (e) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text?.trim()) return;

    // Let the paste happen visually, then immediately parse.
    setIsBulkParsing(true);
    try {
      const draft = await parseRecipeWithLocalAi({
        text,
        meta: {
          sourceType: "paste",
          importMethod: "bulk-paste",
          importedAt: new Date().toISOString(),
        },
      });

      // Make the import "instant": fill the pending recipe and keep UI ready to Save.
      setBulkText(text);
      setParsed(draft);
      toast.success("Bulk Import ready. Hit Save.");
    } catch (err: any) {
      toast.error(err?.message ?? "Bulk Import failed. Try pasting cleaner text.");
    } finally {
      setIsBulkParsing(false);
    }
  };

  const handleDeleteRecipe = (id: string) => {
    deleteRecipe(id);
    toast.info("Recipe deleted.");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground px-6 py-8">
      <div className="w-full max-w-5xl space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Recipes</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Add recipes your way — paste it, grab it from a website, or Smart Scan a photo or document. Everything stays in your Local Vault.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setImportMode("paste")}
            className={cn(
              "group text-left rounded-3xl border shadow-sm transition-all",
              "hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              "bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent",
              importMode === "paste" ? "border-emerald-500/50 shadow-md" : "border-border",
            )}
          >
            <div className="p-5 md:p-6 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Quick Paste</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  ⌘
                </span>
              </div>
              <p className="text-xl font-semibold tracking-tight">Paste a recipe and we’ll fill it in.</p>
              <p className="text-sm text-muted-foreground">
                Great for notes, emails, and printed recipes copied from anywhere.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setImportMode("website")}
            className={cn(
              "group text-left rounded-3xl border shadow-sm transition-all",
              "hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              "bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-transparent",
              importMode === "website" ? "border-sky-500/50 shadow-md" : "border-border",
            )}
          >
            <div className="p-5 md:p-6 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">From Website</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                  ↗
                </span>
              </div>
              <p className="text-xl font-semibold tracking-tight">Bring in a recipe from a link.</p>
              <p className="text-sm text-muted-foreground">
                Paste a recipe webpage and we’ll pull the details into a Recipe File.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setImportMode("scan")}
            className={cn(
              "group text-left rounded-3xl border shadow-sm transition-all",
              "hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              "bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent",
              importMode === "scan" ? "border-orange-500/50 shadow-md" : "border-border",
            )}
          >
            <div className="p-5 md:p-6 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Scan Document</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
                  ▣
                </span>
              </div>
              <p className="text-xl font-semibold tracking-tight">Smart Scan a photo or document.</p>
              <p className="text-sm text-muted-foreground">
                Perfect for recipe cards, screenshots, and photos from your camera roll.
              </p>
            </div>
          </button>
        </div>

        {importMode === "paste" ? (
          <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 rounded-3xl border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">Quick Paste</CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste your recipe below. We’ll organize it into a clean Recipe File you can save.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                onPaste={bulkPasteAndParse}
                placeholder="Paste here. Example: “Name… Serves… Ingredients… Steps…”"
                className="min-h-[160px] text-base leading-relaxed rounded-2xl"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={cn("text-sm", isBulkParsing ? "text-sky-400" : "text-muted-foreground")}>
                  {isBulkParsing ? "Reading your recipe..." : "Tip: pasting starts automatically."}
                </p>
                <Button
                  variant="outline"
                  disabled={!bulkText.trim() || isBulkParsing}
                  onClick={async () => {
                    setIsBulkParsing(true);
                    try {
                      const draft = await parseRecipeWithLocalAi({
                        text: bulkText,
                        meta: { sourceType: "paste", importMethod: "bulk-paste", importedAt: new Date().toISOString() },
                      });
                      setParsed(draft);
                      toast.success("Ready to add to your cookbook.");
                    } catch (err: any) {
                      toast.error(err?.message ?? "Couldn’t read that recipe. Try pasting a cleaner copy.");
                    } finally {
                      setIsBulkParsing(false);
                    }
                  }}
                  className="h-11 rounded-2xl px-5 text-base"
                >
                  Tidy it up again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {importMode === "website" ? (
          <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 rounded-3xl border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">From Website</CardTitle>
              <CardDescription className="text-muted-foreground">
                Use a recipe link and we’ll turn it into a Recipe File you can save.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UniversalRecipeImporter onParsed={(draft) => setParsed(draft)} />
            </CardContent>
          </Card>
        ) : null}

        {importMode === "scan" ? (
          <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 rounded-3xl border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">Scan Document</CardTitle>
              <CardDescription className="text-muted-foreground">
                Drop in a photo or document for Smart Scan, then save it to your cookbook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UniversalRecipeImporter onParsed={(draft) => setParsed(draft)} />
            </CardContent>
          </Card>
        ) : null}

        <div className="sticky bottom-3 z-[80]">
          <Button
            onClick={saveParsed}
            disabled={!canSave}
            className={cn(
              "h-14 w-full rounded-2xl text-base font-semibold shadow-lg",
              canSave
                ? "bg-emerald-600 hover:bg-emerald-600/90 text-white"
                : "bg-muted text-muted-foreground shadow-none",
            )}
          >
            Add to My Cookbook
          </Button>
        </div>

        <div className="pt-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Your Cookbook..."
              aria-label="Search Your Cookbook"
              className={cn(
                "h-14 w-full rounded-2xl border-2 bg-background pl-12 pr-4",
                "text-lg shadow-md shadow-black/5",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
              )}
            />
          </div>
        </div>

        {/* Display Existing Recipes */}
        <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 rounded-2xl border shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-primary">Existing Recipes</CardTitle>
                <CardDescription className="text-muted-foreground">A list of all your managed recipes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecipes.length === 0 ? (
              <p className="text-muted-foreground text-center">No recipes added yet. Start by adding one above!</p>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-3">
                <div className="space-y-3">
                  {filteredRecipes.map((recipe) => (
                    <div key={recipe.id} className="border p-3 rounded-xl bg-background flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          className="text-left w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                          onClick={() => {
                            setSelectedRecipeId(recipe.id);
                            const oy = parseYieldToNumber(recipe.servings) ?? 1;
                            setCurrentServings(oy);
                          }}
                        >
                          <h3 className="text-xl font-semibold truncate">{recipe.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                          <div className="mt-1 text-sm">
                            <p><strong>Category:</strong> {recipe.category}</p>
                            <p><strong>Prep:</strong> {recipe.prepTime} | <strong>Cook:</strong> {recipe.cookTime} | <strong>Yield:</strong> {recipe.servings}</p>
                          </div>
                        </button>

                        {(() => {
                          const oy = parseYieldToNumber(recipe.servings) ?? 1;
                          const qs = quickServingsById[recipe.id] ?? oy;
                          const cps =
                            typeof recipe.costPerServing === "number" && Number.isFinite(recipe.costPerServing)
                              ? recipe.costPerServing
                              : oy > 0
                                ? recipe.baseCost / oy
                                : 0;
                          const total = qs * cps;
                          const sliderMax = Math.max(10, Math.round(oy * 10));

                          return (
                            <div className="mt-3 rounded-xl border bg-card/20 px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-muted-foreground">Quick Scale</p>
                                  <p className="text-base font-semibold tracking-tight truncate">
                                    {formatMoney(total, recipe.currency ?? "USD")}
                                    <span className="text-muted-foreground font-normal"> · {qs} guests</span>
                                  </p>
                                </div>
                                <div className="w-[96px] shrink-0">
                                  <Input
                                    type="number"
                                    min={1}
                                    value={Math.max(1, Math.round(qs))}
                                    onChange={(e) => {
                                      const n = Number.parseFloat(e.target.value);
                                      if (!Number.isFinite(n) || n <= 0) return;
                                      setQuickServingsById((prev) => ({ ...prev, [recipe.id]: n }));
                                    }}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="mt-2">
                                <Slider
                                  value={[Math.max(1, Math.round(qs))]}
                                  min={1}
                                  max={sliderMax}
                                  step={1}
                                  onValueChange={(v) =>
                                    setQuickServingsById((prev) => ({ ...prev, [recipe.id]: v[0] ?? 1 }))
                                  }
                                />
                                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                  <span>1</span>
                                  <span>{sliderMax}</span>
                                </div>
                              </div>

                              <div className="mt-2 text-[11px] text-muted-foreground">
                                Base {formatMoney(recipe.baseCost, recipe.currency ?? "USD")}
                                <span> · </span>
                                {formatMoney(cps, recipe.currency ?? "USD")} / serving
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="ml-4 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      <Dialog
        open={Boolean(selectedRecipe)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecipeId(null);
        }}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedRecipe ? (
            <div className="bg-background">
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-semibold tracking-tight">{selectedRecipe.name}</h2>
                      <Badge variant="secondary">{selectedRecipe.category}</Badge>
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
                      {selectedRecipe.description}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      {selectedRecipe.prepTime ? <span>Prep {selectedRecipe.prepTime}</span> : null}
                      {selectedRecipe.prepTime && selectedRecipe.cookTime ? <span> · </span> : null}
                      {selectedRecipe.cookTime ? <span>Cook {selectedRecipe.cookTime}</span> : null}
                      <span> · Yield {selectedRecipe.servings}</span>
                    </div>
                    {selectedRecipe.sourceUrl ? (
                      <a
                        href={selectedRecipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Source
                      </a>
                    ) : null}
                  </div>

                  <div className="min-w-[320px] rounded-2xl border bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/30 p-6 space-y-5">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Victus Scaling & Costing</p>
                      <p className="text-4xl font-semibold tracking-tight">
                        {formatMoney(totalEstimatedCost, selectedRecipe.currency ?? "USD")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Estimated Cost · {formatMoney(effectiveCostPerServing, selectedRecipe.currency ?? "USD")} / serving
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-end justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Guest count</p>
                          <p className="text-xs text-muted-foreground">
                            Factor \(CurrentServings / OriginalYield\) = {Number.isFinite(factor) ? factor.toFixed(2) : "—"}
                          </p>
                        </div>
                        <div className="w-[120px]">
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            value={Number.isFinite(currentServings) ? currentServings : 1}
                            onChange={(e) => {
                              const n = Number.parseFloat(e.target.value);
                              if (!Number.isFinite(n) || n <= 0) return;
                              setCurrentServings(n);
                            }}
                            className="h-11 text-base"
                          />
                        </div>
                      </div>

                      <Slider
                        value={[Math.max(1, Math.round(currentServings || 1))]}
                        min={1}
                        max={Math.max(10, Math.round(originalYield * 10))}
                        step={1}
                        onValueChange={(v) => setCurrentServings(v[0] ?? 1)}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>{Math.max(10, Math.round(originalYield * 10))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold tracking-tight">Ingredients (scaled)</h3>
                    <div className="rounded-2xl border bg-background/50">
                      <div className="p-4 space-y-2">
                        {selectedRecipe.ingredients.map((ing, idx) => {
                          const scaledQty = ing.quantity * (Number.isFinite(factor) ? factor : 1);
                          const isIngredientInInventory = inventory.some(
                            (item) =>
                              item.name.toLowerCase() === ing.name.toLowerCase() &&
                              item.unit.toLowerCase() === ing.unit.toLowerCase()
                          );
                          return (
                            <div key={idx} className="flex items-center justify-between gap-3 py-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{ing.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {scaledQty.toFixed(scaledQty < 10 ? 2 : 1)} {ing.unit}
                                </p>
                              </div>
                              {!isIngredientInInventory ? (
                                <Badge variant="destructive" className="shrink-0">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Missing
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground shrink-0">In inventory</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold tracking-tight">Instructions</h3>
                    <div className="rounded-2xl border bg-background/50 p-4">
                      <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
                        {selectedRecipe.instructions.map((inst, idx) => (
                          <li key={idx} className="text-foreground/90">
                            {inst.step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">Loading…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;