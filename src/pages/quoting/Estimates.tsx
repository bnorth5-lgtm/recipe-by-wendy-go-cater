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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Edit, Trash2, Utensils, Wine, Package } from "lucide-react"; // Added Package icon
import { toast } from "sonner";
import { useCateringStore, Estimate, ProposalItem, Recipe, InventoryItem } from "@/store/cateringStore";
import { format } from "date-fns";

// Define the schema for an estimated item (recipe or inventory item)
const estimatedItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  type: z.enum(["recipe", "inventoryItem"], { required_error: "Item type is required" }), // Changed from "beverage" to "inventoryItem"
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
  const inventory = useCateringStore((state) => state.inventory); // Use unified inventory
  const estimates = useCateringStore((state) => state.estimates);
  const addEstimate = useCateringStore((state) => state.addEstimate);
  const updateEstimate = useCateringStore((state) => state.updateEstimate);
  const deleteEstimate = useCateringStore((state) => state.deleteEstimate);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);

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

  const handleAddItem = (type: "recipe" | "inventoryItem", selectedId: string) => { // Changed type
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
    } else if (type === "inventoryItem") { // Handle generic inventory items
      const invItem = inventory.find(i => i.id === selectedId);
      if (invItem) {
        appendItem({
          id: invItem.id,
          type: "inventoryItem",
          name: invItem.name,
          quantity: 1,
          unitCost: invItem.costPerUnit,
          totalCost: invItem.costPerUnit,
        });
        toast.success(`Added ${invItem.name} to estimate.`);
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
    const estimateData = {
      ...data,
      subtotal,
      totalAmount,
    };

    if (editingEstimate) {
      updateEstimate({ ...estimateData, id: editingEstimate.id } as Estimate);
      toast.success("Estimate updated successfully!");
    } else {
      addEstimate(estimateData as Omit<Estimate, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'totalAmount'>);
      toast.success("Estimate saved successfully!");
    }
    form.reset();
    setEditingEstimate(null);
    setIsFormDialogOpen(false);
  };

  const handleEdit = (estimate: Estimate) => {
    setEditingEstimate(estimate);
    form.reset(estimate);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEstimate(id);
    toast.info("Estimate deleted.");
  };

  const getIconForItemType = (type: "recipe" | "inventoryItem", category?: InventoryItem["category"]) => {
    if (type === "recipe") return <Utensils className="h-4 w-4 text-muted-foreground" />;
    if (type === "inventoryItem") {
      switch (category) {
        case "Beverage": return <Wine className="h-4 w-4 text-muted-foreground" />;
        case "Furniture": return <Package className="h-4 w-4 text-muted-foreground" />;
        case "Tableware": return <Package className="h-4 w-4 text-muted-foreground" />;
        case "Silverware": return <Package className="h-4 w-4 text-muted-foreground" />;
        case "Glassware": return <Package className="h-4 w-4 text-muted-foreground" />;
        case "Linens": return <Package className="h-4 w-4 text-muted-foreground" />;
        case "Serving Equipment": return <Package className="h-4 w-4 text-muted-foreground" />;
        default: return <Package className="h-4 w-4 text-muted-foreground" />;
      }
    }
    return null;
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Cost Estimates</h1>
        <p className="text-xl text-muted-foreground">
          Quickly calculate and save detailed cost estimates for your events.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-8">
        {/* Add/Edit Estimate Form */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingEstimate ? "Edit Estimate" : "Create New Estimate"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingEstimate ? `Updating estimate for ${editingEstimate.eventName}.` : "Build and save a new catering estimate."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-6">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Estimate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEstimate ? "Edit Estimate" : "Create New Estimate"}</DialogTitle>
                  <DialogDescription>
                    {editingEstimate ? "Adjust the details of this estimate." : "Fill in the details to generate and save a new estimate."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
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
                        <Select onValueChange={(value) => handleAddItem("inventoryItem", value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Add Inventory Item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.length === 0 && <p className="p-2 text-sm text-muted-foreground">No inventory items available.</p>}
                            {inventory.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.category}) (${item.costPerUnit.toFixed(2)}/{item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {itemFields.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No items added yet. Use the dropdowns above to add recipes or inventory items.</p>
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
                              {itemFields.map((item, index) => {
                                const inventoryItemDetails = item.type === "inventoryItem" ? inventory.find(inv => inv.id === item.id) : undefined;
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                      {getIconForItemType(item.type, inventoryItemDetails?.category)}
                                      {item.name}
                                    </TableCell>
                                    <TableCell className="capitalize">{item.type === "inventoryItem" ? inventoryItemDetails?.category : item.type}</TableCell>
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
                                );
                              })}
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

                    <DialogFooter>
                      <Button type="submit" className="w-full">{editingEstimate ? "Save Changes" : "Save Estimate"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Estimates */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Saved Estimates</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your saved cost estimates.</CardDescription>
          </CardHeader>
          <CardContent>
            {estimates.length === 0 ? (
              <p className="text-muted-foreground text-center">No estimates saved yet. Click "Create New Estimate" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((estimate) => (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-medium">{estimate.eventName}</TableCell>
                        <TableCell>{estimate.numberOfGuests}</TableCell>
                        <TableCell>${estimate.subtotal.toFixed(2)}</TableCell>
                        <TableCell>${estimate.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(estimate.createdAt), "PPP")}</TableCell>
                        <TableCell className="text-right flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(estimate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(estimate.id)}>
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

export default Estimates;