"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { PlusCircle, Edit, Trash2, CalendarIcon, Eye, Send, CheckCircle, XCircle, Archive, Utensils, Wine, Package, Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, Client, Recipe, InventoryItem, Proposal, ProposalItem } from "@/store/cateringStore";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ProposalDocument } from "@/components/ProposalDocument";
import { useParams, Link } from "react-router-dom";

// Define the schema for a proposal item within the form
const proposalItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"), // ID of the recipe or inventory item
  type: z.enum(["recipe", "inventoryItem"], { required_error: "Item type is required" }), // Changed from "beverage" to "inventoryItem"
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  totalCost: z.coerce.number().min(0, "Total cost cannot be negative"),
});

// Define the main schema for a proposal form
const proposalFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  eventName: z.string().min(1, "Event name is required"),
  eventDate: z.date({
    required_error: "An event date is required.",
  }),
  numberOfGuests: z.coerce.number().min(1, "Number of guests must be at least 1"),
  items: z.array(proposalItemSchema).min(1, "At least one item (recipe or inventory item) is required"),
  laborCost: z.coerce.number().min(0, "Labor cost cannot be negative").default(0),
  equipmentCost: z.coerce.number().min(0, "Equipment cost cannot be negative").default(0),
  otherCosts: z.coerce.number().min(0, "Other costs cannot be negative").default(0),
  taxRate: z.coerce.number().min(0).max(1, "Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)").default(0.08),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalFormSchema>;

const Proposals = () => {
  const { proposalId } = useParams<{ proposalId?: string }>(); // Get ID from URL
  const clients = useCateringStore((state) => state.clients);
  const recipes = useCateringStore((state) => state.recipes);
  const inventory = useCateringStore((state) => state.inventory); // Use unified inventory
  const proposals = useCateringStore((state) => state.proposals);
  const bookings = useCateringStore((state) => state.bookings); // NEW: Get bookings to find associated BEOs
  const addProposal = useCateringStore((state) => state.addProposal);
  const updateProposal = useCateringStore((state) => state.updateProposal);
  const deleteProposal = useCateringStore((state) => state.deleteProposal);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (proposalId) {
      const proposalToView = proposals.find(p => p.id === proposalId);
      if (proposalToView) {
        setViewingProposal(proposalToView);
        setIsViewDialogOpen(true);
      } else {
        toast.error("Proposal not found.");
      }
    }
  }, [proposalId, proposals]);

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

  const onSubmit = (data: ProposalFormData) => {
    const proposalData = {
      ...data,
      eventDate: format(data.eventDate, "yyyy-MM-dd"), // Store date as string
      subtotal,
      totalAmount,
      status: editingProposal?.status || "Draft", // Preserve status or default to Draft
      createdAt: editingProposal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingProposal) {
      updateProposal({ ...proposalData, id: editingProposal.id } as Proposal);
      toast.success("Proposal updated successfully!");
    } else {
      addProposal(proposalData as Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'totalAmount'>);
      toast.success("Proposal created successfully!");
    }
    form.reset();
    setEditingProposal(null);
    setIsFormDialogOpen(false);
  };

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    form.reset({
      ...proposal,
      eventDate: new Date(proposal.eventDate), // Convert string back to Date object for form
    });
    setIsFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProposal(id);
    toast.info("Proposal deleted.");
  };

  const handleView = (proposal: Proposal) => {
    setViewingProposal(proposal);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: Proposal["status"]) => {
    const proposalToUpdate = proposals.find(p => p.id === id);
    if (proposalToUpdate) {
      updateProposal({ ...proposalToUpdate, status: newStatus });
      toast.info(`Proposal status updated to ${newStatus}.`);
    }
  };

  const handleAddItem = (type: "recipe" | "inventoryItem", selectedId: string) => {
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
        toast.success(`Added recipe: ${recipe.name}`);
      }
    } else if (type === "inventoryItem") {
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
        toast.success(`Added inventory item: ${invItem.name}`);
      }
    }
  };

  const handleItemQuantityChange = (index: number, newQuantity: number) => {
    const currentItem = itemFields[index];
    const newTotalCost = newQuantity * currentItem.unitCost;
    updateItem(index, { ...currentItem, quantity: newQuantity, totalCost: newTotalCost });
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
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Quoting & Proposal Generator</h1>
        <p className="text-xl text-muted-foreground">
          Manage client details, select menus, estimate labor and equipment, and generate proposals here.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-4">
        {/* Add/Edit Proposal Form */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingProposal ? "Edit Proposal" : "Create New Proposal"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingProposal ? `Updating proposal for ${editingProposal.eventName}.` : "Build a new catering proposal for a client."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-3">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProposal ? "Edit Proposal" : "Create New Proposal"}</DialogTitle>
                  <DialogDescription>
                    {editingProposal ? "Adjust the details of this proposal." : "Fill in the details to generate a new proposal."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 py-3">
                    {/* Client & Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients.length === 0 && <p className="p-2 text-sm text-muted-foreground">No clients added yet. Go to Clients page to add one.</p>}
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name} ({client.contactPerson})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Annual Gala Dinner" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Event Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                              <Input type="number" placeholder="e.g., 150" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Items (Recipes & Inventory Items) */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Items Included</h3>
                      <div className="flex gap-2 mb-3">
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
                        <div className="space-y-2">
                          {itemFields.map((item, index) => {
                            const inventoryItemDetails = item.type === "inventoryItem" ? inventory.find(inv => inv.id === item.id) : undefined;
                            return (
                              <div key={item.id} className="flex items-center gap-2 border p-2 rounded-md bg-secondary/20">
                                {getIconForItemType(item.type, inventoryItemDetails?.category)}
                                <span className="font-medium flex-1">{item.name}</span>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemQuantityChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  min="1"
                                />
                                <span className="text-muted-foreground">x ${item.unitCost.toFixed(2)}</span>
                                <span className="font-semibold w-20 text-right">${item.totalCost.toFixed(2)}</span>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Additional Costs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    <div className="text-right space-y-1 mt-3">
                      <p className="text-lg">Subtotal: <span className="font-bold">${subtotal.toFixed(2)}</span></p>
                      <p className="text-xl font-extrabold text-primary">Total: <span className="font-bold">${totalAmount.toFixed(2)}</span></p>
                    </div>

                    {/* Terms and Notes */}
                    <FormField
                      control={form.control}
                      name="termsAndConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter any specific terms and conditions for this proposal..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any additional notes for the client or internal use..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit">{editingProposal ? "Save Changes" : "Create Proposal"}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Proposals */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Existing Proposals</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your generated proposals.</CardDescription>
          </CardHeader>
          <CardContent>
            {proposals.length === 0 ? (
              <p className="text-muted-foreground text-center">No proposals created yet. Click "Create New Proposal" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">Event Name</TableHead>
                      <TableHead className="px-3 py-2">Client</TableHead>
                      <TableHead className="px-3 py-2">Date</TableHead>
                      <TableHead className="px-3 py-2">Guests</TableHead>
                      <TableHead className="px-3 py-2">Total</TableHead>
                      <TableHead className="px-3 py-2 text-center">Status</TableHead>
                      <TableHead className="px-3 py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => {
                      const client = clients.find(c => c.id === proposal.clientId);
                      const associatedBooking = bookings.find(b => b.proposalId === proposal.id);
                      return (
                        <TableRow key={proposal.id} className="border-l-4 border-primary">
                          <TableCell className="font-medium px-3 py-2">
                            <Link to={`/quoting/proposals/${proposal.id}`} className="hover:underline text-primary">
                              {proposal.eventName}
                            </Link>
                          </TableCell>
                          <TableCell className="px-3 py-2">{client ? client.name : "Unknown Client"}</TableCell>
                          <TableCell className="px-3 py-2">{format(new Date(proposal.eventDate), "PPP")}</TableCell>
                          <TableCell className="px-3 py-2">{proposal.numberOfGuests}</TableCell>
                          <TableCell className="px-3 py-2">${proposal.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-center px-3 py-2">
                            <Badge variant={
                              proposal.status === "Accepted" ? "default" :
                              proposal.status === "Rejected" || proposal.status === "Archived" ? "destructive" :
                              "secondary"
                            }>
                              {proposal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex justify-end space-x-2 px-3 py-2">
                            {proposal.status === "Accepted" && associatedBooking && (
                              <Link to={`/events/beos/${associatedBooking.id}`}>
                                <Button variant="outline" size="icon" className="mr-2" title="View BEO">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button variant="outline" size="icon" onClick={() => handleView(proposal)} title="View Proposal">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(proposal)} title="Edit Proposal">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Select onValueChange={(value: Proposal["status"]) => handleStatusChange(proposal.id, value)} value={proposal.status}>
                              <SelectTrigger className="w-[120px] h-9">
                                <SelectValue placeholder="Change Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Sent">Sent</SelectItem>
                                <SelectItem value="Accepted">Accepted</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(proposal.id)} title="Delete Proposal">
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
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Proposal View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>View Proposal</DialogTitle>
            <DialogDescription>Review the full details of this catering proposal.</DialogDescription>
          </DialogHeader>
          {viewingProposal && clients.find(c => c.id === viewingProposal.clientId) ? (
            <ProposalDocument
              proposal={viewingProposal}
              client={clients.find(c => c.id === viewingProposal.clientId)!}
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">Loading proposal details...</div>
          )}
          <DialogFooter className="p-4 pt-2">
            <Button onClick={() => window.print()} className="mr-2">Print Proposal</Button>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposals;