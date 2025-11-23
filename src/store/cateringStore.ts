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
}

// Define the schema for an inventory item
export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
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
}

const initialInventory: InventoryItem[] = [
  { id: "1", name: "Chicken Breast", currentStock: 50, unit: "kg", lowStockThreshold: 10 },
  { id: "2", name: "Beef Sirloin", currentStock: 30, unit: "kg", lowStockThreshold: 5 },
  { id: "3", name: "Salmon Fillets", currentStock: 20, unit: "kg", lowStockThreshold: 4 },
  { id: "4", name: "Mixed Salad Greens", currentStock: 15, unit: "kg", lowStockThreshold: 3 },
  { id: "5", name: "Potatoes", currentStock: 100, unit: "kg", lowStockThreshold: 20 },
  { id: "6", name: "Onions", currentStock: 40, unit: "kg", lowStockThreshold: 8 },
  { id: "7", name: "Carrots", currentStock: 35, unit: "kg", lowStockThreshold: 7 },
  { id: "8", name: "All-Purpose Flour", currentStock: 25, unit: "kg", lowStockThreshold: 5 },
  { id: "9", name: "Sugar", currentStock: 20, unit: "kg", lowStockThreshold: 4 },
  { id: "10", name: "Olive Oil", currentStock: 10, unit: "L", lowStockThreshold: 2 },
  { id: "11", name: "Heavy Cream", currentStock: 8, unit: "L", lowStockThreshold: 1 },
  { id: "12", name: "Eggs", currentStock: 120, unit: "count", lowStockThreshold: 24 },
  { id: "13", name: "Parmesan Cheese", currentStock: 5, unit: "kg", lowStockThreshold: 1 },
  { id: "14", name: "Tomatoes (Canned)", currentStock: 30, unit: "can", lowStockThreshold: 6 },
  { id: "15", name: "Rice (Basmati)", currentStock: 50, unit: "kg", lowStockThreshold: 10 },
];

export const useCateringStore = create<CateringState>()(
  persist(
    (set, get) => ({
      inventory: initialInventory,
      recipes: [],
      bookings: [],

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
    }),
    {
      name: 'catering-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);