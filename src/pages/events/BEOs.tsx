"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, PlusCircle, Edit, FileText, CalendarCheck, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { useCateringStore, BEO as BEOType, BEOCustomSection, BEOChecklistItem } from "@/store/cateringStore"; // Import BEOType, BEOCustomSection, BEOChecklistItem
import { BEO as BEOComponent } from "@/components/BEO";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import { BEOForm, BEOFormData, beoFormSchema } from "@/components/BEOForm";
import { toast } from "sonner";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const BEOs = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();
  const bookings = useCateringStore((state) => state.bookings);
  const recipes = useCateringStore((state) => state.recipes);
  const inventory = useCateringStore((state) => state.inventory);
  const beos = useCateringStore((state) => state.beos);
  const addBEO = useCateringStore((state) => state.addBEO);
  const updateBEO = useCateringStore((state) => state.updateBEO);
  const deleteBEO = useCateringStore((state) => state.deleteBEO);
  const updateBEOChecklistItem = useCateringStore((state) => state.updateBEOChecklistItem);
  const updateBookingStatus = useCateringStore((state) => state.updateBooking); // To update booking status to cancelled

  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>(undefined);
  const [isViewPrintDialogOpen, setIsViewPrintDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBEO, setEditingBEO] = useState<BEOType | null>(null); // Type changed to BEOType

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const associatedBEO = selectedBooking ? beos.find(b => b.bookingId === selectedBooking.id) : undefined;

  // Effect to set selected booking from URL param
  useEffect(() => {
    if (bookingId) {
      setSelectedBookingId(bookingId);
      // If a bookingId is provided in the URL, and there's no BEO, open the form to create one.
      // If there is a BEO, it will be displayed directly on the page.
      const bookingExists = bookings.some(b => b.id === bookingId);
      if (bookingExists && !beos.some(b => b.bookingId === bookingId)) {
        const bookingToCreateBEOFor = bookings.find(b => b.id === bookingId);
        if (bookingToCreateBEOFor) {
          setEditingBEO({
            id: crypto.randomUUID(), // Temp ID for form, will be replaced by store
            bookingId: bookingToCreateBEOFor.id,
            eventTime: "",
            venue: "",
            specialInstructions: "",
            customSections: [],
            checklist: [],
            status: "Draft",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setIsFormDialogOpen(true);
        }
      }
    } else if (!selectedBookingId && bookings.length > 0) {
      // If no bookingId in URL and nothing selected, default to the first booking
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookingId, bookings, beos, selectedBookingId]);

  const handleCreateOrEditBEO = () => {
    if (!selectedBooking) return;

    if (associatedBEO) {
      // Edit existing BEO
      setEditingBEO(associatedBEO);
    } else {
      // Create new BEO
      setEditingBEO({
        id: crypto.randomUUID(), // Temp ID for form, will be replaced by store
        bookingId: selectedBooking.id,
        eventTime: "",
        venue: "",
        specialInstructions: "",
        customSections: [],
        checklist: [],
        status: "Draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsFormDialogOpen(true);
  };

  const handleBEOFormSubmit = (data: BEOFormData) => {
    if (!selectedBooking) {
      toast.error("No booking selected to associate BEO with.");
      return;
    }

    if (editingBEO && editingBEO.id) {
      // Update existing BEO
      updateBEO({
        ...editingBEO, // Keep existing ID, createdAt
        ...data,
        customSections: (data.customSections || []) as BEOCustomSection[],
        checklist: (data.checklist || []) as BEOChecklistItem[],
        updatedAt: new Date().toISOString(),
      });
      toast.success("BEO updated successfully!");
    } else {
      // Create new BEO
      addBEO({
        ...data,
        bookingId: selectedBooking.id, // Ensure bookingId is set
        customSections: (data.customSections || []) as BEOCustomSection[],
        checklist: (data.checklist || []) as BEOChecklistItem[],
      });
      toast.success("BEO created successfully!");
    }
    setIsFormDialogOpen(false);
    setEditingBEO(null);
  };

  const handleDeleteBEO = (beoId: string) => {
    if (window.confirm("Are you sure you want to delete this BEO? This action cannot be undone.")) {
      deleteBEO(beoId);
      toast.info("BEO deleted.");
      // If the deleted BEO was for the currently selected booking, clear selectedBookingId
      if (associatedBEO?.id === beoId) {
        setSelectedBookingId(undefined);
        navigate("/events/beos"); // Navigate away from the specific BEO view
      }
    }
  };

  const handleBEOChecklistToggle = (itemId: string, completed: boolean) => {
    if (associatedBEO) {
      updateBEOChecklistItem(associatedBEO.id, itemId, completed);
    }
  };

  const handleUpdateBEOStatus = (newStatus: BEOType["status"]) => {
    if (associatedBEO) {
      updateBEO({ ...associatedBEO, status: newStatus });
      toast.success(`BEO status updated to ${newStatus}.`);
    }
  };

  const handleCancelBooking = () => {
    if (selectedBooking && window.confirm(`Are you sure you want to cancel the event "${selectedBooking.eventName}"? This action cannot be undone.`)) {
      updateBookingStatus({ ...selectedBooking, status: "cancelled" });
      toast.info(`Event "${selectedBooking.eventName}" has been cancelled.`);
      // Optionally delete associated BEO
      if (associatedBEO) {
        deleteBEO(associatedBEO.id);
        toast.info("Associated BEO also deleted.");
      }
      setSelectedBookingId(undefined);
      navigate("/events/beos");
    }
  };

  const handleCompleteBooking = () => {
    if (selectedBooking && window.confirm(`Are you sure you want to mark the event "${selectedBooking.eventName}" as completed? This will deduct inventory.`)) {
      const success = useCateringStore.getState().completeBooking(selectedBooking.id);
      if (success) {
        toast.success(`Event "${selectedBooking.eventName}" completed and inventory deducted!`);
        // Optionally update BEO status to reflect completion
        if (associatedBEO) {
          updateBEO({ ...associatedBEO, status: "Finalized" }); // Or a new 'Completed' status
        }
      } else {
        toast.error(`Failed to complete event "${selectedBooking.eventName}". Check inventory levels for associated recipes.`);
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Banquet Event Orders (BEOs)</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage detailed Banquet Event Orders for your staff.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Select Booking</CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose an event booking to view, create, or edit its BEO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedBookingId} value={selectedBookingId}>
              <SelectTrigger className="w-full mb-3">
                <SelectValue placeholder="Select a booking to manage BEO" />
              </SelectTrigger>
              <SelectContent>
                {bookings.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No bookings available. Add one on the <Link to="/events/bookings" className="text-blue-500 hover:underline">Bookings page</Link>.</p>
                ) : (
                  bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.eventName} - {booking.clientName} ({format(parseISO(booking.eventDate), "PPP")})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedBooking && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button className="flex-1 min-w-[180px]" onClick={handleCreateOrEditBEO}>
                  {associatedBEO ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" /> Edit BEO
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create BEO
                    </>
                  )}
                </Button>
                {associatedBEO && (
                  <Button variant="outline" onClick={() => setIsViewPrintDialogOpen(true)} className="flex-1 min-w-[180px]">
                    <Printer className="mr-2 h-4 w-4" /> Preview/Print BEO
                  </Button>
                )}
                {selectedBooking.proposalId && (
                  <Link to={`/quoting/proposals/${selectedBooking.proposalId}`} className="flex-1 min-w-[180px]">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" /> View Proposal
                    </Button>
                  </Link>
                )}
                <Link to={`/events/bookings`} className="flex-1 min-w-[180px]">
                  <Button variant="outline" className="w-full">
                    <CalendarCheck className="mr-2 h-4 w-4" /> Manage Bookings
                  </Button>
                </Link>
                {selectedBooking.status === "pending" && (
                  <>
                    <Button variant="destructive" onClick={handleCancelBooking} className="flex-1 min-w-[180px]">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel Event
                    </Button>
                    <Button variant="default" onClick={handleCompleteBooking} className="flex-1 min-w-[180px]">
                      <CheckCircle className="mr-2 h-4 w-4" /> Complete Event
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display BEO Details and Interactive Checklist */}
        {selectedBooking && associatedBEO ? (
          <Card className="bg-card p-3 rounded-lg shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-2xl font-semibold text-primary">
                BEO for {selectedBooking.eventName}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  associatedBEO.status === "Finalized" ? "default" :
                  associatedBEO.status === "Printed" ? "secondary" :
                  "outline"
                }>
                  Status: {associatedBEO.status}
                </Badge>
                <Select onValueChange={handleUpdateBEOStatus} value={associatedBEO.status}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Finalized">Finalized</SelectItem>
                    <SelectItem value="Printed">Printed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteBEO(associatedBEO.id)} title="Delete BEO">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Event Overview</h3>
                  <p><span className="font-medium">Client:</span> {selectedBooking.clientName}</p>
                  <p><span className="font-medium">Date:</span> {format(parseISO(selectedBooking.eventDate), "PPP")}</p>
                  <p><span className="font-medium">Time:</span> {associatedBEO.eventTime}</p>
                  <p><span className="font-medium">Venue:</span> {associatedBEO.venue}</p>
                  <p><span className="font-medium">Guests:</span> {selectedBooking.numberOfGuests}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Menu Items</h3>
                  <ScrollArea className="h-[150px] pr-4">
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {selectedBooking.selectedRecipeIds.length === 0 ? (
                        <li>No recipes selected.</li>
                      ) : (
                        selectedBooking.selectedRecipeIds.map(recipeId => {
                          const recipe = recipes.find(r => r.id === recipeId);
                          return <li key={recipeId}>{recipe ? recipe.name : "Unknown Recipe"}</li>;
                        })
                      )}
                    </ul>
                  </ScrollArea>
                </div>
              </div>

              {associatedBEO.specialInstructions && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Special Instructions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{associatedBEO.specialInstructions}</p>
                </div>
              )}

              {associatedBEO.customSections && associatedBEO.customSections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Additional Details</h3>
                  {associatedBEO.customSections.map(section => (
                    <div key={section.id} className="mb-2">
                      <h4 className="font-medium text-base">{section.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-secondary-foreground mb-2">Staff Operational Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {associatedBEO.checklist.length === 0 ? (
                    <p className="text-muted-foreground text-sm col-span-2">No checklist items defined for this BEO.</p>
                  ) : (
                    associatedBEO.checklist.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`beo-checklist-item-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={(checked: boolean) => handleBEOChecklistToggle(item.id, checked)}
                        />
                        <label
                          htmlFor={`beo-checklist-item-${item.id}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.task}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedBooking ? (
          <Card className="bg-card p-3 rounded-lg shadow-md">
            <CardContent className="text-center text-muted-foreground py-6">
              No BEO found for "{selectedBooking.eventName}". Click "Create BEO" above to get started!
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card p-3 rounded-lg shadow-md">
            <CardContent className="text-center text-muted-foreground py-6">
              Select a booking from the dropdown above to view or create its BEO.
            </CardContent>
          </Card>
        )}
      </div>
      <MadeWithDyad />

      {/* BEO Form Dialog (Create/Edit) */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        setIsFormDialogOpen(open);
        if (!open) {
          setEditingBEO(null); // Clear editing BEO when dialog closes
          // If we were creating a BEO from a URL param, navigate away
          if (bookingId && !associatedBEO) {
            navigate("/events/beos");
          }
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBEO?.id ? "Edit Banquet Event Order" : "Create New Banquet Event Order"}</DialogTitle>
            <DialogDescription>
              {editingBEO?.id ? `Update details for ${selectedBooking?.eventName}'s BEO.` : `Create a detailed BEO for ${selectedBooking?.eventName}.`}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && editingBEO && (
            <BEOForm
              initialData={editingBEO}
              bookingName={`${selectedBooking.eventName} - ${selectedBooking.clientName}`}
              onSubmit={handleBEOFormSubmit}
              onCancel={() => setIsFormDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* BEO View/Print Dialog */}
      <Dialog open={isViewPrintDialogOpen} onOpenChange={setIsViewPrintDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-3 pb-1">
            <DialogTitle>Banquet Event Order</DialogTitle>
            <DialogDescription>Detailed plan for {selectedBooking?.eventName}</DialogDescription>
          </DialogHeader>
          {selectedBooking && associatedBEO ? (
            <BEOComponent booking={selectedBooking} recipes={recipes} inventory={inventory} beo={associatedBEO} />
          ) : (
            <div className="p-3 text-center text-muted-foreground">No BEO found for this booking.</div>
          )}
          <DialogFooter className="p-3 pt-1">
            <Button onClick={() => window.print()} className="mr-2">
              <Printer className="mr-2 h-4 w-4" /> Print BEO
            </Button>
            <Button variant="outline" onClick={() => setIsViewPrintDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BEOs;