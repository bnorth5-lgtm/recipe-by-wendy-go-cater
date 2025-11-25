"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { useCateringStore, EventBooking } from "@/store/cateringStore";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, XCircle, CheckCircle, Loader2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { BookingForm } from "@/components/BookingForm";
import * as z from "zod";
import { bookingFormSchema } from "@/components/BookingForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";

type BookingFormData = z.infer<typeof bookingFormSchema>;

const Calendar = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const bookings = useCateringStore((state) => state.bookings);
  const updateBooking = useCateringStore((state) => state.updateBooking);
  const completeBooking = useCateringStore((state) => state.completeBooking);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingBooking, setEditingBooking] = useState<EventBooking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<EventBooking | null>(null);

  useEffect(() => {
    if (bookingId) {
      const bookingToEdit = bookings.find(b => b.id === bookingId);
      if (bookingToEdit) {
        setEditingBooking(bookingToEdit);
        setIsEditDialogOpen(true);
      } else {
        toast.error("Booking not found.");
      }
    } else {
      setIsEditDialogOpen(false);
      setEditingBooking(null);
    }
  }, [bookingId, bookings]);

  // Prepare modifiers for dates with events
  const bookedDates = bookings.map(booking => parseISO(booking.eventDate));
  const modifiers = {
    hasEvent: bookedDates,
  };
  const modifiersClassNames = {
    hasEvent: "bg-destructive text-destructive-foreground rounded-full",
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
        ...editingBooking,
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
      setBookingToCancel(null);
    }
  };

  // NEW: Handle completing an event directly from the calendar
  const handleCompleteEvent = (event: EventBooking) => {
    const success = completeBooking(event.id);
    if (success) {
      toast.success(`Event "${event.eventName}" completed and inventory deducted!`);
    } else {
      toast.error(`Failed to complete event "${event.eventName}". Check inventory levels for associated recipes.`);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Event Calendar</h1>
        <p className="text-xl text-muted-foreground">
          View and manage all your upcoming events in a calendar format.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
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
        <Card className="bg-card p-3 rounded-lg shadow-md">
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
                <div className="space-y-3">
                  {eventsOnSelectedDate.map((booking) => (
                    <div
                      key={booking.id}
                      className={cn(
                        "border p-2 rounded-md bg-secondary/20 flex justify-between items-center cursor-pointer hover:bg-secondary/30 transition-colors",
                        booking.status === "cancelled" && "opacity-70"
                      )}
                      onClick={() => booking.status !== "cancelled" && handleEditBooking(booking)}
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{booking.eventName}</h3>
                        <p className="text-sm text-muted-foreground">Client: {booking.clientName}</p>
                        <p className="text-sm text-muted-foreground">Guests: {booking.numberOfGuests}</p>
                        <Badge
                          className="mt-1"
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
                        {booking.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleCompleteEvent(booking); }}
                            className="mr-2"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete Event
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                          disabled={booking.status === "cancelled"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {booking.status !== "cancelled" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking); }}
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