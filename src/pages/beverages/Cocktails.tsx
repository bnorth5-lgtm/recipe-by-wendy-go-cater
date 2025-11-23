"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useCateringStore } from "@/store/cateringStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const Cocktails = () => {
  const beverages = useCateringStore((state) => state.beverages);
  const cocktailBeverages = beverages.filter(item => item.type === "Cocktail" || item.type === "Spirit");

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Cocktail Recipes & Spirits</h1>
        <p className="text-xl text-muted-foreground">
          Manage your cocktail recipes and track spirits used in your inventory.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Available Spirits & Mixes</CardTitle>
            <CardDescription className="text-muted-foreground">Items from your inventory categorized as Spirits or Cocktails.</CardDescription>
          </CardHeader>
          <CardContent>
            {cocktailBeverages.length === 0 ? (
              <p className="text-muted-foreground text-center">No spirits or cocktail mixes in inventory. Add some in Beverage Inventory!</p>
            ) : (
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cocktailBeverages.map(item => (
                    <div key={item.id} className="p-3 border rounded-md flex flex-col gap-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Stock: {item.currentStock} {item.unit}</p>
                      <Badge variant="secondary" className="w-fit">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Popular Cocktail Recipes</CardTitle>
            <CardDescription className="text-muted-foreground">Example cocktail recipes to get you started.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Mojito</h3>
              <p className="text-sm text-muted-foreground">White rum, sugar, lime juice, soda water, mint.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Margarita</h3>
              <p className="text-sm text-muted-foreground">Tequila, triple sec, lime juice.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Old Fashioned</h3>
              <p className="text-sm text-muted-foreground">Whiskey, sugar, Angostura bitters, orange peel.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cosmopolitan</h3>
              <p className="text-sm text-muted-foreground">Vodka, triple sec, cranberry juice, fresh lime juice.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Cocktails;