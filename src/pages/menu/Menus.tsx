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
import { PlusCircle, Edit, Trash2, Utensils, ChevronDown, ChevronRight, Wine, Coffee, Cake, Salad } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, Menu, Recipe } from "@/store/cateringStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

const Menus = () => {
  const menus = useCateringStore((state) => state.menus);
  const recipes = useCateringStore((state) => state.recipes);
  const addMenu = useCateringStore((state) => state.addMenu);
  const updateMenu = useCateringStore((state) => state.updateMenu);
  const deleteMenu = useCateringStore((state) => state.deleteMenu);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    setIsDialogOpen(false);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    form.reset(menu); // Populate form with menu data
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMenu(id);
    toast.info("Menu deleted.");
    if (selectedMenuId === id) {
      setSelectedMenuId(undefined); // Clear selected menu if deleted
    }
  };

  const renderRecipeList = (ids: string[] | undefined, title: string, Icon: React.ElementType) => {
    if (!ids || ids.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" /> {title}:
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

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Menu Planning</h1>
        <p className="text-xl text-muted-foreground">
          Organize your recipes into pre-planned menus for various events.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingMenu ? "Edit Menu" : "Create New Menu"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingMenu ? "Update the details of your menu." : "Combine your recipes into a new curated menu."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-6">
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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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

                    {/* Categorized Recipe Selection */}
                    <h3 className="text-lg font-medium mt-4">Select Recipes by Category</h3>
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
                              placeholder="Select appetizers"
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
                              placeholder="Select main courses"
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
                              placeholder="Select side dishes"
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
                              placeholder="Select desserts"
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
                              placeholder="Select non-alcoholic drinks"
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
                              placeholder="Select alcoholic drinks"
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
          </CardContent>
        </Card>

        {/* Display Existing Menus with Dropdown and Detail View */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
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
                  <SelectTrigger className="w-full mb-6">
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
                  <div className="border p-4 rounded-md bg-background mt-4">
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
                      {renderRecipeList(selectedMenu.appetizerIds, "Appetizers", Salad)}
                      {renderRecipeList(selectedMenu.mainCourseIds, "Main Courses", Utensils)}
                      {renderRecipeList(selectedMenu.sideDishIds, "Side Dishes", Utensils)}
                      {renderRecipeList(selectedMenu.dessertIds, "Desserts", Cake)}
                      {renderRecipeList(selectedMenu.nonAlcoholicBeverageIds, "Non-Alcoholic Beverages", Coffee)}
                      {renderRecipeList(selectedMenu.alcoholicBeverageIds, "Alcoholic Beverages", Wine)}
                      {(selectedMenu.appetizerIds?.length === 0 &&
                        selectedMenu.mainCourseIds?.length === 0 &&
                        selectedMenu.dessertIds?.length === 0 &&
                        selectedMenu.alcoholicBeverageIds?.length === 0 &&
                        selectedMenu.nonAlcoholicBeverageIds?.length === 0 &&
                        selectedMenu.sideDishIds?.length === 0) && (
                        <p className="text-muted-foreground text-sm">No recipes selected for this menu.</p>
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