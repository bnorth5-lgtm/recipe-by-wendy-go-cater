"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useCateringStore } from "@/store/cateringStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const GeneralBeverages = () => {
  const beverages = useCateringStore((state) => state.beverages);
  const nonAlcoholicBeverages = beverages.filter(item => item.type === "Non-Alcoholic" || item.type === "Other");

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">General Beverages & Mixtures</h1>
        <p className="text-xl text-muted-foreground">
          Manage your non-alcoholic drinks, juices, and other beverage mixtures.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Current Non-Alcoholic Inventory</CardTitle>
            <CardDescription className="text-muted-foreground">Items from your inventory categorized as Non-Alcoholic or Other.</CardDescription>
          </CardHeader>
          <CardContent>
            {nonAlcoholicBeverages.length === 0 ? (
              <p className="text-muted-foreground text-center">No non-alcoholic beverages in inventory. Add some in Beverage Inventory!</p>
            ) : (
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonAlcoholicBeverages.map(item => (
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
            <CardTitle className="text-2xl font-semibold text-primary">Common Non-Alcoholic Offerings</CardTitle>
            <CardDescription className="text-muted-foreground">Popular choices for various events.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Soft Drinks</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Coca-Cola, Diet Coke, Sprite</li>
                <li>Ginger Ale, Tonic Water, Soda Water</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Juices & Mixers</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Orange Juice, Apple Juice, Cranberry Juice</li>
                <li>Lemonade, Iced Tea</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Hot Beverages</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Coffee (Regular & Decaf)</li>
                <li>Assorted Teas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default GeneralBeverages;