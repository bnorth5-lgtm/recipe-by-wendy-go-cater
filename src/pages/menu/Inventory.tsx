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
import { PlusCircle, Edit, Trash2, AlertCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCateringStore, InventoryItem } from "@/store/cateringStore";

// Define the schema for an inventory item
const inventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.enum(["Food Ingredient", "Beverage", "Furniture", "Tableware", "Silverware", "Glassware", "Linens", "Serving Equipment", "Other"], {
    required_error: "Category is required.",
  }),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
  costPerUnit: z.coerce.number().min(0, "Cost per unit cannot be negative"),
  markupPercentage: z.coerce.number().min(0, "Markup cannot be negative").max(1, "Markup must be between 0 and 1 (e.g., 0.20 for 20%)"),
});

type InventoryFormData = z.infer<typeof inventoryItemSchema>;

const Inventory = () => {
  const inventory = useCateringStore((state) => state.inventory);
  const addInventoryItem = useCateringStore((state) => state.addInventoryItem);
  const updateInventoryItem = useCateringStore((state) => state.updateInventoryItem);
  const deleteInventoryItem = useCateringStore((state) => state.deleteInventoryItem);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      category: "Food Ingredient",
      currentStock: 0,
      unit: "lb",
      lowStockThreshold: 10,
      costPerUnit: 0.00,
      markupPercentage: 0.20,
    },
  });

  const onSubmit = (data: InventoryFormData) => {
    if (editingItem) {
      updateInventoryItem({ ...data, id: editingItem.id } as InventoryItem);
      toast.success("Inventory item updated successfully!");
    } else {
      addInventoryItem(data as Omit<InventoryItem, 'id'>);
      toast.success("Inventory item added successfully!");
    }
    form.reset();
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteInventoryItem(id);
    toast.info("Inventory item deleted.");
  };

  const handleStockChange = (itemId: string, newStock: number) => {
    const itemToUpdate = inventory.find(item => item.id === itemId);
    if (itemToUpdate) {
      updateInventoryItem({ ...itemToUpdate, currentStock: newStock });
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Inventory Management</h1>
        <p className="text-xl text-muted-foreground">
          Track all your items, from ingredients and beverages to furniture and tableware.
        </p>
      </div>

      <div className="w-full space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingItem ? "Update the details of your inventory item." : "Fill in the details to add a new item to your inventory."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-3">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Make changes to the inventory item here. Click save when you're done." : "Add a new item to your inventory. Click save when you're done."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 py-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Chicken Breast" {...field} />
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
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Food Ingredient">Food Ingredient</SelectItem>
                              <SelectItem value="Beverage">Beverage</SelectItem>
                              <SelectItem value="Furniture">Furniture</SelectItem>
                              <SelectItem value="Tableware">Tableware</SelectItem>
                              <SelectItem value="Silverware">Silverware</SelectItem>
                              <SelectItem value="Glassware">Glassware</SelectItem>
                              <SelectItem value="Linens">Linens</SelectItem>
                              <SelectItem value="Serving Equipment">Serving Equipment</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lb">Pounds (lb)</SelectItem>
                              <SelectItem value="oz">Ounces (oz)</SelectItem>
                              <SelectItem value="cup">Cup</SelectItem>
                              <SelectItem value="quart">Quart</SelectItem>
                              <SelectItem value="gallon">Gallon</SelectItem>
                              <SelectItem value="fl oz">Fluid Ounces (fl oz)</SelectItem>
                              <SelectItem value="tsp">Teaspoon (tsp)</SelectItem>
                              <SelectItem value="tbsp">Tablespoon (tbsp)</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="bottle">Bottle</SelectItem>
                              <SelectItem value="can">Can</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="unit">Unit</SelectItem>
                              <SelectItem value="chair">Chair</SelectItem>
                              <SelectItem value="table">Table</SelectItem>
                              <SelectItem value="plate">Plate</SelectItem>
                              <SelectItem value="piece">Piece</SelectItem>
                              <SelectItem value="glass">Glass</SelectItem>
                              <SelectItem value="linen">Linen</SelectItem>
                              <SelectItem value="napkin">Napkin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="costPerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Per Unit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="markupPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Markup Percentage (e.g., 0.20 for 20%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">{editingItem ? "Save changes" : "Add Item"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Inventory */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Current Inventory</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all items in your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <p className="text-muted-foreground text-center">No inventory items added yet. Click "Add New Item" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px] px-3 py-2">Item Name</TableHead>
                      <TableHead className="min-w-[80px] text-xs px-3 py-2">Category</TableHead>
                      <TableHead className="min-w-[120px] px-3 py-2">Current Stock</TableHead>
                      <TableHead className="min-w-[120px] px-3 py-2">Cost per Unit</TableHead>
                      <TableHead className="min-w-[120px] px-3 py-2">Selling Price</TableHead>
                      <TableHead className="min-w-[100px] px-3 py-2">Low Stock Threshold</TableHead>
                      <TableHead className="text-center min-w-[100px] px-3 py-2">Status</TableHead>
                      <TableHead className="text-right min-w-[100px] px-3 py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium px-3 py-2 min-w-[120px]">
                          {item.name}
                        </TableCell>
                        <TableCell className="px-3 py-2 min-w-[80px] text-xs">{item.category}</TableCell>
                        <TableCell className="px-3 py-2 min-w-[120px]">
                          <div className="flex items-center space-x-0.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStockChange(item.id, item.currentStock - 1)}
                              disabled={item.currentStock <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.currentStock}
                              onChange={(e) => handleStockChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-16 text-center h-7"
                              min="0"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStockChange(item.id, item.currentStock + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 min-w-[120px]">${item.costPerUnit.toFixed(2)} / {item.unit}</TableCell>
                        <TableCell className="px-3 py-2 min-w-[120px]">${(item.costPerUnit * (1 + item.markupPercentage)).toFixed(2)} / {item.unit}</TableCell>
                        <TableCell className="px-3 py-2 min-w-[100px]">{item.lowStockThreshold}</TableCell>
                        <TableCell className="text-center px-3 py-2 min-w-[100px]">
                          {item.currentStock <= item.lowStockThreshold ? (
                            <Badge variant="destructive" className="flex items-center justify-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-3 py-2 min-w-[100px]">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
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
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Inventory;