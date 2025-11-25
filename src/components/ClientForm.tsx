"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { useCateringStore, Client } from "@/store/cateringStore";
import { toast } from "sonner";

// Define the schema for a client form
export const clientFormSchema = z.object({
  name: z.string().min(1, "Company/Client name is required"),
  contactPerson: z.string().min(1, "Contact person's name is required"),
  email: z.string().email("Must be a valid email address").min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client; // Optional: for editing existing clients
  onSubmit: (data: ClientFormData) => void;
  onCancel?: () => void;
  readOnly?: boolean; // NEW: Add readOnly prop
}

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel, readOnly = false }) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialData || {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
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
              <FormLabel>Company/Client Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Acme Corp" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g., (555) 123-4567" {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any specific client preferences or details..." {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!readOnly && (
          <div className="flex justify-end gap-2 mt-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
            <Button type="submit">{initialData ? "Save changes" : "Add Client"}</Button>
          </div>
        )}
      </form>
    </Form>
  );
};