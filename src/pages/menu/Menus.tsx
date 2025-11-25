"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash2, Utensils, ChevronDown, ChevronRight, Wine, Coffee, Cake, Salad, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, Menu, Recipe, InventoryItem } from "@/store/cateringStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Multi-select component for recipes (reusing from Bookings, slightly adapted)
interface MultiSelectProps {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, placeholder }) => {
  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <Select onValueChange={handleSelect} value=""> {/* Value is empty to allow re-selection */}
      <SelectTrigger className="w-full">
        <SelectValue placeholder={selectedValues.length > 0 ? `${selectedValues.length} items selected` : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                readOnly
                className="mr-2"
              />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Define the schema for a menu form
const menuFormSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["Wedding", "Corporate", "Seasonal", "Buffet", "Plated", "Other"], {
    required_error: "Please select a category.",
  }),
  appetizerIds: z.array(z.string()).optional(),
  mainCourseIds: z.array(z.string()).optional(),
  dessertIds: z.array(z.string()).optional(),
  alcoholicBeverageIds: z.array(z.string()).optional(),
  nonAlcoholicBeverageIds: z.array(z.string()).optional(),
  sideDishIds: z.array(z.string()).optional(),
}).refine(data => 
  (data.appetizerIds && data.appetizerIds.length > 0) ||
  (data.mainCourseIds && data.mainCourseIds.length > 0) ||
  (data.dessertIds && data.dessertIds.length > 0) ||
  (data.alcoholicBeverageIds && data.alcoholicBeverageIds.length > 0) ||
  (data.nonAlcoholicBeverageIds && data.nonAlcoholicBeverageIds.length > 0) ||
  (data.sideDishIds && data.sideDishIds.length > 0),
  {
    message: "At least one item must be selected for the menu across all categories.",
    path: ["appetizerIds"], // Attach error to one of the fields
  }
);

type MenuFormData = z.infer<typeof menuFormSchema>;

// Define a simple structure for simulated imported menu data
interface SimulatedImportedMenu {
  name: string;
  description: string;
  category: "Wedding" | "Corporate" | "Seasonal" | "Buffet" | "Plated" | "Other";
  appetizerIds?: string[];
  mainCourseIds?: string[];
  dessertIds?: string[];
  alcoholicBeverageIds?: string[];
  nonAlcoholicBeverageIds?: string[];
  sideDishIds?: string[];
}

const Menus = () => {
  const menus = useCateringStore((state) => state.menus);
  const recipes = useCateringStore((state) => state.recipes);
  const inventory = useCateringStore((state) => state.inventory);
  const addMenu = useCateringStore((state) => state.addMenu);
  const updateMenu = useCateringStore((state) => state.updateMenu);
  const deleteMenu = useCateringStore((state) => state.deleteMenu);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState(""); // State for the JSON input
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined); // New state for dropdown selection

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Other",
      appetizerIds: [],
      mainCourseIds: [],
      dessertIds: [],
      alcoholicBeverageIds: [],
      nonAlcoholicBeverageIds: [],
      sideDishIds: [],
    },
  });

  // Watch the category field to adjust UI dynamically
  const watchedCategory = form.watch("category");

  // Filter recipes by category for multi-select options
  const getRecipeOptions = (category: Recipe["category"]) => 
    recipes.filter(r => r.category === category).map(recipe => ({
      label: recipe.name,
      value: recipe.id,
    }));

  const onSubmit = (data: MenuFormData) => {
    // Ensure arrays are not undefined before passing to store
    const menuData = {
      ...data,
      appetizerIds: data.appetizerIds || [],
      mainCourseIds: data.mainCourseIds || [],
      dessertIds: data.dessertIds || [],
      alcoholicBeverageIds: data.alcoholicBeverageIds || [],
      nonAlcoholicBeverageIds: data.nonAlcoholicBeverageIds || [],
      sideDishIds: data.sideDishIds || [],
    };

    if (editingMenu) {
      updateMenu({ ...menuData, id: editingMenu.id } as Menu);
      toast.success("Menu updated successfully!");
    } else {
      addMenu(menuData as Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success("Menu created successfully!");
    }
    form.reset();
    setEditingMenu(null);
    setIsFormDialogOpen(false);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    form.reset(menu); // Populate form with menu data
    setIsFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMenu(id);
    toast.info("Menu deleted.");
    if (selectedMenuId === id) {
      setSelectedMenuId(undefined); // Clear selected menu if deleted
    }
  };

  const handleSimulateMenuImport = () => {
    try {
      const importedMenu: SimulatedImportedMenu = JSON.parse(importJson);
      form.reset({
        name: importedMenu.name || "",
        description: importedMenu.description || "",
        category: importedMenu.category || "Other",
        appetizerIds: importedMenu.appetizerIds || [],
        mainCourseIds: importedMenu.mainCourseIds || [],
        dessertIds: importedMenu.dessertIds || [],
        alcoholicBeverageIds: importedMenu.alcoholicBeverageIds || [],
        nonAlcoholicBeverageIds: importedMenu.nonAlcoholicBeverageIds || [],
        sideDishIds: importedMenu.sideDishIds || [],
      });
      toast.success("Menu details pre-filled from import!");
      setIsImportDialogOpen(false);
      setImportJson(""); // Clear the textarea
      setIsFormDialogOpen(true); // Open the form dialog after pre-filling
    } catch (error) {
      toast.error("Failed to parse JSON. Please ensure it's valid JSON format.");
      console.error("JSON parsing error:", error);
    }
  };

  const renderRecipeList = (ids: string[] | undefined, title: string, Icon: React.ElementType, isPlated: boolean) => {
    if (!ids || ids.length === 0) {
      return (
        <div className="mt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" /> {title}:
          </h4>
          <p className="text-muted-foreground text-sm ml-6">No {title.toLowerCase()} selected for this menu.</p>
        </div>
      );
    }
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" /> {title} {isPlated ? "(Choices)" : "(Offerings)"}:
        </h4>
        <ul className="space-y-2">
          {ids.map(recipeId => {
            const recipe = recipes.find(r => r.id === recipeId);
            return recipe ? (
              <li key={recipe.id} className="flex items-start gap-2 text-sm">
                <Utensils className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                <div>
                  <span className="font-medium">{recipe.name}</span>
                  <p className="text-muted-foreground text-xs">{recipe.description}</p>
                </div>
              </li>
            ) : (
              <li key={recipeId} className="text-destructive text-sm">Unknown Recipe (ID: {recipeId})</li>
            );
          })}
        </ul>
      </div>
    );
  };

  const selectedMenu = menus.find(menu => menu.id === selectedMenuId);
  const isSelectedMenuPlated = selectedMenu?.category === "Plated";
  const isSelectedMenuBuffet = selectedMenu?.category === "Buffet";

  // Function to get all unique missing ingredients for a given menu
  const getMissingIngredientsForMenu = (menu: Menu) => {
    const allRecipeIds = [
      ...(menu.appetizerIds || []),
      ...(menu.mainCourseIds || []),
      ...(menu.dessertIds || []),
      ...(menu.alcoholicBeverageIds || []),
      ...(menu.nonAlcoholicBeverageIds || []),
      ...(menu.sideDishIds || []),
    ];

    const uniqueMissingIngredients = new Set<string>();

    allRecipeIds.forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ing => {
          const found = inventory.some(item =>
            item.name.toLowerCase() === ing.name.toLowerCase() &&
            item.unit.toLowerCase() === ing.unit.toLowerCase()
          );
          if (!found) {
            uniqueMissingIngredients.add(`${ing.name} (${ing.unit})`);
          }
        });
      }
    });
    return Array.from(uniqueMissingIngredients);
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4">Menu Planning</h1>
        <p className="text-xl text-muted-foreground">
          Organize your recipes into pre-planned menus for various events.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <Card className="bg-card p-4 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingMenu ? "Edit Menu" : "Create New Menu"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingMenu ? "Update the details of your menu." : "Combine your recipes into a new curated menu."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
                setIsFormDialogOpen(open);
                if (!open) { // If dialog is closing
                  form.reset();
                  setEditingMenu(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-1/2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingMenu ? "Edit Menu" : "Create New Menu"}</DialogTitle>
                    <DialogDescription>
                      {editingMenu ? "Make changes to the menu here. Click save when you're done." : "Define a new menu by selecting recipes and providing details."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 py-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Menu Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Summer Wedding Package" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="A delightful selection of seasonal dishes..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Menu Type/Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Wedding">Wedding</SelectItem>
                                <SelectItem value="Corporate">Corporate</SelectItem>
                                <SelectItem value="Seasonal">Seasonal</SelectItem>
                                <SelectItem value="Buffet">Buffet</SelectItem>
                                <SelectItem value="Plated">Plated</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categorized Recipe Selection - Conditional based on Menu Type */}
                      <h3 className="text-lg font-medium mt-4">
                        Select Recipes by Category {watchedCategory === "Plated" && "(Choose 1-2 per category)"}
                        {watchedCategory === "Buffet" && "(Select multiple offerings per category)"}
                      </h3>
                      {watchedCategory === "Plated" && (
                        <p className="text-sm text-muted-foreground -mt-2 mb-4">
                          For a plated menu, select the specific dishes offered for each course.
                        </p>
                      )}
                      {watchedCategory === "Buffet" && (
                        <p className="text-sm text-muted-foreground -mt-2 mb-4">
                          For a buffet menu, select all items that will be available in each category.
                        </p>
                      )}

                      <FormField
                        control={form.control}
                        name="appetizerIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Appetizers</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Appetizer")}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select appetizer choices" : "Select buffet appetizers"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mainCourseIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Main Courses</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Main Course").concat(getRecipeOptions("Vegetarian Main"))}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select main course choices" : "Select buffet main courses"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sideDishIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Side Dishes</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Side Dish")}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select side dish choices" : "Select buffet side dishes"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dessertIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desserts</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Dessert")}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select dessert choices" : "Select buffet desserts"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nonAlcoholicBeverageIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Non-Alcoholic Beverages</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Non-Alcoholic Beverage")}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select non-alcoholic drink choices" : "Select buffet non-alcoholic drinks"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="alcoholicBeverageIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alcoholic Beverages</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={getRecipeOptions("Alcoholic Beverage")}
                                selectedValues={field.value || []}
                                onChange={field.onChange}
                                placeholder={watchedCategory === "Plated" ? "Select alcoholic drink choices" : "Select buffet alcoholic drinks"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit">{editingMenu ? "Save changes" : "Create Menu"}</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-1/2">
                    <LinkIcon className="mr-2 h-4 w-4" /> Simulate Menu Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Simulate Menu Import</DialogTitle>
                    <DialogDescription>
                      Paste menu details in JSON format. This will pre-fill the "Create New Menu" form.
                      <br />
                      <span className="text-xs text-muted-foreground">
                        (Note: For legal reasons, direct web scraping is not supported. Please ensure your source is legal.)
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-3">
                    <Label htmlFor="menuJson" className="text-left">
                      Menu JSON
                    </Label>
                    <Textarea
                      id="menuJson"
                      placeholder={`{\n  "name": "Example Menu",\n  "description": "A delightful example menu.",\n  "category": "Wedding",\n  "appetizerIds": ["r10", "r21"],\n  "mainCourseIds": ["r3", "r7"]\n}`}
                      className="min-h-[200px] font-mono text-xs"
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" onClick={handleSimulateMenuImport}>Pre-fill Form</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Display Existing Menus with Dropdown and Detail View */}
        <Card className="bg-card p-4 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">View Existing Menus</CardTitle>
            <CardDescription className="text-muted-foreground">Select a menu to view its full details.</CardDescription>
          </CardHeader>
          <CardContent>
            {menus.length === 0 ? (
              <p className="text-muted-foreground text-center">No menus created yet. Click "Create New Menu" to get started!</p>
            ) : (
              <>
                <Select onValueChange={setSelectedMenuId} value={selectedMenuId}>
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Select a menu to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        {menu.name} ({menu.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMenu ? (
                  <div className="border p-3 rounded-md bg-background mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{selectedMenu.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMenu.description}</p>
                        <Badge variant="secondary" className="mt-2">{selectedMenu.category}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(selectedMenu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(selectedMenu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      {isSelectedMenuPlated && (
                        <p className="text-md font-semibold text-primary mb-4">This is a Plated Menu. Guests will choose from the following options:</p>
                      )}
                      {isSelectedMenuBuffet && (
                        <p className="text-md font-semibold text-primary mb-4">This is a Buffet Menu. The following items will be available:</p>
                      )}
                      {renderRecipeList(selectedMenu.appetizerIds, "Appetizers", Salad, isSelectedMenuPlated)}
                      {renderRecipeList(selectedMenu.mainCourseIds, "Main Courses", Utensils, isSelectedMenuPlated)}
                      {renderRecipeList(selectedMenu.sideDishIds, "Side Dishes", Utensils, isSelectedMenuPlated)}
                      {renderRecipeList(selectedMenu.dessertIds, "Desserts", Cake, isSelectedMenuPlated)}
                      {renderRecipeList(selectedMenu.nonAlcoholicBeverageIds, "Non-Alcoholic Beverages", Coffee, isSelectedMenuPlated)}
                      {renderRecipeList(selectedMenu.alcoholicBeverageIds, "Alcoholic Beverages", Wine, isSelectedMenuPlated)}

                      <Separator className="my-6" />

                      {/* Missing Ingredients Section */}
                      <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" /> Missing Ingredients for this Menu:
                      </h4>
                      {getMissingIngredientsForMenu(selectedMenu).length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-destructive ml-4">
                          {getMissingIngredientsForMenu(selectedMenu).map((ingredient, idx) => (
                            <li key={idx}>{ingredient}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-green-600 text-sm ml-4">All ingredients for this menu are currently in your inventory!</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center mt-4">Select a menu from the dropdown to see its details.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Menus;