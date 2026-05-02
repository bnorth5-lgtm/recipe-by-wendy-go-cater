import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, ChevronRight, ArrowLeft } from "lucide-react";
import { formatQuantity, scaleAndConvertQuantity, Recipe } from "@/store/cateringStore";
import { LiveMarketBadge } from "@/components/LiveMarketBadge";
import { ScrollStory } from "@/components/ScrollStory";
import { prepareStripePayload } from "@/logic/PaymentOrchestrator";
import { cn } from "@/lib/utils";

interface RecipeNarrativeViewProps {
  recipe: Recipe;
  onClose: () => void;
  currentServings: number;
  setCurrentServings: (n: number) => void;
  originalYield: number;
  factor: number;
  totalEstimatedCost: number;
  paymentMethod: "CHECK" | "STRIPE";
  setPaymentMethod: (m: "CHECK" | "STRIPE") => void;
  paymentGate: any;
  totalWithFees: number;
  inventory: any[];
  getIngredientRate: (name: string) => any;
  formatMoney: (amount: number, currency?: string) => string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipeNarrativeView: React.FC<RecipeNarrativeViewProps> = ({
  recipe,
  onClose,
  currentServings,
  setCurrentServings,
  originalYield,
  factor,
  totalEstimatedCost,
  paymentMethod,
  setPaymentMethod,
  paymentGate,
  totalWithFees,
  inventory,
  getIngredientRate,
  formatMoney,
  scrollRef,
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showUnlockGlow, setShowUnlockGlow] = useState(false);

  const handleIngredientToggle = (idx: number) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setCheckedIngredients(newSet);
  };

  const allIngredientsChecked = recipe.ingredients.length > 0 && checkedIngredients.size === recipe.ingredients.length;

  useEffect(() => {
    if (allIngredientsChecked) {
      setShowUnlockGlow(true);
      const timer = setTimeout(() => setShowUnlockGlow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [allIngredientsChecked]);

  return (
    <>
      <ScrollStory storyText={recipe.comments || recipe.description} scrollRef={scrollRef} />
      <div className="flex-1 overflow-y-auto relative z-10 bg-background/60 backdrop-blur-xl" ref={scrollRef}>
        {/* Legacy Header: Full-width hero section */}
        <div className="w-full bg-slate-900 text-slate-50 py-16 px-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-900"></div>
          <div className="relative z-10 space-y-4 max-w-4xl mx-auto">
            <h1 
              className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-md"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {recipe.name}
            </h1>
            <p className="text-xl md:text-2xl text-amber-200/80 font-medium italic">
              {recipe.source || "A Stonington Tradition"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-slate-300">
              <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/20 text-amber-100">{recipe.category}</Badge>
              {recipe.prepTime.value > 0 ? <span className="text-sm">Prep {formatQuantity(recipe.prepTime)}</span> : null}
              {recipe.prepTime.value > 0 && recipe.cookTime.value > 0 ? <span>&middot;</span> : null}
              {recipe.cookTime.value > 0 ? <span className="text-sm">Cook {formatQuantity(recipe.cookTime)}</span> : null}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12 max-w-6xl mx-auto">
          {/* Victus Scaling & Costing / Sidebar replaced by inline top section to focus narrative */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-semibold">The Prelude</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {recipe.description}
              </p>
            </div>
            <div className="min-w-[280px] rounded-2xl border bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/30 p-6 space-y-5 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Victus Scaling</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {formatMoney(totalWithFees, recipe.currency ?? "USD")}
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Guest count</p>
                  </div>
                  <div className="w-[100px]">
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
                      className="h-9 text-base"
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
              </div>
            </div>
          </div>

          <Separator />

          {/* Interactive Mise en Place */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Interactive Mise en Place</h3>
              <p className="text-muted-foreground">Tap each ingredient as you gather it to unlock the preparation steps.</p>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recipe.ingredients.map((ing, idx) => {
                const { quantity: convertedQty, unit: convertedUnit } = scaleAndConvertQuantity(
                  ing.quantity, 
                  ing.unit, 
                  Number.isFinite(factor) ? factor : 1
                );
                const scaledQty = convertedQty;
                const isIngredientInInventory = inventory.some(
                  (item) =>
                    item.name.toLowerCase() === ing.name.toLowerCase() &&
                    item.unit.toLowerCase() === ing.unit.toLowerCase()
                );
                const marketRate = getIngredientRate(ing.name);
                const isChecked = checkedIngredients.has(idx);

                return (
                  <div 
                    key={idx} 
                    onClick={() => handleIngredientToggle(idx)}
                    className={cn(
                      "flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                      isChecked 
                        ? "border-[#fbbf24]/50 bg-amber-50/50 dark:bg-amber-900/20 opacity-40 grayscale-[0.5]" 
                        : "border-border/50 bg-card hover:border-[#fbbf24]/80 hover:shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className={cn("font-semibold text-lg truncate transition-all duration-300", isChecked && "line-through")}>
                          {ing.name}
                        </p>
                        <p className={cn("text-sm text-muted-foreground transition-all duration-300", isChecked && "line-through")}>
                          {scaledQty.toFixed(scaledQty < 10 ? 2 : 1)} {convertedUnit}
                        </p>
                      </div>
                      <div 
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 transition-all duration-300",
                          isChecked 
                            ? "bg-[#fbbf24] border-[#fbbf24] text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.8)]" 
                            : "border-muted-foreground/30 text-transparent"
                        )}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-2">
                      {marketRate && <LiveMarketBadge rate={marketRate} />}
                      {!isIngredientInInventory ? (
                        <Badge variant="destructive" className="shrink-0 text-[10px]">
                          <AlertCircle className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stepper Logic for Instructions */}
          <div className={cn(
            "transition-all duration-1000 ease-in-out transform origin-top",
            allIngredientsChecked ? "opacity-100 scale-y-100 h-auto" : "opacity-0 scale-y-0 h-0 overflow-hidden"
          )}>
            <Separator className="my-12" />
            <div className={cn(
              "space-y-8 transition-all duration-1000 rounded-3xl p-4 sm:p-8",
              showUnlockGlow ? "shadow-[0_0_60px_rgba(234,179,8,0.4)] ring-1 ring-[#fbbf24] bg-[#fbbf24]/5" : ""
            )}>
              <h3 className="text-3xl font-semibold tracking-tight text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>The Method</h3>
              
              <div className="space-y-6 max-w-3xl mx-auto">
                {recipe.instructions.map((inst, idx) => {
                  const isActive = idx === activeStep;
                  const isPast = idx < activeStep;
                  
                  return (
                    <motion.div 
                      key={idx}
                      layout
                      initial={false}
                      animate={{
                        scale: isActive ? 1.05 : isPast ? 0.95 : 0.95,
                        opacity: isActive ? 1 : isPast ? 0.6 : 0.4,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "p-6 rounded-2xl border-2 relative overflow-hidden",
                        isActive 
                          ? "border-[#fbbf24] bg-card shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-[#fbbf24]/50 z-10" 
                          : isPast
                            ? "border-border/40 bg-card/50"
                            : "border-border/40 bg-card/30 blur-[2px]"
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#fbbf24] shadow-[0_0_8px_rgba(234,179,8,1)]"></div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 transition-colors",
                            isActive ? "bg-[#fbbf24] text-slate-900" : isPast ? "bg-muted-foreground/30 text-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={cn(
                            "text-lg leading-relaxed",
                            isActive ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {inst.step}
                          </p>
                          
                          {isActive && (
                            <div className="mt-6 flex justify-end">
                              {idx < recipe.instructions.length - 1 ? (
                                <Button 
                                  onClick={() => setActiveStep(idx + 1)}
                                  className="bg-slate-900 text-[#fbbf24] hover:bg-slate-800 border border-[#fbbf24]/30 shadow-[0_0_12px_rgba(234,179,8,0.3)] hover:shadow-[0_0_16px_rgba(234,179,8,0.5)] transition-all"
                                >
                                  Next Step <ChevronRight className="ml-1 w-4 h-4" />
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-lg">
                                  <Check className="w-6 h-6 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" /> 
                                  Ready to Serve
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className={cn(
                "text-center mt-16 transition-all duration-1000",
                activeStep === recipe.instructions.length - 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <p className="text-[#fbbf24] italic font-serif text-lg tracking-wide drop-shadow-sm">
                  Legacy Preserved — {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 flex justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full px-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-2 border-slate-200 dark:border-slate-800 shadow-lg"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Vault
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
