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
import { Printer, PlusCircle, Edit } from "lucide-react"; // Import PlusCircle and Edit
import { useCateringStore } from "@/store/cateringStore";
import { BEO as BEOComponent } from "@/components/BEO"; // Renamed to BEOComponent to avoid conflict
import { useParams } from "react-router-dom";
import { BEOForm, BEOFormData, beoFormSchema } from "@/components/BEOForm"; // Import BEOForm and its types
import { toast } from "sonner";
import * as z from "zod";

const BEOs = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const bookings = useCateringStore((state) => state.bookings);
  const recipes = useCateringStore((state) => state.recipes);
  const inventory = useCateringStore((state) => state.inventory);
  const beos = useCateringStore((state) => state.beos);
  const addBEO = useCateringStore((state) => state.addBEO);
  const updateBEO = useCateringStore((state) => state.updateBEO);

  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>(undefined);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBEO, setEditingBEO] = useState<z.infer<typeof beoFormSchema> | null>(null);

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);
  const associatedBEO = selectedBooking ? beos.find(b => b.bookingId === selectedBooking.id) : undefined;

  // Effect to open view dialog if bookingId is in URL
  useEffect(() => {
    if (bookingId) {
      const bookingToView = bookings.find(b => b.id === bookingId);
      if (bookingToView) {
        setSelectedBookingId(bookingId);
        const beoToView = beos.find(b => b.bookingId === bookingId);
        if (beoToView) {
          setIsViewDialogOpen(true);
        } else {
          // If bookingId is in URL but no BEO exists, open the form to create one
          setEditingBEO({
            bookingId: bookingToView.id,
            eventTime: "", // Default empty
            venue: "", // Default empty
            specialInstructions: "",
            customSections: [],
            status: "Draft",
          });
          setIsFormDialogOpen(true);
        }
      } else {
        toast.error("Booking not found for BEO.");
      }
    }
  }, [bookingId, bookings, beos]);

  const handleCreateOrEditBEO = () => {
    if (!selectedBooking) return;

    if (associatedBEO) {
      // Edit existing BEO
      setEditingBEO(associatedBEO);
    } else {
      // Create new BEO
      setEditingBEO({
        bookingId: selectedBooking.id,
        eventTime: "",
        venue: "",
        specialInstructions: "",
        customSections: [],
        status: "Draft",
      });
    }
    setIsFormDialogOpen(true);
  };

  const handleBEOFormSubmit = (data: BEOFormData) => {
    if (editingBEO && editingBEO.id) {
      // Update existing BEO
      updateBEO({ ...data, id: editingBEO.id } as z.infer<typeof beoFormSchema>);
      toast.success("BEO updated successfully!");
    } else {
      // Create new BEO
      addBEO(data as Omit<z.infer<typeof beoFormSchema>, 'id' | 'createdAt' | 'updatedAt' | 'status'>);
      toast.success("BEO created successfully!");
    }
    setIsFormDialogOpen(false);
    setEditingBEO(null);
    // If a booking was selected, open the view dialog after creation/update
    if (selectedBooking) {
      setIsViewDialogOpen(true);
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

      <div className="w-full max-w-4xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Manage BEOs</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select an existing booking to create or manage its Banquet Event Order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedBookingId} value={selectedBookingId}>
              <SelectTrigger className="w-full mb-3">
                <SelectValue placeholder="Select a booking to manage BEO" />
              </SelectTrigger>
              <SelectContent>
                {bookings.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No bookings available. Add one on the Bookings page.</p>
                ) : (
                  bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.eventName} - {booking.clientName} ({booking.eventDate})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedBooking && (
              <div className="flex gap-2 mt-3">
                <Button className="flex-1" onClick={handleCreateOrEditBEO}>
                  {associatedBEO ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" /> View/Edit BEO for {selectedBooking.eventName}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create BEO for {selectedBooking.eventName}
                    </>
                  )}
                </Button>
                {associatedBEO && (
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(true)}>
                    <Printer className="mr-2 h-4 w-4" /> Preview BEO
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* BEO Form Dialog (Create/Edit) */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        setIsFormDialogOpen(open);
        if (!open) {
          setEditingBEO(null); // Clear editing BEO when dialog closes
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
              initialData={editingBEO as BEO} // Cast to BEO for initialData
              bookingName={`${selectedBooking.eventName} - ${selectedBooking.clientName}`}
              onSubmit={handleBEOFormSubmit}
              onCancel={() => setIsFormDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* BEO View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BEOs;