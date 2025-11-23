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
  category: "Appetizer" | "Main Course" | "Dessert" | "Beverage" | "Side Dish" | "Breakfast" | "Other";
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

interface CateringState {
  inventory: InventoryItem[];
  recipes: Recipe[];
  bookings: EventBooking[];
  beverageInventory: BeverageItem[];
  clients: Client[]; // New: Clients state
  proposals: Proposal[]; // New: Proposals state

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

  // New: Client actions
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  // New: Proposal actions
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'totalAmount'>) => void;
  updateProposal: (proposal: Proposal) => void;
  deleteProposal: (id: string) => void;
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
    }),
    {
      name: 'catering-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);