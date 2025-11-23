"use client";

import React from "react";
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, Recipe, RecipeIngredient, RecipeInstruction } from "@/store/cateringStore"; // Import from store
import RecipeImporter from "@/components/RecipeImporter"; // Import the new component

// Define the schema for a single ingredient
const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

// Define the schema for a single instruction step
const instructionSchema = z.object({
  step: z.string().min(1, "Instruction step is required"),
});

// Define the main schema for a recipe
const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Description is required"),
  prepTime: z.string().min(1, "Preparation time is required"),
  cookTime: z.string().min(1, "Cook time is required"),
  servings: z.string().min(1, "Servings is required"),
  category: z.enum(["Appetizer", "Main Course", "Dessert", "Beverage", "Side Dish", "Breakfast", "Other"], {
    required_error: "Please select a category.",
  }),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
  instructions: z.array(instructionSchema).min(1, "At least one instruction step is required"),
});

// Infer the form data type directly from the schema
type RecipeFormData = z.infer<typeof recipeFormSchema>;

const Recipes = () => {
  const recipes = useCateringStore((state) => state.recipes);
  const addRecipe = useCateringStore((state) => state.addRecipe);
  const deleteRecipe = useCateringStore((state) => state.deleteRecipe);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      category: "Main Course",
      ingredients: [{ name: "", quantity: "" }],
      instructions: [{ step: "" }],
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
    addRecipe(data as Omit<Recipe, 'id'>); // Explicitly cast data
    form.reset({
      name: "",
      description: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      category: "Main Course",
      ingredients: [{ name: "", quantity: "" }],
      instructions: [{ step: "" }],
    }); // Reset the form after submission
    toast.success("Recipe added successfully!");
  };

  const handleDeleteRecipe = (id: string) => {
    deleteRecipe(id);
    toast.info("Recipe deleted.");
  };

  const handleImportedRecipe = (importedRecipe: Omit<Recipe, 'id'>) => {
    // Set the form values with the imported recipe data
    form.reset(importedRecipe);
    toast.info("Recipe data loaded into form. Review and click 'Add Recipe' to save.");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Recipe Management</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage your recipes, including ingredients and instructions.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <RecipeImporter onRecipeImport={handleImportedRecipe} /> {/* Integrate the importer */}

        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Recipe</CardTitle>
            <CardDescription className="text-muted-foreground">Fill in the details to create a new recipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <SelectItem value="Beverage">Beverage</SelectItem>
                          <SelectItem value="Side Dish">Side Dish</SelectItem>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ingredients Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Ingredients</h3>
                  <div className="space-y-3">
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
                            <FormItem className="flex-1">
                              <FormLabel className={cn(index !== 0 && "sr-only")}>Quantity</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 1.5 lbs" {...field} />
                              </FormControl>
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
                    className="mt-4"
                    onClick={() => appendIngredient({ name: "", quantity: "" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
                  </Button>
                </div>

                {/* Instructions Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Instructions</h3>
                  <div className="space-y-3">
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
                    className="mt-4"
                    onClick={() => appendInstruction({ step: "" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                </div>

                <Button type="submit" className="w-full">Add Recipe</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Display Existing Recipes */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Existing Recipes</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your managed recipes.</CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <p className="text-muted-foreground text-center">No recipes added yet. Start by adding one above!</p>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="border p-4 rounded-md bg-background flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{recipe.name}</h3>
                        <p className="text-sm text-muted-foreground">{recipe.description}</p>
                        <div className="mt-2 text-sm">
                          <p><strong>Category:</strong> {recipe.category}</p>
                          <p><strong>Prep:</strong> {recipe.prepTime} | <strong>Cook:</strong> {recipe.cookTime} | <strong>Servings:</strong> {recipe.servings}</p>
                        </div>
                        <div className="mt-2">
                          <h4 className="font-medium">Ingredients:</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {recipe.ingredients.map((ing, idx) => (
                              <li key={idx}>{ing.quantity} {ing.name}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2">
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