/**
 * BEO Generator — Catering By Wendy
 *
 * Core logic for the Automated BEO Generator (/logistics/beo-generator).
 *
 * Three calculation engines:
 *  1. COGS — scales recipe ingredients to guest count, pulls market rates
 *     from competitor_pricing via matchIngredientMarketRate()
 *  2. Equipment Needs — derives rental items + estimated costs from
 *     guest count × service style × recipe count
 *  3. Run of Show — builds a precise day-of timeline backwards from
 *     service start time, scaled to event size
 *
 * Generated documents are saved to the `event_orders` Supabase table.
 */

import { get, set } from 'idb-keyval';
import { scaleAndConvertQuantity } from "@/store/cateringStore";
import type { Recipe, InventoryItem } from "@/store/cateringStore";
import {
  matchIngredientMarketRate,
  type CompetitorPrice,
} from "@/lib/competitorPricing";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceStyle = "plated" | "buffet" | "cocktail";

export interface COGSLineItem {
  ingredientName: string;
  scaledQuantity: number;
  unit: string;
  pricePerUnit: number;
  rateSource: "market_rate" | "inventory" | "estimate";
  rateLabel: string;
  lineCost: number;
}

export interface BEOMenuSection {
  recipeId: string;
  recipeName: string;
  category: string;
  description: string;
  originalYield: number;
  scaleFactor: number;
  cogsItems: COGSLineItem[];
  recipeCOGS: number;
}

export type EquipmentCategory = "seating" | "tableware" | "kitchen" | "bar";

export interface EquipmentItem {
  item: string;
  qty: number;
  unit: string;
  rentalCostPerUnit: number;
  totalRentalCost: number;
  category: EquipmentCategory;
}

export interface RunOfShowEntry {
  time: string;
  task: string;
  owner: "Kitchen" | "FOH" | "Bar" | "Client" | "All";
  isKeyMoment?: boolean;
}

export interface BEODocument {
  id: string;
  beoNumber: string;
  status: "draft" | "sent" | "accepted";

  // Event
  eventName: string;
  eventDate: string;
  serviceTime: string;
  venueName: string;
  venueZip: string;
  serviceStyle: ServiceStyle;
  guestCount: number;
  specialInstructions: string;

  // Content
  menuSections: BEOMenuSection[];
  equipmentNeeds: EquipmentItem[];
  runOfShow: RunOfShowEntry[];

  // Financials
  totalCOGS: number;
  laborCost: number;
  equipmentCost: number;
  overheadCost: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  perPersonRate: number;

  generatedAt: string;
  generatedBy: string;
}

export interface BEOFormInput {
  eventName: string;
  eventDate: string;
  serviceTime: string;
  venueName: string;
  venueZip: string;
  serviceStyle: ServiceStyle;
  guestCount: number;
  recipeIds: string[];
  specialInstructions: string;
  taxRate: number;
  generatedBy?: string;
}

/** Lightweight row returned by fetchBEOHistory() */
export interface EventOrderRow {
  id: string;
  beo_number: string;
  event_name: string;
  event_date: string | null;
  service_time: string | null;
  venue_name: string | null;
  venue_zip: string | null;
  service_style: string;
  guest_count: number;
  cogs_total: number;
  total: number;
  per_person_rate: number;
  status: string;
  recipe_names: string[];
  created_at: string;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function getSupabaseCfg() {
  const normalize = (v: unknown) =>
    String(v ?? "").trim().replace(/^["']|["']$/g, "");
  const url = normalize(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = normalize(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const base = (() => {
    const raw = url.replace(/\/+$/, "");
    if (import.meta.env.DEV && typeof window !== "undefined") {
      return `${window.location.origin}/supabase`;
    }
    return raw;
  })();
  return { url, anonKey, base, enabled: Boolean(url && anonKey) };
}

async function sbFetch(path: string, init?: RequestInit): Promise<Response> {
  const cfg = getSupabaseCfg();
  if (!cfg.enabled) throw new Error("Supabase not configured.");
  return fetch(`${cfg.base}${path}`, {
    mode: "cors",
    ...init,
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

// ── BEO Number Generator ──────────────────────────────────────────────────────

let _beoSeq = Date.now() % 100000;

export function nextBEONumber(): string {
  _beoSeq = (_beoSeq + 1) % 1000000;
  const year = new Date().getFullYear();
  return `BEO-${year}-${String(_beoSeq).padStart(6, "0")}`;
}

// ── Servings parser ───────────────────────────────────────────────────────────

import type { Quantity } from "@/store/cateringStore";

function parseServings(q: Quantity | undefined): number {
  if (!q) return 1;
  return Number.isFinite(q.value) && q.value > 0 ? q.value : 1;
}

// ── 1. COGS Engine ────────────────────────────────────────────────────────────

/**
 * Scales every ingredient in a recipe to the requested guest count and
 * attaches a market-rate cost from the competitor_pricing Supabase table.
 * Falls back to inventory costPerUnit, then to a flat $2.50/unit estimate.
 */
function buildMenuSection(
  recipe: Recipe,
  guestCount: number,
  competitorData: CompetitorPrice[],
  inventory: InventoryItem[]
): BEOMenuSection {
  const originalYield = parseServings(recipe.servings);
  const scaleFactor = guestCount / Math.max(originalYield, 1);

  const cogsItems: COGSLineItem[] = recipe.ingredients.map((ing) => {
    // 1. Calculate raw un-converted scaled quantity for cost math
    const rawScaledQty = ing.quantity * scaleFactor;
    
    // 2. Calculate converted unit and quantity for display
    const { quantity: convertedQty, unit: convertedUnit } = scaleAndConvertQuantity(ing.quantity, ing.unit, scaleFactor);
    const scaledQty = round2(convertedQty);

    // Try live market rate first
    const mr = matchIngredientMarketRate(ing.name, competitorData);
    if (mr) {
      // cost based on raw un-converted quantity so price matches the original unit
      const cost = round2(rawScaledQty * mr.price_per_unit);
      return {
        ingredientName: ing.name,
        scaledQuantity: scaledQty,
        unit: convertedUnit,
        pricePerUnit: mr.price_per_unit, // Note: per original unit
        rateSource: "market_rate",
        rateLabel: mr.competitor_name ?? "Market Rate",
        lineCost: cost,
      };
    }

    // Fall back to inventory costPerUnit
    const invItem = inventory.find(
      (i) =>
        i.name.toLowerCase() === ing.name.toLowerCase() &&
        i.unit.toLowerCase() === ing.unit.toLowerCase()
    );
    if (invItem && invItem.costPerUnit > 0) {
      const cost = round2(rawScaledQty * invItem.costPerUnit);
      return {
        ingredientName: ing.name,
        scaledQuantity: scaledQty,
        unit: convertedUnit,
        pricePerUnit: invItem.costPerUnit, // Note: per original unit
        rateSource: "inventory",
        rateLabel: "Inventory Rate",
        lineCost: cost,
      };
    }

    // Flat estimate
    const estimated = round2(rawScaledQty * 2.5);
    return {
      ingredientName: ing.name,
      scaledQuantity: scaledQty,
      unit: convertedUnit,
      pricePerUnit: 2.5,
      rateSource: "estimate",
      rateLabel: "Est. $2.50/unit",
      lineCost: estimated,
    };
  });

  const recipeCOGS = round2(
    cogsItems.reduce((s, c) => s + c.lineCost, 0)
  );

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    category: recipe.category,
    description: recipe.description,
    originalYield,
    scaleFactor: round2(scaleFactor),
    cogsItems,
    recipeCOGS,
  };
}

// ── 2. Equipment Engine ───────────────────────────────────────────────────────

/** Rental cost table (USD) per unit — standard US foodservice rates 2026. */
const RENTAL_RATES: Record<string, number> = {
  "6-ft Round Table (seats 8)": 16,
  "8-ft Banquet Table": 12,
  "Folding Chair": 2.5,
  "Chair Pad / Cover": 1.5,
  "Table Linen (90\" round)": 24,
  "Napkin (cloth)": 0.75,
  "Dinner Plate": 0.85,
  "Salad / Starter Plate": 0.75,
  "Bread Plate": 0.6,
  "Soup Bowl": 0.75,
  "Dessert Plate": 0.6,
  "Dinner Fork": 0.5,
  "Salad Fork": 0.45,
  "Dinner Knife": 0.45,
  "Teaspoon": 0.4,
  "Dessert Spoon": 0.4,
  "Water Glass": 0.55,
  "Wine Glass (red)": 0.6,
  "Wine Glass (white)": 0.6,
  "Champagne Flute": 0.65,
  "Rocks Glass": 0.55,
  "Chafing Dish (full-size)": 22,
  "Chafing Dish (half-size)": 14,
  "Steam Table Pan (full)": 8,
  "Serving Spoon / Ladle": 2,
  "Serving Tongs": 1.5,
  "Sneeze Guard": 35,
  "Portable Bar (6-ft)": 175,
  "Bar Mat": 15,
  "High-Top Cocktail Table": 25,
  "Bar Stool": 5,
};

function eq(
  item: string,
  qty: number,
  category: EquipmentCategory
): EquipmentItem {
  const rate = RENTAL_RATES[item] ?? 5;
  return {
    item,
    qty,
    unit: "each",
    rentalCostPerUnit: rate,
    totalRentalCost: round2(qty * rate),
    category,
  };
}

/**
 * Derives equipment rental list from guest count, service style, and the
 * number of recipes being served.
 */
export function buildEquipmentNeeds(
  guestCount: number,
  serviceStyle: ServiceStyle,
  recipeCount: number
): EquipmentItem[] {
  const g = Math.max(1, guestCount);
  const buffer = (n: number, pct = 0.1) => Math.ceil(n * (1 + pct));

  if (serviceStyle === "plated") {
    const tables = Math.ceil(g / 8);
    const courses = Math.min(recipeCount, 4); // plated = 1 plate per course
    return [
      // Seating
      eq("6-ft Round Table (seats 8)", tables, "seating"),
      eq("Folding Chair", buffer(g), "seating"),
      eq("Chair Pad / Cover", buffer(g), "seating"),
      eq("Table Linen (90\" round)", tables, "seating"),
      eq("Napkin (cloth)", buffer(g), "seating"),
      // Tableware
      eq("Dinner Plate", buffer(g), "tableware"),
      eq("Salad / Starter Plate", buffer(g), "tableware"),
      eq("Bread Plate", g, "tableware"),
      ...(courses >= 3 ? [eq("Dessert Plate", g, "tableware")] : []),
      ...(courses >= 4 ? [eq("Soup Bowl", g, "tableware")] : []),
      eq("Dinner Fork", buffer(g), "tableware"),
      eq("Salad Fork", buffer(g), "tableware"),
      eq("Dinner Knife", buffer(g), "tableware"),
      eq("Teaspoon", buffer(g), "tableware"),
      eq("Water Glass", buffer(g), "tableware"),
      eq("Wine Glass (red)", g, "tableware"),
      eq("Wine Glass (white)", g, "tableware"),
      eq("Champagne Flute", g, "tableware"),
      // Kitchen service
      eq("Serving Tray", Math.ceil(g / 20), "kitchen"),
      // Bar
      eq("Portable Bar (6-ft)", Math.max(1, Math.ceil(g / 75)), "bar"),
      eq("Bar Mat", Math.max(1, Math.ceil(g / 75)), "bar"),
      eq("Rocks Glass", g, "bar"),
    ];
  }

  if (serviceStyle === "buffet") {
    const guestTables = Math.ceil(g / 8);
    const buffetTables = Math.max(2, Math.ceil(recipeCount / 3));
    return [
      // Seating
      eq("8-ft Banquet Table", guestTables + buffetTables, "seating"),
      eq("Folding Chair", buffer(g), "seating"),
      eq("Chair Pad / Cover", buffer(g), "seating"),
      eq("Table Linen (90\" round)", guestTables + buffetTables, "seating"),
      eq("Napkin (cloth)", buffer(g), "seating"),
      // Tableware
      eq("Dinner Plate", buffer(g, 0.25), "tableware"),
      eq("Salad / Starter Plate", buffer(g, 0.2), "tableware"),
      eq("Dinner Fork", buffer(g, 0.25), "tableware"),
      eq("Dinner Knife", buffer(g, 0.2), "tableware"),
      eq("Teaspoon", buffer(g), "tableware"),
      eq("Water Glass", buffer(g), "tableware"),
      eq("Wine Glass (red)", g, "tableware"),
      eq("Wine Glass (white)", g, "tableware"),
      // Kitchen / buffet
      eq("Chafing Dish (full-size)", recipeCount, "kitchen"),
      eq("Steam Table Pan (full)", recipeCount * 2, "kitchen"),
      eq("Serving Spoon / Ladle", recipeCount * 2, "kitchen"),
      eq("Serving Tongs", recipeCount, "kitchen"),
      eq("Sneeze Guard", Math.ceil(buffetTables / 2), "kitchen"),
      // Bar
      eq("Portable Bar (6-ft)", Math.max(1, Math.ceil(g / 75)), "bar"),
      eq("Rocks Glass", g, "bar"),
    ];
  }

  // cocktail
  const highTops = Math.max(4, Math.ceil(g / 4));
  return [
    eq("High-Top Cocktail Table", highTops, "seating"),
    eq("Bar Stool", highTops * 2, "seating"),
    // Tableware
    eq("Small Plate (6\")", buffer(g, 0.3), "tableware"),
    eq("Cocktail Napkin", g * 4, "tableware"),
    eq("Dinner Fork", g, "tableware"),
    eq("Rocks Glass", g, "bar"),
    eq("Wine Glass (red)", g, "bar"),
    eq("Champagne Flute", g, "bar"),
    // Kitchen
    eq("Chafing Dish (half-size)", recipeCount, "kitchen"),
    eq("Serving Tongs", recipeCount, "kitchen"),
    eq("Serving Spoon / Ladle", recipeCount, "kitchen"),
    // Bar
    eq("Portable Bar (6-ft)", Math.max(1, Math.ceil(g / 50)) + 1, "bar"),
    eq("Bar Mat", Math.max(1, Math.ceil(g / 50)) + 1, "bar"),
  ];
}

// ── 3. Run of Show Engine ─────────────────────────────────────────────────────

/** Parse "HH:MM" (24-h) → minutes since midnight */
function parseTime24(t: string): number {
  const [h, m] = (t || "18:00").split(":").map(Number);
  return (isFinite(h) ? h : 18) * 60 + (isFinite(m) ? m : 0);
}

/** Minutes since midnight → "H:MM AM/PM" */
function fmtTime(mins: number): string {
  const safe = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(safe / 60);
  const m = safe % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Generates a complete day-of timeline, with times calculated from the
 * service start time.  Scales prep windows to event size.
 */
export function buildRunOfShow(
  serviceTime: string,
  guestCount: number,
  serviceStyle: ServiceStyle
): RunOfShowEntry[] {
  const svc = parseTime24(serviceTime);
  const large = guestCount >= 150;
  const medium = guestCount >= 50 && guestCount < 150;

  // Prep window: large=360m, medium=210m, small=120m before service
  const prepOffset = large ? -360 : medium ? -240 : -120;

  const entries: RunOfShowEntry[] = [
    {
      time: fmtTime(svc + prepOffset),
      task: "Rental delivery arrives. Crew receives, counts, and stages all equipment.",
      owner: "FOH",
    },
    {
      time: fmtTime(svc + prepOffset + 30),
      task: "Kitchen crew arrives. Review BEO, confirm station assignments, begin prep.",
      owner: "Kitchen",
    },
  ];

  if (serviceStyle !== "cocktail") {
    entries.push({
      time: fmtTime(svc + (large ? -180 : medium ? -150 : -90)),
      task: "Front-of-house crew begins setup: tables, chairs, linens.",
      owner: "FOH",
    });
    entries.push({
      time: fmtTime(svc + (large ? -120 : medium ? -90 : -60)),
      task: "Table settings completed: china, silverware, glassware placed per BEO diagram.",
      owner: "FOH",
    });
  } else {
    entries.push({
      time: fmtTime(svc - 90),
      task: "Cocktail tables and stools positioned. Passed-appetizer stations staged.",
      owner: "FOH",
    });
  }

  if (serviceStyle === "buffet") {
    entries.push({
      time: fmtTime(svc - 75),
      task: "Buffet tables dressed. Chafing dishes filled with water and lit.",
      owner: "Kitchen",
    });
    entries.push({
      time: fmtTime(svc - 45),
      task: "Buffet stations loaded. Sneeze guards in place. Labels set.",
      owner: "Kitchen",
    });
  }

  entries.push({
    time: fmtTime(svc - 60),
    task: "Bar program staged and fully stocked. Ice loaded.",
    owner: "Bar",
  });

  entries.push({
    time: fmtTime(svc - 30),
    task: "Final food quality check. Plating garnishes and serving pieces confirmed.",
    owner: "Kitchen",
  });

  entries.push({
    time: fmtTime(svc - 15),
    task: "Walk-through with client or event coordinator. Confirm any last-minute adjustments.",
    owner: "All",
    isKeyMoment: true,
  });

  entries.push({
    time: fmtTime(svc),
    task: serviceStyle === "cocktail"
      ? "COCKTAIL HOUR BEGINS. Passed hors d'oeuvres circulating. Bar open."
      : serviceStyle === "buffet"
      ? "BUFFET OPENS. Guests directed to stations. Staff at positions."
      : "DOORS OPEN. Guests seated. Water service commences.",
    owner: "All",
    isKeyMoment: true,
  });

  if (serviceStyle === "plated") {
    entries.push({
      time: fmtTime(svc + 15),
      task: "First course service begins.",
      owner: "FOH",
    });
    entries.push({
      time: fmtTime(svc + 45),
      task: "First course cleared. Main course plated and fired.",
      owner: "Kitchen",
    });
    entries.push({
      time: fmtTime(svc + 75),
      task: "Main course service.",
      owner: "FOH",
    });
    entries.push({
      time: fmtTime(svc + 105),
      task: "Mains cleared. Dessert plates and coffee service.",
      owner: "FOH",
    });
  }

  const serviceDuration = serviceStyle === "cocktail" ? 120 : 180;

  entries.push({
    time: fmtTime(svc + serviceDuration),
    task: "SERVICE CONCLUDES. Bar closed. Kitchen begins consolidation.",
    owner: "All",
    isKeyMoment: true,
  });

  entries.push({
    time: fmtTime(svc + serviceDuration + 15),
    task: "Breakdown begins: food consolidated, leftover portioned, cold chain maintained.",
    owner: "Kitchen",
  });

  entries.push({
    time: fmtTime(svc + serviceDuration + 30),
    task: "Tables broken down. Linens removed and bagged for laundry.",
    owner: "FOH",
  });

  entries.push({
    time: fmtTime(svc + serviceDuration + (large ? 120 : medium ? 90 : 60)),
    task: "Venue cleared. Rental items staged for morning pickup. Final walk-through with venue staff.",
    owner: "All",
    isKeyMoment: true,
  });

  return entries;
}

// ── 4. Full BEO Document Generator ───────────────────────────────────────────

export function generateBEODocument(
  input: BEOFormInput,
  recipes: Recipe[],
  competitorData: CompetitorPrice[],
  inventory: InventoryItem[]
): BEODocument {
  const selectedRecipes = input.recipeIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is Recipe => Boolean(r));

  // Build menu sections + COGS
  const menuSections = selectedRecipes.map((r) =>
    buildMenuSection(r, input.guestCount, competitorData, inventory)
  );

  const totalCOGS = round2(
    menuSections.reduce((s, m) => s + m.recipeCOGS, 0)
  );

  // Equipment
  const equipmentNeeds = buildEquipmentNeeds(
    input.guestCount,
    input.serviceStyle,
    selectedRecipes.length
  );
  const equipmentCost = round2(
    equipmentNeeds.reduce((s, e) => s + e.totalRentalCost, 0)
  );

  // Run of show
  const runOfShow = buildRunOfShow(
    input.serviceTime,
    input.guestCount,
    input.serviceStyle
  );

  // Financials (standard catering cost structure)
  const laborCost = round2(totalCOGS * 0.35);     // 35% of COGS
  const overheadCost = round2((totalCOGS + laborCost) * 0.1); // 10% overhead
  const subtotal = round2(totalCOGS + laborCost + equipmentCost + overheadCost);
  const taxRate = input.taxRate ?? 0.08;
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);
  const perPersonRate = input.guestCount > 0 ? round2(total / input.guestCount) : 0;

  return {
    id: crypto.randomUUID(),
    beoNumber: nextBEONumber(),
    status: "draft",

    eventName: input.eventName,
    eventDate: input.eventDate,
    serviceTime: input.serviceTime,
    venueName: input.venueName,
    venueZip: input.venueZip,
    serviceStyle: input.serviceStyle,
    guestCount: input.guestCount,
    specialInstructions: input.specialInstructions,

    menuSections,
    equipmentNeeds,
    runOfShow,

    totalCOGS,
    laborCost,
    equipmentCost,
    overheadCost,
    subtotal,
    taxRate,
    taxAmount,
    total,
    perPersonRate,

    generatedAt: new Date().toISOString(),
    generatedBy: input.generatedBy ?? "system",
  };
}

// ── 5. Local persistence ───────────────────────────────────────────────────

const BEO_HISTORY_KEY = 'nbs_beo_history';

/** Saves a generated BEO document to the local database. */
export async function saveBEOToSupabase(
  doc: BEODocument,
  competitorDataSnapshot: CompetitorPrice[]
): Promise<void> {
  const row = {
    id: doc.id,
    beo_number: doc.beoNumber,
    status: doc.status,
    event_name: doc.eventName,
    event_date: doc.eventDate || null,
    service_time: doc.serviceTime || null,
    venue_name: doc.venueName || null,
    venue_zip: doc.venueZip || null,
    service_style: doc.serviceStyle,
    guest_count: doc.guestCount,
    special_instructions: doc.specialInstructions || null,
    recipe_ids: doc.menuSections.map((m) => m.recipeId),
    recipe_names: doc.menuSections.map((m) => m.recipeName),
    cogs_total: doc.totalCOGS,
    labor_cost: doc.laborCost,
    equipment_cost: doc.equipmentCost,
    overhead_cost: doc.overheadCost,
    subtotal: doc.subtotal,
    tax_rate: doc.taxRate,
    tax_amount: doc.taxAmount,
    total: doc.total,
    per_person_rate: doc.perPersonRate,
    itemized_menu: doc.menuSections,
    equipment_needs: doc.equipmentNeeds,
    run_of_show: doc.runOfShow,
    market_rate_snapshot: competitorDataSnapshot.map((c) => ({
      item_name: c.item_name,
      price_per_unit: c.price_per_unit,
      unit: c.unit,
      competitor_name: c.competitor_name,
      captured_at: c.captured_at,
    })),
    generated_by: doc.generatedBy,
    created_at: new Date().toISOString(),
  };

  const history = await get<EventOrderRow[]>(BEO_HISTORY_KEY) || [];
  history.unshift(row as any);
  await set(BEO_HISTORY_KEY, history.slice(0, 200));
}

/** Fetches BEO history (most recent 200) from local db. */
export async function fetchBEOHistory(): Promise<EventOrderRow[]> {
  try {
    const rows = await get<EventOrderRow[]>(BEO_HISTORY_KEY) || [];
    return rows.map((r) => ({
      ...r,
      cogs_total: Number(r.cogs_total ?? 0),
      total: Number(r.total ?? 0),
      per_person_rate: Number(r.per_person_rate ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches a single full event_order row by id and reconstructs a BEODocument.
 */
export async function fetchBEOById(id: string): Promise<BEODocument | null> {
  try {
    const rows = await get<any[]>(BEO_HISTORY_KEY) || [];
    const r = rows.find(row => row.id === id);
    if (!r) return null;

    return {
      id: r["id"] as string,
      beoNumber: r["beo_number"] as string,
      status: (r["status"] as string ?? "draft") as BEODocument["status"],

      eventName: (r["event_name"] as string) ?? "",
      eventDate: (r["event_date"] as string) ?? "",
      serviceTime: (r["service_time"] as string) ?? "",
      venueName: (r["venue_name"] as string) ?? "",
      venueZip: (r["venue_zip"] as string) ?? "",
      serviceStyle: (r["service_style"] as ServiceStyle) ?? "plated",
      guestCount: Number(r["guest_count"] ?? 0),
      specialInstructions: (r["special_instructions"] as string) ?? "",

      menuSections: (r["itemized_menu"] as BEOMenuSection[]) ?? [],
      equipmentNeeds: (r["equipment_needs"] as EquipmentItem[]) ?? [],
      runOfShow: (r["run_of_show"] as RunOfShowEntry[]) ?? [],

      totalCOGS: Number(r["cogs_total"] ?? 0),
      laborCost: Number(r["labor_cost"] ?? 0),
      equipmentCost: Number(r["equipment_cost"] ?? 0),
      overheadCost: Number(r["overhead_cost"] ?? 0),
      subtotal: Number(r["subtotal"] ?? 0),
      taxRate: Number(r["tax_rate"] ?? 0.08),
      taxAmount: Number(r["tax_amount"] ?? 0),
      total: Number(r["total"] ?? 0),
      perPersonRate: Number(r["per_person_rate"] ?? 0),

      generatedAt: (r["created_at"] as string) ?? new Date().toISOString(),
      generatedBy: (r["generated_by"] as string) ?? "system",
    };
  } catch {
    return null;
  }
}

/**
 * Saves the client's signature and marks the BEO as 'Signed'.
 * This PATCH fires a Realtime UPDATE event which triggers the gold pulse
 * on the Executive tab via the existing useAgentRealtime subscription.
 */
export async function signBEO(
  id: string,
  signatureData: string,
  signerName: string
): Promise<void> {
  const history = await get<any[]>(BEO_HISTORY_KEY) || [];
  const idx = history.findIndex(r => r.id === id);
  if (idx !== -1) {
    history[idx].status = "Signed";
    history[idx].signature_data = signatureData;
    history[idx].signer_name = signerName || null;
    history[idx].signed_at = new Date().toISOString();
    history[idx].updated_at = new Date().toISOString();
    await set(BEO_HISTORY_KEY, history);
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmt$(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

export function fmtServiceTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  if (!isFinite(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

export function styleLabel(s: ServiceStyle): string {
  return s === "plated"
    ? "Plated Dinner"
    : s === "buffet"
    ? "Buffet Service"
    : "Cocktail Reception";
}
