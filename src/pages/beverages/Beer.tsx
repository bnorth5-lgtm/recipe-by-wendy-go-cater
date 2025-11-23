"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useCateringStore } from "@/store/cateringStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const Beer = () => {
  const beverages = useCateringStore((state) => state.beverages);
  const beerBeverages = beverages.filter(item => item.type === "Beer");

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Beer Selection</h1>
        <p className="text-xl text-muted-foreground">
          Manage your beer offerings and track inventory.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Current Beer Inventory</CardTitle>
            <CardDescription className="text-muted-foreground">Items from your inventory categorized as Beer.</CardDescription>
          </CardHeader>
          <CardContent>
            {beerBeverages.length === 0 ? (
              <p className="text-muted-foreground text-center">No beer in inventory. Add some in Beverage Inventory!</p>
            ) : (
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {beerBeverages.map(item => (
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
            <CardTitle className="text-2xl font-semibold text-primary">Popular Beer Types</CardTitle>
            <CardDescription className="text-muted-foreground">Common beer varieties for catering.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Lagers & Pilsners</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Pilsner Urquell</li>
                <li>Heineken</li>
                <li>Budweiser</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Ales</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>IPA (India Pale Ale)</li>
                <li>Pale Ale</li>
                <li>Stout</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Beer;