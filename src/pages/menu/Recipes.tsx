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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Link as LinkIcon, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, Recipe, RecipeIngredient, RecipeInstruction } from "@/store/cateringStore";
import { Badge } from "@/components/ui/badge";

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

type RecipeFormData = z.infer<typeof recipeFormSchema>;

// Define a simple structure for simulated imported recipe data
interface SimulatedImportedRecipe {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  category: "Appetizer" | "Main Course" | "Dessert" | "Alcoholic Beverage" | "Non-Alcoholic Beverage" | "Side Dish" | "Breakfast" | "Vegetarian Main" | "Other";
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: { step: string }[];
  sourceUrl?: string;
}

const Recipes = () => {
  const recipes = useCateringStore((state) => state.recipes);
  const addRecipe = useCateringStore((state) => state.addRecipe);
  const deleteRecipe = useCateringStore((state) => state.deleteRecipe);
  const inventory = useCateringStore((state) => state.inventory);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      category: "Main Course",
      ingredients: [{ name: "", quantity: 0.01, unit: "lb" }],
      instructions: [{ step: "" }],
      sourceUrl: "",
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({
    control: form.control,
    name: "instructions",
  });

  const onSubmit = (data: RecipeFormData) => {
    const missingIngredients: string[] = [];
    data.ingredients.forEach(ing => {
      const found = inventory.some(item =>
        item.name.toLowerCase() === ing.name.toLowerCase() &&
        item.unit.toLowerCase() === ing.unit.toLowerCase()
      );
      if (!found) {
        missingIngredients.push(`${ing.name} (${ing.unit})`);
      }
    });

    if (missingIngredients.length > 0) {
      toast.warning(
        `The following ingredients are not found in your inventory: ${missingIngredients.join(", ")}. Consider adding them to inventory.`,
        { duration: 8000 }
      );
    }

    addRecipe(data as Omit<Recipe, 'id' | 'baseCost'>);
    form.reset({
      name: "",
      description: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      category: "Main Course",
      ingredients: [{ name: "", quantity: 0.01, unit: "lb" }],
      instructions: [{ step: "" }],
      sourceUrl: "",
    });
    toast.success("Recipe added successfully!");
  };

  const handleDeleteRecipe = (id: string) => {
    deleteRecipe(id);
    toast.info("Recipe deleted.");
  };

  const handleSimulateImport = () => {
    try {
      const importedRecipe: SimulatedImportedRecipe = JSON.parse(importJson);
      form.reset({
        name: importedRecipe.name || "",
        description: importedRecipe.description || "",
        prepTime: importedRecipe.prepTime || "",
        cookTime: importedRecipe.cookTime || "",
        servings: importedRecipe.servings || "",
        category: importedRecipe.category || "Main Course",
        ingredients: importedRecipe.ingredients || [{ name: "", quantity: 0.01, unit: "lb" }],
        instructions: importedRecipe.instructions || [{ step: "" }],
        sourceUrl: importedRecipe.sourceUrl || "",
      });
      toast.success("Recipe details pre-filled from import!");
      setIsImportDialogOpen(false);
      setImportJson("");
    } catch (error) {
      toast.error("Failed to parse JSON. Please ensure it's valid JSON format.");
      console.error("JSON parsing error:", error);
    }
  };

  const availableUnits = Array.from(new Set(inventory.map(item => item.unit)));

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Recipe Management</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage your recipes, including ingredients and instructions.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Recipe</CardTitle>
            <CardDescription className="text-muted-foreground">Fill in the details to create a new recipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mb-3">
                  <LinkIcon className="mr-2 h-4 w-4" /> Simulate Recipe Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Simulate Recipe Import</DialogTitle>
                  <DialogDescription>
                    Paste recipe details in JSON format. This will pre-fill the form below.
                    <br />
                    <span className="text-xs text-muted-foreground">
                      (Note: For legal reasons, direct web scraping is not supported. Please ensure your source is legal.)
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Label htmlFor="recipeJson" className="text-left">
                    Recipe JSON
                  </Label>
                  <Textarea
                    id="recipeJson"
                    placeholder={`{\n  "name": "Example Dish",\n  "description": "A delicious example.",\n  "prepTime": "10 mins",\n  "cookTime": "20 mins",\n  "servings": "4",\n  "category": "Main Course",\n  "ingredients": [\n    { "name": "Chicken Breast", "quantity": 1, "unit": "lb" }\n  ],\n  "instructions": [\n    { "step": "Cook chicken." }\n  ],\n  "sourceUrl": "https://example.com/recipe"\n}`}
                    className="min-h-[200px] font-mono text-xs"
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleSimulateImport}>Pre-fill Form</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipe Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Classic Beef Stroganoff" {...field} />
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
                        <Textarea placeholder="A rich and creamy beef dish..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="prepTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prep Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 20 mins" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cookTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cook Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 45 mins" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servings</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 4-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Appetizer">Appetizer</SelectItem>
                          <SelectItem value="Main Course">Main Course</SelectItem>
                          <SelectItem value="Dessert">Dessert</SelectItem>
                          <SelectItem value="Alcoholic Beverage">Alcoholic Beverage</SelectItem>
                          <SelectItem value="Non-Alcoholic Beverage">Non-Alcoholic Beverage</SelectItem>
                          <SelectItem value="Side Dish">Side Dish</SelectItem>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Vegetarian Main">Vegetarian Main</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ingredients Section */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Ingredients</h3>
                  <div className="space-y-2">
                    {ingredientFields.map((item, index) => (
                      <div key={item.id} className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className={cn(index !== 0 && "sr-only")}>Ingredient Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Beef sirloin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel className={cn(index !== 0 && "sr-only")}>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="1.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ingredients.${index}.unit`}
                          render={({ field }) => (
                            <FormItem className="w-28">
                              <FormLabel className={cn(index !== 0 && "sr-only")}>Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableUnits.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => appendIngredient({ name: "", quantity: 0.01, unit: "lb" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
                  </Button>
                </div>

                {/* Instructions Section */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Instructions</h3>
                  <div className="space-y-2">
                    {instructionFields.map((item, index) => (
                      <div key={item.id} className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`instructions.${index}.step`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className={cn(index !== 0 && "sr-only")}>Step {index + 1}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={`Step ${index + 1}:`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeInstruction(index)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => appendInstruction({ step: "" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., https://www.allrecipes.com/my-recipe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">Add Recipe</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Existing Recipes</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your managed recipes.</CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <p className="text-muted-foreground text-center">No recipes added yet. Start by adding one above!</p>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-3">
                <div className="space-y-3">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="border p-2 rounded-md bg-background flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{recipe.name}</h3>
                        <p className="text-sm text-muted-foreground">{recipe.description}</p>
                        <div className="mt-1 text-sm">
                          <p><strong>Category:</strong> {recipe.category}</p>
                          <p><strong>Prep:</strong> {recipe.prepTime} | <strong>Cook:</strong> {recipe.cookTime} | <strong>Servings:</strong> {recipe.servings}</p>
                          <p><strong>Base Cost:</strong> ${recipe.baseCost.toFixed(2)}</p>
                          {recipe.sourceUrl && (
                            <p>
                              <strong>Source:</strong>{" "}
                              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {new URL(recipe.sourceUrl).hostname}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="mt-1">
                          <h4 className="font-medium">Ingredients:</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {recipe.ingredients.map((ing, idx) => {
                              const isIngredientInInventory = inventory.some(item =>
                                item.name.toLowerCase() === ing.name.toLowerCase() &&
                                item.unit.toLowerCase() === ing.unit.toLowerCase()
                              );
                              return (
                                <li key={idx} className="flex items-center gap-1">
                                  {ing.quantity} {ing.unit} {ing.name}
                                  {!isIngredientInInventory && (
                                    <Badge variant="destructive" className="ml-2">
                                      <AlertCircle className="h-3 w-3 mr-1" /> Missing in Inventory
                                    </Badge>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="mt-1">
                          <h4 className="font-medium">Instructions:</h4>
                          <ol className="list-decimal list-inside text-sm text-muted-foreground">
                            {recipe.instructions.map((inst, idx) => (
                              <li key={idx}>{inst.step}</li>
                            ))}
                          </ol>
                        </div>
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
    </div>
  );
};

export default Recipes;