"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the schema for a single ingredient within a recipe
export interface RecipeIngredient {
  name: string;
  quantity: string;
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
  unit: string; // e.g., "kg", "L", "count", "bottle", "chair", "set"
  lowStockThreshold: number;
  costPerUnit: number; // Cost per unit for inventory tracking
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

// Define the schema for a proposal
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

interface CateringState {
  inventory: InventoryItem[];
  recipes: Recipe[];
  bookings: EventBooking[];
  clients: Client[]; // New: Clients state
  proposals: Proposal[]; // New: Proposals state
  estimates: Estimate[]; // Estimates state
  menus: Menu[]; // NEW: Menus state

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  deductInventory: (recipeId: string) => boolean; // Returns true if deduction successful, false otherwise
  deductInventoryItem: (itemId: string, quantity: number) => boolean; // For direct inventory item deduction

  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
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
}

const initialInventory: InventoryItem[] = [
  // Food Ingredients
  { id: "1", name: "Chicken Breast", category: "Food Ingredient", currentStock: 50, unit: "kg", lowStockThreshold: 10, costPerUnit: 5.00 },
  { id: "2", name: "Beef Sirloin", category: "Food Ingredient", currentStock: 30, unit: "kg", lowStockThreshold: 5, costPerUnit: 15.00 },
  { id: "3", name: "Salmon Fillets", category: "Food Ingredient", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 12.00 },
  { id: "4", name: "Mixed Salad Greens", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 3.50 },
  { id: "5", name: "Potatoes", category: "Food Ingredient", currentStock: 100, unit: "kg", lowStockThreshold: 20, costPerUnit: 1.20 },
  { id: "6", name: "Onions", category: "Food Ingredient", currentStock: 40, unit: "kg", lowStockThreshold: 8, costPerUnit: 0.80 },
  { id: "7", name: "Carrots", category: "Food Ingredient", currentStock: 35, unit: "kg", lowStockThreshold: 7, costPerUnit: 0.90 },
  { id: "8", name: "All-Purpose Flour", category: "Food Ingredient", currentStock: 25, unit: "kg", lowStockThreshold: 5, costPerUnit: 1.00 },
  { id: "9", name: "Sugar", category: "Food Ingredient", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 0.70 },
  { id: "10", name: "Olive Oil", category: "Food Ingredient", currentStock: 10, unit: "L", lowStockThreshold: 2, costPerUnit: 8.00 },
  { id: "11", name: "Heavy Cream", category: "Food Ingredient", currentStock: 8, unit: "L", lowStockThreshold: 1, costPerUnit: 4.50 },
  { id: "12", name: "Eggs", category: "Food Ingredient", currentStock: 120, unit: "count", lowStockThreshold: 24, costPerUnit: 0.20 },
  { id: "13", name: "Parmesan Cheese", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 18.00 },
  { id: "14", name: "Tomatoes (Canned)", category: "Food Ingredient", currentStock: 30, unit: "can", lowStockThreshold: 6, costPerUnit: 1.10 },
  { id: "15", name: "Rice (Basmati)", category: "Food Ingredient", currentStock: 50, unit: "kg", lowStockThreshold: 10, costPerUnit: 2.50 },
  { id: "16", name: "Fresh Dill", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "17", name: "Fresh Parsley", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.00 },
  { id: "18", name: "Fresh Thyme", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "19", name: "Lemon", category: "Food Ingredient", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.75 },
  { id: "20", name: "Garlic", category: "Food Ingredient", currentStock: 30, unit: "head", lowStockThreshold: 6, costPerUnit: 0.50 },
  { id: "21", name: "Cremini Mushrooms", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 8.00 },
  { id: "22", name: "Marsala Wine (cooking)", category: "Food Ingredient", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "23", name: "Chicken Broth", category: "Food Ingredient", currentStock: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 3.00 },
  { id: "24", name: "Butter", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 12.00 },
  { id: "25", name: "Beef Tenderloin", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 35.00 },
  { id: "26", name: "Shallots", category: "Food Ingredient", currentStock: 8, unit: "kg", lowStockThreshold: 2, costPerUnit: 7.00 },
  { id: "27", name: "Fresh Rosemary", category: "Food Ingredient", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "28", name: "Arborio Rice", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 4.00 },
  { id: "29", name: "Mixed Wild Mushrooms", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 25.00 },
  { id: "30", name: "Vegetable Broth", category: "Food Ingredient", currentStock: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 2.50 },
  { id: "31", name: "Dry White Wine (cooking)", category: "Food Ingredient", currentStock: 5, unit: "bottle", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "32", name: "Pork Loin", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 18.00 },
  { id: "33", name: "Apples (Granny Smith)", category: "Food Ingredient", currentStock: 25, unit: "count", lowStockThreshold: 5, costPerUnit: 3.00 },
  { id: "34", name: "Red Onion", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 2.00 },
  { id: "35", name: "Apple Cider Vinegar", category: "Food Ingredient", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 4.00 },
  { id: "36", name: "Brown Sugar", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "37", name: "Fresh Ginger", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "38", name: "Mustard Seeds", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 8.00 },
  { id: "39", name: "Ground Cinnamon", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 15.00 },
  { id: "40", name: "Ground Cloves", category: "Food Ingredient", currentStock: 0.5, unit: "kg", lowStockThreshold: 0.1, costPerUnit: 20.00 },
  { id: "41", name: "Shrimp (Peeled & Deveined)", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 25.00 },
  { id: "42", name: "Linguine Pasta", category: "Food Ingredient", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 3.00 },
  { id: "43", name: "Red Pepper Flakes", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 12.00 },
  { id: "44", name: "Heavy Cream (Dessert)", category: "Food Ingredient", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 4.50 },
  { id: "45", name: "Dark Chocolate", category: "Food Ingredient", currentStock: 3, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 20.00 },
  { id: "46", name: "All-Purpose Flour (Dessert)", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 1.00 },
  { id: "47", name: "Cocoa Powder", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 18.00 },
  { id: "48", name: "Vanilla Extract", category: "Food Ingredient", currentStock: 0.5, unit: "L", lowStockThreshold: 0.1, costPerUnit: 25.00 },
  { id: "49", name: "Fresh Berries (Mixed)", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 15.00 },
  { id: "50", name: "Pie Crust (Pre-made)", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "51", name: "Gelatin Powder", category: "Food Ingredient", currentStock: 0.2, unit: "kg", lowStockThreshold: 0.05, costPerUnit: 30.00 },
  { id: "52", name: "Sparkling Water (Extra)", category: "Food Ingredient", currentStock: 20, unit: "L", lowStockThreshold: 5, costPerUnit: 1.00 },
  { id: "53", name: "Fresh Mint", category: "Food Ingredient", currentStock: 5, unit: "bunch", lowStockThreshold: 1, costPerUnit: 2.00 },
  { id: "54", name: "Green Tea Bags", category: "Food Ingredient", currentStock: 100, unit: "count", lowStockThreshold: 20, costPerUnit: 0.15 },
  { id: "55", name: "Honey", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 10.00 },
  { id: "56", name: "Oranges", category: "Food Ingredient", currentStock: 15, unit: "count", lowStockThreshold: 3, costPerUnit: 0.80 },
  { id: "57", name: "Cream Cheese", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 7.00 },
  { id: "58", name: "Graham Cracker Crumbs", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 4.00 },
  { id: "59", name: "Espresso Powder", category: "Food Ingredient", currentStock: 0.1, unit: "kg", lowStockThreshold: 0.02, costPerUnit: 30.00 },
  { id: "60", name: "Ladyfingers", category: "Food Ingredient", currentStock: 10, unit: "pack", lowStockThreshold: 2, costPerUnit: 5.00 },
  { id: "61", name: "Mascarpone Cheese", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 25.00 },
  { id: "62", name: "Whiskey (Bourbon)", category: "Food Ingredient", currentStock: 3, unit: "bottle", lowStockThreshold: 0.5, costPerUnit: 30.00 },
  { id: "63", name: "Angostura Bitters", category: "Food Ingredient", currentStock: 0.1, unit: "bottle", lowStockThreshold: 0.02, costPerUnit: 15.00 },
  { id: "64", name: "Club Soda", category: "Food Ingredient", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 0.50 },
  { id: "65", name: "White Rum", category: "Food Ingredient", currentStock: 4, unit: "bottle", lowStockThreshold: 1, costPerUnit: 22.00 },
  { id: "66", name: "Fresh Limes", category: "Food Ingredient", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.60 },
  { id: "67", name: "Spinach (Fresh)", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 6.00 },
  { id: "68", name: "Artichoke Hearts (Canned)", category: "Food Ingredient", currentStock: 10, unit: "can", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "69", name: "Mayonnaise", category: "Food Ingredient", currentStock: 2, unit: "L", lowStockThreshold: 0.5, costPerUnit: 5.00 },
  { id: "70", name: "Parmesan Cheese (grated)", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 18.00 },
  { id: "71", name: "Cream Cheese (softened)", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 7.00 },
  { id: "72", name: "Crostini/Baguette", category: "Food Ingredient", currentStock: 10, unit: "pack", lowStockThreshold: 2, costPerUnit: 4.00 },
  { id: "73", name: "Cantaloupe", category: "Food Ingredient", currentStock: 5, unit: "count", lowStockThreshold: 1, costPerUnit: 4.00 },
  { id: "74", name: "Honeydew Melon", category: "Food Ingredient", currentStock: 5, unit: "count", lowStockThreshold: 1, costPerUnit: 4.00 },
  { id: "75", name: "Prosciutto", category: "Food Ingredient", currentStock: 0.5, unit: "kg", lowStockThreshold: 0.1, costPerUnit: 30.00 },
  { id: "76", name: "Asparagus", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 7.00 },
  { id: "77", name: "Potatoes (Russet)", category: "Food Ingredient", currentStock: 20, unit: "kg", lowStockThreshold: 5, costPerUnit: 1.50 },
  { id: "78", name: "Milk", category: "Food Ingredient", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 2.00 },
  { id: "79", name: "Quinoa", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 8.00 },
  { id: "80", name: "Bell Peppers (Assorted)", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 1.00 },
  { id: "81", name: "Zucchini", category: "Food Ingredient", currentStock: 8, unit: "count", lowStockThreshold: 2, costPerUnit: 0.80 },
  { id: "82", name: "Red Wine Vinegar", category: "Food Ingredient", currentStock: 1, unit: "L", lowStockThreshold: 0.2, costPerUnit: 4.00 },
  { id: "83", name: "Cucumber", category: "Food Ingredient", currentStock: 10, unit: "count", lowStockThreshold: 2, costPerUnit: 1.20 },
  { id: "84", name: "Apple Cider", category: "Food Ingredient", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 4.00 },
  { id: "85", name: "Cinnamon Sticks", category: "Food Ingredient", currentStock: 0.1, unit: "kg", lowStockThreshold: 0.02, costPerUnit: 10.00 },
  { id: "86", name: "Coffee Beans (Ground)", category: "Food Ingredient", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 20.00 },
  { id: "87", name: "Oats (Rolled)", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 3.00 },
  { id: "88", name: "Parsnips", category: "Food Ingredient", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "89", name: "Sweet Potatoes", category: "Food Ingredient", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 1.80 },
  { id: "90", name: "Nutmeg (Ground)", category: "Food Ingredient", currentStock: 0.1, unit: "kg", lowStockThreshold: 0.02, costPerUnit: 15.00 },
  { id: "91", name: "Couscous (Medium)", category: "Food Ingredient", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 4.50 },
  { id: "92", name: "Feta Cheese (Crumbled)", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 12.00 },
  { id: "93", name: "Kalamata Olives", category: "Food Ingredient", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 9.00 },
  { id: "94", name: "Simple Syrup", category: "Food Ingredient", currentStock: 2, unit: "L", lowStockThreshold: 0.5, costPerUnit: 6.00 },
  { id: "95", name: "Coffee Liqueur", category: "Food Ingredient", currentStock: 1, unit: "bottle", lowStockThreshold: 0.2, costPerUnit: 25.00 },

  // Beverages
  { id: "b1", name: "Cabernet Sauvignon", category: "Beverage", currentStock: 12, unit: "bottle", lowStockThreshold: 3, costPerUnit: 15.00 },
  { id: "b2", name: "Chardonnay", category: "Beverage", currentStock: 10, unit: "bottle", lowStockThreshold: 2, costPerUnit: 12.00 },
  { id: "b3", name: "Pilsner Beer", category: "Beverage", currentStock: 48, unit: "can", lowStockThreshold: 12, costPerUnit: 1.50 },
  { id: "b4", name: "IPA Beer", category: "Beverage", currentStock: 36, unit: "can", lowStockThreshold: 9, costPerUnit: 2.00 },
  { id: "b5", name: "Vodka (Standard)", category: "Beverage", currentStock: 6, unit: "bottle", lowStockThreshold: 1, costPerUnit: 20.00 },
  { id: "b6", name: "Gin (Dry)", category: "Beverage", currentStock: 4, unit: "bottle", lowStockThreshold: 1, costPerUnit: 18.00 },
  { id: "b7", name: "Orange Juice", category: "Beverage", currentStock: 10, unit: "L", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "b8", name: "Tonic Water", category: "Beverage", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 0.75 },
  { id: "b9", name: "Coca-Cola", category: "Beverage", currentStock: 30, unit: "can", lowStockThreshold: 10, costPerUnit: 0.60 },
  { id: "b10", name: "Local Craft Beer (Assorted)", category: "Beverage", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 3.00 },
  { id: "b11", name: "Sparkling Wine (Prosecco)", category: "Beverage", currentStock: 8, unit: "bottle", lowStockThreshold: 2, costPerUnit: 18.00 },
  { id: "b12", name: "Diet Cola", category: "Beverage", currentStock: 30, unit: "can", lowStockThreshold: 10, costPerUnit: 0.60 },
  { id: "b13", name: "Lemon-Lime Soda", category: "Beverage", currentStock: 30, unit: "can", lowStockThreshold: 10, costPerUnit: 0.60 },
  { id: "b14", name: "Cranberry Juice", category: "Beverage", currentStock: 8, unit: "L", lowStockThreshold: 2, costPerUnit: 3.50 },
  { id: "b15", name: "Apple Juice", category: "Beverage", currentStock: 8, unit: "L", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "b16", name: "Sparkling Water (Lime)", category: "Beverage", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 0.80 },

  // Furniture
  { id: "f1", name: "Round Dining Table (60in)", category: "Furniture", currentStock: 20, unit: "table", lowStockThreshold: 5, costPerUnit: 50.00 },
  { id: "f2", name: "Folding Chair (White)", category: "Furniture", currentStock: 200, unit: "chair", lowStockThreshold: 50, costPerUnit: 5.00 },
  { id: "f3", name: "High-Top Cocktail Table", category: "Furniture", currentStock: 15, unit: "table", lowStockThreshold: 3, costPerUnit: 30.00 },
  { id: "f4", name: "Buffet Table (8ft)", category: "Furniture", currentStock: 10, unit: "table", lowStockThreshold: 2, costPerUnit: 60.00 },

  // Tableware
  { id: "t1", name: "Dinner Plate (White Ceramic)", category: "Tableware", currentStock: 250, unit: "plate", lowStockThreshold: 50, costPerUnit: 2.50 },
  { id: "t2", name: "Salad Plate (White Ceramic)", category: "Tableware", currentStock: 250, unit: "plate", lowStockThreshold: 50, costPerUnit: 2.00 },
  { id: "t3", name: "Bread Plate (White Ceramic)", category: "Tableware", currentStock: 250, unit: "plate", lowStockThreshold: 50, costPerUnit: 1.50 },
  { id: "t4", name: "Coffee Cup (White Ceramic)", category: "Tableware", currentStock: 100, unit: "cup", lowStockThreshold: 20, costPerUnit: 1.80 },

  // Silverware
  { id: "s1", name: "Dinner Fork", category: "Silverware", currentStock: 300, unit: "piece", lowStockThreshold: 60, costPerUnit: 0.75 },
  { id: "s2", name: "Dinner Knife", category: "Silverware", currentStock: 300, unit: "piece", lowStockThreshold: 60, costPerUnit: 0.75 },
  { id: "s3", name: "Dinner Spoon", category: "Silverware", currentStock: 300, unit: "piece", lowStockThreshold: 60, costPerUnit: 0.75 },
  { id: "s4", name: "Dessert Fork", category: "Silverware", currentStock: 200, unit: "piece", lowStockThreshold: 40, costPerUnit: 0.60 },

  // Glassware
  { id: "g1", name: "Water Glass (12oz)", category: "Glassware", currentStock: 250, unit: "glass", lowStockThreshold: 50, costPerUnit: 1.20 },
  { id: "g2", name: "Wine Glass (Red, 16oz)", category: "Glassware", currentStock: 150, unit: "glass", lowStockThreshold: 30, costPerUnit: 1.50 },
  { id: "g3", name: "Wine Glass (White, 12oz)", category: "Glassware", currentStock: 150, unit: "glass", lowStockThreshold: 30, costPerUnit: 1.50 },
  { id: "g4", name: "Champagne Flute", category: "Glassware", currentStock: 100, unit: "glass", lowStockThreshold: 20, costPerUnit: 1.80 },
  { id: "g5", name: "Cocktail Glass (Rocks)", category: "Glassware", currentStock: 100, unit: "glass", lowStockThreshold: 20, costPerUnit: 1.30 },

  // Linens
  { id: "l1", name: "Tablecloth (White, 90x90)", category: "Linens", currentStock: 50, unit: "linen", lowStockThreshold: 10, costPerUnit: 10.00 },
  { id: "l2", name: "Napkin (White Cotton)", category: "Linens", currentStock: 300, unit: "napkin", lowStockThreshold: 60, costPerUnit: 1.00 },
  { id: "l3", name: "Tablecloth (Black, 90x90)", category: "Linens", currentStock: 20, unit: "linen", lowStockThreshold: 5, costPerUnit: 10.00 },

  // Serving Equipment
  { id: "se1", name: "Chafing Dish (Full Size)", category: "Serving Equipment", currentStock: 15, unit: "unit", lowStockThreshold: 3, costPerUnit: 40.00 },
  { id: "se2", name: "Serving Platter (Large)", category: "Serving Equipment", currentStock: 25, unit: "unit", lowStockThreshold: 5, costPerUnit: 15.00 },
  { id: "se3", name: "Beverage Dispenser (3 Gallon)", category: "Serving Equipment", currentStock: 10, unit: "unit", lowStockThreshold: 2, costPerUnit: 35.00 },
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
      { name: "Beef Sirloin", quantity: "0.5 kg" },
      { name: "Onions", quantity: "0.2 kg" },
      { name: "Cremini Mushrooms", quantity: "0.3 kg" }, // Changed from generic Mushrooms
      { name: "Heavy Cream", quantity: "0.2 L" },
      { name: "Sour Cream", quantity: "0.1 L" },
      { name: "Linguine Pasta", quantity: "0.4 kg" }, // Changed from generic Pasta
    ],
    instructions: [
      { step: "Slice beef thinly and sauté." },
      { step: "Add onions and mushrooms, cook until tender." },
      { step: "Stir in cream and sour cream, simmer." },
      { step: "Serve over cooked pasta." },
    ],
    baseCost: 15.00, // Example base cost
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
      { name: "Mixed Salad Greens", quantity: "0.5 kg" },
      { name: "Cherry Tomatoes", quantity: "0.2 kg" }, // Changed from generic Tomatoes
      { name: "Cucumber", quantity: "0.15 kg" }, // Changed from generic Cucumbers
      { name: "Bell Peppers (Assorted)", quantity: "0.1 kg" }, // Changed from generic Bell Peppers
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Red Wine Vinegar", quantity: "0.02 L" },
    ],
    instructions: [
      { step: "Wash and chop all vegetables." },
      { step: "Combine greens and vegetables in a large bowl." },
      { step: "Whisk olive oil and vinegar for dressing." },
      { step: "Toss salad with dressing just before serving." },
    ],
    baseCost: 8.00, // Example base cost
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
      { name: "Salmon Fillets", quantity: "0.8 kg" },
      { name: "Fresh Dill", quantity: "0.5 bunch" },
      { name: "Fresh Parsley", quantity: "0.5 bunch" },
      { name: "Fresh Thyme", quantity: "0.5 bunch" },
      { name: "Lemon", quantity: "2 count" },
      { name: "Garlic", quantity: "2 head" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Preheat oven to 400°F (200°C)." },
      { step: "Chop herbs and garlic finely. Zest and juice one lemon." },
      { step: "Combine herbs, garlic, lemon zest, olive oil, salt, and pepper." },
      { step: "Pat salmon dry, spread herb mixture over top." },
      { step: "Bake for 15-20 minutes, or until cooked through. Serve with lemon wedges." },
    ],
    baseCost: 28.00,
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
      { name: "Chicken Breast", quantity: "0.6 kg" },
      { name: "All-Purpose Flour", quantity: "0.05 kg" },
      { name: "Olive Oil", quantity: "0.03 L" },
      { name: "Butter", quantity: "0.05 kg" },
      { name: "Cremini Mushrooms", quantity: "0.3 kg" },
      { name: "Garlic", quantity: "3 head" },
      { name: "Marsala Wine (cooking)", quantity: "0.2 L" },
      { name: "Chicken Broth", quantity: "0.2 L" },
      { name: "Fresh Parsley", quantity: "0.2 bunch" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Dredge chicken in flour, season with salt and pepper." },
      { step: "Sauté chicken in olive oil and butter until golden; set aside." },
      { step: "Add mushrooms and garlic to pan, cook until tender." },
      { step: "Deglaze with Marsala wine, then add chicken broth and simmer." },
      { step: "Return chicken to pan, cook until sauce thickens. Garnish with parsley." },
    ],
    baseCost: 22.00,
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
      { name: "Beef Tenderloin", quantity: "0.8 kg" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Butter", quantity: "0.05 kg" },
      { name: "Shallots", quantity: "0.1 kg" },
      { name: "Garlic", quantity: "2 head" },
      { name: "Cabernet Sauvignon", quantity: "0.2 bottle" }, // Using beverage inventory item
      { name: "Chicken Broth", quantity: "0.3 L" }, // Using chicken broth as a substitute for beef broth
      { name: "Fresh Thyme", quantity: "0.2 bunch" },
      { name: "Fresh Rosemary", quantity: "0.2 bunch" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Season beef tenderloin with salt and pepper." },
      { step: "Sear beef in olive oil and butter until browned on all sides; finish in oven if needed. Rest." },
      { step: "Sauté shallots and garlic in pan drippings. Add red wine, reduce by half." },
      { step: "Stir in beef broth, thyme, and rosemary; simmer until sauce thickens." },
      { step: "Slice beef and serve with red wine reduction." },
    ],
    baseCost: 55.00,
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
      { name: "Arborio Rice", quantity: "0.3 kg" },
      { name: "Mixed Wild Mushrooms", quantity: "0.4 kg" },
      { name: "Vegetable Broth", quantity: "1.5 L" },
      { name: "Parmesan Cheese", quantity: "0.1 kg" },
      { name: "Dry White Wine (cooking)", quantity: "0.15 bottle" },
      { name: "Onions", quantity: "0.15 kg" },
      { name: "Garlic", quantity: "2 head" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Butter", quantity: "0.05 kg" },
      { name: "Fresh Parsley", quantity: "0.2 bunch" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Sauté chopped onions and garlic in olive oil and butter." },
      { step: "Add Arborio rice, toast for 2 minutes. Deglaze with white wine." },
      { step: "Gradually add warm vegetable broth, stirring constantly, until absorbed." },
      { step: "Stir in sautéed wild mushrooms and Parmesan Cheese. Season to taste." },
      { step: "Garnish with fresh parsley before serving." },
    ],
    baseCost: 25.00,
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
      { name: "Pork Loin", quantity: "1.2 kg" },
      { name: "Apples (Granny Smith)", quantity: "0.5 kg" },
      { name: "Red Onion", quantity: "0.2 kg" },
      { name: "Apple Cider Vinegar", quantity: "0.1 L" },
      { name: "Brown Sugar", quantity: "0.1 kg" },
      { name: "Fresh Ginger", quantity: "0.02 kg" },
      { name: "Mustard Seeds", quantity: "0.005 kg" },
      { name: "Ground Cinnamon", quantity: "0.002 kg" },
      { name: "Ground Cloves", quantity: "0.001 kg" },
      { name: "Olive Oil", quantity: "0.03 L" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Season pork loin with salt, pepper, and olive oil. Roast until internal temperature reaches 145°F (63°C)." },
      { step: "For chutney: Dice apples and red onion. Sauté with ginger, mustard seeds, cinnamon, and cloves." },
      { step: "Add apple cider vinegar and brown sugar; simmer until apples are tender and sauce thickens." },
      { step: "Slice pork loin and serve with warm apple chutney." },
    ],
    baseCost: 38.00,
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
      { name: "Shrimp (Peeled & Deveined)", quantity: "0.6 kg" },
      { name: "Linguine Pasta", quantity: "0.4 kg" },
      { name: "Garlic", quantity: "4 head" },
      { name: "Butter", quantity: "0.1 kg" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Dry White Wine (cooking)", quantity: "0.1 L" },
      { name: "Lemon", quantity: "1 count" },
      { name: "Red Pepper Flakes", quantity: "0.002 kg" },
      { name: "Fresh Parsley", quantity: "0.3 bunch" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Cook linguine according to package directions. Reserve pasta water." },
      { step: "Melt butter and olive oil in a large skillet. Add minced garlic and red pepper flakes; cook until fragrant." },
      { step: "Add shrimp to skillet, cook until pink. Deglaze with white wine and lemon juice." },
      { step: "Toss cooked linguine with shrimp sauce. Add a splash of pasta water if needed. Garnish with fresh parsley." },
    ],
    baseCost: 30.00,
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
      { name: "Fresh Berries (Mixed)", quantity: "0.2 kg" }, // Using mixed berries for raspberries
      { name: "Lemon", quantity: "4 count" }, // Changed from plural Lemons
      { name: "Sugar", quantity: "0.1 kg" },
      { name: "Sparkling Water (Extra)", quantity: "1 L" }, // Using Sparkling Water (Extra)
      { name: "Fresh Mint", quantity: "6 sprig" }, // Changed from Mint Sprigs
    ],
    instructions: [
      { step: "Muddle raspberries and sugar in a pitcher." },
      { step: "Add fresh lemon juice and stir well." },
      { step: "Top with sparkling water and ice." },
      { step: "Garnish with mint sprigs and lemon slices." },
    ],
    baseCost: 6.00,
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
      { name: "Cherry Tomatoes", quantity: "0.3 kg" },
      { name: "Fresh Mozzarella Balls (mini)", quantity: "0.2 kg" }, // Assuming this is a pantry item
      { name: "Fresh Basil Leaves", quantity: "20 count" }, // Assuming this is a pantry item
      { name: "Balsamic Glaze", quantity: "0.05 L" }, // Assuming this is a pantry item
    ],
    instructions: [
      { step: "Thread cherry tomato, mozzarella ball, and basil leaf onto small skewers." },
      { step: "Arrange on a platter." },
      { step: "Drizzle with balsamic glaze just before serving." },
    ],
    baseCost: 12.00,
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
      { name: "Vodka (Standard)", quantity: "60 ml" }, // Using Vodka as a proxy for Tequila
      { name: "Fresh Limes", quantity: "1 count" }, // Changed from plural Limes
      { name: "Orange Juice", quantity: "20 ml" }, // Using Orange Juice as a proxy for Triple Sec
      { name: "Salt", quantity: "5 g" }, // For rim
      { name: "Lemon", quantity: "1 wedge" }, // Using Lemon for Lime Wedge
    ],
    instructions: [
      { step: "Rim a chilled margarita glass with salt." },
      { step: "Combine tequila, lime juice, and triple sec in a shaker with ice." },
      { step: "Shake well until thoroughly chilled." },
      { step: "Strain into the prepared glass over fresh ice. Garnish with a lime wedge." },
    ],
    baseCost: 8.00,
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
      { name: "Dark Chocolate", quantity: "0.2 kg" },
      { name: "Butter", quantity: "0.1 kg" },
      { name: "Eggs", quantity: "2 count" },
      { name: "Sugar", quantity: "0.05 kg" },
      { name: "All-Purpose Flour (Dessert)", quantity: "0.03 kg" },
      { name: "Vanilla Extract", quantity: "5 ml" },
      { name: "Fresh Berries (Mixed)", quantity: "0.1 kg" },
    ],
    instructions: [
      { step: "Preheat oven to 425°F (220°C). Grease ramekins." },
      { step: "Melt chocolate and butter together. Whisk in sugar, then eggs one at a time." },
      { step: "Fold in flour and vanilla. Pour batter into ramekins." },
      { step: "Bake for 10-12 minutes until edges are set but center is gooey. Invert onto plates and serve with berries." },
    ],
    baseCost: 10.00,
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
      { name: "Pie Crust (Pre-made)", quantity: "1 count" },
      { name: "Heavy Cream (Dessert)", quantity: "0.2 L" },
      { name: "Sugar", quantity: "0.1 kg" },
      { name: "Eggs", quantity: "3 count" },
      { name: "All-Purpose Flour (Dessert)", quantity: "0.05 kg" },
      { name: "Vanilla Extract", quantity: "10 ml" },
      { name: "Fresh Berries (Mixed)", quantity: "0.3 kg" },
      { name: "Gelatin Powder", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Blind bake pie crust according to package directions; let cool." },
      { step: "Prepare pastry cream: whisk egg yolks, sugar, flour. Heat milk/cream, temper yolks, cook until thick. Stir in vanilla." },
      { step: "Pour cooled pastry cream into pie crust. Arrange fresh fruits on top." },
      { step: "Prepare a simple glaze with gelatin and water, brush over fruit for shine. Chill before serving." },
    ],
    baseCost: 18.00,
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
      { name: "Green Tea Bags", quantity: "8 count" }, // Using green tea for variety
      { name: "Fresh Mint", quantity: "1 bunch" },
      { name: "Lemon", quantity: "2 count" }, // Changed from plural Lemons
      { name: "Sugar", quantity: "0.1 kg" },
      { name: "Water", quantity: "1.5 L" }, // Assuming water is always available
    ],
    instructions: [
      { step: "Bring water to a boil. Add tea bags and mint leaves; steep for 5 minutes. Remove tea bags and mint." },
      { step: "Stir in sugar until dissolved. Let cool to room temperature." },
      { step: "Add lemon juice. Chill thoroughly. Serve over ice with fresh mint and lemon slices." },
    ],
    baseCost: 5.00,
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
      { name: "Oranges", quantity: "4 count" },
      { name: "Sparkling Water (Extra)", quantity: "0.75 L" },
      { name: "Orange Blossom Water", quantity: "5 ml" }, // Assume this is a pantry item, not tracked in inventory
      { name: "Honey", quantity: "15 ml" },
      { name: "Fresh Mint", quantity: "4 sprig" },
    ],
    instructions: [
      { step: "Juice the oranges. Strain to remove pulp." },
      { step: "In a pitcher, combine orange juice, orange blossom water, and honey. Stir until honey dissolves." },
      { step: "Top with sparkling water and ice. Garnish with fresh mint sprigs and orange slices." },
    ],
    baseCost: 7.00,
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
      { name: "Cream Cheese", quantity: "1 kg" },
      { name: "Sugar", quantity: "0.3 kg" },
      { name: "Eggs", quantity: "4 count" },
      { name: "Heavy Cream (Dessert)", quantity: "0.1 L" },
      { name: "Vanilla Extract", quantity: "10 ml" },
      { name: "Graham Cracker Crumbs", quantity: "0.2 kg" },
      { name: "Butter", quantity: "0.08 kg" },
      { name: "Lemon", quantity: "1 count" },
    ],
    instructions: [
      { step: "Preheat oven to 325°F (160°C). Prepare springform pan with graham cracker crust." },
      { step: "Beat cream cheese and sugar until smooth. Add eggs one at a time, then heavy cream, vanilla, and lemon zest." },
      { step: "Pour batter into crust. Bake for 60-70 minutes until edges are set and center is slightly jiggly." },
      { step: "Cool completely, then chill for at least 4 hours or overnight before serving." },
    ],
    baseCost: 25.00,
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
      { name: "Mascarpone Cheese", quantity: "0.5 kg" },
      { name: "Eggs", quantity: "4 count" }, // Yolks only
      { name: "Sugar", quantity: "0.15 kg" },
      { name: "Espresso Powder", quantity: "20 g" },
      { name: "Ladyfingers", quantity: "1 pack" },
      { name: "Cocoa Powder", quantity: "20 g" },
      { name: "Dark Chocolate", quantity: "50 g" }, // For shaving
      { name: "Coffee Liqueur", quantity: "50 ml" }, // Optional, using inventory item
    ],
    instructions: [
      { step: "Brew strong espresso and let cool. Mix with coffee liqueur if using." },
      { step: "Whisk egg yolks and sugar over a double boiler until pale and thick. Remove from heat, stir in mascarpone." },
      { step: "In a separate bowl, whip egg whites to soft peaks and gently fold into mascarpone mixture." },
      { step: "Quickly dip ladyfingers in espresso, arrange a layer in a dish. Spread half the mascarpone cream over." },
      { step: "Repeat layers. Chill for at least 4 hours. Dust with cocoa powder and chocolate shavings before serving." },
    ],
    baseCost: 30.00,
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
      { name: "Whiskey (Bourbon)", quantity: "60 ml" },
      { name: "Angostura Bitters", quantity: "2 dashes" },
      { name: "Sugar", quantity: "1 cube" },
      { name: "Oranges", quantity: "1 peel" }, // Using Oranges for peel
      { name: "Ice", quantity: "large cube" }, // Assuming ice is always available
    ],
    instructions: [
      { step: "Place sugar cube in an Old Fashioned glass, add bitters and a splash of water. Muddle until sugar dissolves." },
      { step: "Add whiskey and a large ice cube. Stir gently for 30 seconds to chill and dilute." },
      { step: "Express the oil from an orange peel over the drink, then drop it in. Serve." },
    ],
    baseCost: 10.00,
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
      { name: "White Rum", quantity: "60 ml" },
      { name: "Fresh Limes", quantity: "1 count" },
      { name: "Fresh Mint", quantity: "10 leaves" },
      { name: "Sugar", quantity: "2 tsp" },
      { name: "Club Soda", quantity: "90 ml" },
      { name: "Ice", quantity: "crushed" }, // Assuming ice is always available
    ],
    instructions: [
      { step: "In a sturdy glass, gently muddle mint leaves with sugar and lime juice." },
      { step: "Add rum and fill the glass with crushed ice." },
      { step: "Top with club soda. Stir gently to combine. Garnish with a lime wedge and mint sprig." },
    ],
    baseCost: 9.00,
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
      { name: "Spinach (Fresh)", quantity: "0.5 kg" },
      { name: "Artichoke Hearts (Canned)", quantity: "0.4 kg" },
      { name: "Cream Cheese (softened)", quantity: "0.2 kg" },
      { name: "Mayonnaise", quantity: "0.1 L" },
      { name: "Parmesan Cheese (grated)", quantity: "0.1 kg" },
      { name: "Garlic", quantity: "3 head" },
      { name: "Crostini/Baguette", quantity: "1 pack" },
    ],
    instructions: [
      { step: "Preheat oven to 375°F (190°C). Sauté spinach and garlic until wilted; squeeze out excess water." },
      { step: "Chop artichoke hearts. In a bowl, combine spinach, artichokes, cream cheese, mayonnaise, and half of the Parmesan." },
      { step: "Transfer to a baking dish, top with remaining Parmesan. Bake for 20-25 minutes until bubbly and golden." },
      { step: "Serve warm with crostini." },
    ],
    baseCost: 18.00,
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
      { name: "Cantaloupe", quantity: "0.5 count" },
      { name: "Honeydew Melon", quantity: "0.5 count" },
      { name: "Prosciutto", quantity: "0.15 kg" },
      { name: "Fresh Mint", quantity: "0.1 bunch" },
    ],
    instructions: [
      { step: "Cut melon into bite-sized cubes. Slice prosciutto into thin strips." },
      { step: "Wrap each melon cube with a strip of prosciutto." },
      { step: "Arrange on a platter and garnish with fresh mint leaves. Chill until serving." },
    ],
    baseCost: 15.00,
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
      { name: "Shrimp (Peeled & Deveined)", quantity: "0.5 kg" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Lemon", quantity: "1 count" },
      { name: "Garlic", quantity: "2 head" },
      { name: "Red Pepper Flakes", quantity: "0.003 kg" },
      { name: "Fresh Parsley", quantity: "0.1 bunch" },
      { name: "Salt", quantity: "0.005 kg" },
      { name: "Black Pepper", quantity: "0.003 kg" },
    ],
    instructions: [
      { step: "In a bowl, whisk together olive oil, lemon juice, minced garlic, red pepper flakes, salt, and pepper." },
      { step: "Add shrimp to the marinade, toss to coat, and refrigerate for at least 30 minutes." },
      { step: "Thread shrimp onto skewers. Grill or pan-fry for 2-4 minutes per side until pink and cooked through." },
      { step: "Garnish with fresh chopped parsley and serve immediately." },
    ],
    baseCost: 20.00,
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
      { name: "Asparagus", quantity: "0.5 kg" },
      { name: "Olive Oil", quantity: "0.03 L" },
      { name: "Garlic", quantity: "2 head" },
      { name: "Parmesan Cheese (grated)", quantity: "0.05 kg" },
      { name: "Salt", quantity: "0.005 kg" },
      { name: "Black Pepper", quantity: "0.003 kg" },
    ],
    instructions: [
      { step: "Preheat oven to 400°F (200°C). Trim woody ends off asparagus." },
      { step: "Toss asparagus with olive oil, minced garlic, salt, and pepper on a baking sheet." },
      { step: "Roast for 10-15 minutes until tender-crisp. Sprinkle with Parmesan cheese and serve." },
    ],
    baseCost: 10.00,
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
      { name: "Potatoes (Russet)", quantity: "1 kg" },
      { name: "Butter", quantity: "0.1 kg" },
      { name: "Milk", quantity: "0.2 L" },
      { name: "Heavy Cream", quantity: "0.1 L" },
      { name: "Salt", quantity: "0.01 kg" },
      { name: "Black Pepper", quantity: "0.005 kg" },
    ],
    instructions: [
      { step: "Peel and chop potatoes into even pieces. Boil in salted water until very tender." },
      { step: "Drain potatoes thoroughly. Return to pot over low heat to dry out any remaining moisture." },
      { step: "Mash potatoes. Heat butter, milk, and heavy cream until warm. Gradually add to potatoes, mixing until smooth and creamy." },
      { step: "Season with salt and pepper to taste. Serve hot." },
    ],
    baseCost: 12.00,
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
      { name: "Quinoa", quantity: "0.3 kg" },
      { name: "Vegetable Broth", quantity: "0.6 L" },
      { name: "Bell Peppers (Assorted)", quantity: "2 count" },
      { name: "Zucchini", quantity: "1 count" },
      { name: "Red Onion", quantity: "0.1 kg" },
      { name: "Cherry Tomatoes", quantity: "0.2 kg" },
      { name: "Olive Oil", quantity: "0.05 L" },
      { name: "Red Wine Vinegar", quantity: "0.03 L" },
      { name: "Fresh Parsley", quantity: "0.1 bunch" },
      { name: "Salt", quantity: "0.005 kg" },
      { name: "Black Pepper", quantity: "0.003 kg" },
    ],
    instructions: [
      { step: "Rinse quinoa thoroughly. Cook quinoa in vegetable broth according to package directions; fluff with a fork." },
      { step: "Chop bell peppers, zucchini, and red onion. Toss with olive oil, salt, and pepper. Roast at 400°F (200°C) for 20-25 minutes." },
      { step: "Combine cooked quinoa, roasted vegetables, and halved cherry tomatoes in a large bowl." },
      { step: "Whisk together olive oil, red wine vinegar, salt, and pepper for dressing. Pour over salad and toss. Garnish with fresh parsley." },
    ],
    baseCost: 16.00,
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
      { name: "Cucumber", quantity: "1 count" },
      { name: "Fresh Mint", quantity: "0.5 bunch" },
      { name: "Lemon", quantity: "2 count" },
      { name: "Sugar", quantity: "0.05 kg" },
      { name: "Water", quantity: "1 L" },
      { name: "Sparkling Water (Extra)", quantity: "0.5 L" },
    ],
    instructions: [
      { step: "Peel and chop cucumber. Muddle cucumber slices with mint leaves and sugar in a pitcher." },
      { step: "Add lemon juice and still water. Stir well and let infuse for 15 minutes." },
      { step: "Strain the mixture, pressing solids to extract juice. Top with sparkling water and ice." },
      { step: "Garnish with fresh cucumber slices and mint sprigs." },
    ],
    baseCost: 7.00,
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
      { name: "Apple Cider", quantity: "1.5 L" },
      { name: "Cinnamon Sticks", quantity: "3 count" },
      { name: "Ground Cloves", quantity: "0.002 kg" },
      { name: "Oranges", quantity: "1 count" },
      { name: "Brown Sugar", quantity: "0.05 kg" },
    ],
    instructions: [
      { step: "Combine apple cider, cinnamon sticks, ground cloves, and orange slices in a large pot." },
      { step: "Add brown sugar and stir until dissolved." },
      { step: "Bring to a simmer over medium heat, then reduce heat to low and let steep for at least 15-20 minutes." },
      { step: "Serve warm, garnished with fresh orange slices and cinnamon sticks." },
    ],
    baseCost: 9.00,
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
      { name: "Coffee Beans (Ground)", quantity: "0.2 kg" },
      { name: "Water", quantity: "1.5 L" }, // For cold brew
      { name: "Milk", quantity: "1 L" },
      { name: "Heavy Cream", quantity: "0.5 L" }, // For creamer
      { name: "Simple Syrup", quantity: "0.2 L" },
      { name: "Vanilla Extract", quantity: "10 ml" }, // For vanilla syrup
      { name: "Ice", quantity: "1 kg" },
    ],
    instructions: [
      { step: "Prepare cold brew coffee: combine ground coffee and water, steep for 12-18 hours, then strain." },
      { step: "Prepare vanilla syrup: combine simple syrup and vanilla extract." },
      { step: "Set up a station with cold brew, milk, heavy cream, vanilla syrup, and ice. Allow guests to customize." },
    ],
    baseCost: 18.00,
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
      { name: "Heavy Cream (Dessert)", quantity: "0.4 L" },
      { name: "Lemon", quantity: "3 count" },
      { name: "Sugar", quantity: "0.1 kg" },
      { name: "Gelatin Powder", quantity: "0.005 kg" },
      { name: "Fresh Berries (Mixed)", quantity: "0.2 kg" }, // Using mixed berries for raspberries
      { name: "Fresh Mint", quantity: "0.05 bunch" }, // For garnish
    ],
    instructions: [
      { step: "Whip heavy cream to soft peaks; set aside." },
      { step: "Bloom gelatin in a small amount of cold water. Heat lemon juice and sugar until dissolved, then stir in bloomed gelatin." },
      { step: "Fold lemon mixture into whipped cream. Gently fold in half of the raspberries." },
      { step: "Spoon mousse into serving glasses, layering with remaining raspberries. Chill for at least 2 hours. Garnish with mint." },
    ],
    baseCost: 15.00,
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
      { name: "Cream Cheese", quantity: "0.5 kg" },
      { name: "Sugar", quantity: "0.15 kg" },
      { name: "Eggs", quantity: "2 count" },
      { name: "Vanilla Extract", quantity: "5 ml" },
      { name: "Graham Cracker Crumbs", quantity: "0.1 kg" },
      { name: "Butter", quantity: "0.05 kg" },
      { name: "Fresh Berries (Mixed)", quantity: "0.2 kg" }, // For compote
      { name: "Lemon", quantity: "1 count" }, // For compote
    ],
    instructions: [
      { step: "Preheat oven to 325°F (160°C). Line a muffin tin with paper liners. Press graham cracker crust into each liner." },
      { step: "Beat cream cheese and sugar until smooth. Add eggs and vanilla, mix until just combined." },
      { step: "Fill liners with cheesecake batter. Bake for 18-20 minutes until centers are almost set. Cool completely, then chill." },
      { step: "Prepare fruit compotes (e.g., berry, lemon curd). Top chilled cheesecakes with assorted compotes before serving." },
    ],
    baseCost: 20.00,
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
      { name: "Apples (Granny Smith)", quantity: "1 kg" },
      { name: "Oats (Rolled)", quantity: "0.15 kg" },
      { name: "All-Purpose Flour (Dessert)", quantity: "0.1 kg" },
      { name: "Brown Sugar", quantity: "0.1 kg" },
      { name: "Butter", quantity: "0.1 kg" },
      { name: "Ground Cinnamon", quantity: "0.005 kg" },
      { name: "Nutmeg (Ground)", quantity: "0.001 kg" },
      { name: "Vanilla Ice Cream", quantity: "1 L" }, // Placeholder for ice cream
    ],
    instructions: [
      { step: "Preheat oven to 375°F (190°C). Peel, core, and slice apples. Toss with a little sugar and cinnamon; place in a baking dish." },
      { step: "In a bowl, combine oats, flour, brown sugar, cinnamon, and nutmeg. Cut in cold butter until crumbly." },
      { step: "Sprinkle crumble topping evenly over apples. Bake for 35-40 minutes until apples are tender and topping is golden brown." },
      { step: "Serve warm with a scoop of vanilla ice cream." },
    ],
    baseCost: 16.00,
  },
  // NEW ALCOHOLIC BEVERAGE RECIPES
  {
    id: "r32",
    name: "Espresso Martini",
    description: "A sophisticated and energizing cocktail with vodka, coffee liqueur, and espresso.",
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "1",
    category: "Alcoholic Beverage",
    ingredients: [
      { name: "Vodka (Standard)", quantity: "45 ml" },
      { name: "Coffee Liqueur", quantity: "20 ml" },
      { name: "Espresso Powder", quantity: "10 g" }, // Using powder for simplicity, assume brewed
      { name: "Simple Syrup", quantity: "15 ml" },
      { name: "Ice", quantity: "cubed" },
      { name: "Coffee Beans (Ground)", quantity: "3 count" }, // For garnish, using ground coffee as a proxy
    ],
    instructions: [
      { step: "Brew espresso (or dissolve espresso powder in a small amount of hot water and cool). Chill." },
      { step: "Combine vodka, coffee liqueur, cooled espresso, and simple syrup in a shaker with ice." },
      { step: "Shake vigorously until well-chilled and a frothy head forms." },
      { step: "Strain into a chilled martini glass. Garnish with three coffee beans." },
    ],
    baseCost: 12.00,
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
      { name: "Whiskey (Bourbon)", quantity: "60 ml" },
      { name: "Lemon", quantity: "0.5 count" }, // For fresh lemon juice
      { name: "Simple Syrup", quantity: "20 ml" },
      { name: "Egg", quantity: "1 white only" }, // Optional, for foam
      { name: "Angostura Bitters", quantity: "1 dash" }, // For garnish
      { name: "Ice", quantity: "cubed" },
      { name: "Oranges", quantity: "1 slice" }, // For garnish
    ],
    instructions: [
      { step: "Combine whiskey, fresh lemon juice, simple syrup, and egg white (if using) in a shaker without ice. Dry shake vigorously for 15 seconds." },
      { step: "Add ice to the shaker and shake again until well-chilled." },
      { step: "Strain into a chilled coupe or rocks glass over fresh ice. Garnish with an orange slice and a dash of Angostura bitters." },
    ],
    baseCost: 11.00,
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
    alcoholicBeverageIds: ["r11", "r19", "r33", "b1", "b2", "b11", "b4", "b3", "b10"], // Classic Margarita, Mojito, Whiskey Sour, Cabernet Sauvignon, Chardonnay, Sparkling Wine (Prosecco), IPA Beer, Pilsner Beer, Local Craft Beer (Assorted)
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
    alcoholicBeverageIds: ["b3", "b10"], // Pilsner Beer, Local Craft Beer
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
    alcoholicBeverageIds: ["r18", "b11"], // Old Fashioned, Sparkling Wine
    nonAlcoholicBeverageIds: ["r9", "r14", "r27"], // Sparkling Raspberry Lemonade, Fresh Mint Iced Tea, Spiced Apple Cider
    sideDishIds: ["r2", "r25"], // Garden Salad, Quinoa Salad with Roasted Vegetables
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];


export const useCateringStore = create<CateringState>()(
  persist(
    (set, get) => ({
      inventory: initialInventory,
      recipes: initialRecipes, // Initialize with some recipes
      bookings: [],
      clients: [], // Initialize clients
      proposals: [], // Initialize proposals
      estimates: [], // Estimates state
      menus: initialMenus, // NEW: Initialize menus with sample data

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
          const inventoryItem = updatedInventory.find(inv => inv.name.toLowerCase() === recipeIng.name.toLowerCase());
          if (!inventoryItem) {
            console.warn(`Ingredient "${recipeIng.name}" not found in inventory.`);
            canDeduct = false;
            break;
          }
          // Simple quantity parsing for now, assumes recipeIng.quantity is a number string
          const requiredQuantity = parseFloat(recipeIng.quantity);
          if (isNaN(requiredQuantity) || inventoryItem.currentStock < requiredQuantity) {
            console.warn(`Insufficient stock for "${recipeIng.name}". Needed: ${requiredQuantity}, Available: ${inventoryItem.currentStock}`);
            canDeduct = false;
            break;
          }
        }

        if (!canDeduct) return false; // Not enough stock for one or more ingredients

        // If enough stock, proceed with deduction
        for (const recipeIng of recipe.ingredients) {
          const inventoryItem = updatedInventory.find(inv => inv.name.toLowerCase() === recipeIng.name.toLowerCase());
          if (inventoryItem) {
            const requiredQuantity = parseFloat(recipeIng.quantity);
            inventoryItem.currentStock -= requiredQuantity;
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

      addRecipe: (recipe) => set((state) => ({
        recipes: [...state.recipes, { ...recipe, id: crypto.randomUUID() }],
      })),
      updateRecipe: (updatedRecipe) => set((state) => ({
        recipes: state.recipes.map((recipe) =>
          recipe.id === updatedRecipe.id ? updatedRecipe : recipe
        ),
      })),
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

        return {
          proposals: state.proposals.map((p) =>
            p.id === updatedProposal.id ? { ...updatedProposal, subtotal, totalAmount, updatedAt: new Date().toISOString() } : p
          ),
        };
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
    }),
    {
      name: 'catering-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);