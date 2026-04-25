import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const cateringIntakeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  eventType: z.enum(
    ["Wedding", "Gala/Fundraiser", "Corporate Lunch", "Private Dinner", "Event Trays"],
    { required_error: "Event type is required" },
  ),
  eventDate: z.string().min(1, "Event date is required"),
  numberOfGuests: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1 guest"),
});

export type CateringIntakeFormData = z.infer<typeof cateringIntakeFormSchema>;

interface CateringIntakeFormProps {
  onSubmit: (data: CateringIntakeFormData) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const CateringIntakeForm: React.FC<CateringIntakeFormProps> = ({
  onSubmit,
  onCancel,
  readOnly = false,
}) => {
  const form = useForm<CateringIntakeFormData>({
    resolver: zodResolver(cateringIntakeFormSchema),
    defaultValues: {
      name: "",
      eventType: "Wedding",
      eventDate: "",
      numberOfGuests: 25,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jordan Lee" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Gala/Fundraiser">Gala/Fundraiser</SelectItem>
                    <SelectItem value="Corporate Lunch">Corporate Lunch</SelectItem>
                    <SelectItem value="Private Dinner">Private Dinner</SelectItem>
                    <SelectItem value="Event Trays">Event Trays</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={readOnly} />
                </FormControl>
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
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-2 mt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">Submit Intake</Button>
          </div>
        )}
      </form>
    </Form>
  );
};

