"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Package } from "lucide-react";
import { useCateringStore } from "@/store/cateringStore";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const LowStockAlertsCard: React.FC = () => {
  const inventory = useCateringStore((state) => state.inventory);
  const currencySymbol = useCateringStore((state) => state.currencySymbol);

  const lowStockItems = inventory.filter(
    (item) => item.currentStock <= item.lowStockThreshold
  ).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" /> Low Stock Alerts
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <CardDescription className="text-xs text-muted-foreground mb-3">
          Items currently below their defined low stock threshold.
        </CardDescription>
        {lowStockItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            All inventory items are currently in good stock!
          </p>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <Link to="/menu/inventory" key={item.id} className="block">
                  <div className="flex items-center justify-between p-2 border rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer">
                    <div>
                      <h4 className="font-semibold text-sm text-destructive">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Stock: {item.currentStock} {item.unit} (Threshold: {item.lowStockThreshold})
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      Low
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
        <Link to="/menu/inventory" className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full">
            Manage Inventory
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};