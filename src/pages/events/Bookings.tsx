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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, CheckCircle, XCircle, Loader2, Utensils, Users, AlertCircle, Trash2 } from "lucide-react"; // Removed DollarSign
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCateringStore, EventBooking } from "@/store/cateringStore";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Multi-select component for recipes (simplified for now, could be a more robust component)
interface MultiSelectProps {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, placeholder }) => {
  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <Select onValueChange={handleSelect} value=""> {/* Value is empty to allow re-selection */}
      <SelectTrigger className="w-full">
        <SelectValue placeholder={selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                readOnly
                className="mr-2"
              />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};


// Define the schema for an event booking form
const bookingFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  clientName: z.string().min(1, "Client name is required"),
  eventDate: z.date({
    required_error: "An event date is required.",
  }),
  numberOfGuests: z.coerce.number().min(1, "Number of guests must be at least 1"),
  selectedRecipeIds: z.array(z.string()).min(1, "At least one recipe must be selected"),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

const Bookings = () => {
  const bookings = useCateringStore((state) => state.bookings);
  const recipes = useCateringStore((state) => state.recipes);
  const addBooking = useCateringStore((state) => state.addBooking);
  const completeBooking = useCateringStore((state) => state.completeBooking);
  const deleteBooking = useCateringStore((state) => state.deleteBooking);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      eventName: "",
      clientName: "",
      eventDate: new Date(),
      numberOfGuests: 1,
      selectedRecipeIds: [],
    },
  });

  const recipeOptions = recipes.map(recipe => ({
    label: recipe.name,
    value: recipe.id,
  }));

  const onSubmit = (data: BookingFormData) => {
    addBooking({
      eventName: data.eventName,
      clientName: data.clientName,
      eventDate: format(data.eventDate, "yyyy-MM-dd"), // Format date for storage
      numberOfGuests: data.numberOfGuests,
      selectedRecipeIds: data.selectedRecipeIds,
    });
    form.reset({
      eventName: "",
      clientName: "",
      eventDate: new Date(),
      numberOfGuests: 1,
      selectedRecipeIds: [],
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
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Event Bookings</h1>
        <p className="text-xl text-muted-foreground">
          Manage all your confirmed event bookings and details.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Add New Booking</CardTitle>
            <CardDescription className="text-muted-foreground">Fill in the details to create a new event booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sarah & John Wedding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
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
                <FormField
                  control={form.control}
                  name="selectedRecipeIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Recipes</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={recipeOptions}
                          selectedValues={field.value}
                          onChange={field.onChange}
                          placeholder="Select recipes for this event"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Add Booking</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Display Existing Bookings */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
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
                      <TableRow key={booking.id}>
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