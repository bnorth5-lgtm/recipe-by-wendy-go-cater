"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Recipe } from "@/store/cateringStore"; // Import Recipe interface

interface RecipeImporterProps {
  onRecipeImport: (recipe: Omit<Recipe, 'id'>) => void;
}

const RecipeImporter: React.FC<RecipeImporterProps> = ({ onRecipeImport }) => {
  const [recipeUrl, setRecipeUrl] = useState("");
  const [jsonInput, setJsonInput] = useState("");

  const handleImportFromUrl = () => {
    // In a real application, this URL would be sent to a backend service
    // that performs the actual scraping and returns structured recipe data.
    toast.info("A backend service is required to scrape recipes from a URL.", {
      description: "For now, you can paste structured JSON data below to import a recipe.",
    });
    console.log("Attempting to import from URL:", recipeUrl);
  };

  const handleImportFromJson = () => {
    try {
      const parsedRecipe: Omit<Recipe, 'id'> = JSON.parse(jsonInput);
      // Basic validation to ensure it looks like a recipe
      if (parsedRecipe.name && parsedRecipe.ingredients && parsedRecipe.instructions) {
        onRecipeImport(parsedRecipe);
        toast.success("Recipe imported from JSON successfully!");
        setJsonInput("");
      } else {
        toast.error("Invalid JSON format. Please ensure it contains 'name', 'ingredients', and 'instructions'.");
      }
    } catch (error) {
      toast.error("Failed to parse JSON. Please check the format.");
      console.error("JSON parsing error:", error);
    }
  };

  return (
    <Card className="bg-card p-6 rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Import Recipe</CardTitle>
        <CardDescription className="text-muted-foreground">
          Paste a recipe URL or structured JSON data to quickly add a new recipe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="recipe-url" className="mb-2 block">Recipe URL (Requires Backend)</Label>
          <div className="flex space-x-2">
            <Input
              id="recipe-url"
              placeholder="e.g., https://www.allrecipes.com/recipe/..."
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
            />
            <Button onClick={handleImportFromUrl} disabled={!recipeUrl}>
              Import from URL
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="json-input" className="mb-2 block">Paste Recipe JSON Data</Label>
          <Textarea
            id="json-input"
            placeholder={`Paste recipe JSON here, e.g.:
{
  "name": "Example Dish",
  "description": "A delicious example.",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "servings": "4",
  "category": "Main Course",
  "ingredients": [
    {"name": "Ingredient 1", "quantity": "1 cup"},
    {"name": "Ingredient 2", "quantity": "2 tbsp"}
  ],
  "instructions": [
    {"step": "Step 1: Do this."},
    {"step": "Step 2: Then that."}
  ]
}`}
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="font-mono text-xs"
          />
          <Button onClick={handleImportFromJson} disabled={!jsonInput} className="mt-4 w-full">
            Import from JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeImporter;