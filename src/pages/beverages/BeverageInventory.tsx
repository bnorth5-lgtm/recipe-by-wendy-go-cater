"use client";

import React, { useState } from "react";
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
import { PlusCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCateringStore, BeverageItem } from "@/store/cateringStore";

// Define the schema for a beverage item
const beverageItemSchema = z.object({
  name: z.string().min(1, "Beverage name is required"),
  type: z.enum(["Cocktail", "Wine", "Beer", "Non-Alcoholic", "Spirit", "Other"], {
    required_error: "Beverage type is required.",
  }),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  lowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
});

// Infer the form data type directly from the schema
type BeverageFormData = z.infer<typeof beverageItemSchema>;

const BeverageInventory = () => {
  const beverages = useCateringStore((state) => state.beverages);
  const addBeverageItem = useCateringStore((state) => state.addBeverageItem);
  const updateBeverageItem = useCateringStore((state) => state.updateBeverageItem);
  const deleteBeverageItem = useCateringStore((state) => state.deleteBeverageItem);

  const [editingItem, setEditingItem] = useState<BeverageItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<BeverageFormData>({
    resolver: zodResolver(beverageItemSchema),
    defaultValues: {
      name: "",
      type: "Non-Alcoholic",
      currentStock: 0,
      unit: "bottle",
      lowStockThreshold: 10,
    },
  });

  const onSubmit = (data: BeverageFormData) => {
    if (editingItem) {
      updateBeverageItem({ ...data, id: editingItem.id } as BeverageItem); // Explicitly cast data
      toast.success("Beverage item updated successfully!");
    } else {
      addBeverageItem(data as Omit<BeverageItem, 'id'>); // Explicitly cast data
      toast.success("Beverage item added successfully!");
    }
    form.reset();
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: BeverageItem) => {
    setEditingItem(item);
    form.reset(item); // Populate form with item data
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBeverageItem(id);
    toast.info("Beverage item deleted.");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Beverage Inventory Management</h1>
        <p className="text-xl text-muted-foreground">
          Track your beverage stock levels, manage types, and monitor usage.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingItem ? "Edit Beverage Item" : "Add New Beverage Item"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingItem ? "Update the details of your beverage item." : "Fill in the details to add a new item to your beverage inventory."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-6">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Beverage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Beverage Item" : "Add New Beverage Item"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Make changes to the beverage item here. Click save when you're done." : "Add a new item to your beverage inventory. Click save when you're done."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beverage Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Coca-Cola" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beverage Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cocktail">Cocktail</SelectItem>
                              <SelectItem value="Wine">Wine</SelectItem>
                              <SelectItem value="Beer">Beer</SelectItem>
                              <SelectItem value="Non-Alcoholic">Non-Alcoholic</SelectItem>
                              <SelectItem value="Spirit">Spirit</SelectItem>
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
                              <SelectItem value="bottle">Bottle</SelectItem>
                              <SelectItem value="can">Can</SelectItem>
                              <SelectItem value="L">Liters (L)</SelectItem>
                              <SelectItem value="ml">Milliliters (ml)</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="keg">Keg</SelectItem>
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
                    <DialogFooter>
                      <Button type="submit">{editingItem ? "Save changes" : "Add Item"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Beverages */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Current Beverage Inventory</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all items in your beverage inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            {beverages.length === 0 ? (
              <p className="text-muted-foreground text-center">No beverage items added yet. Click "Add New Beverage" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beverage Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beverages.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.lowStockThreshold}</TableCell>
                        <TableCell className="text-center">
                          {item.currentStock <= item.lowStockThreshold ? (
                            <Badge variant="destructive" className="flex items-center justify-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
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

export default BeverageInventory;