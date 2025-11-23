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

// Define the schema for an inventory item
export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number; // New: Cost per unit for inventory tracking
}

// Define the schema for a beverage item
export interface BeverageItem {
  id: string;
  name: string;
  type: "Cocktail" | "Wine" | "Beer" | "Spirit" | "Mixer" | "Other";
  currentStock: number;
  unit: string; // e.g., "bottle", "can", "ml", "L"
  lowStockThreshold: number;
  costPerUnit: number; // New: Cost per unit for beverage tracking
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

// Define the schema for an item within a proposal (recipe or beverage)
export interface ProposalItem {
  id: string; // ID of the recipe or beverage
  type: "recipe" | "beverage";
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
  items: ProposalItem[]; // Recipes and beverages included
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

// Define the schema for a Menu
export interface Menu {
  id: string;
  name: string;
  description: string;
  category: "Wedding" | "Corporate" | "Seasonal" | "Buffet" | "Plated" | "Other";
  recipeIds: string[]; // IDs of recipes included in this menu
  createdAt: string;
  updatedAt: string;
}

interface CateringState {
  inventory: InventoryItem[];
  recipes: Recipe[];
  bookings: EventBooking[];
  beverageInventory: BeverageItem[];
  clients: Client[]; // New: Clients state
  proposals: Proposal[]; // New: Proposals state
  estimates: Estimate[]; // Estimates state
  menus: Menu[]; // NEW: Menus state

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  deductInventory: (recipeId: string) => boolean; // Returns true if deduction successful, false otherwise

  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;

  addBooking: (booking: Omit<EventBooking, 'id' | 'status'>) => void;
  updateBooking: (booking: EventBooking) => void;
  deleteBooking: (id: string) => void;
  completeBooking: (id: string) => boolean; // Returns true if completed and inventory deducted, false otherwise

  addBeverageItem: (item: Omit<BeverageItem, 'id'>) => void;
  updateBeverageItem: (item: BeverageItem) => void;
  deleteBeverageItem: (id: string) => void;
  deductBeverageStock: (beverageId: string, quantity: number) => boolean;

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
  { id: "1", name: "Chicken Breast", currentStock: 50, unit: "kg", lowStockThreshold: 10, costPerUnit: 5.00 },
  { id: "2", name: "Beef Sirloin", currentStock: 30, unit: "kg", lowStockThreshold: 5, costPerUnit: 15.00 },
  { id: "3", name: "Salmon Fillets", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 12.00 },
  { id: "4", name: "Mixed Salad Greens", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 3.50 },
  { id: "5", name: "Potatoes", currentStock: 100, unit: "kg", lowStockThreshold: 20, costPerUnit: 1.20 },
  { id: "6", name: "Onions", currentStock: 40, unit: "kg", lowStockThreshold: 8, costPerUnit: 0.80 },
  { id: "7", name: "Carrots", currentStock: 35, unit: "kg", lowStockThreshold: 7, costPerUnit: 0.90 },
  { id: "8", name: "All-Purpose Flour", currentStock: 25, unit: "kg", lowStockThreshold: 5, costPerUnit: 1.00 },
  { id: "9", name: "Sugar", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 0.70 },
  { id: "10", name: "Olive Oil", currentStock: 10, unit: "L", lowStockThreshold: 2, costPerUnit: 8.00 },
  { id: "11", name: "Heavy Cream", currentStock: 8, unit: "L", lowStockThreshold: 1, costPerUnit: 4.50 },
  { id: "12", name: "Eggs", currentStock: 120, unit: "count", lowStockThreshold: 24, costPerUnit: 0.20 },
  { id: "13", name: "Parmesan Cheese", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 18.00 },
  { id: "14", name: "Tomatoes (Canned)", currentStock: 30, unit: "can", lowStockThreshold: 6, costPerUnit: 1.10 },
  { id: "15", name: "Rice (Basmati)", currentStock: 50, unit: "kg", lowStockThreshold: 10, costPerUnit: 2.50 },
  // New ingredients for recipes
  { id: "16", name: "Fresh Dill", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "17", name: "Fresh Parsley", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.00 },
  { id: "18", name: "Fresh Thyme", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "19", name: "Lemon", currentStock: 20, unit: "count", lowStockThreshold: 5, costPerUnit: 0.75 },
  { id: "20", name: "Garlic", currentStock: 30, unit: "head", lowStockThreshold: 6, costPerUnit: 0.50 },
  { id: "21", name: "Cremini Mushrooms", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 8.00 },
  { id: "22", name: "Marsala Wine (cooking)", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "23", name: "Chicken Broth", currentStock: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 3.00 },
  { id: "24", name: "Butter", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 12.00 },
  { id: "25", name: "Beef Tenderloin", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 35.00 },
  { id: "26", name: "Shallots", currentStock: 8, unit: "kg", lowStockThreshold: 2, costPerUnit: 7.00 },
  { id: "27", name: "Fresh Rosemary", currentStock: 10, unit: "bunch", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "28", name: "Arborio Rice", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 4.00 },
  { id: "29", name: "Mixed Wild Mushrooms", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 25.00 },
  { id: "30", name: "Vegetable Broth", currentStock: 20, unit: "L", lowStockThreshold: 4, costPerUnit: 2.50 },
  { id: "31", name: "Dry White Wine (cooking)", currentStock: 5, unit: "bottle", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "32", name: "Pork Loin", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 18.00 },
  { id: "33", name: "Apples (Granny Smith)", currentStock: 25, unit: "kg", lowStockThreshold: 5, costPerUnit: 3.00 },
  { id: "34", name: "Red Onion", currentStock: 15, unit: "kg", lowStockThreshold: 3, costPerUnit: 2.00 },
  { id: "35", name: "Apple Cider Vinegar", currentStock: 5, unit: "L", lowStockThreshold: 1, costPerUnit: 4.00 },
  { id: "36", name: "Brown Sugar", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 2.50 },
  { id: "37", name: "Fresh Ginger", currentStock: 5, unit: "kg", lowStockThreshold: 1, costPerUnit: 10.00 },
  { id: "38", name: "Mustard Seeds", currentStock: 2, unit: "kg", lowStockThreshold: 0.5, costPerUnit: 8.00 },
  { id: "39", name: "Ground Cinnamon", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 15.00 },
  { id: "40", name: "Ground Cloves", currentStock: 0.5, unit: "kg", lowStockThreshold: 0.1, costPerUnit: 20.00 },
  { id: "41", name: "Shrimp (Peeled & Deveined)", currentStock: 10, unit: "kg", lowStockThreshold: 2, costPerUnit: 25.00 },
  { id: "42", name: "Linguine Pasta", currentStock: 20, unit: "kg", lowStockThreshold: 4, costPerUnit: 3.00 },
  { id: "43", name: "Red Pepper Flakes", currentStock: 1, unit: "kg", lowStockThreshold: 0.2, costPerUnit: 12.00 },
];

const initialBeverageInventory: BeverageItem[] = [
  { id: "b1", name: "Cabernet Sauvignon", type: "Wine", currentStock: 12, unit: "bottle", lowStockThreshold: 3, costPerUnit: 15.00 },
  { id: "b2", name: "Chardonnay", type: "Wine", currentStock: 10, unit: "bottle", lowStockThreshold: 2, costPerUnit: 12.00 },
  { id: "b3", name: "Pilsner Beer", type: "Beer", currentStock: 48, unit: "can", lowStockThreshold: 12, costPerUnit: 1.50 },
  { id: "b4", name: "IPA Beer", type: "Beer", currentStock: 36, unit: "can", lowStockThreshold: 9, costPerUnit: 2.00 },
  { id: "b5", name: "Vodka (Standard)", type: "Spirit", currentStock: 6, unit: "bottle", lowStockThreshold: 1, costPerUnit: 20.00 },
  { id: "b6", name: "Gin (Dry)", type: "Spirit", currentStock: 4, unit: "bottle", lowStockThreshold: 1, costPerUnit: 18.00 },
  { id: "b7", name: "Orange Juice", type: "Mixer", currentStock: 10, unit: "L", lowStockThreshold: 2, costPerUnit: 3.00 },
  { id: "b8", name: "Tonic Water", type: "Mixer", currentStock: 24, unit: "can", lowStockThreshold: 6, costPerUnit: 0.75 },
  { id: "b9", name: "Coca-Cola", type: "Other", currentStock: 30, unit: "can", lowStockThreshold: 10, costPerUnit: 0.60 },
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
      { name: "Mushrooms", quantity: "0.3 kg" },
      { name: "Heavy Cream", quantity: "0.2 L" },
      { name: "Sour Cream", quantity: "0.1 L" },
      { name: "Pasta", quantity: "0.4 kg" },
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
      { name: "Tomatoes", quantity: "0.2 kg" },
      { name: "Cucumbers", quantity: "0.15 kg" },
      { name: "Bell Peppers", quantity: "0.1 kg" },
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
      { name: "Beef Broth", quantity: "0.3 L" },
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
      { step: "Stir in sautéed wild mushrooms and Parmesan cheese. Season to taste." },
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
      { name: "Raspberries", quantity: "0.2 kg" },
      { name: "Lemons", quantity: "4 count" },
      { name: "Sugar", quantity: "0.1 kg" },
      { name: "Sparkling Water", quantity: "1 L" },
      { name: "Mint Sprigs", quantity: "6 count" },
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
      { name: "Fresh Mozzarella Balls (mini)", quantity: "0.2 kg" },
      { name: "Fresh Basil Leaves", quantity: "20 count" },
      { name: "Balsamic Glaze", quantity: "0.05 L" },
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
      { name: "Tequila", quantity: "60 ml" },
      { name: "Fresh Lime Juice", quantity: "30 ml" },
      { name: "Triple Sec", quantity: "20 ml" },
      { name: "Salt (for rim)", quantity: "5 g" },
      { name: "Lime Wedge", quantity: "1 count" },
    ],
    instructions: [
      { step: "Rim a chilled margarita glass with salt." },
      { step: "Combine tequila, lime juice, and triple sec in a shaker with ice." },
      { step: "Shake well until thoroughly chilled." },
      { step: "Strain into the prepared glass over fresh ice. Garnish with a lime wedge." },
    ],
    baseCost: 8.00,
  },
];

const initialMenus: Menu[] = [
  {
    id: "m1",
    name: "Summer Wedding Package",
    description: "A delightful and elegant menu perfect for a summer wedding celebration.",
    category: "Wedding",
    recipeIds: ["r3", "r6", "r7", "r9", "r10"], // Salmon, Risotto, Pork Loin, Lemonade, Caprese Skewers
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m2",
    name: "Corporate Lunch Buffet",
    description: "A versatile buffet menu suitable for corporate events and business lunches.",
    category: "Corporate",
    recipeIds: ["r1", "r2", "r4"], // Beef Stroganoff, Garden Salad, Chicken Marsala
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m3",
    name: "Vegetarian Dinner Party",
    description: "An exquisite plant-based menu designed to impress at any dinner party.",
    category: "Plated",
    recipeIds: ["r6", "r2", "r9"], // Wild Mushroom Risotto, Garden Salad, Sparkling Raspberry Lemonade
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
      beverageInventory: initialBeverageInventory,
      clients: [], // Initialize clients
      proposals: [], // Initialize proposals
      estimates: [], // Estimates state
      menus: initialMenus, // NEW: Initialize menus with sample data

      addInventoryItem: (item) => set((state) => ({
        inventory: [...state.inventory, { ...item, id: crypto.randomUUID() }],
      })),
      updateInventoryItem: (updatedItem) => set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
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
            canDeduct = false;
            break;
          }
          // Simple quantity parsing for now, assumes recipeIng.quantity is a number string
          const requiredQuantity = parseFloat(recipeIng.quantity);
          if (isNaN(requiredQuantity) || inventoryItem.currentStock < requiredQuantity) {
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

      addBeverageItem: (item) => set((state) => ({
        beverageInventory: [...state.beverageInventory, { ...item, id: crypto.randomUUID() }],
      })),
      updateBeverageItem: (updatedItem) => set((state) => ({
        beverageInventory: state.beverageInventory.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      })),
      deleteBeverageItem: (id) => set((state) => ({
        beverageInventory: state.beverageInventory.filter((item) => item.id !== id),
      })),
      deductBeverageStock: (beverageId, quantity) => {
        const updatedBeverageInventory = get().beverageInventory.map(item => {
          if (item.id === beverageId) {
            if (item.currentStock >= quantity) {
              return { ...item, currentStock: item.currentStock - quantity };
            }
            return item; // Not enough stock
          }
          return item;
        });

        const itemToDeduct = get().beverageInventory.find(item => item.id === beverageId);
        if (itemToDeduct && itemToDeduct.currentStock >= quantity) {
          set({ beverageInventory: updatedBeverageInventory });
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