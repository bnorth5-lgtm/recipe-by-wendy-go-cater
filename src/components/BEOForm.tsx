"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { BEO, BEOCustomSection, BEOChecklistItem } from "@/store/cateringStore"; // Import BEOChecklistItem
import { cn } from "@/lib/utils";

// Define the schema for a custom section
const customSectionSchema = z.object({
  id: z.string().optional(), // ID is optional for new sections
  title: z.string().min(1, "Section title is required"),
  content: z.string().min(1, "Section content is required"),
});

// Define the schema for a checklist item
const checklistItemSchema = z.object({
  id: z.string().optional(), // ID is optional for new items
  task: z.string().min(1, "Checklist task is required"),
  completed: z.boolean().default(false),
});

// Define the main schema for the BEO form
export const beoFormSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  eventTime: z.string().min(1, "Event time is required (e.g., 6:00 PM - 10:00 PM)"),
  venue: z.string().min(1, "Venue is required"),
  specialInstructions: z.string().optional(),
  customSections: z.array(customSectionSchema).optional(),
  checklist: z.array(checklistItemSchema).optional(), // NEW: Add checklist to schema
  status: z.enum(["Draft", "Finalized", "Printed"]).default("Draft"),
});

export type BEOFormData = z.infer<typeof beoFormSchema>;

interface BEOFormProps {
  initialData?: BEO; // Optional: for editing existing BEOs
  bookingName: string; // To display in the form
  onSubmit: (data: BEOFormData) => void;
  onCancel?: () => void;
}

export const BEOForm: React.FC<BEOFormProps> = ({ initialData, bookingName, onSubmit, onCancel }) => {
  const form = useForm<BEOFormData>({
    resolver: zodResolver(beoFormSchema),
    defaultValues: initialData || {
      bookingId: "",
      eventTime: "",
      venue: "",
      specialInstructions: "",
      customSections: [],
      checklist: [], // Initialize checklist
      status: "Draft",
    },
  });

  const { fields: customSectionFields, append: appendCustomSection, remove: removeCustomSection } = useFieldArray({
    control: form.control,
    name: "customSections",
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control: form.control,
    name: "checklist", // NEW: Field array for checklist
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 py-3">
        <FormField
          control={form.control}
          name="bookingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Booking</FormLabel>
              <FormControl>
                <Input value={bookingName} disabled /> {/* Display booking name, not ID */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eventTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Time</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 6:00 PM - 10:00 PM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grand Ballroom, City Convention Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Client requires all serving staff to wear black ties. VIP table near the stage." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Sections */}
        <div>
          <h3 className="text-lg font-medium mb-2">Custom Sections</h3>
          <div className="space-y-3">
            {customSectionFields.map((item, index) => (
              <div key={item.id} className="border p-2 rounded-md bg-secondary/20">
                <div className="flex justify-between items-center mb-2">
                  <FormField
                    control={form.control}
                    name={`customSections.${index}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-1 mr-2">
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Section Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Floral Arrangements" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeCustomSection(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name={`customSections.${index}.content`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Section Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter content for this section..." {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => appendCustomSection({ id: crypto.randomUUID(), title: "", content: "" })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Section
          </Button>
        </div>

        {/* NEW: Checklist Section */}
        <div>
          <h3 className="text-lg font-medium mb-2">Staff Checklist</h3>
          <div className="space-y-3">
            {checklistFields.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-2 border p-2 rounded-md bg-secondary/20">
                <FormField
                  control={form.control}
                  name={`checklist.${index}.completed`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`checklist.${index}.task`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="sr-only">Task</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Confirm final guest count" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeChecklist(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => appendChecklist({ id: crypto.randomUUID(), task: "", completed: false })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Checklist Item
          </Button>
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>BEO Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select BEO status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Finalized">Finalized</SelectItem>
                  <SelectItem value="Printed">Printed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? "Save BEO" : "Create BEO"}</Button>
        </div>
      </form>
    </Form>
  );
};