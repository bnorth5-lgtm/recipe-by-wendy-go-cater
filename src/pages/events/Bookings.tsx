"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Loader2, Trash2, XCircle } from "lucide-react"; // XCircle added here
import { toast } from "sonner";
import { useCateringStore, EventBooking } from "@/store/cateringStore";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/components/BookingForm";
import { format } from "date-fns"; // Import format from date-fns
import * as z from "zod"; // Import Zod
import { bookingFormSchema } from "@/components/BookingForm"; // Import the schema
import { cn } from "@/lib/utils"; // Import cn for conditional classNames

type BookingFormData = z.infer<typeof bookingFormSchema>; // Infer type from schema

const Bookings = () => {
  const bookings = useCateringStore((state) => state.bookings);
  const recipes = useCateringStore((state) => state.recipes);
  const addBooking = useCateringStore((state) => state.addBooking);
  const completeBooking = useCateringStore((state) => state.completeBooking);
  const deleteBooking = useCateringStore((state) => state.deleteBooking);

  // Explicitly type data as BookingFormData
  const handleAddBookingSubmit = (data: BookingFormData) => {
    addBooking({
      eventName: data.eventName,
      clientName: data.clientName,
      eventDate: format(data.eventDate, "yyyy-MM-dd"),
      numberOfGuests: data.numberOfGuests,
      selectedRecipeIds: data.selectedRecipeIds,
    });
    toast.success("Event booking added successfully!");
  };

  const handleCompleteBooking = (bookingId: string) => {
    const success = completeBooking(bookingId);
    if (success) {
      toast.success("Event completed and inventory deducted!");
    } else {
      toast.error("Failed to complete event. Check inventory levels for associated recipes.");
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    deleteBooking(bookingId);
    toast.info("Booking deleted.");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4">Event Bookings</h1>
        <p className="text-xl text-muted-foreground">
          Manage all your confirmed event bookings and details.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <Card className="bg-card p-4 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Booking</CardTitle>
            <CardDescription className="text-muted-foreground">Fill in the details to create a new event booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm onSubmit={handleAddBookingSubmit} />
          </CardContent>
        </Card>

        <Card className="bg-card p-4 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Current Bookings</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your event bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center">No bookings added yet. Start by adding one above!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Recipes</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className={cn(
                          booking.status === "pending" && "border-l-4 border-destructive", // Red border for pending
                          booking.status === "completed" && "border-l-4 border-green-500", // Green border for completed
                          booking.status === "cancelled" && "border-l-4 border-gray-400 opacity-70" // Gray border for cancelled
                        )}
                      >
                        <TableCell className="font-medium">{booking.eventName}</TableCell>
                        <TableCell>{booking.clientName}</TableCell>
                        <TableCell>{booking.eventDate}</TableCell>
                        <TableCell>{booking.numberOfGuests}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {booking.selectedRecipeIds.map(recipeId => {
                              const recipe = recipes.find(r => r.id === recipeId);
                              return recipe ? (
                                <Badge key={recipeId} variant="secondary">{recipe.name}</Badge>
                              ) : (
                                <Badge key={recipeId} variant="destructive">Unknown Recipe</Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {booking.status === "completed" ? (
                            <Badge className="bg-green-500 hover:bg-green-500 text-white flex items-center justify-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </Badge>
                          ) : booking.status === "cancelled" ? (
                            <Badge variant="destructive" className="flex items-center justify-center gap-1">
                              <XCircle className="h-3 w-3" /> Cancelled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center justify-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="mr-2"
                            >
                              Complete Event
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteBooking(booking.id)}
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

export default Bookings;