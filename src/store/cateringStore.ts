"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format, isFuture, parseISO, addDays, addMonths } from "date-fns"; // Import date-fns for date handling

// Helper to parse quantity strings from initial data for conversion
const parseQuantityAndUnit = (quantityString: string): { quantity: number; unit: string } => {
  const trimmed = quantityString.trim();
  const parts = trimmed.split(' ');

  // Handle cases like "1 lb", "0.5 quart"
  if (parts.length >= 2) {
    const num = parseFloat(parts[0]);
    if (!isNaN(num)) {
      const unit = parts.slice(1).join(' ').toLowerCase();
      return { quantity: num, unit: unit };
    }
  }

  // Handle cases like "20 count", "10 leaves" where unit is part of the string
  const unitMap: { [key: string]: string } = {
    "lb": "lb", "lbs": "lb",
    "oz": "oz",
    "cup": "cup", "cups": "cup",
    "quart": "quart", "quarts": "quart",
    "gallon": "gallon", "gallons": "gallon",
    "fl oz": "fl oz", "fluid oz": "fl oz",
    "tsp": "tsp", "teaspoon": "tsp", "teaspoons": "tsp",
    "tbsp": "tbsp", "tablespoon": "tbsp", "tablespoons": "tbsp",
    "count": "count", "counts": "count",
    "bottle": "bottle", "bottles": "bottle",
    "can": "can", "cans": "can",
    "box": "box", "boxes": "box",
    "unit": "unit", "units": "unit",
    "chair": "chair", "chairs": "chair",
    "table": "table", "tables": "table",
    "plate": "plate", "plates": "plate",
    "piece": "piece", "pieces": "piece",
    "glass": "glass", "glasses": "glass",
    "linen": "linen", "linens": "linen",
    "napkin": "napkin", "napkins": "napkin",
    "head": "head", "heads": "head",
    "bunch": "bunch", "bunches": "bunch",
    "pack": "pack", "packs": "pack",
    "sprig": "sprig", "sprigs": "sprig",
    "leaves": "leaves", "leaf": "leaves",
    "cube": "cube", "cubes": "cube",
    "dash": "dash", "dashes": "dash",
    "slice": "slice", "slices": "slice",
    "patty": "patty", "patties": "patty",
    "chop": "chop", "chops": "chop",
    "fillet": "fillet", "fillets": "fillet",
    "whole": "whole",
    "half": "half", "halves": "half",
  };

  for (const key in unitMap) {
    if (trimmed.endsWith(key)) {
      const numPart = trimmed.substring(0, trimmed.length - key.length).trim();
      const num = parseFloat(numPart);
      if (!isNaN(num)) {
        return { quantity: num, unit: unitMap[key] };
      }
    }
  }

  // If no unit found, assume it's a count or a generic unit
  const numOnly = parseFloat(trimmed);
  if (!isNaN(numOnly)) {
    return { quantity: numOnly, unit: "count" }; // Default to 'count'
  }

  // Fallback for very ambiguous cases, assume 1 and use the whole string as unit
  return { quantity: 1, unit: trimmed.toLowerCase() };
};


// Define the schema for a single ingredient within a recipe
export interface RecipeIngredient {
  name: string;
  quantity: number; // Changed to number
  unit: string;    // Added unit
}

// Define the schema for a single instruction step within a recipe
export interface RecipeInstruction {
  step: string;
}

// Define the main schema for a recipe
export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  category: "Appetizer" | "Main Course" | "Dessert" | "Alcoholic Beverage" | "Non-Alcoholic Beverage" | "Side Dish" | "Breakfast" | "Vegetarian Main" | "Other";
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  sourceUrl?: string; // Added for recipe import simulation
  baseCost: number; // New: Base cost for the recipe
}

// Define the schema for an inventory item (now includes all types of items)
export interface InventoryItem {
  id: string;
  name: string;
  category: "Food Ingredient" | "Beverage" | "Furniture" | "Tableware" | "Silverware" | "Glassware" | "Linens" | "Serving Equipment" | "Other";
  currentStock: number;
  unit: string; // e.g., "lb", "fl oz", "count", "bottle", "chair", "set"
  lowStockThreshold: number;
  costPerUnit: number; // Cost per unit for inventory tracking
  markupPercentage: number; // NEW: Markup percentage for profit (e.g., 0.20 for 20%)
}

// Define the schema for a client
export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

// Define the schema for an item within a proposal (recipe or direct inventory item)
export interface ProposalItem {
  id: string; // ID of the recipe or inventory item
  type: "recipe" | "inventoryItem"; // Changed from "beverage" to "inventoryItem"
  name: string;
  quantity: number; // How many servings/units of this item
  unitCost: number; // Cost per serving/unit at the time of proposal
  totalCost: number; // quantity * unitCost
}

// Define the main schema for a proposal
export interface Proposal {
  id: string;
  clientId: string; // Link to Client
  eventName: string;
  eventDate: string; // Storing as string for simplicity, can be Date object
  numberOfGuests: number;
  items: ProposalItem[]; // Recipes and inventory items included
  laborCost: number;
  equipmentCost: number;
  otherCosts: number;
  subtotal: number;
  taxRate: number; // e.g., 0.08 for 8%
  totalAmount: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Archived";
  termsAndConditions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Define the schema for an event booking
export interface EventBooking {
  id: string;
  eventName: string;
  clientName: string;
  eventDate: string; // Storing as string for simplicity, can be Date object
  numberOfGuests: number;
  selectedRecipeIds: string[]; // IDs of recipes used for this event
  status: "pending" | "completed" | "cancelled";
  proposalId?: string; // NEW: Link to the originating proposal
}

// Define the schema for an Estimate
export interface Estimate {
  id: string;
  eventName: string;
  numberOfGuests: number;
  items: ProposalItem[]; // Reusing ProposalItem for consistency
  laborCost: number;
  equipmentCost: number;
  otherCosts: number;
  subtotal: number;
  taxRate: number;
  totalAmount: number;
  createdAt: string; // To track when the estimate was created
  updatedAt: string; // To track when the estimate was last updated
}

// NEW: Define the schema for a Menu
export interface Menu {
  id: string;
  name: string;
  description: string;
  category: "Wedding" | "Corporate" | "Seasonal" | "Buffet" | "Plated" | "Other";
  appetizerIds: string[];
  mainCourseIds: string[];
  dessertIds: string[];
  alcoholicBeverageIds: string[];
  nonAlcoholicBeverageIds: string[];
  sideDishIds: string[];
  createdAt: string;
  updatedAt: string;
}

// NEW: Define the schema for a Note
export interface Note {
  id: string;
  content: string;
  timestamp: string; // ISO string
}

// NEW: Define the schema for a Critical Task
export interface CriticalTask {
  id: string;
  content: string;
}

interface CateringState {
  inventory: InventoryItem[];
  recipes: Recipe[];
  bookings: EventBooking[];
  clients: Client[]; // New: Clients state
  proposals: Proposal[]; // New: Proposals state
  estimates: Estimate[]; // Estimates state
  menus: Menu[]; // NEW: Menus state
  notes: Note[]; // NEW: Notes state
  criticalTasks: CriticalTask[]; // NEW: Critical Tasks state

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  deductInventory: (recipeId: string) => boolean; // Returns true if deduction successful, false otherwise
  deductInventoryItem: (itemId: string, quantity: number) => boolean; // For direct inventory item deduction

  addRecipe: (recipe: Omit<Recipe, 'id' | 'baseCost'>) => void; // baseCost is calculated
  updateRecipe: (recipe: Omit<Recipe, 'baseCost'>) => void; // baseCost is calculated
  deleteRecipe: (id: string) => void;

  addBooking: (booking: Omit<EventBooking, 'id' | 'status'>) => void;
  updateBooking: (booking: EventBooking) => void;
  deleteBooking: (id: string) => void;
  completeBooking: (id: string) => boolean; // Returns true if completed and inventory deducted, false otherwise

  // Client actions
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  // Proposal actions
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'totalAmount'>) => void;
  updateProposal: (proposal: Proposal) => void;
  deleteProposal: (id: string) => void;

  // Estimate actions
  addEstimate: (estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'totalAmount'>) => void;
  updateEstimate: (estimate: Estimate) => void;
  deleteEstimate: (id: string) => void;

  // NEW: Menu actions
  addMenu: (menu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMenu: (menu: Menu) => void;
  deleteMenu: (id: string) => void;

  // NEW: Note actions
  addNote: (content: string) => void;
  updateNote: (id: string, content: string) => void; // NEW: Update note action
  deleteNote: (id: string) => void;

  // NEW: Critical Task actions
  addCriticalTask: (content: string) => void;
  updateCriticalTask: (id: string, content: string) => void;
  deleteCriticalTask: (id: string) => void;
}

const initialInventory: InventoryItem[] = [
  // Food Ingredients - Beef
  { id: "1", name: "Beef Sirloin", category: "Food Ingredient", currentStock: 30, unit: "lb", lowStockThreshold: 5, costPerUnit: 10.50, markupPercentage: 0.20 },
  { id: "1a", name: "Beef Sirloin", category: "Food Ingredient", currentStock: 40, unit: "8oz cut", lowStockThreshold: 10, costPerUnit: (10.50 / 16) * 8, markupPercentage: 0.20 },
  { id: "1b", name: "Beef Sirloin", category: "Food Ingredient", currentStock: 30, unit: "12oz cut", lowStockThreshold: 8, costPerUnit: (10.50 / 16) * 12, markupPercentage: 0.20 },
  { id: "1c", name: "Beef Sirloin", category: "Food Ingredient", currentStock: 20, unit: "16oz cut", lowStockThreshold: 5, costPerUnit: 10.50, markupPercentage: 0.20 },
  { id: "25a", name: "Filet Mignon", category: "Food Ingredient", currentStock: 20, unit: "8oz cut", lowStockThreshold: 4, costPerUnit: (23.00 / 16) * 8, markupPercentage: 0.25 },
  { id: "25b", name: "Filet Mignon", category: "Food Ingredient", currentStock: 15, unit: "12oz cut", lowStockThreshold: 3, costPerUnit: (23.00 / 16) * 12, markupPercentage: 0.25 },
  { id: "25c", name: "Filet Mignon", category: "Food Ingredient", currentStock: 10, unit: "16oz cut", lowStockThreshold: 2, costPerUnit: (23.00 / 16) * 16, markupPercentage: 0.25 },
  { id: "98a", name: "Top Round Roast", category: "Food Ingredient", currentStock: 25, unit: "8oz cut", lowStockThreshold: 5, costPerUnit: (8.50 / 16) * 8, markupPercentage: 0.20 },
  { id: "98b", name: "Top Round Roast", category: "Food Ingredient", currentStock: 20, unit: "12oz cut", lowStockThreshold: 4, costPerUnit: (8.50 / 16) * 12, markupPercentage: 0.20 },
  { id: "98c", name: "Top Round Roast", category: "Food Ingredient", currentStock: 15, unit: "16oz cut", lowStockThreshold: 3, costPerUnit: (8.50 / 16) * 16, markupPercentage: 0.20 },
  { id: "99a", name: "Strip Steak", category: "Food Ingredient", currentStock: 20, unit: "8oz cut", lowStockThreshold: 4, costPerUnit: (20.00 / 16) * 8, markupPercentage: 0.25 },
  { id: "99b", name: "Strip Steak", category: "Food Ingredient", currentStock: 18, unit: "12oz cut", lowStockThreshold: 4, costPerUnit: (20.00 / 16) * 12, markupPercentage: 0.25 },
  { id: "99c", name: "Strip Steak", category: "Food Ingredient", currentStock: 15, unit: "16oz cut", lowStockThreshold: 3, costPerUnit: (20.00 / 16) * 16, markupPercentage: 0.25 },
  { id: "100a", name: "Rib-Eye Steak", category: "Food Ingredient", currentStock: 15, unit: "8oz cut", lowStockThreshold: 3, costPerUnit: (26.00 / 16) * 8, markupPercentage: 0.25 },
  { id: "100b", name: "Rib-Eye Steak", category: "Food Ingredient", currentStock: 12, unit: "12oz cut", lowStockThreshold: 2, costPerUnit: (26.00 / 16) * 12, markupPercentage: 0.25 },
  { id: "100c", name: "Rib-Eye Steak", category: "Food Ingredient", currentStock: 10, unit: "16oz cut", lowStockThreshold: 2, costPerUnit: (26.00 / 16) * 16, markupPercentage: 0.25 },
  { id: "101", name: "Ground Beef (80/20)", category: "Food Ingredient", currentStock: 40, unit: "lb", lowStockThreshold: 10, costPerUnit: 5.50, markupPercentage: 0.20 },
  { id: "124", name: "Hamburger Patty", category: "Food Ingredient", currentStock: 50, unit: "6oz patty", lowStockThreshold: 15, costPerUnit: (5.50 / 16) * 6, markupPercentage: 0.20 },
  { id: "125", name: "Hamburger Patty", category: "Food Ingredient", currentStock: 40, unit: "8oz patty", lowStockThreshold: 10, costPerUnit: (5.50 / 16) * 8, markupPercentage: 0.20 },
  { id: "126", name: "Hamburger Patty", category: "Food Ingredient", currentStock: 25, unit: "12oz patty", lowStockThreshold: 5, costPerUnit: (5.50 / 16) * 12, markupPercentage: 0.20 },

  // Food Ingredients - Chicken
  { id: "102a", name: "Chicken Breast", category: "Food Ingredient", currentStock: 100, unit: "7oz breast", lowStockThreshold: 20, costPerUnit: (4.50 / 16) * 7, markupPercentage: 0.20 }, // Assuming average 7oz per breast
  { id: "103", name: "Chicken Half", category: "Food Ingredient", currentStock: 20, unit: "1.5lb half", lowStockThreshold: 5, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "104", name: "Whole Chicken", category: "Food Ingredient", currentStock: 15, unit: "3lb whole", lowStockThreshold: 3, costPerUnit: 8.00, markupPercentage: 0.20 },
  { id: "105a", name: "Chicken Thighs", category: "Food Ingredient", currentStock: 60, unit: "serving", lowStockThreshold: 12, costPerUnit: (3.00 / 16) * 8, markupPercentage: 0.20 },
  { id: "106a", name: "Chicken Wings", category: "Food Ingredient", currentStock: 50, unit: "serving", lowStockThreshold: 10, costPerUnit: 4.50, markupPercentage: 0.20 },
  { id: "107a", name: "Ground Chicken", category: "Food Ingredient", currentStock: 20, unit: "8oz serving", lowStockThreshold: 4, costPerUnit: (5.00 / 16) * 8, markupPercentage: 0.20 },
  { id: "107b", name: "Ground Chicken", category: "Food Ingredient", currentStock: 15, unit: "10oz serving", lowStockThreshold: 3, costPerUnit: (5.00 / 16) * 10, markupPercentage: 0.20 },
  { id: "107c", name: "Ground Chicken", category: "Food Ingredient", currentStock: 10, unit: "12oz serving", lowStockThreshold: 2, costPerUnit: (5.00 / 16) * 12, markupPercentage: 0.20 },
  { id: "108", name: "Turkey Breast", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 6.00, markupPercentage: 0.20 },

  // Food Ingredients - Pork
  { id: "32", name: "Pork Loin", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 6.50, markupPercentage: 0.20 },
  { id: "32a", name: "Pork Loin", category: "Food Ingredient", currentStock: 30, unit: "8oz cut", lowStockThreshold: 6, costPerUnit: (6.50 / 16) * 8, markupPercentage: 0.20 },
  { id: "132", name: "Pork Chop", category: "Food Ingredient", currentStock: 20, unit: "10oz chop", lowStockThreshold: 4, costPerUnit: (5.00 / 16) * 10, markupPercentage: 0.20 }, // Assuming raw pork chop at $5.00/lb
  { id: "109", name: "Pulled Pork", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 9.00, markupPercentage: 0.20 },
  { id: "110", name: "Bacon", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 7.50, markupPercentage: 0.20 },
  { id: "111", name: "Ham", category: "Food Ingredient", currentStock: 8, unit: "lb", lowStockThreshold: 1, costPerUnit: 6.00, markupPercentage: 0.20 },
  { id: "112", name: "Sausage", category: "Food Ingredient", currentStock: 12, unit: "lb", lowStockThreshold: 3, costPerUnit: 4.50, markupPercentage: 0.20 },
  { id: "113", name: "Pork Shoulder", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 3.50, markupPercentage: 0.20 },
  { id: "127", name: "Hotdogs", category: "Food Ingredient", currentStock: 100, unit: "count", lowStockThreshold: 20, costPerUnit: 0.75, markupPercentage: 0.20 },

  // Food Ingredients - Lamb
  { id: "128", name: "Lamb Chops", category: "Food Ingredient", currentStock: 30, unit: "count", lowStockThreshold: 5, costPerUnit: 8.00, markupPercentage: 0.25 },
  { id: "129", name: "Ground Lamb", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 9.50, markupPercentage: 0.20 },

  // Food Ingredients - Seafood
  { id: "3", name: "Salmon Fillets", category: "Food Ingredient", currentStock: 20, unit: "lb", lowStockThreshold: 4, costPerUnit: 12.00, markupPercentage: 0.25 },
  { id: "133", name: "Haddock", category: "Food Ingredient", currentStock: 30, unit: "6oz fillet", lowStockThreshold: 6, costPerUnit: (10.00 / 16) * 6, markupPercentage: 0.20 }, // Assuming raw haddock at $10.00/lb
  { id: "134", name: "Haddock", category: "Food Ingredient", currentStock: 25, unit: "8oz fillet", lowStockThreshold: 5, costPerUnit: (10.00 / 16) * 8, markupPercentage: 0.20 },
  { id: "135", name: "Haddock", category: "Food Ingredient", currentStock: 20, unit: "10oz fillet", lowStockThreshold: 4, costPerUnit: (10.00 / 16) * 10, markupPercentage: 0.20 },
  { id: "41", name: "Shrimp (Peeled & Deveined)", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 15.00, markupPercentage: 0.25 },
  { id: "136", name: "Shrimp (Small)", category: "Food Ingredient", currentStock: 500, unit: "count", lowStockThreshold: 100, costPerUnit: 8.00 / 55, markupPercentage: 0.20 }, // Avg 55 per lb
  { id: "137", name: "Shrimp (Medium)", category: "Food Ingredient", currentStock: 350, unit: "count", lowStockThreshold: 70, costPerUnit: 10.00 / 35, markupPercentage: 0.20 }, // Avg 35 per lb
  { id: "138", name: "Shrimp (Large)", category: "Food Ingredient", currentStock: 200, unit: "count", lowStockThreshold: 40, costPerUnit: 12.00 / 23, markupPercentage: 0.20 }, // Avg 23 per lb
  { id: "139", name: "Shrimp", category: "Food Ingredient", currentStock: 50, unit: "serving", lowStockThreshold: 10, costPerUnit: (8.00 / 55) * 10, markupPercentage: 0.20 },
  { id: "140", name: "Shrimp", category: "Food Ingredient", currentStock: 40, unit: "serving", lowStockThreshold: 8, costPerUnit: (10.00 / 35) * 8, markupPercentage: 0.20 },
  { id: "141", name: "Shrimp", category: "Food Ingredient", currentStock: 30, unit: "serving", lowStockThreshold: 6, costPerUnit: (12.00 / 23) * 5, markupPercentage: 0.20 },
  { id: "114", name: "Cod", category: "Food Ingredient", currentStock: 8, unit: "lb", lowStockThreshold: 2, costPerUnit: 9.00, markupPercentage: 0.20 },
  { id: "115", name: "Smoked Salmon", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 22.00, markupPercentage: 0.25 },
  { id: "116", name: "Tuna (Fresh)", category: "Food Ingredient", currentStock: 7, unit: "lb", lowStockThreshold: 1, costPerUnit: 18.00, markupPercentage: 0.25 },
  { id: "117", name: "Oysters", category: "Food Ingredient", currentStock: 50, unit: "count", lowStockThreshold: 10, costPerUnit: 1.25, markupPercentage: 0.30 },

  // Food Ingredients - Vegetarian/Vegan Proteins
  { id: "118", name: "Tofu (Firm)", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "119", name: "Tempeh", category: "Food Ingredient", currentStock: 8, unit: "lb", lowStockThreshold: 2, costPerUnit: 4.50, markupPercentage: 0.20 },
  { id: "120", name: "Chickpeas (Dried)", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 1.50, markupPercentage: 0.20 },
  { id: "121", name: "Black Beans (Dried)", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 1.40, markupPercentage: 0.20 },
  { id: "122", name: "Lentils (Green)", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 1.60, markupPercentage: 0.20 },
  { id: "123", name: "Nutritional Yeast", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 10.00, markupPercentage: 0.20 },

  // Other Food Ingredients (existing)
  { id: "4", name: "Mixed Salad Greens", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 1.59, markupPercentage: 0.20 },
  { id: "5", name: "Potatoes", category: "Food Ingredient", currentStock: 100, unit: "lb", lowStockThreshold: 20, costPerUnit: 0.54, markupPercentage: 0.20 },
  { id: "130", name: "Baked Potato", category: "Food Ingredient", currentStock: 50, unit: "10oz count", lowStockThreshold: 10, costPerUnit: 1.00, markupPercentage: 0.20 },
  { id: "131", name: "French Fries", category: "Food Ingredient", currentStock: 75, unit: "serving", lowStockThreshold: 15, costPerUnit: 1.50, markupPercentage: 0.20 },
  { id: "142", name: "Mashed Potato", category: "Food Ingredient", currentStock: 60, unit: "serving", lowStockThreshold: 12, costPerUnit: 1.20, markupPercentage: 0.20 }, // Estimated cost per serving
  { id: "6", name: "Onions", category: "Food Ingredient", currentStock: 40, unit: "lb", lowStockThreshold: 8, costPerUnit: 0.36, markupPercentage: 0.20 },
  { id: "7", name: "Carrots", category: "Food Ingredient", currentStock: 35, unit: "lb", lowStockThreshold: 7, costPerUnit: 0.41, markupPercentage: 0.20 },
  { id: "8", name: "All-Purpose Flour", category: "Food Ingredient", currentStock: 25, unit: "lb", lowStockThreshold: 5, costPerUnit: 0.45, markupPercentage: 0.20 },
  { id: "9", name: "Sugar", category: "Food Ingredient", currentStock: 20, unit: "lb", lowStockThreshold: 4, costPerUnit: 0.32, markupPercentage: 0.20 },
  { id: "10", name: "Olive Oil", category: "Food Ingredient", currentStock: 10, unit: "quart", lowStockThreshold: 2, costPerUnit: 8.00, markupPercentage: 0.20 },
  { id: "11", name: "Heavy Cream", category: "Food Ingredient", currentStock: 8, unit: "quart", lowStockThreshold: 1, costPerUnit: 4.50, markupPercentage: 0.20 },
  { id: "12", name: "Eggs", category: "Food Ingredient", currentStock: 120, unit: "count", lowStockThreshold: 24, costPerUnit: 0.20, markupPercentage: 0.20 },
  { id: "13", name: "Parmesan Cheese", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 8.16, markupPercentage: 0.20 },
  { id: "14", name: "Tomatoes (Canned)", category: "Food Ingredient", currentStock: 30, unit: "can", lowStockThreshold: 6, costPerUnit: 1.10, markupPercentage: 0.20 },
  { id: "15", name: "Rice (Basmati)", category: "Food Ingredient", currentStock: 50, unit: "lb", lowStockThreshold: 10, costPerUnit: 1.13, markupPercentage: 0.20 },
  { id: "16", name: "Fresh Dill", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50, markupPercentage: 0.20 },
  { id: "17", name: "Fresh Parsley", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.00, markupPercentage: 0.20 },
  { id: "18", name: "Fresh Thyme", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50, markupPercentage: 0.20 },
  { id: "19", name: "Lemon", category: "Food Ingredient", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.75, markupPercentage: 0.20 },
  { id: "20", name: "Garlic", category: "Food Ingredient", currentStock: 30, unit: "head", lowStockThreshold: 6, costPerUnit: 0.50, markupPercentage: 0.20 },
  { id: "21", name: "Cremini Mushrooms", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 3.63, markupPercentage: 0.20 },
  { id: "22", name: "Marsala Wine (cooking)", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 10.00, markupPercentage: 0.20 },
  { id: "23", name: "Chicken Broth", category: "Food Ingredient", currentStock: 20, unit: "quart", lowStockThreshold: 4, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "24", name: "Butter", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 5.44, markupPercentage: 0.20 },
  { id: "26", name: "Shallots", category: "Food Ingredient", currentStock: 8, unit: "lb", lowStockThreshold: 2, costPerUnit: 3.18, markupPercentage: 0.20 },
  { id: "27", name: "Fresh Rosemary", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "28", name: "Arborio Rice", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 1.81, markupPercentage: 0.20 },
  { id: "29", name: "Mixed Wild Mushrooms", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 11.34, markupPercentage: 0.20 },
  { id: "30", name: "Vegetable Broth", category: "Food Ingredient", currentStock: 20, unit: "quart", lowStockThreshold: 4, costPerUnit: 2.50, markupPercentage: 0.20 },
  { id: "31", name: "Dry White Wine (cooking)", category: "Food Ingredient", currentStock: 5, unit: "bottle", lowStockThreshold: 1, costPerUnit: 10.00, markupPercentage: 0.20 },
  { id: "33", name: "Apples (Granny Smith)", category: "Food Ingredient", currentStock: 25, unit: "count", lowStockThreshold: 5, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "34", name: "Red Onion", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 0.91, markupPercentage: 0.20 },
  { id: "35", name: "Apple Cider Vinegar", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "36", name: "Brown Sugar", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 1.13, markupPercentage: 0.20 },
  { id: "37", name: "Fresh Ginger", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 4.54, markupPercentage: 0.20 },
  { id: "38", name: "Mustard Seeds", category: "Food Ingredient", currentStock: 2, unit: "oz", lowStockThreshold: 0.5, costPerUnit: 0.23, markupPercentage: 0.20 },
  { id: "39", name: "Ground Cinnamon", category: "Food Ingredient", currentStock: 1, unit: "oz", lowStockThreshold: 0.2, costPerUnit: 0.43, markupPercentage: 0.20 },
  { id: "40", name: "Ground Cloves", category: "Food Ingredient", currentStock: 0.5, unit: "oz", lowStockThreshold: 0.1, costPerUnit: 0.57, markupPercentage: 0.20 },
  { id: "42", name: "Linguine Pasta", category: "Food Ingredient", currentStock: 20, unit: "lb", lowStockThreshold: 4, costPerUnit: 1.36, markupPercentage: 0.20 },
  { id: "43", name: "Red Pepper Flakes", category: "Food Ingredient", currentStock: 1, unit: "oz", lowStockThreshold: 0.2, costPerUnit: 0.34, markupPercentage: 0.20 },
  { id: "44", name: "Heavy Cream (Dessert)", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 4.50, markupPercentage: 0.20 },
  { id: "45", name: "Dark Chocolate", category: "Food Ingredient", currentStock: 3, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 9.07, markupPercentage: 0.20 },
  { id: "46", name: "All-Purpose Flour (Dessert)", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 0.45, markupPercentage: 0.20 },
  { id: "47", name: "Cocoa Powder", category: "Food Ingredient", currentStock: 1, unit: "oz", lowStockThreshold: 0.2, costPerUnit: 0.51, markupPercentage: 0.20 },
  { id: "48", name: "Vanilla Extract", category: "Food Ingredient", currentStock: 16, unit: "fl oz", lowStockThreshold: 3, costPerUnit: 25.00, markupPercentage: 0.20 },
  { id: "49", name: "Fresh Berries (Mixed)", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 6.80, markupPercentage: 0.20 },
  { id: "50", name: "Pie Crust (Pre-made)", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "51", name: "Gelatin Powder", category: "Food Ingredient", currentStock: 0.2, unit: "oz", lowStockThreshold: 0.05, costPerUnit: 0.85, markupPercentage: 0.20 },
  { id: "52", name: "Sparkling Water (Extra)", category: "Food Ingredient", currentStock: 20, unit: "quart", lowStockThreshold: 5, costPerUnit: 1.00, markupPercentage: 0.20 },
  { id: "53", name: "Fresh Mint", category: "Food Ingredient", currentStock: 5, unit: "bunch", lowStockThreshold: 1, costPerUnit: 2.00, markupPercentage: 0.20 },
  { id: "54", name: "Green Tea Bags", category: "Food Ingredient", currentStock: 100, unit: "count", lowStockThreshold: 20, costPerUnit: 0.15, markupPercentage: 0.20 },
  { id: "55", name: "Honey", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 4.54, markupPercentage: 0.20 },
  { id: "56", name: "Oranges", category: "Food Ingredient", currentStock: 15, unit: "count", lowStockThreshold: 3, costPerUnit: 0.80, markupPercentage: 0.20 },
  { id: "57", name: "Cream Cheese", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 3.18, markupPercentage: 0.20 },
  { id: "58", name: "Graham Cracker Crumbs", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 1.81, markupPercentage: 0.20 },
  { id: "59", name: "Espresso Powder", category: "Food Ingredient", currentStock: 0.1, unit: "oz", lowStockThreshold: 0.02, costPerUnit: 0.85, markupPercentage: 0.20 },
  { id: "60", name: "Ladyfingers", category: "Food Ingredient", currentStock: 10, unit: "pack", lowStockThreshold: 2, costPerUnit: 5.00, markupPercentage: 0.20 },
  { id: "61", name: "Mascarpone Cheese", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 11.34, markupPercentage: 0.20 },
  { id: "62", name: "Whiskey (Bourbon)", category: "Food Ingredient", currentStock: 3, unit: "bottle", lowStockThreshold: 0.5, costPerUnit: 30.00, markupPercentage: 0.20 },
  { id: "63", name: "Angostura Bitters", category: "Food Ingredient", currentStock: 0.1, unit: "bottle", lowStockThreshold: 0.02, costPerUnit: 15.00, markupPercentage: 0.20 },
  { id: "64", name: "Club Soda", category: "Food Ingredient", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 0.50, markupPercentage: 0.20 },
  { id: "65", name: "White Rum", category: "Food Ingredient", currentStock: 4, unit: "bottle", lowStockThreshold: 1, costPerUnit: 22.00, markupPercentage: 0.20 },
  { id: "66", name: "Fresh Limes", category: "Food Ingredient", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.60, markupPercentage: 0.20 },
  { id: "67", name: "Spinach (Fresh)", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 2.72, markupPercentage: 0.20 },
  { id: "68", name: "Artichoke Hearts (Canned)", category: "Food Ingredient", currentStock: 10, unit: "can", lowStockThreshold: 2, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "69", name: "Mayonnaise", category: "Food Ingredient", currentStock: 2, unit: "quart", lowStockThreshold: 0.5, costPerUnit: 5.00, markupPercentage: 0.20 },
  { id: "70", name: "Parmesan Cheese (grated)", category: "Food Ingredient", currentStock: 1, unit: "lb", lowStockThreshold: 0.2, costPerUnit: 8.16, markupPercentage: 0.20 },
  { id: "71", name: "Cream Cheese (softened)", category: "Food Ingredient", currentStock: 1, unit: "lb", lowStockThreshold: 0.2, costPerUnit: 3.18, markupPercentage: 0.20 },
  { id: "72", name: "Crostini/Baguette", category: "Food Ingredient", currentStock: 10, unit: "pack", lowStockThreshold: 2, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "73", name: "Cantaloupe", category: "Food Ingredient", currentStock: 5, unit: "count", lowStockThreshold: 1, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "74", name: "Honeydew Melon", category: "Food Ingredient", currentStock: 5, unit: "count", lowStockThreshold: 1, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "75", name: "Prosciutto", category: "Food Ingredient", currentStock: 0.5, unit: "lb", lowStockThreshold: 0.1, costPerUnit: 13.61, markupPercentage: 0.20 },
  { id: "76", name: "Asparagus", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 3.18, markupPercentage: 0.20 },
  { id: "77", name: "Potatoes (Russet)", category: "Food Ingredient", currentStock: 20, unit: "lb", lowStockThreshold: 5, costPerUnit: 0.68, markupPercentage: 0.20 },
  { id: "78", name: "Milk", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 2.00, markupPercentage: 0.20 },
  { id: "79", name: "Quinoa", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 3.63, markupPercentage: 0.20 },
  { id: "80", name: "Bell Peppers (Assorted)", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 1.00, markupPercentage: 0.20 },
  { id: "81", name: "Zucchini", category: "Food Ingredient", currentStock: 8, unit: "count", lowStockThreshold: 2, costPerUnit: 0.80, markupPercentage: 0.20 },
  { id: "82", name: "Red Wine Vinegar", category: "Food Ingredient", currentStock: 1, unit: "quart", lowStockThreshold: 0.2, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "83", name: "Cucumber", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 1.20, markupPercentage: 0.20 },
  { id: "84", name: "Apple Cider", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "85", name: "Cinnamon Sticks", category: "Food Ingredient", currentStock: 0.1, unit: "oz", lowStockThreshold: 0.02, costPerUnit: 0.28, markupPercentage: 0.20 },
  { id: "86", name: "Coffee Beans (Ground)", category: "Food Ingredient", currentStock: 2, unit: "lb", lowStockThreshold: 0.5, costPerUnit: 9.07, markupPercentage: 0.20 },
  { id: "87", name: "Oats (Rolled)", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 1.36, markupPercentage: 0.20 },
  { id: "88", name: "Parsnips", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 1.13, markupPercentage: 0.20 },
  { id: "89", name: "Sweet Potatoes", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 0.82, markupPercentage: 0.20 },
  { id: "90", name: "Nutmeg (Ground)", category: "Food Ingredient", currentStock: 0.1, unit: "oz", lowStockThreshold: 0.02, costPerUnit: 0.43, markupPercentage: 0.20 },
  { id: "91", name: "Couscous (Medium)", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 2.04, markupPercentage: 0.20 },
  { id: "92", name: "Feta Cheese (Crumbled)", category: "Food Ingredient", currentStock: 1, unit: "lb", lowStockThreshold: 0.2, costPerUnit: 5.44, markupPercentage: 0.20 },
  { id: "93", name: "Kalamata Olives", category: "Food Ingredient", currentStock: 1, unit: "lb", lowStockThreshold: 0.2, costPerUnit: 4.08, markupPercentage: 0.20 },
  { id: "94", name: "Simple Syrup", category: "Food Ingredient", currentStock: 2, unit: "quart", lowStockThreshold: 0.5, costPerUnit: 6.00, markupPercentage: 0.20 },
  { id: "95", name: "Coffee Liqueur", category: "Food Ingredient", currentStock: 1, unit: "bottle", lowStockThreshold: 0.2, costPerUnit: 25.00, markupPercentage: 0.20 },

  // Food Ingredients - Breads/Rolls
  { id: "b17", name: "Slider Buns", category: "Food Ingredient", currentStock: 60, unit: "bun", lowStockThreshold: 12, costPerUnit: 0.33, markupPercentage: 0.20 },
  { id: "b18", name: "Brioche Buns", category: "Food Ingredient", currentStock: 40, unit: "bun", lowStockThreshold: 8, costPerUnit: 0.63, markupPercentage: 0.20 },
  { id: "b19", name: "Ciabatta Rolls", category: "Food Ingredient", currentStock: 30, unit: "roll", lowStockThreshold: 6, costPerUnit: 1.00, markupPercentage: 0.20 },
  { id: "b20", name: "White Bread", category: "Food Ingredient", currentStock: 200, unit: "slice", lowStockThreshold: 40, costPerUnit: 0.15, markupPercentage: 0.20 },
  { id: "b21", name: "Wheat Bread", category: "Food Ingredient", currentStock: 150, unit: "slice", lowStockThreshold: 30, costPerUnit: 0.18, markupPercentage: 0.20 },

  // NEW/Corrected Inventory Items (matching recipe names and units exactly)
  { id: "inv_sourcream_quart", name: "Sour Cream", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 4.00, markupPercentage: 0.20 },
  { id: "inv_cherrytomatoes_lb", name: "Cherry Tomatoes", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 3.00, markupPercentage: 0.20 },
  { id: "inv_cucumber_lb", name: "Cucumber", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 1.50, markupPercentage: 0.20 },
  { id: "inv_bellpeppers_lb", name: "Bell Peppers (Assorted)", category: "Food Ingredient", currentStock: 10, unit: "lb", lowStockThreshold: 2, costPerUnit: 2.00, markupPercentage: 0.20 },
  { id: "inv_oliveoil_tbsp", name: "Olive Oil", category: "Food Ingredient", currentStock: 640, unit: "tbsp", lowStockThreshold: 30, costPerUnit: 8.00 / 64, markupPercentage: 0.00 }, // 1 quart = 64 tbsp
  { id: "inv_redwinevinegar_tbsp", name: "Red Wine Vinegar", category: "Food Ingredient", currentStock: 640, unit: "tbsp", lowStockThreshold: 30, costPerUnit: 4.00 / 64, markupPercentage: 0.00 }, // 1 quart = 64 tbsp
  { id: "inv_salt_tbsp", name: "Salt", category: "Food Ingredient", currentStock: 1000, unit: "tbsp", lowStockThreshold: 50, costPerUnit: 0.05, markupPercentage: 0.00 },
  { id: "inv_salt_tsp", name: "Salt", category: "Food Ingredient", currentStock: 3000, unit: "tsp", lowStockThreshold: 150, costPerUnit: 0.05 / 3, markupPercentage: 0.00 }, // Added for tsp unit
  { id: "inv_blackpepper_tsp", name: "Black Pepper", category: "Food Ingredient", currentStock: 1000, unit: "tsp", lowStockThreshold: 50, costPerUnit: 0.10, markupPercentage: 0.00 },
  { id: "inv_chickenbreast_count", name: "Chicken Breast", category: "Food Ingredient", currentStock: 100, unit: "count", lowStockThreshold: 20, costPerUnit: (4.50 / 16) * 7, markupPercentage: 0.20 },
  { id: "inv_allpurposeflour_cup", name: "All-Purpose Flour", category: "Food Ingredient", currentStock: 100, unit: "cup", lowStockThreshold: 10, costPerUnit: 0.45 / 4, markupPercentage: 0.00 },
  { id: "inv_butter_tbsp", name: "Butter", category: "Food Ingredient", currentStock: 320, unit: "tbsp", lowStockThreshold: 20, costPerUnit: 5.44 / 32, markupPercentage: 0.00 },
  { id: "inv_cabernetsauvignon_bottle", name: "Cabernet Sauvignon", category: "Beverage", currentStock: 5, unit: "bottle", lowStockThreshold: 1, costPerUnit: 15.00, markupPercentage: 0.25 },
  { id: "inv_drywhitewine_quart", name: "Dry White Wine (cooking)", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 8.00, markupPercentage: 0.20 },
  { id: "inv_apples_lb", name: "Apples (Granny Smith)", category: "Food Ingredient", currentStock: 15, unit: "lb", lowStockThreshold: 3, costPerUnit: 2.50, markupPercentage: 0.20 },
  { id: "inv_mustardseeds_tsp", name: "Mustard Seeds", category: "Food Ingredient", currentStock: 100, unit: "tsp", lowStockThreshold: 10, costPerUnit: 0.23 / 6, markupPercentage: 0.00 },
  { id: "inv_groundcinnamon_tsp", name: "Ground Cinnamon", category: "Food Ingredient", currentStock: 100, unit: "tsp", lowStockThreshold: 10, costPerUnit: 0.43 / 6, markupPercentage: 0.00 },
  { id: "inv_groundcloves_tsp", name: "Ground Cloves", category: "Food Ingredient", currentStock: 50, unit: "tsp", lowStockThreshold: 5, costPerUnit: 0.57 / 6, markupPercentage: 0.00 },
  { id: "inv_redpepperflakes_tsp", name: "Red Pepper Flakes", category: "Food Ingredient", currentStock: 100, unit: "tsp", lowStockThreshold: 10, costPerUnit: 0.34 / 6, markupPercentage: 0.00 },
  { id: "inv_freshmint_sprig", name: "Fresh Mint", category: "Food Ingredient", currentStock: 50, unit: "sprig", lowStockThreshold: 10, costPerUnit: 2.00 / 10, markupPercentage: 0.00 },
  { id: "inv_freshmozzarella_lb", name: "Fresh Mozzarella Balls (mini)", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 7.00, markupPercentage: 0.20 },
  { id: "inv_freshbasil_count", name: "Fresh Basil Leaves", category: "Food Ingredient", currentStock: 50, unit: "count", lowStockThreshold: 10, costPerUnit: 0.10, markupPercentage: 0.00 },
  { id: "inv_balsamicglaze_tbsp", name: "Balsamic Glaze", category: "Food Ingredient", currentStock: 20, unit: "tbsp", lowStockThreshold: 5, costPerUnit: 0.50, markupPercentage: 0.00 },
  { id: "inv_vodka_floz", name: "Vodka (Standard)", category: "Beverage", currentStock: 150, unit: "fl oz", lowStockThreshold: 20, costPerUnit: 20.00 / 25.36, markupPercentage: 0.00 },
  { id: "inv_orangejuice_floz", name: "Orange Juice", category: "Beverage", currentStock: 320, unit: "fl oz", lowStockThreshold: 50, costPerUnit: 3.00 / 32, markupPercentage: 0.00 },
  { id: "inv_lemon_wedge", name: "Lemon", category: "Food Ingredient", currentStock: 100, unit: "wedge", lowStockThreshold: 20, costPerUnit: 0.75 / 8, markupPercentage: 0.00 },
  { id: "inv_allpurposeflour_dessert_cup", name: "All-Purpose Flour (Dessert)", category: "Food Ingredient", currentStock: 100, unit: "cup", lowStockThreshold: 10, costPerUnit: 0.45 / 4, markupPercentage: 0.00 },
  { id: "inv_vanillaextract_tsp", name: "Vanilla Extract", category: "Food Ingredient", currentStock: 320, unit: "tsp", lowStockThreshold: 20, costPerUnit: 25.00 / 96, markupPercentage: 0.00 },
  { id: "inv_gelatinpowder_tsp", name: "Gelatin Powder", category: "Food Ingredient", currentStock: 20, unit: "tsp", lowStockThreshold: 2, costPerUnit: 0.85 / 2, markupPercentage: 0.00 },
  { id: "inv_water_quart", name: "Water", category: "Food Ingredient", currentStock: 100, unit: "quart", lowStockThreshold: 10, costPerUnit: 0.01, markupPercentage: 0.00 },
  { id: "inv_orangeblossomwater_tsp", name: "Orange Blossom Water", category: "Food Ingredient", currentStock: 10, unit: "tsp", lowStockThreshold: 1, costPerUnit: 0.50, markupPercentage: 0.00 },
  { id: "inv_honey_tbsp", name: "Honey", category: "Food Ingredient", currentStock: 64, unit: "tbsp", lowStockThreshold: 5, costPerUnit: 4.54 / 32, markupPercentage: 0.00 },
  { id: "inv_darkchocolate_oz", name: "Dark Chocolate", category: "Food Ingredient", currentStock: 48, unit: "oz", lowStockThreshold: 5, costPerUnit: 9.07 / 16, markupPercentage: 0.00 },
  { id: "inv_coffeeliqueur_floz", name: "Coffee Liqueur", category: "Beverage", currentStock: 150, unit: "fl oz", lowStockThreshold: 20, costPerUnit: 25.00 / 25.36, markupPercentage: 0.00 },
  { id: "inv_whiskey_floz", name: "Whiskey (Bourbon)", category: "Beverage", currentStock: 150, unit: "fl oz", lowStockThreshold: 20, costPerUnit: 30.00 / 25.36, markupPercentage: 0.00 },
  { id: "inv_angosturabitters_dashes", name: "Angostura Bitters", category: "Food Ingredient", currentStock: 100, unit: "dashes", lowStockThreshold: 10, costPerUnit: 15.00 / 200, markupPercentage: 0.00 },
  { id: "inv_sugar_cube", name: "Sugar", category: "Food Ingredient", currentStock: 200, unit: "cube", lowStockThreshold: 20, costPerUnit: 0.10, markupPercentage: 0.00 },
  { id: "inv_oranges_peel", name: "Oranges", category: "Food Ingredient", currentStock: 100, unit: "peel", lowStockThreshold: 20, costPerUnit: 0.80 / 8, markupPercentage: 0.00 },
  { id: "inv_ice_largecube", name: "Ice (Large Cube)", category: "Food Ingredient", currentStock: 500, unit: "large cube", lowStockThreshold: 50, costPerUnit: 0.02, markupPercentage: 0.00 },
  { id: "inv_whiterum_floz", name: "White Rum", category: "Beverage", currentStock: 150, unit: "fl oz", lowStockThreshold: 20, costPerUnit: 22.00 / 25.36, markupPercentage: 0.00 },
  { id: "inv_freshmint_leaves", name: "Fresh Mint (Leaves)", category: "Food Ingredient", currentStock: 100, unit: "leaves", lowStockThreshold: 20, costPerUnit: 2.00 / 20, markupPercentage: 0.00 },
  { id: "inv_sugar_tsp", name: "Sugar", category: "Food Ingredient", currentStock: 1000, unit: "tsp", lowStockThreshold: 50, costPerUnit: 0.32 / 200, markupPercentage: 0.00 },
  { id: "inv_clubsoda_floz", name: "Club Soda", category: "Beverage", currentStock: 288, unit: "fl oz", lowStockThreshold: 50, costPerUnit: 0.50 / 12, markupPercentage: 0.00 },
  { id: "inv_ice_crushed", name: "Ice (Crushed)", category: "Food Ingredient", currentStock: 500, unit: "crushed", lowStockThreshold: 50, costPerUnit: 0.01, markupPercentage: 0.00 },
  { id: "inv_artichokehearts_lb", name: "Artichoke Hearts (Canned)", category: "Food Ingredient", currentStock: 5, unit: "lb", lowStockThreshold: 1, costPerUnit: 6.00, markupPercentage: 0.20 },
  { id: "inv_parmesancheesegrated_cup", name: "Parmesan Cheese (grated)", category: "Food Ingredient", currentStock: 20, unit: "cup", lowStockThreshold: 4, costPerUnit: 2.04, markupPercentage: 0.20 },
  { id: "inv_ice_lb", name: "Ice (Bagged)", category: "Food Ingredient", currentStock: 50, unit: "lb", lowStockThreshold: 10, costPerUnit: 0.50, markupPercentage: 0.00 },
  { id: "inv_vanillaicecream_quart", name: "Vanilla Ice Cream", category: "Food Ingredient", currentStock: 5, unit: "quart", lowStockThreshold: 1, costPerUnit: 5.00, markupPercentage: 0.20 },
  { id: "inv_cinnamonsticks_count", name: "Cinnamon Sticks", category: "Food Ingredient", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.75, markupPercentage: 0.00 },
  { id: "inv_nutmeg_tsp", name: "Nutmeg (Ground)", category: "Food Ingredient", currentStock: 50, unit: "tsp", lowStockThreshold: 5, costPerUnit: 0.43 / 6, markupPercentage: 0.00 },
  { id: "inv_simplesyrup_floz", name: "Simple Syrup", category: "Food Ingredient", currentStock: 64, unit: "fl oz", lowStockThreshold: 10, costPerUnit: 6.00 / 32, markupPercentage: 0.00 },
  { id: "inv_ice_cubed", name: "Ice (Cubed)", category: "Food Ingredient", currentStock: 500, unit: "cubed", lowStockThreshold: 50, costPerUnit: 0.01, markupPercentage: 0.00 },
  { id: "inv_coffeebeans_count", name: "Coffee Beans (Ground)", category: "Food Ingredient", currentStock: 100, unit: "count", lowStockThreshold: 10, costPerUnit: 0.05, markupPercentage: 0.00 },
  { id: "inv_egg_whiteonly", name: "Egg (White Only)", category: "Food Ingredient", currentStock: 100, unit: "white only", lowStockThreshold: 10, costPerUnit: 0.10, markupPercentage: 0.00 },
  { id: "inv_angosturabitters_dash", name: "Angostura Bitters", category: "Food Ingredient", currentStock: 200, unit: "dash", lowStockThreshold: 20, costPerUnit: 15.00 / 200, markupPercentage: 0.00 },
  { id: "inv_oranges_slice", name: "Oranges (Slice)", category: "Food Ingredient", currentStock: 100, unit: "slice", lowStockThreshold: 20, costPerUnit: 0.80 / 8, markupPercentage: 0.00 },
];

const initialRecipes: Recipe[] = [
  {
    id: "r1",
    name: "Classic Beef Stroganoff",
    description: "A rich and creamy beef dish with mushrooms and sour cream.",
    prepTime: "20 mins",
    cookTime: "45 mins",
    servings: "4-6",
    category: "Main Course",
    ingredients: [
      { name: "Beef Sirloin", quantity: 1, unit: "lb" },
      { name: "Onions", quantity: 0.5, unit: "lb" },
      { name: "Cremini Mushrooms", quantity: 0.75, unit: "lb" },
      { name: "Heavy Cream", quantity: 0.25, unit: "quart" },
      { name: "Sour Cream", quantity: 0.1, unit: "quart" },
      { name: "Linguine Pasta", quantity: 1, unit: "lb" },
    ],
    instructions: [
      { step: "Slice beef thinly and sauté." },
      { step: "Add onions and mushrooms, cook until tender." },
      { step: "Stir in cream and sour cream, simmer." },
      { step: "Serve over cooked pasta." },
    ],
    baseCost: 0, // Will be calculated
  },
  {
    id: "r2",
    name: "Garden Salad with Vinaigrette",
    description: "Fresh mixed greens with assorted vegetables and a tangy vinaigrette.",
    prepTime: "15 mins",
    cookTime: "0 mins",
    servings: "4",
    category: "Side Dish",
    ingredients: [
      { name: "Mixed Salad Greens", quantity: 1, unit: "lb" },
      { name: "Cherry Tomatoes", quantity: 0.5, unit: "lb" },
      { name: "Cucumber", quantity: 0.3, unit: "lb" },
      { name: "Bell Peppers (Assorted)", quantity: 0.25, unit: "lb" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Red Wine Vinegar", quantity: 1, unit: "tbsp" },
    ],
    instructions: [
      { step: "Wash and chop all vegetables." },
      { step: "Combine greens and vegetables in a large bowl." },
      { step: "Whisk olive oil and vinegar for dressing." },
      { step: "Toss salad with dressing just before serving." },
    ],
    baseCost: 0, // Will be calculated
  },
  {
    id: "r3",
    name: "Herb-Crusted Roasted Salmon",
    description: "Flaky salmon fillets roasted with a fresh herb and lemon crust.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: "4",
    category: "Main Course",
    ingredients: [
      { name: "Salmon Fillets", quantity: 1.75, unit: "lb" },
      { name: "Fresh Dill", quantity: 0.5, unit: "bunch" },
      { name: "Fresh Parsley", quantity: 0.5, unit: "bunch" },
      { name: "Fresh Thyme", quantity: 0.5, unit: "bunch" },
      { name: "Lemon", quantity: 2, unit: "count" },
      { name: "Garlic", quantity: 2, unit: "head" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Preheat oven to 400°F (200°C)." },
      { step: "Chop herbs and garlic finely. Zest and juice one lemon." },
      { step: "Combine herbs, garlic, lemon zest, olive oil, salt, and pepper." },
      { step: "Pat salmon dry, spread herb mixture over top." },
      { step: "Bake for 15-20 minutes, or until cooked through. Serve with lemon wedges." },
    ],
    baseCost: 0,
  },
  {
    id: "r4",
    name: "Chicken Marsala",
    description: "Tender chicken breasts in a rich mushroom and Marsala wine sauce.",
    prepTime: "20 mins",
    cookTime: "30 mins",
    servings: "4",
    category: "Main Course",
    ingredients: [
      { name: "Chicken Breast", quantity: 3, unit: "count" }, // Using specific breast item
      { name: "All-Purpose Flour", quantity: 0.25, unit: "cup" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { name: "Butter", quantity: 4, unit: "tbsp" },
      { name: "Cremini Mushrooms", quantity: 0.75, unit: "lb" },
      { name: "Garlic", quantity: 3, unit: "head" },
      { name: "Marsala Wine (cooking)", quantity: 0.25, unit: "quart" },
      { name: "Chicken Broth", quantity: 0.25, unit: "quart" }, // Using chicken broth as a substitute for beef broth
      { name: "Fresh Parsley", quantity: 0.2, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Dredge chicken in flour, season with salt and pepper." },
      { step: "Sauté chicken in olive oil and butter until golden; set aside." },
      { step: "Add mushrooms and garlic to pan, cook until tender." },
      { step: "Deglaze with Marsala wine, then add chicken broth and simmer." },
      { step: "Return chicken to pan, cook until sauce thickens. Garnish with parsley." },
    ],
    baseCost: 0,
  },
  {
    id: "r5",
    name: "Beef Tenderloin with Red Wine Reduction",
    description: "Pan-seared beef tenderloin served with a luxurious red wine reduction.",
    prepTime: "25 mins",
    cookTime: "20 mins",
    servings: "4",
    category: "Main Course",
    ingredients: [
      { name: "Beef Sirloin", quantity: 1.75, unit: "lb" }, // Using sirloin as a proxy for tenderloin
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Butter", quantity: 4, unit: "tbsp" },
      { name: "Shallots", quantity: 0.25, unit: "lb" },
      { name: "Garlic", quantity: 2, unit: "head" },
      { name: "Cabernet Sauvignon", quantity: 0.2, unit: "bottle" }, // Using beverage inventory item
      { name: "Chicken Broth", quantity: 0.33, unit: "quart" }, // Using chicken broth as a substitute for beef broth
      { name: "Fresh Thyme", quantity: 0.2, unit: "bunch" },
      { name: "Fresh Rosemary", quantity: 0.2, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Season beef tenderloin with salt and pepper." },
      { step: "Sear beef in olive oil and butter until browned on all sides; finish in oven if needed. Rest." },
      { step: "Sauté shallots and garlic in pan drippings. Add red wine, reduce by half." },
      { step: "Stir in beef broth, thyme, and rosemary; simmer until sauce thickens." },
      { step: "Slice beef and serve with red wine reduction." },
    ],
    baseCost: 0,
  },
  {
    id: "r6",
    name: "Wild Mushroom Risotto",
    description: "Creamy Arborio rice cooked with a medley of earthy wild mushrooms.",
    prepTime: "20 mins",
    cookTime: "40 mins",
    servings: "4",
    category: "Vegetarian Main", // Updated category
    ingredients: [
      { name: "Arborio Rice", quantity: 0.75, unit: "lb" },
      { name: "Mixed Wild Mushrooms", quantity: 1, unit: "lb" },
      { name: "Vegetable Broth", quantity: 1.5, unit: "quart" },
      { name: "Parmesan Cheese", quantity: 0.25, unit: "lb" },
      { name: "Dry White Wine (cooking)", quantity: 0.15, unit: "quart" },
      { name: "Onions", quantity: 0.33, unit: "lb" },
      { name: "Garlic", quantity: 2, unit: "head" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Butter", quantity: 4, unit: "tbsp" },
      { name: "Fresh Parsley", quantity: 0.2, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Sauté chopped onions and garlic in olive oil and butter." },
      { step: "Add Arborio rice, toast for 2 minutes. Deglaze with white wine." },
      { step: "Gradually add warm vegetable broth, stirring constantly, until absorbed." },
      { step: "Stir in sautéed wild mushrooms and Parmesan Cheese. Season to taste." },
      { step: "Garnish with fresh parsley before serving." },
    ],
    baseCost: 0,
  },
  {
    id: "r7",
    name: "Roasted Pork Loin with Apple Chutney",
    description: "Succulent roasted pork loin served with a sweet and tangy apple chutney.",
    prepTime: "25 mins",
    cookTime: "60 mins",
    servings: "6",
    category: "Main Course",
    ingredients: [
      { name: "Pork Loin", quantity: 2.5, unit: "lb" },
      { name: "Apples (Granny Smith)", quantity: 1, unit: "lb" },
      { name: "Red Onion", quantity: 0.5, unit: "lb" },
      { name: "Apple Cider Vinegar", quantity: 0.1, unit: "quart" },
      { name: "Brown Sugar", quantity: 0.25, unit: "lb" },
      { name: "Fresh Ginger", quantity: 0.05, unit: "lb" },
      { name: "Mustard Seeds", quantity: 1, unit: "tsp" },
      { name: "Ground Cinnamon", quantity: 0.5, unit: "tsp" },
      { name: "Ground Cloves", quantity: 0.25, unit: "tsp" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Season pork loin with salt, pepper, and olive oil. Roast until internal temperature reaches 145°F (63°C)." },
      { step: "For chutney: Dice apples and red onion. Sauté with ginger, mustard seeds, cinnamon, and cloves." },
      { step: "Add apple cider vinegar and brown sugar; simmer until apples are tender and sauce thickens." },
      { step: "Slice pork loin and serve with warm apple chutney." },
    ],
    baseCost: 0,
  },
  {
    id: "r8",
    name: "Shrimp Scampi with Linguine",
    description: "Garlic butter shrimp served over a bed of al dente linguine pasta.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: "4",
    category: "Main Course",
    ingredients: [
      { name: "Shrimp (Peeled & Deveined)", quantity: 1.25, unit: "lb" },
      { name: "Linguine Pasta", quantity: 1, unit: "lb" },
      { name: "Garlic", quantity: 4, unit: "head" },
      { name: "Butter", quantity: 8, unit: "tbsp" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Dry White Wine (cooking)", quantity: 0.1, unit: "quart" },
      { name: "Lemon", quantity: 1, unit: "count" },
      { name: "Red Pepper Flakes", quantity: 0.5, unit: "tsp" },
      { name: "Fresh Parsley", quantity: 0.3, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Cook linguine according to package directions. Reserve pasta water." },
      { step: "Melt butter and olive oil in a large skillet. Add minced garlic and red pepper flakes; cook until fragrant." },
      { step: "Add shrimp to skillet, cook until pink. Deglaze with white wine and lemon juice." },
      { step: "Toss cooked linguine with shrimp sauce. Add a splash of pasta water if needed. Garnish with fresh parsley." },
    ],
    baseCost: 0,
  },
  {
    id: "r9",
    name: "Sparkling Raspberry Lemonade",
    description: "A refreshing non-alcoholic drink with fresh raspberries and lemon.",
    prepTime: "10 mins",
    cookTime: "0 mins",
    servings: "6",
    category: "Non-Alcoholic Beverage", // New category
    ingredients: [
      { name: "Fresh Berries (Mixed)", quantity: 0.5, unit: "lb" }, // Using mixed berries for raspberries
      { name: "Lemon", quantity: 4, unit: "count" }, // Changed from plural Lemons
      { name: "Sugar", quantity: 0.25, unit: "lb" },
      { name: "Sparkling Water (Extra)", quantity: 1, unit: "quart" }, // Using Sparkling Water (Extra)
      { name: "Fresh Mint", quantity: 6, unit: "sprig" }, // Changed from Mint Sprigs
    ],
    instructions: [
      { step: "Muddle raspberries and sugar in a pitcher." },
      { step: "Add fresh lemon juice and stir well." },
      { step: "Top with sparkling water and ice." },
      { step: "Garnish with mint sprigs and lemon slices." },
    ],
    baseCost: 0,
  },
  {
    id: "r10",
    name: "Mini Caprese Skewers",
    description: "Bite-sized skewers with cherry tomatoes, fresh mozzarella, and basil.",
    prepTime: "15 mins",
    cookTime: "0 mins",
    servings: "12",
    category: "Appetizer", // Existing category, good example
    ingredients: [
      { name: "Cherry Tomatoes", quantity: 0.75, unit: "lb" },
      { name: "Fresh Mozzarella Balls (mini)", quantity: 0.5, unit: "lb" }, // Assuming this is a pantry item
      { name: "Fresh Basil Leaves", quantity: 20, unit: "count" }, // Assuming this is a pantry item
      { name: "Balsamic Glaze", quantity: 3, unit: "tbsp" }, // Assuming this is a pantry item
    ],
    instructions: [
      { step: "Thread cherry tomato, mozzarella ball, and basil leaf onto small skewers." },
      { step: "Arrange on a platter." },
      { step: "Drizzle with balsamic glaze just before serving." },
    ],
    baseCost: 0,
  },
  {
    id: "r11",
    name: "Classic Margarita",
    description: "A timeless cocktail with tequila, lime, and triple sec.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage", // New category
    ingredients: [
      { name: "Vodka (Standard)", quantity: 2, unit: "fl oz" }, // Using Vodka as a proxy for Tequila
      { name: "Fresh Limes", quantity: 1, unit: "count" }, // Changed from plural Limes
      { name: "Orange Juice", quantity: 0.75, unit: "fl oz" }, // Using Orange Juice as a proxy for Triple Sec
      { name: "Salt", quantity: 1, unit: "tsp" }, // For rim
      { name: "Lemon", quantity: 1, unit: "wedge" }, // Using Lemon for Lime Wedge
    ],
    instructions: [
      { step: "Rim a chilled margarita glass with salt." },
      { step: "Combine tequila, lime juice, and triple sec in a shaker with ice." },
      { step: "Shake well until thoroughly chilled." },
      { step: "Strain into the prepared glass over fresh ice. Garnish with a lime wedge." },
    ],
    baseCost: 0,
  },
  // NEW DESSERT RECIPES
  {
    id: "r12",
    name: "Chocolate Lava Cake",
    description: "Rich individual chocolate cakes with a molten center, served with berries.",
    prepTime: "20 mins",
    cookTime: "12 mins",
    servings: "4",
    category: "Dessert",
    ingredients: [
      { name: "Dark Chocolate", quantity: 0.5, unit: "lb" },
      { name: "Butter", quantity: 0.25, unit: "lb" },
      { name: "Eggs", quantity: 2, unit: "count" },
      { name: "Sugar", quantity: 0.1, unit: "lb" },
      { name: "All-Purpose Flour (Dessert)", quantity: 0.25, unit: "cup" },
      { name: "Vanilla Extract", quantity: 1, unit: "tsp" },
      { name: "Fresh Berries (Mixed)", quantity: 0.25, unit: "lb" },
    ],
    instructions: [
      { step: "Preheat oven to 425°F (220°C). Grease ramekins." },
      { step: "Melt chocolate and butter together. Whisk in sugar, then eggs one at a time." },
      { step: "Fold in flour and vanilla. Pour batter into ramekins." },
      { step: "Bake for 10-12 minutes until edges are set but center is gooey. Invert onto plates and serve with berries." },
    ],
    baseCost: 0,
  },
  {
    id: "r13",
    name: "Seasonal Fruit Tart",
    description: "A buttery pie crust filled with pastry cream and topped with fresh seasonal fruits.",
    prepTime: "30 mins",
    cookTime: "25 mins",
    servings: "8",
    category: "Dessert",
    ingredients: [
      { name: "Pie Crust (Pre-made)", quantity: 1, unit: "count" },
      { name: "Heavy Cream (Dessert)", quantity: 0.25, unit: "quart" },
      { name: "Sugar", quantity: 0.25, unit: "lb" },
      { name: "Eggs", quantity: 3, unit: "count" },
      { name: "All-Purpose Flour (Dessert)", quantity: 0.25, unit: "cup" },
      { name: "Vanilla Extract", quantity: 2, unit: "tsp" },
      { name: "Fresh Berries (Mixed)", quantity: 0.75, unit: "lb" },
      { name: "Gelatin Powder", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Blind bake pie crust according to package directions; let cool." },
      { step: "Prepare pastry cream: whisk egg yolks, sugar, flour. Heat milk/cream, temper yolks, cook until thick. Stir in vanilla." },
      { step: "Pour cooled pastry cream into pie crust. Arrange fresh fruits on top." },
      { step: "Prepare a simple glaze with gelatin and water, brush over fruit for shine. Chill before serving." },
    ],
    baseCost: 0,
  },
  // NEW NON-ALCOHOLIC BEVERAGE RECIPES
  {
    id: "r14",
    name: "Fresh Mint Iced Tea",
    description: "Refreshing black iced tea infused with fresh mint leaves and a hint of lemon.",
    prepTime: "10 mins",
    cookTime: "5 mins",
    servings: "8",
    category: "Non-Alcoholic Beverage",
    ingredients: [
      { name: "Green Tea Bags", quantity: 8, unit: "count" }, // Using green tea for variety
      { name: "Fresh Mint", quantity: 1, unit: "bunch" },
      { name: "Lemon", quantity: 2, unit: "count" }, // Changed from plural Lemons
      { name: "Sugar", quantity: 0.25, unit: "lb" },
      { name: "Water", quantity: 1.5, unit: "quart" }, // Assuming water is always available
    ],
    instructions: [
      { step: "Bring water to a boil. Add tea bags and mint leaves; steep for 5 minutes. Remove tea bags and mint." },
      { step: "Stir in sugar until dissolved. Let cool to room temperature." },
      { step: "Add lemon juice. Chill thoroughly. Serve over ice with fresh mint and lemon slices." },
    ],
    baseCost: 0,
  },
  {
    id: "r15",
    name: "Sparkling Orange Blossom Water",
    description: "A delicate and fragrant sparkling drink with orange juice and a touch of orange blossom water.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "4",
    category: "Non-Alcoholic Beverage",
    ingredients: [
      { name: "Oranges", quantity: 4, unit: "count" },
      { name: "Sparkling Water (Extra)", quantity: 0.75, unit: "quart" },
      { name: "Orange Blossom Water", quantity: 1, unit: "tsp" }, // Assume this is a pantry item, not tracked in inventory
      { name: "Honey", quantity: 1, unit: "tbsp" },
      { name: "Fresh Mint", quantity: 4, unit: "sprig" },
    ],
    instructions: [
      { step: "Juice the oranges. Strain to remove pulp." },
      { step: "In a pitcher, combine orange juice, orange blossom water, and honey. Stir until honey dissolves." },
      { step: "Top with sparkling water and ice. Garnish with fresh mint sprigs and orange slices." },
    ],
    baseCost: 0,
  },
  // NEW DESSERTS
  {
    id: "r16",
    name: "New York Cheesecake",
    description: "Classic rich and creamy cheesecake with a graham cracker crust.",
    prepTime: "45 mins",
    cookTime: "70 mins",
    servings: "12",
    category: "Dessert",
    ingredients: [
      { name: "Cream Cheese", quantity: 2.2, unit: "lb" },
      { name: "Sugar", quantity: 0.75, unit: "lb" },
      { name: "Eggs", quantity: 4, unit: "count" },
      { name: "Heavy Cream (Dessert)", quantity: 0.1, unit: "quart" },
      { name: "Vanilla Extract", quantity: 2, unit: "tsp" },
      { name: "Graham Cracker Crumbs", quantity: 0.5, unit: "lb" },
      { name: "Butter", quantity: 6, unit: "tbsp" },
      { name: "Lemon", quantity: 1, unit: "count" },
    ],
    instructions: [
      { step: "Preheat oven to 325°F (160°C). Prepare springform pan with graham cracker crust." },
      { step: "Beat cream cheese and sugar until smooth. Add eggs one at a time, then heavy cream, vanilla, and lemon zest." },
      { step: "Pour batter into crust. Bake for 60-70 minutes until edges are set and center is slightly jiggly." },
      { step: "Cool completely, then chill for at least 4 hours or overnight before serving." },
    ],
    baseCost: 0,
  },
  {
    id: "r17",
    name: "Tiramisu",
    description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream.",
    prepTime: "30 mins",
    cookTime: "0 mins",
    servings: "8",
    category: "Dessert",
    ingredients: [
      { name: "Mascarpone Cheese", quantity: 1, unit: "lb" },
      { name: "Eggs", quantity: 4, unit: "count" }, // Yolks only
      { name: "Sugar", quantity: 0.33, unit: "lb" },
      { name: "Espresso Powder", quantity: 0.7, unit: "oz" },
      { name: "Ladyfingers", quantity: 1, unit: "pack" },
      { name: "Cocoa Powder", quantity: 0.7, unit: "oz" },
      { name: "Dark Chocolate", quantity: 1.7, unit: "oz" }, // For shaving
      { name: "Coffee Liqueur", quantity: 1.7, unit: "fl oz" }, // Optional, using inventory item
    ],
    instructions: [
      { step: "Brew strong espresso and let cool. Mix with coffee liqueur if using." },
      { step: "Whisk egg yolks and sugar over a double boiler until pale and thick. Remove from heat, stir in mascarpone." },
      { step: "In a separate bowl, whip egg whites to soft peaks and gently fold into mascarpone mixture." },
      { step: "Quickly dip ladyfingers in espresso, arrange a layer in a dish. Spread half the mascarpone cream over." },
      { step: "Repeat layers. Chill for at least 4 hours. Dust with cocoa powder and chocolate shavings before serving." },
    ],
    baseCost: 0,
  },
  // NEW ALCOHOLIC BEVERAGES
  {
    id: "r18",
    name: "Old Fashioned",
    description: "A classic cocktail made with whiskey, bitters, sugar, and an orange peel.",
    prepTime: "2 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage",
    ingredients: [
      { name: "Whiskey (Bourbon)", quantity: 2, unit: "fl oz" },
      { name: "Angostura Bitters", quantity: 2, unit: "dashes" },
      { name: "Sugar", quantity: 1, unit: "cube" },
      { name: "Oranges", quantity: 1, unit: "peel" }, // Using Oranges for peel
      { name: "Ice (Large Cube)", quantity: 1, unit: "large cube" }, // Assuming ice is always available
    ],
    instructions: [
      { step: "Place sugar cube in an Old Fashioned glass, add bitters and a splash of water. Muddle until sugar dissolves." },
      { step: "Add whiskey and a large ice cube. Stir gently for 30 seconds to chill and dilute." },
      { step: "Express the oil from an orange peel over the drink, then drop it in. Serve." },
    ],
    baseCost: 0,
  },
  {
    id: "r19",
    name: "Mojito",
    description: "A refreshing Cuban highball with white rum, lime juice, sugar, mint, and soda water.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage",
    ingredients: [
      { name: "White Rum", quantity: 2, unit: "fl oz" },
      { name: "Fresh Limes", quantity: 1, unit: "count" },
      { name: "Fresh Mint (Leaves)", quantity: 10, unit: "leaves" },
      { name: "Sugar", quantity: 2, unit: "tsp" },
      { name: "Club Soda", quantity: 3, unit: "fl oz" },
      { name: "Ice (Crushed)", quantity: 1, unit: "crushed" }, // Assuming ice is always available
    ],
    instructions: [
      { step: "In a sturdy glass, gently muddle mint leaves with sugar and lime juice." },
      { step: "Add rum and fill the glass with crushed ice." },
      { step: "Top with club soda. Stir gently to combine. Garnish with a lime wedge and mint sprig." },
    ],
    baseCost: 0,
  },
  // NEW APPETIZERS
  {
    id: "r20",
    name: "Spinach Artichoke Dip with Crostini",
    description: "A warm, creamy, and cheesy dip served with crispy crostini.",
    prepTime: "15 mins",
    cookTime: "25 mins",
    servings: "8-10",
    category: "Appetizer",
    ingredients: [
      { name: "Spinach (Fresh)", quantity: 1, unit: "lb" },
      { name: "Artichoke Hearts (Canned)", quantity: 1, unit: "lb" },
      { name: "Cream Cheese (softened)", quantity: 0.5, unit: "lb" },
      { name: "Mayonnaise", quantity: 0.1, unit: "quart" },
      { name: "Parmesan Cheese (grated)", quantity: 0.25, unit: "lb" },
      { name: "Garlic", quantity: 3, unit: "head" },
      { name: "Crostini/Baguette", quantity: 1, unit: "pack" },
    ],
    instructions: [
      { step: "Preheat oven to 375°F (190°C). Sauté spinach and garlic until wilted; squeeze out excess water." },
      { step: "Chop artichoke hearts. In a bowl, combine spinach, artichokes, cream cheese, mayonnaise, and half of the Parmesan." },
      { step: "Transfer to a baking dish, top with remaining Parmesan. Bake for 20-25 minutes until bubbly and golden." },
      { step: "Serve warm with crostini." },
    ],
    baseCost: 0,
  },
  {
    id: "r21",
    name: "Prosciutto-Wrapped Melon Bites",
    description: "Sweet melon cubes wrapped in savory prosciutto, a perfect light appetizer.",
    prepTime: "15 mins",
    cookTime: "0 mins",
    servings: "10-12",
    category: "Appetizer",
    ingredients: [
      { name: "Cantaloupe", quantity: 0.5, unit: "count" },
      { name: "Honeydew Melon", quantity: 0.5, unit: "count" },
      { name: "Prosciutto", quantity: 0.33, unit: "lb" },
      { name: "Fresh Mint", quantity: 0.1, unit: "bunch" },
    ],
    instructions: [
      { step: "Cut melon into bite-sized cubes. Slice prosciutto into thin strips." },
      { step: "Arrange on a platter and garnish with fresh mint leaves. Chill until serving." },
    ],
    baseCost: 0,
  },
  {
    id: "r22",
    name: "Spicy Shrimp Skewers",
    description: "Grilled shrimp marinated in a zesty and spicy sauce.",
    prepTime: "20 mins (plus 30 min marinate)",
    cookTime: "8 mins",
    servings: "6",
    category: "Appetizer",
    ingredients: [
      { name: "Shrimp (Peeled & Deveined)", quantity: 1, unit: "lb" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Lemon", quantity: 1, unit: "count" },
      { name: "Garlic", quantity: 2, unit: "head" },
      { name: "Red Pepper Flakes", quantity: 0.5, unit: "tsp" },
      { name: "Fresh Parsley", quantity: 0.1, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" },
    ],
    instructions: [
      { step: "In a bowl, whisk together olive oil, lemon juice, minced garlic, red pepper flakes, salt, and pepper." },
      { step: "Add shrimp to the marinade, toss to coat, and refrigerate for at least 30 minutes." },
      { step: "Thread shrimp onto skewers. Grill or pan-fry for 2-4 minutes per side until pink and cooked through." },
      { step: "Garnish with fresh chopped parsley and serve immediately." },
    ],
    baseCost: 0,
  },
  // NEW SIDE DISHES
  {
    id: "r23",
    name: "Garlic Parmesan Roasted Asparagus",
    description: "Tender asparagus spears roasted with garlic and Parmesan cheese.",
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: "4",
    category: "Side Dish",
    ingredients: [
      { name: "Asparagus", quantity: 1, unit: "lb" },
      { name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { name: "Garlic", quantity: 2, unit: "head" },
      { name: "Parmesan Cheese (grated)", quantity: 0.25, unit: "cup" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" },
    ],
    instructions: [
      { step: "Preheat oven to 400°F (200°C). Trim woody ends off asparagus." },
      { step: "Toss asparagus with olive oil, minced garlic, salt, and pepper on a baking sheet." },
      { step: "Roast for 10-15 minutes until tender-crisp. Sprinkle with Parmesan cheese and serve." },
    ],
    baseCost: 0,
  },
  {
    id: "r24",
    name: "Creamy Mashed Potatoes",
    description: "Smooth and buttery mashed potatoes, a classic comfort food side.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: "6",
    category: "Side Dish",
    ingredients: [
      { name: "Potatoes (Russet)", quantity: 2.2, unit: "lb" },
      { name: "Butter", quantity: 0.25, unit: "lb" },
      { name: "Milk", quantity: 0.25, unit: "quart" },
      { name: "Heavy Cream", quantity: 0.1, unit: "quart" },
      { name: "Salt", quantity: 1, unit: "tbsp" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
    ],
    instructions: [
      { step: "Peel and chop potatoes into even pieces. Boil in salted water until very tender." },
      { step: "Drain potatoes thoroughly. Return to pot over low heat to dry out any remaining moisture." },
      { step: "Mash potatoes. Heat butter, milk, and heavy cream until warm. Gradually add to potatoes, mixing until smooth and creamy." },
      { step: "Season with salt and pepper to taste. Serve hot." },
    ],
    baseCost: 0,
  },
  {
    id: "r25",
    name: "Quinoa Salad with Roasted Vegetables",
    description: "A hearty and healthy salad featuring fluffy quinoa and seasonal roasted vegetables.",
    prepTime: "20 mins",
    cookTime: "30 mins",
    servings: "8",
    category: "Side Dish",
    ingredients: [
      { name: "Quinoa", quantity: 0.75, unit: "lb" },
      { name: "Vegetable Broth", quantity: 0.6, unit: "quart" },
      { name: "Bell Peppers (Assorted)", quantity: 2, unit: "count" },
      { name: "Zucchini", quantity: 1, unit: "count" },
      { name: "Red Onion", quantity: 0.25, unit: "lb" },
      { name: "Cherry Tomatoes", quantity: 0.5, unit: "lb" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Red Wine Vinegar", quantity: 2, unit: "tbsp" },
      { name: "Fresh Parsley", quantity: 0.1, unit: "bunch" },
      { name: "Salt", quantity: 1, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" },
    ],
    instructions: [
      { step: "Rinse quinoa thoroughly. Cook quinoa in vegetable broth according to package directions; fluff with a fork." },
      { step: "Chop bell peppers, zucchini, and red onion. Toss with olive oil, salt, and pepper. Roast at 400°F (200°C) for 20-25 minutes." },
      { step: "Combine cooked quinoa, roasted vegetables, and halved cherry tomatoes in a large bowl." },
      { step: "Whisk together olive oil, red wine vinegar, salt, and pepper for dressing. Pour over salad and toss. Garnish with fresh parsley." },
    ],
    baseCost: 0,
  },
  // NEW NON-ALCOHOLIC BEVERAGE RECIPES
  {
    id: "r26",
    name: "Cucumber Mint Cooler",
    description: "A super refreshing and hydrating drink with fresh cucumber and mint.",
    prepTime: "10 mins",
    cookTime: "0 mins",
    servings: "4",
    category: "Non-Alcoholic Beverage",
    ingredients: [
      { name: "Cucumber", quantity: 1, unit: "count" },
      { name: "Fresh Mint", quantity: 0.5, unit: "bunch" },
      { name: "Lemon", quantity: 2, unit: "count" },
      { name: "Sugar", quantity: 0.1, unit: "lb" },
      { name: "Water", quantity: 1, unit: "quart" },
      { name: "Sparkling Water (Extra)", quantity: 0.5, unit: "quart" },
    ],
    instructions: [
      { step: "Peel and chop cucumber. Muddle cucumber slices with mint leaves and sugar in a pitcher." },
      { step: "Add lemon juice and still water. Stir well and let infuse for 15 minutes." },
      { step: "Strain the mixture, pressing solids to extract juice. Top with sparkling water and ice." },
      { step: "Garnish with fresh cucumber slices and mint sprigs." },
    ],
    baseCost: 0,
  },
  {
    id: "r27",
    name: "Spiced Apple Cider",
    description: "Warm and comforting apple cider infused with cinnamon, cloves, and orange.",
    prepTime: "5 mins",
    cookTime: "20 mins",
    servings: "6",
    category: "Non-Alcoholic Beverage",
    ingredients: [
      { name: "Apple Cider", quantity: 1.5, unit: "quart" },
      { name: "Cinnamon Sticks", quantity: 3, unit: "count" },
      { name: "Ground Cloves", quantity: 0.5, unit: "tsp" },
      { name: "Oranges", quantity: 1, unit: "count" },
      { name: "Brown Sugar", quantity: 0.1, unit: "lb" },
    ],
    instructions: [
      { step: "Combine apple cider, cinnamon sticks, ground cloves, and orange slices in a large pot." },
      { step: "Add brown sugar and stir until dissolved." },
      { step: "Bring to a simmer over medium heat, then reduce heat to low and let steep for at least 15-20 minutes." },
      { step: "Serve warm, garnished with fresh orange slices and cinnamon sticks." },
    ],
    baseCost: 0,
  },
  {
    id: "r28",
    name: "Iced Coffee Bar (Components)",
    description: "Components for a customizable iced coffee bar, including cold brew, milk, and syrups.",
    prepTime: "15 mins",
    cookTime: "0 mins",
    servings: "10",
    category: "Non-Alcoholic Beverage",
    ingredients: [
      { name: "Coffee Beans (Ground)", quantity: 0.5, unit: "lb" },
      { name: "Water", quantity: 1.5, unit: "quart" }, // For cold brew
      { name: "Milk", quantity: 1, unit: "quart" },
      { name: "Heavy Cream", quantity: 0.5, unit: "quart" }, // For creamer
      { name: "Simple Syrup", quantity: 0.2, unit: "quart" },
      { name: "Vanilla Extract", quantity: 2, unit: "tsp" }, // For vanilla syrup
      { name: "Ice (Bagged)", quantity: 2.2, unit: "lb" },
    ],
    instructions: [
      { step: "Prepare cold brew coffee: combine ground coffee and water, steep for 12-18 hours, then strain." },
      { step: "Prepare vanilla syrup: combine simple syrup and vanilla extract." },
      { step: "Set up a station with cold brew, milk, heavy cream, vanilla syrup, and ice. Allow guests to customize." },
    ],
    baseCost: 0,
  },
  // NEW DESSERT RECIPES
  {
    id: "r29",
    name: "Lemon Raspberry Mousse",
    description: "Light and airy lemon mousse layered with fresh raspberries.",
    prepTime: "25 mins",
    cookTime: "0 mins",
    servings: "6",
    category: "Dessert",
    ingredients: [
      { name: "Heavy Cream (Dessert)", quantity: 0.4, unit: "quart" },
      { name: "Lemon", quantity: 3, unit: "count" },
      { name: "Sugar", quantity: 0.25, unit: "lb" },
      { name: "Gelatin Powder", quantity: 1, unit: "tsp" },
      { name: "Fresh Berries (Mixed)", quantity: 0.5, unit: "lb" }, // Using mixed berries for raspberries
      { name: "Fresh Mint", quantity: 0.05, unit: "bunch" }, // For garnish
    ],
    instructions: [
      { step: "Whip heavy cream to soft peaks; set aside." },
      { step: "Bloom gelatin in a small amount of cold water. Heat lemon juice and sugar until dissolved, then stir in bloomed gelatin." },
      { step: "Fold lemon mixture into whipped cream. Gently fold in half of the raspberries." },
      { step: "Spoon mousse into serving glasses, layering with remaining raspberries. Chill for at least 2 hours. Garnish with mint." },
    ],
    baseCost: 0,
  },
  {
    id: "r30",
    name: "Mini Cheesecakes (Assorted)",
    description: "Individual cheesecakes with a graham cracker crust, topped with various fruit compotes.",
    prepTime: "30 mins",
    cookTime: "20 mins",
    servings: "12",
    category: "Dessert",
    ingredients: [
      { name: "Cream Cheese", quantity: 1.1, unit: "lb" },
      { name: "Sugar", quantity: 0.33, unit: "lb" },
      { name: "Eggs", quantity: 2, unit: "count" },
      { name: "Vanilla Extract", quantity: 1, unit: "tsp" },
      { name: "Graham Cracker Crumbs", quantity: 0.25, unit: "lb" },
      { name: "Butter", quantity: 4, unit: "tbsp" },
      { name: "Fresh Berries (Mixed)", quantity: 0.5, unit: "lb" }, // For compote
      { name: "Lemon", quantity: 1, unit: "count" }, // For compote
    ],
    instructions: [
      { step: "Preheat oven to 325°F (160°C). Line a muffin tin with paper liners. Press graham cracker crust into each liner." },
      { step: "Beat cream cheese and sugar until smooth. Add eggs and vanilla, mix until just combined." },
      { step: "Fill liners with cheesecake batter. Bake for 18-20 minutes until centers are almost set. Cool completely, then chill." },
      { step: "Prepare fruit compotes (e.g., berry, lemon curd). Top chilled cheesecakes with assorted compotes before serving." },
    ],
    baseCost: 0,
  },
  {
    id: "r31",
    name: "Apple Crumble with Vanilla Ice Cream",
    description: "Warm baked apples topped with a buttery oat crumble, served with vanilla ice cream.",
    prepTime: "20 mins",
    cookTime: "40 mins",
    servings: "8",
    category: "Dessert",
    ingredients: [
      { name: "Apples (Granny Smith)", quantity: 2.2, unit: "lb" },
      { name: "Oats (Rolled)", quantity: 0.33, unit: "lb" },
      { name: "All-Purpose Flour (Dessert)", quantity: 0.25, unit: "lb" },
      { name: "Brown Sugar", quantity: 0.25, unit: "lb" },
      { name: "Butter", quantity: 0.25, unit: "lb" },
      { name: "Ground Cinnamon", quantity: 1, unit: "tsp" },
      { name: "Nutmeg (Ground)", quantity: 0.25, unit: "tsp" },
      { name: "Vanilla Ice Cream", quantity: 1, unit: "quart" }, // Placeholder for ice cream
    ],
    instructions: [
      { step: "Preheat oven to 375°F (190°C). Peel, core, and slice apples. Toss with a little sugar and cinnamon; place in a baking dish." },
      { step: "In a bowl, combine oats, flour, brown sugar, cinnamon, and nutmeg. Cut in cold butter until crumbly." },
      { step: "Sprinkle crumble topping evenly over apples. Bake for 35-40 minutes until apples are tender and topping is golden brown." },
      { step: "Serve warm with a scoop of vanilla ice cream." },
    ],
    baseCost: 0,
  },
  // NEW ALCOHOLIC BEVERAGES
  {
    id: "r32",
    name: "Espresso Martini",
    description: "A sophisticated and energizing cocktail with vodka, coffee liqueur, and espresso.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage",
    ingredients: [
      { name: "Vodka (Standard)", quantity: 1.5, unit: "fl oz" },
      { name: "Coffee Liqueur", quantity: 0.75, unit: "fl oz" },
      { name: "Espresso Powder", quantity: 0.35, unit: "oz" }, // Using powder for simplicity, assume brewed
      { name: "Simple Syrup", quantity: 0.5, unit: "fl oz" },
      { name: "Ice (Cubed)", quantity: 1, unit: "cubed" },
      { name: "Coffee Beans (Ground)", quantity: 3, unit: "count" }, // For garnish, using ground coffee as a proxy
    ],
    instructions: [
      { step: "Brew espresso (or dissolve espresso powder in a small amount of hot water and cool). Chill." },
      { step: "Combine vodka, coffee liqueur, cooled espresso, and simple syrup in a shaker with ice." },
      { step: "Shake vigorously until well-chilled and a frothy head forms." },
      { step: "Strain into a chilled martini glass. Garnish with three coffee beans." },
    ],
    baseCost: 0,
  },
  {
    id: "r33",
    name: "Whiskey Sour",
    description: "A balanced cocktail with whiskey, lemon juice, simple syrup, and an optional egg white.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage",
    ingredients: [
      { name: "Whiskey (Bourbon)", quantity: 2, unit: "fl oz" },
      { name: "Lemon", quantity: 0.5, unit: "count" }, // For fresh lemon juice
      { name: "Simple Syrup", quantity: 0.75, unit: "fl oz" },
      { name: "Egg (White Only)", quantity: 1, unit: "white only" }, // Optional, for foam
      { name: "Angostura Bitters", quantity: 1, unit: "dash" }, // For garnish
      { name: "Ice (Cubed)", quantity: 1, unit: "cubed" },
      { name: "Oranges (Slice)", quantity: 1, unit: "slice" }, // For garnish
    ],
    instructions: [
      { step: "Combine whiskey, fresh lemon juice, simple syrup, and egg white (if using) in a shaker without ice. Dry shake vigorously for 15 seconds." },
      { step: "Add ice to the shaker and shake again until well-chilled." },
      { step: "Strain into a chilled coupe or rocks glass over fresh ice. Garnish with an orange slice and a dash of Angostura bitters." },
    ],
    baseCost: 0,
  },
];

const initialMenus: Menu[] = [
  {
    id: "m1",
    name: "Summer Wedding Package",
    description: "A delightful and elegant menu perfect for a summer wedding celebration.",
    category: "Wedding",
    appetizerIds: ["r10", "r21", "r22"], // Mini Caprese Skewers, Prosciutto-Wrapped Melon Bites, Spicy Shrimp Skewers
    mainCourseIds: ["r3", "r7", "r5"], // Herb-Crusted Roasted Salmon, Roasted Pork Loin with Apple Chutney, Beef Tenderloin
    dessertIds: ["r13", "r16", "r29"], // Seasonal Fruit Tart, New York Cheesecake, Lemon Raspberry Mousse
    alcoholicBeverageIds: ["r11", "r19", "r33"], // Classic Margarita, Mojito, Whiskey Sour
    nonAlcoholicBeverageIds: ["r9", "r15", "r26"], // Sparkling Raspberry Lemonade, Sparkling Orange Blossom Water, Cucumber Mint Cooler
    sideDishIds: ["r2", "r23", "r25"], // Garden Salad, Garlic Parmesan Roasted Asparagus, Quinoa Salad with Roasted Vegetables
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m2",
    name: "Corporate Lunch Buffet",
    description: "A versatile buffet menu suitable for corporate events and business lunches.",
    category: "Corporate",
    appetizerIds: ["r20", "r10"], // Spinach Artichoke Dip, Mini Caprese Skewers
    mainCourseIds: ["r1", "r4", "r6"], // Classic Beef Stroganoff, Chicken Marsala, Wild Mushroom Risotto
    dessertIds: ["r12", "r17", "r30"], // Chocolate Lava Cake, Tiramisu, Mini Cheesecakes
    alcoholicBeverageIds: ["r18", "r32"], // Old Fashioned, Espresso Martini
    nonAlcoholicBeverageIds: ["r9", "r14", "r28"], // Sparkling Raspberry Lemonade, Fresh Mint Iced Tea, Iced Coffee Bar
    sideDishIds: ["r2", "r24", "r25"], // Garden Salad, Creamy Mashed Potatoes, Quinoa Salad with Roasted Vegetables
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m3",
    name: "Vegetarian Dinner Party",
    description: "An exquisite plant-based menu designed to impress at any dinner party.",
    category: "Plated",
    appetizerIds: ["r10", "r20"], // Mini Caprese Skewers, Spinach Artichoke Dip
    mainCourseIds: ["r6"], // Wild Mushroom Risotto
    dessertIds: ["r13", "r31"], // Seasonal Fruit Tart, Apple Crumble
    alcoholicBeverageIds: ["r18", "r33"], // Old Fashioned, Whiskey Sour
    nonAlcoholicBeverageIds: ["r9", "r14", "r27"], // Sparkling Raspberry Lemonade, Fresh Mint Iced Tea, Spiced Apple Cider
    sideDishIds: ["r2", "r25"], // Garden Salad, Quinoa Salad with Roasted Vegetables
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialNotes: Note[] = [
  { id: "note1", content: "Follow up with 'Acme Corp' regarding proposal #123.", timestamp: new Date().toISOString() },
  { id: "note2", content: "Order more salmon for next week's events.", timestamp: new Date(Date.now() - 3600000).toISOString() }, // 1 hour ago
];

const initialCriticalTasks: CriticalTask[] = [
  { id: "task1", content: "Review new leads and assign follow-ups." },
  { id: "task2", content: "Check inventory levels for upcoming events." },
  { id: "task3", content: "Update recipe costs based on recent supplier invoices." },
  { id: "task4", content: "Engage with clients who received proposals last week." },
  { id: "task5", content: "Plan social media content for the next 3 days." },
  { id: "task6", content: "Review staff schedule for next week's events." },
];

const initialClients: Client[] = [
  {
    id: "c1",
    name: "Acme Corp",
    contactPerson: "Jane Doe",
    email: "jane.doe@acmecorp.com",
    phone: "555-111-2222",
    address: "123 Corporate Blvd, Suite 100, Metropolis",
    notes: "Prefers vegetarian options, always on time.",
  },
  {
    id: "c2",
    name: "Global Innovations Inc.",
    contactPerson: "John Smith",
    email: "john.smith@globalinnovations.com",
    phone: "555-333-4444",
    address: "456 Tech Park, Silicon Valley",
    notes: "Large events, requires detailed invoices.",
  },
  {
    id: "c3",
    name: "Community Outreach Foundation",
    contactPerson: "Sarah Lee",
    email: "sarah.lee@communityfoundation.org",
    phone: "555-555-6666",
    address: "789 Charity Lane, Downtown",
    notes: "Non-profit rates, often requests buffet style.",
  },
];

// Helper to get a future date relative to today
const getFutureDate = (days: number, months: number = 0) => {
  let date = new Date();
  date = addDays(date, days);
  date = addMonths(date, months);
  return format(date, "yyyy-MM-dd");
};

const initialProposals: Proposal[] = [
  {
    id: "p1",
    clientId: "c1",
    eventName: "Acme Corp Annual Gala",
    eventDate: getFutureDate(10), // 10 days from now
    numberOfGuests: 150,
    items: [
      { id: "r3", type: "recipe", name: "Herb-Crusted Roasted Salmon", quantity: 150, unitCost: 15.00, totalCost: 2250.00 },
      { id: "r24", type: "recipe", name: "Creamy Mashed Potatoes", quantity: 150, unitCost: 3.00, totalCost: 450.00 },
      { id: "r23", type: "recipe", name: "Garlic Parmesan Roasted Asparagus", quantity: 150, unitCost: 3.50, totalCost: 525.00 },
      { id: "r16", type: "recipe", name: "New York Cheesecake", quantity: 150, unitCost: 6.00, totalCost: 900.00 },
      { id: "inv_cabernetsauvignon_bottle", type: "inventoryItem", name: "Cabernet Sauvignon", quantity: 10, unitCost: 18.75, totalCost: 187.50 },
    ],
    laborCost: 1200.00,
    equipmentCost: 500.00,
    otherCosts: 100.00,
    subtotal: 0, // Will be calculated
    taxRate: 0.08,
    totalAmount: 0, // Will be calculated
    status: "Accepted",
    termsAndConditions: "Standard catering terms apply. 50% deposit required.",
    notes: "Client requested a tasting session in June.",
    createdAt: getFutureDate(-30), // Created 30 days ago
    updatedAt: getFutureDate(-15), // Updated 15 days ago
  },
  {
    id: "p2",
    clientId: "c2",
    eventName: "Global Innovations Product Launch",
    eventDate: getFutureDate(25), // 25 days from now
    numberOfGuests: 50,
    items: [
      { id: "r1", type: "recipe", name: "Classic Beef Stroganoff", quantity: 50, unitCost: 12.00, totalCost: 600.00 },
      { id: "r2", type: "recipe", name: "Garden Salad with Vinaigrette", quantity: 50, unitCost: 4.00, totalCost: 200.00 },
      { id: "r12", type: "recipe", name: "Chocolate Lava Cake", quantity: 50, unitCost: 7.00, totalCost: 350.00 },
      { id: "r9", type: "recipe", name: "Sparkling Raspberry Lemonade", quantity: 50, unitCost: 3.00, totalCost: 150.00 },
    ],
    laborCost: 600.00,
    equipmentCost: 200.00,
    otherCosts: 50.00,
    subtotal: 0, // Will be calculated
    taxRate: 0.08,
    totalAmount: 0, // Will be calculated
    status: "Sent",
    termsAndConditions: "Payment due 7 days prior to event.",
    notes: "Follow up by end of week.",
    createdAt: getFutureDate(-10), // Created 10 days ago
    updatedAt: getFutureDate(-10), // Updated 10 days ago
  },
  {
    id: "p3",
    clientId: "c3",
    eventName: "Community Foundation Charity Gala",
    eventDate: getFutureDate(40), // 40 days from now
    numberOfGuests: 200,
    items: [
      { id: "r6", type: "recipe", name: "Wild Mushroom Risotto", quantity: 200, unitCost: 14.00, totalCost: 2800.00 },
      { id: "r25", type: "recipe", name: "Quinoa Salad with Roasted Vegetables", quantity: 200, unitCost: 5.00, totalCost: 1000.00 },
      { id: "r31", type: "recipe", name: "Apple Crumble with Vanilla Ice Cream", quantity: 200, unitCost: 6.50, totalCost: 1300.00 },
      { id: "r14", type: "recipe", name: "Fresh Mint Iced Tea", quantity: 200, unitCost: 2.50, totalCost: 500.00 },
    ],
    laborCost: 1500.00,
    equipmentCost: 700.00,
    otherCosts: 150.00,
    subtotal: 0, // Will be calculated
    taxRate: 0.08,
    totalAmount: 0, // Will be calculated
    status: "Draft",
    termsAndConditions: "Special non-profit discount applied.",
    notes: "Needs approval from board by next month.",
    createdAt: getFutureDate(-5), // Created 5 days ago
    updatedAt: getFutureDate(-5), // Updated 5 days ago
  },
  {
    id: "p4",
    clientId: "c1",
    eventName: "Acme Corp Summer Picnic",
    eventDate: getFutureDate(5, 1), // 1 month and 5 days from now
    numberOfGuests: 75,
    items: [
      { id: "124", type: "inventoryItem", name: "Hamburger Patty", quantity: 75, unitCost: 2.06, totalCost: 154.50 },
      { id: "b17", type: "inventoryItem", name: "Slider Buns", quantity: 75, unitCost: 0.33, totalCost: 24.75 },
      { id: "131", type: "recipe", name: "French Fries", quantity: 75, unitCost: 1.50, totalCost: 112.50 },
      { id: "r9", type: "recipe", name: "Sparkling Raspberry Lemonade", quantity: 75, unitCost: 3.00, totalCost: 225.00 },
    ],
    laborCost: 400.00,
    equipmentCost: 100.00,
    otherCosts: 20.00,
    subtotal: 0,
    taxRate: 0.08,
    totalAmount: 0,
    status: "Sent",
    termsAndConditions: "Casual event, outdoor setup.",
    notes: "Client wants a quote for a rain contingency plan.",
    createdAt: getFutureDate(-20),
    updatedAt: getFutureDate(-18),
  },
];

const initialBookings: EventBooking[] = [
  // Booking for p1 (Acme Corp Annual Gala) - already accepted
  {
    id: "b1",
    eventName: "Acme Corp Annual Gala",
    clientName: "Acme Corp",
    eventDate: getFutureDate(10), // Matches p1 eventDate
    numberOfGuests: 150,
    selectedRecipeIds: ["r3", "r24", "r23", "r16"],
    status: "pending", // Default to pending, can be completed later
    proposalId: "p1", // Link to the accepted proposal
  },
  {
    id: "b2",
    eventName: "Tech Startup Mixer",
    clientName: "Global Innovations Inc.",
    eventDate: getFutureDate(20), // 20 days from now
    numberOfGuests: 80,
    selectedRecipeIds: ["r10", "r20", "r1", "r2", "r12"],
    status: "pending",
    proposalId: "p2", // Linked to p2
  },
  {
    id: "b3",
    eventName: "Local Charity Dinner",
    clientName: "Community Outreach Foundation",
    eventDate: getFutureDate(35), // 35 days from now
    numberOfGuests: 120,
    selectedRecipeIds: ["r6", "r25", "r31", "r14"],
    status: "pending",
    proposalId: "p3", // Linked to p3
  },
];


export const useCateringStore = create<CateringState>()(
  persist(
    (set, get) => ({
      inventory: initialInventory,
      recipes: initialRecipes.map(recipe => {
        // Calculate initial baseCost for existing recipes
        let calculatedCost = 0;
        for (const ingredient of recipe.ingredients) {
          const inventoryItem = initialInventory.find(
            (item) => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.unit.toLowerCase() === ingredient.unit.toLowerCase()
          );
          if (inventoryItem) { // Add null check here
            calculatedCost += ingredient.quantity * inventoryItem.costPerUnit;
          } else {
            console.warn(`Ingredient "${ingredient.name}" with unit "${ingredient.unit}" not found in initial inventory for recipe "${recipe.name}".`);
          }
        }
        return { ...recipe, baseCost: calculatedCost };
      }),
      bookings: initialBookings,
      clients: initialClients, // Initialize clients
      proposals: initialProposals.map(proposal => {
        // Calculate initial subtotal and totalAmount for existing proposals
        const itemsCost = proposal.items.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = itemsCost + proposal.laborCost + proposal.equipmentCost + proposal.otherCosts;
        const totalAmount = subtotal * (1 + proposal.taxRate);
        return { ...proposal, subtotal, totalAmount };
      }),
      estimates: [], // Estimates state
      menus: initialMenus, // NEW: Initialize menus with sample data
      notes: initialNotes, // NEW: Initialize notes with sample data
      criticalTasks: initialCriticalTasks, // NEW: Initialize critical tasks

      addInventoryItem: (item) => set((state) => ({
        inventory: [...state.inventory, { ...item, id: crypto.randomUUID() }],
      })),
      updateInventoryItem: (updatedItem) => set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === updatedItem.id ? { ...updatedItem, currentStock: Math.max(0, updatedItem.currentStock) } : item // Ensure stock doesn't go below 0
        ),
      })),
      deleteInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter((item) => item.id !== id),
      })),
      deductInventory: (recipeId) => {
        const recipe = get().recipes.find(r => r.id === recipeId);
        if (!recipe) return false;

        const updatedInventory = [...get().inventory];
        let canDeduct = true;

        // First, check if there's enough stock for all ingredients
        for (const recipeIng of recipe.ingredients) {
          const inventoryItem = updatedInventory.find(
            inv => inv.name.toLowerCase() === recipeIng.name.toLowerCase() && inv.unit.toLowerCase() === recipeIng.unit.toLowerCase()
          );
          if (!inventoryItem) {
            console.warn(`Insufficient stock for "${recipeIng.name}" (${recipeIng.unit}). Needed: ${recipeIng.quantity}, Available: N/A`);
            canDeduct = false;
            break;
          }
          if (inventoryItem.currentStock < recipeIng.quantity) {
            console.warn(`Insufficient stock for "${recipeIng.name}" (${recipeIng.unit}). Needed: ${recipeIng.quantity}, Available: ${inventoryItem.currentStock}`);
            canDeduct = false;
            break;
          }
        }

        if (!canDeduct) return false; // Not enough stock for one or more ingredients

        // If enough stock, proceed with deduction
        for (const recipeIng of recipe.ingredients) {
          const inventoryItem = updatedInventory.find(
            inv => inv.name.toLowerCase() === recipeIng.name.toLowerCase() && inv.unit.toLowerCase() === recipeIng.unit.toLowerCase()
          );
          if (inventoryItem) {
            inventoryItem.currentStock -= recipeIng.quantity;
          }
        }

        set({ inventory: updatedInventory });
        return true;
      },
      deductInventoryItem: (itemId, quantity) => {
        const updatedInventory = get().inventory.map(item => {
          if (item.id === itemId) {
            if (item.currentStock >= quantity) {
              return { ...item, currentStock: item.currentStock - quantity };
            }
            console.warn(`Insufficient stock for item "${item.name}". Needed: ${quantity}, Available: ${item.currentStock}`);
            return item; // Not enough stock
          }
          return item;
        });

        const itemToDeduct = get().inventory.find(item => item.id === itemId);
        if (itemToDeduct && itemToDeduct.currentStock >= quantity) {
          set({ inventory: updatedInventory });
          return true;
        }
        return false;
      },

      addRecipe: (recipe) => set((state) => {
        let calculatedCost = 0;
        for (const ingredient of recipe.ingredients) {
          const inventoryItem = state.inventory.find(
            (item) => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.unit.toLowerCase() === ingredient.unit.toLowerCase()
          );
          if (inventoryItem) {
            calculatedCost += ingredient.quantity * inventoryItem.costPerUnit;
          } else {
            console.warn(`Ingredient "${ingredient.name}" with unit "${ingredient.unit}" not found in inventory for new recipe "${recipe.name}".`);
          }
        }
        return {
          recipes: [...state.recipes, { ...recipe, id: crypto.randomUUID(), baseCost: calculatedCost }],
        };
      }),
      updateRecipe: (updatedRecipe) => set((state) => {
        let calculatedCost = 0;
        for (const ingredient of updatedRecipe.ingredients) {
          const inventoryItem = state.inventory.find(
            (item) => item.name.toLowerCase() === ingredient.name.toLowerCase() && item.unit.toLowerCase() === ingredient.unit.toLowerCase()
          );
          if (inventoryItem) {
            calculatedCost += ingredient.quantity * inventoryItem.costPerUnit;
          } else {
            console.warn(`Ingredient "${ingredient.name}" with unit "${ingredient.unit}" not found in inventory for updated recipe "${updatedRecipe.name}".`);
          }
        }
        return {
          recipes: state.recipes.map((recipe) =>
            recipe.id === updatedRecipe.id ? { ...updatedRecipe, baseCost: calculatedCost } : recipe
          ),
        };
      }),
      deleteRecipe: (id) => set((state) => ({
        recipes: state.recipes.filter((recipe) => recipe.id !== id),
      })),

      addBooking: (booking) => set((state) => ({
        bookings: [...state.bookings, { ...booking, id: crypto.randomUUID(), status: "pending" }],
      })),
      updateBooking: (updatedBooking) => set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking
        ),
      })),
      deleteBooking: (id) => set((state) => ({
        bookings: state.bookings.filter((booking) => booking.id !== id),
      })),
      completeBooking: (id) => {
        const booking = get().bookings.find(b => b.id === id);
        if (!booking || booking.status === "completed") return false;

        let allDeducted = true;
        for (const recipeId of booking.selectedRecipeIds) {
          const deducted = get().deductInventory(recipeId);
          if (!deducted) {
            allDeducted = false;
            // Optionally, you could revert previous deductions or notify about partial failure
            console.warn(`Could not deduct inventory for recipe ${recipeId} for booking ${id}`);
            break; // Stop if any recipe deduction fails
          }
        }

        if (allDeducted) {
          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === id ? { ...b, status: "completed" } : b
            ),
          }));
          return true;
        }
        return false;
      },

      // Client actions
      addClient: (client) => set((state) => ({
        clients: [...state.clients, { ...client, id: crypto.randomUUID() }],
      })),
      updateClient: (updatedClient) => set((state) => ({
        clients: state.clients.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        ),
      })),
      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
      })),

      // Proposal actions
      addProposal: (proposal) => set((state) => {
        const now = new Date().toISOString();
        // Calculate subtotal and totalAmount based on items, labor, equipment, other costs, and tax rate
        const itemsCost = proposal.items.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = itemsCost + proposal.laborCost + proposal.equipmentCost + proposal.otherCosts;
        const totalAmount = subtotal * (1 + proposal.taxRate);

        return {
          proposals: [...state.proposals, {
            ...proposal,
            id: crypto.randomUUID(),
            status: "Draft", // Default status
            subtotal,
            totalAmount,
            createdAt: now,
            updatedAt: now,
          }],
        };
      }),
      updateProposal: (updatedProposal) => set((state) => {
        // Recalculate subtotal and totalAmount on update
        const itemsCost = updatedProposal.items.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = itemsCost + updatedProposal.laborCost + updatedProposal.equipmentCost + updatedProposal.otherCosts;
        const totalAmount = subtotal * (1 + updatedProposal.taxRate);

        const newProposals = state.proposals.map((p) =>
          p.id === updatedProposal.id ? { ...updatedProposal, subtotal, totalAmount, updatedAt: new Date().toISOString() } : p
        );

        // If proposal status changes to "Accepted", create a new booking
        if (updatedProposal.status === "Accepted" && state.proposals.find(p => p.id === updatedProposal.id)?.status !== "Accepted") {
          const client = state.clients.find(c => c.id === updatedProposal.clientId);
          if (client) {
            const newBooking: EventBooking = {
              id: crypto.randomUUID(),
              eventName: updatedProposal.eventName,
              clientName: client.name,
              eventDate: updatedProposal.eventDate,
              numberOfGuests: updatedProposal.numberOfGuests,
              selectedRecipeIds: updatedProposal.items
                .filter(item => item.type === "recipe")
                .map(item => item.id),
              status: "pending",
              proposalId: updatedProposal.id, // Link to the originating proposal
            };
            return {
              proposals: newProposals,
              bookings: [...state.bookings, newBooking],
            };
          } else {
            console.error(`Client with ID ${updatedProposal.clientId} not found for accepted proposal ${updatedProposal.id}. Booking not created.`);
          }
        }

        return { proposals: newProposals };
      }),
      deleteProposal: (id) => set((state) => ({
        proposals: state.proposals.filter((proposal) => proposal.id !== id),
      })),

      // Estimate actions
      addEstimate: (estimate) => set((state) => {
        const now = new Date().toISOString();
        const itemsCost = estimate.items.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = itemsCost + estimate.laborCost + estimate.equipmentCost + estimate.otherCosts;
        const totalAmount = subtotal * (1 + estimate.taxRate);

        return {
          estimates: [...state.estimates, {
            ...estimate,
            id: crypto.randomUUID(),
            subtotal,
            totalAmount,
            createdAt: now,
            updatedAt: now,
          }],
        };
      }),
      updateEstimate: (updatedEstimate) => set((state) => {
        const itemsCost = updatedEstimate.items.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = itemsCost + updatedEstimate.laborCost + updatedEstimate.equipmentCost + updatedEstimate.otherCosts;
        const totalAmount = subtotal * (1 + updatedEstimate.taxRate);

        return {
          estimates: state.estimates.map((e) =>
            e.id === updatedEstimate.id ? { ...updatedEstimate, subtotal, totalAmount, updatedAt: new Date().toISOString() } : e
          ),
        };
      }),
      deleteEstimate: (id) => set((state) => ({
        estimates: state.estimates.filter((estimate) => estimate.id !== id),
      })),

      // NEW: Menu actions
      addMenu: (menu) => set((state) => {
        const now = new Date().toISOString();
        return {
          menus: [...state.menus, {
            ...menu,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          }],
        };
      }),
      updateMenu: (updatedMenu) => set((state) => ({
        menus: state.menus.map((m) =>
          m.id === updatedMenu.id ? { ...updatedMenu, updatedAt: new Date().toISOString() } : m
        ),
      })),
      deleteMenu: (id) => set((state) => ({
        menus: state.menus.filter((menu) => menu.id !== id),
      })),

      // NEW: Note actions
      addNote: (content) => set((state) => ({
        notes: [...state.notes, { id: crypto.randomUUID(), content, timestamp: new Date().toISOString() }],
      })),
      updateNote: (id, content) => set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, content, timestamp: new Date().toISOString() } : note
        ),
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      })),

      // NEW: Critical Task actions
      addCriticalTask: (content) => set((state) => ({
        criticalTasks: [...state.criticalTasks, { id: crypto.randomUUID(), content }],
      })),
      updateCriticalTask: (id, content) => set((state) => ({
        criticalTasks: state.criticalTasks.map((task) =>
          task.id === id ? { ...task, content } : task
        ),
      })),
      deleteCriticalTask: (id) => set((state) => ({
        criticalTasks: state.criticalTasks.filter((task) => task.id !== id),
      })),
    }),
    {
      name: 'catering-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);