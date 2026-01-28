"use client";

import React, { useState, useMemo } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Utensils, Clock, Thermometer, ChefHat, Timer, X } from "lucide-react";
import { useCateringStore, Recipe } from "@/store/cateringStore";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import RecipeTimer from "@/components/RecipeTimer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Helper function to convert time string (e.g., '20 mins', '1 hr 30 min') to seconds
const timeStringToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.toLowerCase().match(/(\d+)\s*(min|hr|hour|h|m)/g);
  if (!parts) return 0;

  let totalSeconds = 0;
  parts.forEach(part => {
    const match = part.match(/(\d+)\s*(min|hr|hour|h|m)/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const unit = match[2];
      if (unit.startsWith('h')) {
        totalSeconds += quantity * 3600;
      } else if (unit.startsWith('m')) {
        totalSeconds += quantity * 60;
      }
    }
  });
  return totalSeconds;
};

interface ActiveTimer {
  id: string; // Unique ID for the timer instance
  recipeId: string;
  recipeName: string;
  type: 'prep' | 'cook';
  initialTimeInSeconds: number;
}

const PrepSchedule = () => {
  const recipes = useCateringStore((state) => state.recipes);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(lowerCaseSearch) ||
      recipe.description.toLowerCase().includes(lowerCaseSearch) ||
      recipe.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [recipes, searchTerm]);

  const startTimer = (recipe: Recipe, type: 'prep' | 'cook') => {
    const timeStr = type === 'prep' ? recipe.prepTime : recipe.cookTime;
    const initialTimeInSeconds = timeStringToSeconds(timeStr);

    if (initialTimeInSeconds === 0) {
      toast.error(`Cannot start ${type} timer: Time is not defined for ${recipe.name}.`);
      return;
    }

    const timerId = `${recipe.id}-${type}`;
    if (activeTimers.some(t => t.id === timerId)) {
      toast.warning(`${type.charAt(0).toUpperCase() + type.slice(1)} timer for ${recipe.name} is already running.`);
      return;
    }

    setActiveTimers(prev => [
      ...prev,
      {
        id: timerId,
        recipeId: recipe.id,
        recipeName: `${recipe.name} (${type.charAt(0).toUpperCase() + type.slice(1)})`,
        type,
        initialTimeInSeconds,
      }
    ]);
    toast.success(`Started ${type} timer for ${recipe.name}.`);
  };

  const handleTimerAlarm = (timerId: string) => {
    // This function is called when the timer hits zero.
    // The RecipeTimer component handles the 20-second toast alarm internally.
    console.log(`Alarm triggered for timer: ${timerId}`);
  };

  const handleRemoveTimer = (timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
    toast.info("Timer removed.");
  };

  const renderRecipeDetails = (recipe: Recipe) => {
    // Placeholder for temperature, as it's not explicitly stored in the Recipe interface
    // We can infer a common cooking temperature based on category for demonstration
    let temperature = "N/A";
    if (recipe.cookTime.toLowerCase().includes("min") && timeStringToSeconds(recipe.cookTime) > 0) {
        if (recipe.category.includes("Dessert")) {
            temperature = "350°F / 175°C";
        } else if (recipe.category.includes("Main Course") || recipe.category.includes("Appetizer")) {
            temperature = "400°F / 200°C (Roast/Bake)";
        }
    }

    return (
      <div className="p-2 space-y-2">
        <h4 className="text-lg font-bold text-primary">{recipe.name}</h4>
        <p className="text-sm text-muted-foreground">{recipe.description}</p>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Prep Time:</span> {recipe.prepTime}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Cook Time:</span> {recipe.cookTime}
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Suggested Temp:</span> {temperature}
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Servings:</span> {recipe.servings}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Recipe Prep Schedule</h1>
        <p className="text-xl text-muted-foreground">
          Manage your kitchen workflow with interactive timers and quick recipe specs.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Recipe List & Search */}
        <Card className="lg:col-span-1 bg-card p-3 rounded-lg shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Utensils className="h-5 w-5" /> Recipe Directory
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Search and select recipes to start timers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative mb-3 px-3">
              <Search className="absolute left-6 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[600px] px-3">
              <div className="space-y-2">
                {filteredRecipes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recipes found matching "{searchTerm}".</p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <div key={recipe.id} className="border p-2 rounded-md bg-secondary/20 flex flex-col space-y-2">
                      <HoverCard openDelay={100} closeDelay={200}>
                        <HoverCardTrigger asChild>
                          <h3 className="font-semibold text-base cursor-pointer hover:text-primary transition-colors truncate">
                            {recipe.name}
                          </h3>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          {renderRecipeDetails(recipe)}
                        </HoverCardContent>
                      </HoverCard>
                      
                      <div className="flex gap-2 text-xs">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startTimer(recipe, 'prep')}
                          disabled={timeStringToSeconds(recipe.prepTime) === 0}
                        >
                          <Clock className="h-3 w-3 mr-1" /> Start Prep ({recipe.prepTime})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startTimer(recipe, 'cook')}
                          disabled={timeStringToSeconds(recipe.cookTime) === 0}
                        >
                          <Thermometer className="h-3 w-3 mr-1" /> Start Cook ({recipe.cookTime})
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Column 2 & 3: Active Timers */}
        <Card className="lg:col-span-2 bg-card p-3 rounded-lg shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Timer className="h-5 w-5" /> Active Timers ({activeTimers.length})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monitor all active prep and cook timers in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTimers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-10 col-span-2">
                    No timers running. Select a recipe from the left to start one!
                  </p>
                ) : (
                  activeTimers.map(timer => (
                    <div key={timer.id} className="relative">
                      <RecipeTimer
                        initialTimeInSeconds={timer.initialTimeInSeconds}
                        recipeName={timer.recipeName}
                        onAlarm={() => handleTimerAlarm(timer.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveTimer(timer.id)}
                        title="Remove Timer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default PrepSchedule;