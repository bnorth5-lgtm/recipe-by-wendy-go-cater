"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { useCateringStore, EventBooking } from "@/store/cateringStore";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, XCircle } from "lucide-react"; // Import XCircle for cancel icon
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { BookingForm } from "@/components/BookingForm";
import * as z from "zod";
import { bookingFormSchema } from "@/components/BookingForm";
import { toast } from "sonner"; // Import toast for notifications
import { cn } from "@/lib/utils"; // Import cn for conditional classNames

type BookingFormData = z.infer<typeof bookingFormSchema>;

const Calendar = () => {
  const bookings = useCateringStore((state) => state.bookings);
  const updateBooking = useCateringStore((state) => state.updateBooking);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingBooking, setEditingBooking] = useState<EventBooking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<EventBooking | null>(null); // State for booking to cancel

  // Prepare modifiers for dates with events
  const bookedDates = bookings.map(booking => parseISO(booking.eventDate));
  const modifiers = {
    hasEvent: bookedDates,
  };
  const modifiersClassNames = {
    hasEvent: "bg-destructive text-destructive-foreground rounded-full", // Highlight event dates in red
  };

  // Filter events for the selected date
  const eventsOnSelectedDate = selectedDate
    ? bookings.filter(booking => isSameDay(parseISO(booking.eventDate), selectedDate))
    : [];

  const handleEditBooking = (booking: EventBooking) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleUpdateBookingSubmit = (data: BookingFormData) => {
    if (editingBooking) {
      updateBooking({
        ...editingBooking, // Keep existing ID and status
        eventName: data.eventName,
        clientName: data.clientName,
        eventDate: format(data.eventDate, "yyyy-MM-dd"),
        numberOfGuests: data.numberOfGuests,
        selectedRecipeIds: data.selectedRecipeIds,
      });
      setEditingBooking(null);
      setIsEditDialogOpen(false);
      toast.success("Event booking updated successfully!");
    }
  };

  const handleCancelBooking = (booking: EventBooking) => {
    setBookingToCancel(booking);
  };

  const confirmCancelBooking = () => {
    if (bookingToCancel) {
      updateBooking({ ...bookingToCancel, status: "cancelled" });
      toast.info(`Event "${bookingToCancel.eventName}" has been cancelled.`);
      setBookingToCancel(null); // Clear the booking to cancel
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Event Calendar</h1>
        <p className="text-xl text-muted-foreground">
          View and manage all your upcoming events in a calendar format.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar View */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Event Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select a date to see scheduled events. Dates with events are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ShadcnCalendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Events List for Selected Date */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              Events on {selectedDate ? format(selectedDate, "PPP") : "No Date Selected"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Details for events scheduled on the chosen date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsOnSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center">
                {selectedDate ? "No events scheduled for this date." : "Select a date on the calendar to view events."}
              </p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {eventsOnSelectedDate.map((booking) => (
                    <div
                      key={booking.id}
                      className={cn(
                        "border p-3 rounded-md bg-secondary/20 flex justify-between items-center cursor-pointer hover:bg-secondary/30 transition-colors",
                        booking.status === "cancelled" && "opacity-70" // Dim cancelled events
                      )}
                      onClick={() => booking.status !== "cancelled" && handleEditBooking(booking)} // Hotlink to edit dialog
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{booking.eventName}</h3>
                        <p className="text-sm text-muted-foreground">Client: {booking.clientName}</p>
                        <p className="text-sm text-muted-foreground">Guests: {booking.numberOfGuests}</p>
                        <Badge
                          className="mt-2"
                          variant={
                            booking.status === "completed" ? "default" :
                            booking.status === "cancelled" ? "destructive" :
                            "secondary"
                          }
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }} // Prevent parent div click
                          disabled={booking.status === "cancelled"} // Disable edit if cancelled
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {booking.status !== "cancelled" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking); }} // Prevent parent div click
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will mark the event "{bookingToCancel?.eventName}" as cancelled.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setBookingToCancel(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmCancelBooking}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event Booking</DialogTitle>
            <DialogDescription>
              Make changes to the event details here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <BookingForm
              initialData={editingBooking}
              onSubmit={handleUpdateBookingSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;