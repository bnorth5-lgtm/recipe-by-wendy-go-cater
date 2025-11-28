"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { User, UserRole } from "@/store/cateringStore"; // Import User and UserRole

// Define the schema for a user form
export const userFormSchema = z.object({
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Must be a valid email address").min(1, "Email is required"),
  role: z.enum(["Owner", "Caterer", "Employee"], {
    required_error: "User role is required.",
  }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: User; // Optional: for editing existing users
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      role: "Employee", // Default to employee
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
              <FormLabel>User Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Caterer">Caterer</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 mt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? "Save changes" : "Add User"}</Button>
        </div>
      </form>
    </Form>
  );
};