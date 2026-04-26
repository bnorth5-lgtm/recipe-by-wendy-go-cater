"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import * as z from "zod";
import { AlertCircle, Check, ExternalLink, Search, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useCateringStore, Recipe } from "@/store/cateringStore";
import { Badge } from "@/components/ui/badge"; // Import Badge for visual cues
import type { ParsedRecipeDraft } from "@/lib/localAi";
import { assertCloudVaultReady, upsertRecipeToCloudVault } from "@/lib/cloudVault";
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

const RECIPE_CATEGORIES = [
  "Appetizer",
  "Main Course",
  "Dessert",
  "Alcoholic Beverage",
  "Non-Alcoholic Beverage",
  "Side Dish",
  "Breakfast",
  "Vegetarian Main",
  "Other",
] as const satisfies readonly Recipe["category"][];

function cloneParsedDraft(d: ParsedRecipeDraft): ParsedRecipeDraft {
  return {
    ...d,
    ingredients: (d.ingredients ?? []).map((i) => ({ ...i })),
    instructions: (d.instructions ?? []).map((s) => ({ ...s })),
  };
}

function isValidOptionalUrl(s: string | undefined): boolean {
  if (!s || !String(s).trim()) return true;
  try {
    const u = new URL(String(s).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Button enable: enough to save without touching other fields first. */
function isDraftSaveable(d: ParsedRecipeDraft | null): boolean {
  if (!d) return false;
  const name = String(d.name ?? "").trim();
  if (!name) return false;
  const ings = d.ingredients ?? [];
  return ings.some(
    (ing) =>
      String(ing?.name ?? "").trim() &&
      String(ing?.unit ?? "").trim() &&
      Number(ing?.quantity) > 0,
  );
}

/** Fill gaps so strict save validation passes without extra clicks. */
function normalizeDraftForSave(d: ParsedRecipeDraft): RecipeDraft {
  const category = (RECIPE_CATEGORIES as readonly string[]).includes(d.category)
    ? d.category
    : "Other";

  let sourceUrl = String(d.sourceUrl ?? "").trim();
  if (!isValidOptionalUrl(sourceUrl)) sourceUrl = "";

  const ingredients = (d.ingredients ?? [])
    .map((i) => ({
      name: String(i?.name ?? "").trim(),
      quantity: Number(i?.quantity ?? 0),
      unit: String(i?.unit ?? "").trim(),
    }))
    .filter((i) => i.name && i.unit && i.quantity > 0);

  const rawSteps = (d.instructions ?? [])
    .map((x) => String(x?.step ?? "").trim())
    .filter(Boolean);
  const instructions =
    rawSteps.length > 0
      ? rawSteps.map((step) => ({ step }))
      : [{ step: "Review and finish preparation steps in your cookbook." }];

  return {
    name: String(d.name ?? "").trim(),
    description: String(d.description ?? "").trim() || "Imported recipe.",
    prepTime: String(d.prepTime ?? "").trim() || "—",
    cookTime: String(d.cookTime ?? "").trim() || "—",
    servings: String(d.servings ?? "").trim() || "Serves 4",
    category: category as RecipeDraft["category"],
    ingredients,
    instructions,
    sourceUrl,
  };
}

function historySourceFromDraft(d: ParsedRecipeDraft): string | undefined {
  const line = [d.sourceTitle, d.sourceSite, d.sourceAuthor].filter(Boolean).join(" · ").trim();
  return line || undefined;
}

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
  const [saveFlash, setSaveFlash] = useState<"idle" | "success" | "error">("idle");
  const [lastSavedRecipeName, setLastSavedRecipeName] = useState<string | null>(null);
  const [lastSaveErrorReason, setLastSaveErrorReason] = useState<string | null>(null);
  const quickPasteRef = useRef<HTMLTextAreaElement | null>(null);
  const bulkParseDebounceRef = useRef<number | null>(null);
  const lastParsedTextRef = useRef<string>("");
  const saveLockRef = useRef(false);

  useEffect(() => {
    void hydrateRecipesFromDb();
  }, [hydrateRecipesFromDb]);

  useEffect(() => {
    // Focus the textarea immediately on load.
    const id = window.setTimeout(() => quickPasteRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const hasAnyText = useMemo(() => Boolean(bulkText.trim()), [bulkText]);
  const canAddToCookbook = useMemo(() => {
    // Allow click anytime there’s text; if not parsed yet, click will parse-and-save.
    return hasAnyText && !isBulkParsing && saveFlash === "idle";
  }, [hasAnyText, isBulkParsing, saveFlash]);

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

  const resetImporterForNextRecipe = () => {
    setBulkText("");
    lastParsedTextRef.current = "";
    setParsed(null);
    setLastSavedRecipeName(null);
  };

  const bulkPasteAndParse: React.ClipboardEventHandler<HTMLTextAreaElement> = async (e) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text?.trim()) return;

    // Let the paste happen visually, then immediately parse.
    void startBulkParse(text, "paste");
  };

  const startBulkParse = async (text: string, trigger: "paste" | "change" | "manual") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isBulkParsing) return;
    if (lastParsedTextRef.current === trimmed) return;

    setIsBulkParsing(true);
    try {
      const draft = await parseRecipeWithLocalAi({
        text: trimmed,
        meta: {
          sourceType: "paste",
          importMethod: trigger === "paste" ? "bulk-paste" : trigger === "manual" ? "bulk-manual" : "bulk-change",
          importedAt: new Date().toISOString(),
        },
      });
      lastParsedTextRef.current = trimmed;
      setParsed(cloneParsedDraft(draft));
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn’t read that recipe. Try pasting a cleaner copy.");
    } finally {
      setIsBulkParsing(false);
    }
  };

  const scheduleBulkParseFromChange = (nextText: string) => {
    const trimmed = nextText.trim();
    if (!trimmed) return;

    if (bulkParseDebounceRef.current) window.clearTimeout(bulkParseDebounceRef.current);
    bulkParseDebounceRef.current = window.setTimeout(() => {
      void startBulkParse(trimmed, "change");
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (bulkParseDebounceRef.current) window.clearTimeout(bulkParseDebounceRef.current);
    };
  }, []);

  const handleDeleteRecipe = (id: string) => {
    deleteRecipe(id);
    toast.info("Recipe deleted.");
  };

  const forceRecipeFromText = (text: string): Omit<Recipe, "id" | "baseCost"> => {
    const t = text.trim();
    const firstLine = t.split(/\r?\n/).map((s) => s.trim()).find(Boolean) ?? "Untitled Recipe";
    return {
      name: firstLine.slice(0, 120),
      description: "Imported from Quick Paste.",
      prepTime: "—",
      cookTime: "—",
      servings: "—",
      category: "Other",
      ingredients: [],
      instructions: [{ step: "See original pasted text." }],
      sourceUrl: "",
      sourceType: "paste",
      importMethod: "force-save",
      importedAt: new Date().toISOString(),
      sourceJson: { rawText: t },
      currency: "USD",
      baseCost: 0 as any, // omitted field; store computes baseCost
    } as any;
  };

  const saveParsed = async () => {
    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setLastSaveErrorReason(null);

    let created: Recipe | null = null;
    try {
      // Ensure cloud vault is reachable now so errors are specific.
      await assertCloudVaultReady();

      let draftToSave = parsed;
      // If text exists but parsing hasn't produced a draft yet, parse on click.
      if (!draftToSave && bulkText.trim()) {
        setIsBulkParsing(true);
        try {
          const freshDraft = await parseRecipeWithLocalAi({
            text: bulkText.trim(),
            meta: { sourceType: "paste", importMethod: "button-press", importedAt: new Date().toISOString() },
          });
          draftToSave = cloneParsedDraft(freshDraft);
          setParsed(draftToSave);
        } finally {
          setIsBulkParsing(false);
        }
      }

      // FORCE SAVE: if parsing/validation doesn't produce a full draft, we still save the raw text.
      let data: RecipeDraft | null = null;
      if (draftToSave) {
        const normalized = normalizeDraftForSave(draftToSave);
        const validation = recipeFormSchema.safeParse(normalized);
        if (validation.success) {
          data = validation.data;
        }
      }

      const payload: Omit<Recipe, "id" | "baseCost"> =
        data
          ? ({
              ...(data as Omit<Recipe, "id" | "baseCost">),
              source: historySourceFromDraft(draftToSave ?? ({} as any)),
              comments: undefined,
            } as any)
          : (forceRecipeFromText(bulkText) as any);

      const missingIngredients: string[] = [];
      (data?.ingredients ?? []).forEach((ing) => {
        const found = inventory.some(
          (item) =>
            item.name.toLowerCase() === ing.name.toLowerCase() &&
            item.unit.toLowerCase() === ing.unit.toLowerCase()
        );
        if (!found) missingIngredients.push(`${ing.name} (${ing.unit})`);
      });
      if (missingIngredients.length > 0) {
        toast.warning(`Missing in inventory: ${missingIngredients.join(", ")}. Saving anyway.`, { duration: 6000 });
      }

      created = await addRecipe(payload);
      await upsertRecipeToCloudVault(created);

      setLastSavedRecipeName(created.name);
      setSaveFlash("success");
      window.setTimeout(() => {
        setSaveFlash("idle");
        resetImporterForNextRecipe();
        saveLockRef.current = false;
      }, 900);
    } catch (e: any) {
      if (created) deleteRecipe(created.id);
      const msg = String(e?.message ?? "");
      let reason = msg || "Unknown error.";
      if (/cloud vault offline/i.test(reason)) reason = "Cloud Vault offline.";
      if (/key rejected/i.test(reason)) reason = "Cloud Vault key rejected.";
      if (/table missing/i.test(reason)) reason = "Cloud Vault table missing.";
      if (/Paste a recipe first/i.test(reason)) reason = "Missing text.";
      setLastSaveErrorReason(reason);
      setSaveFlash("error");
      window.setTimeout(() => setSaveFlash("idle"), 900);
      saveLockRef.current = false;
      toast.error(reason);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col items-center bg-background text-foreground px-6 py-8">
      {saveFlash === "success" ? (
        <div
          role="status"
          aria-live="assertive"
          className={cn(
            "fixed inset-0 z-[400] flex flex-col items-center justify-center gap-7 px-6 py-12 text-white",
            "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800",
            "shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.10)]",
          )}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25 shadow-2xl sm:h-36 sm:w-36">
            <Check className="h-16 w-16 shrink-0 stroke-[3] drop-shadow-2xl sm:h-20 sm:w-20" aria-hidden />
          </div>
          <p className="text-center text-6xl font-black tracking-tight drop-shadow-md sm:text-8xl">
            SAVED
          </p>
          {lastSavedRecipeName ? (
            <p className="max-w-3xl text-center text-2xl font-semibold leading-tight text-white/95 sm:text-3xl">
              {lastSavedRecipeName}
            </p>
          ) : null}
          <p className="max-w-xl text-center text-lg font-semibold leading-snug text-white/90 sm:text-xl">
            Stored safely in your Local Vault and Cloud Vault.
          </p>
        </div>
      ) : null}
      {saveFlash === "error" ? (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-0 z-[400] flex flex-col items-center justify-center gap-4 bg-red-600 px-6 text-white"
        >
          <AlertCircle className="h-24 w-24 shrink-0 stroke-[2.5]" aria-hidden />
          <p className="text-center text-4xl font-black tracking-tight sm:text-5xl">NOT SAVED</p>
          <p className="max-w-2xl text-center text-lg font-semibold text-white/95">
            {lastSaveErrorReason ?? "Fix the text and try again."}
          </p>
        </div>
      ) : null}
      <div className="w-full max-w-5xl space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Recipes</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Add recipes your way — paste it, grab it from a website, or Smart Scan a photo or document. Everything stays in your Local Vault.
          </p>
        </div>

        <Card className="rounded-3xl border bg-background shadow-lg shadow-black/5">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-2xl font-semibold tracking-tight">Quick Paste</CardTitle>
            <CardDescription className="text-muted-foreground">
              Paste a recipe below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 md:p-6 md:pt-0">
            <Textarea
              ref={quickPasteRef}
              value={bulkText}
              onChange={(e) => {
                const next = e.target.value;
                setBulkText(next);
                scheduleBulkParseFromChange(next);
              }}
              onPaste={bulkPasteAndParse}
              placeholder="Paste recipe text here…"
              className={cn(
                "min-h-[420px] rounded-2xl border bg-white px-5 py-4 text-lg leading-relaxed text-slate-900",
                "shadow-md shadow-black/10 placeholder:text-slate-400",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background",
                parsed ? "border-sky-500 ring-sky-500/30" : "border-slate-200",
                "dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:border-zinc-800",
              )}
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-3 z-[80]">
          <Button
            type="button"
            onClick={saveParsed}
            disabled={!canAddToCookbook}
            className={cn(
              "h-16 w-full rounded-2xl text-xl font-black tracking-wide shadow-2xl",
              // STRICT: bright orange + opacity-100 whenever there is any text in the box.
              hasAnyText
                ? "bg-orange-600 hover:bg-orange-600/90 text-white opacity-100 disabled:opacity-100"
                : "bg-muted text-muted-foreground shadow-none disabled:opacity-100",
            )}
          >
            ADD TO COOKBOOK
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
                    {selectedRecipe.source ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Citation: </span>
                        {selectedRecipe.source}
                      </p>
                    ) : null}
                    {selectedRecipe.comments ? (
                      <div className="max-w-2xl rounded-2xl border bg-muted/30 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family notes</p>
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{selectedRecipe.comments}</p>
                      </div>
                    ) : null}
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