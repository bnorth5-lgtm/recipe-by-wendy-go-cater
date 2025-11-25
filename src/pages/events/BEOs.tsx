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
import { Printer } from "lucide-react";
import { useCateringStore } from "@/store/cateringStore";
import { BEO } from "@/components/BEO"; // Import the new BEO component
import { useParams } from "react-router-dom"; // Import useParams

const BEOs = () => {
  const { bookingId } = useParams<{ bookingId?: string }>(); // Get ID from URL
  const bookings = useCateringStore((state) => state.bookings);
  const recipes = useCateringStore((state) => state.recipes);
  const inventory = useCateringStore((state) => state.inventory); // Needed for BEO details

  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>(undefined);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  // Effect to open view dialog if bookingId is in URL
  useEffect(() => {
    if (bookingId) {
      const bookingToView = bookings.find(b => b.id === bookingId);
      if (bookingToView) {
        setSelectedBookingId(bookingId);
        setIsViewDialogOpen(true);
      } else {
        // Optionally, show a toast error if booking not found
        // toast.error("Booking not found for BEO.");
      }
    }
  }, [bookingId, bookings]);

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4">Banquet Event Orders (BEOs)</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage detailed Banquet Event Orders for your staff.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <Card className="bg-card p-4 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Generate BEO</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select an existing booking to generate its Banquet Event Order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedBookingId} value={selectedBookingId}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Select a booking to generate BEO" />
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
              <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    View BEO for {selectedBooking.eventName}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-0">
                  <DialogHeader className="p-4 pb-0">
                    <DialogTitle>Banquet Event Order</DialogTitle>
                    <DialogDescription>Detailed plan for {selectedBooking.eventName}</DialogDescription>
                  </DialogHeader>
                  <BEO booking={selectedBooking} recipes={recipes} inventory={inventory} />
                  <DialogFooter className="p-4 pt-0">
                    <Button onClick={() => window.print()} className="mr-2">
                      <Printer className="mr-2 h-4 w-4" /> Print BEO
                    </Button>
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default BEOs;