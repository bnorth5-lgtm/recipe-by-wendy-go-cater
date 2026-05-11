"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useCateringStore, EventBooking } from "@/store/cateringStore";

// Multi-select component for recipes
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
export const bookingFormSchema = z.object({ // Exported the schema
  eventName: z.string().min(1, "Event name is required"),
  clientName: z.string().min(1, "Client name is required"),
  eventDate: z.date({
    required_error: "An event date is required.",
  }),
  numberOfGuests: z.coerce.number().min(1, "Number of guests must be at least 1"),
  selectedRecipeIds: z.array(z.string()).min(1, "At least one menu dish must be selected"),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  initialData?: EventBooking; // Optional: for editing existing bookings
  onSubmit: (data: BookingFormData) => void;
  onCancel?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const recipes = useCateringStore((state) => state.recipes);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          eventDate: new Date(initialData.eventDate), // Convert string to Date object
        }
      : {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
              <FormLabel>Select menu dishes</FormLabel>
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
        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? "Save Changes" : "Add Booking"}</Button>
        </div>
      </form>
    </Form>
  );
};