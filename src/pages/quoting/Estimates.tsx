"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, Utensils, Wine } from "lucide-react";
import { toast } from "sonner";
import { useCateringStore } from "@/store/cateringStore";

// Define the schema for an estimated item (recipe or beverage)
const estimatedItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  type: z.enum(["recipe", "beverage"], { required_error: "Item type is required" }),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  totalCost: z.coerce.number().min(0, "Total cost cannot be negative"),
});

// Define the main schema for the estimate form
const estimateFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  numberOfGuests: z.coerce.number().min(1, "Number of guests must be at least 1"),
  items: z.array(estimatedItemSchema).min(0), // Can start with no items
  laborCost: z.coerce.number().min(0, "Labor cost cannot be negative").default(0),
  equipmentCost: z.coerce.number().min(0, "Equipment cost cannot be negative").default(0),
  otherCosts: z.coerce.number().min(0, "Other costs cannot be negative").default(0),
  taxRate: z.coerce.number().min(0).max(1, "Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)").default(0.08),
});

type EstimateFormData = z.infer<typeof estimateFormSchema>;

const Estimates = () => {
  const recipes = useCateringStore((state) => state.recipes);
  const beverageInventory = useCateringStore((state) => state.beverageInventory);

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      eventName: "",
      numberOfGuests: 1,
      items: [],
      laborCost: 0,
      equipmentCost: 0,
      otherCosts: 0,
      taxRate: 0.08,
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem, update: updateItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch for changes in items, labor, equipment, other costs, and tax rate to calculate totals
  const watchedItems = form.watch("items");
  const watchedLaborCost = form.watch("laborCost");
  const watchedEquipmentCost = form.watch("equipmentCost");
  const watchedOtherCosts = form.watch("otherCosts");
  const watchedTaxRate = form.watch("taxRate");

  const calculateTotals = () => {
    const itemsTotalCost = watchedItems.reduce((sum, item) => sum + item.totalCost, 0);
    const subtotal = itemsTotalCost + watchedLaborCost + watchedEquipmentCost + watchedOtherCosts;
    const totalAmount = subtotal * (1 + watchedTaxRate);
    return { subtotal, totalAmount };
  };

  const { subtotal, totalAmount } = calculateTotals();

  const handleAddItem = (type: "recipe" | "beverage", selectedId: string) => {
    if (type === "recipe") {
      const recipe = recipes.find(r => r.id === selectedId);
      if (recipe) {
        appendItem({
          id: recipe.id,
          type: "recipe",
          name: recipe.name,
          quantity: 1,
          unitCost: recipe.baseCost,
          totalCost: recipe.baseCost,
        });
        toast.success(`Added ${recipe.name} to estimate.`);
      }
    } else if (type === "beverage") {
      const beverage = beverageInventory.find(b => b.id === selectedId);
      if (beverage) {
        appendItem({
          id: beverage.id,
          type: "beverage",
          name: beverage.name,
          quantity: 1,
          unitCost: beverage.costPerUnit,
          totalCost: beverage.costPerUnit,
        });
        toast.success(`Added ${beverage.name} to estimate.`);
      }
    }
  };

  const handleItemQuantityChange = (index: number, newQuantity: number) => {
    const currentItem = itemFields[index];
    const quantity = newQuantity > 0 ? newQuantity : 1; // Ensure quantity is at least 1
    const newTotalCost = quantity * currentItem.unitCost;
    updateItem(index, { ...currentItem, quantity: quantity, totalCost: newTotalCost });
  };

  const handleRemoveItem = (index: number, itemName: string) => {
    removeItem(index);
    toast.info(`Removed ${itemName} from estimate.`);
  };

  const onSubmit = (data: EstimateFormData) => {
    // This page is for quick estimates, so we don't save to store.
    // We just log the final estimate for demonstration.
    console.log("Final Estimate Data:", { ...data, subtotal, totalAmount });
    toast.success("Estimate calculated!");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Cost Estimates</h1>
        <p className="text-xl text-muted-foreground">
          Quickly calculate detailed cost estimates for your events.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Event Details & Items</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter event specifics and select items to include in your estimate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Corporate Holiday Party" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Item Selection */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Add Items</h3>
                  <div className="flex gap-2 mb-4">
                    <Select onValueChange={(value) => handleAddItem("recipe", value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Add Recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.length === 0 && <p className="p-2 text-sm text-muted-foreground">No recipes available.</p>}
                        {recipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name} (${recipe.baseCost.toFixed(2)}/serving)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handleAddItem("beverage", value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Add Beverage" />
                      </SelectTrigger>
                      <SelectContent>
                        {beverageInventory.length === 0 && <p className="p-2 text-sm text-muted-foreground">No beverages available.</p>}
                        {beverageInventory.map((beverage) => (
                          <SelectItem key={beverage.id} value={beverage.id}>
                            {beverage.name} (${beverage.costPerUnit.toFixed(2)}/{beverage.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {itemFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items added yet. Use the dropdowns above to add recipes or beverages.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itemFields.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium flex items-center gap-2">
                                {item.type === "recipe" ? <Utensils className="h-4 w-4 text-muted-foreground" /> : <Wine className="h-4 w-4 text-muted-foreground" />}
                                {item.name}
                              </TableCell>
                              <TableCell className="capitalize">{item.type}</TableCell>
                              <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemQuantityChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right inline-flex"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-right">${item.totalCost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index, item.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Additional Costs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="laborCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Labor Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="equipmentCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="otherCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Costs</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (e.g., 0.08 for 8%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.08" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Totals Display */}
                <div className="text-right space-y-1 mt-4">
                  <p className="text-lg">Subtotal: <span className="font-bold">${subtotal.toFixed(2)}</span></p>
                  <p className="text-xl font-extrabold text-primary">Total Estimated Cost: <span className="font-bold">${totalAmount.toFixed(2)}</span></p>
                </div>

                <Button type="submit" className="w-full">Calculate Estimate</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Estimates;