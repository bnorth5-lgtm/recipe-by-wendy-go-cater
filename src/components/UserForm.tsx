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
import { User } from "@/store/cateringStore";
import { TIER_DEFINITIONS } from "@/lib/subscriptionTiers";
import { NBS_ROLE_DEFINITIONS, type NbsRole } from "@/lib/partnershipLedger";

export const userFormSchema = z.object({
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Must be a valid email address").min(1, "Email is required"),
  role: z.enum(["Owner", "Caterer", "Employee", "System Admin", "Executive Chef"], {
    required_error: "Display role is required.",
  }),
  nbsRole: z.enum(["system_admin", "executive_chef", "staff"], {
    required_error: "NBS authority role is required.",
  }),
  tier: z.enum(["basic", "professional", "enterprise"], {
    required_error: "Subscription tier is required.",
  }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          email: initialData.email,
          role: initialData.role,
          nbsRole: (initialData.nbsRole as NbsRole) ?? "staff",
          tier: initialData.tier ?? "basic",
        }
      : {
          name: "",
          email: "",
          role: "Employee",
          nbsRole: "staff",
          tier: "basic",
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
          name="nbsRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NBS Authority Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NBS role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(NBS_ROLE_DEFINITIONS) as NbsRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {NBS_ROLE_DEFINITIONS[r].displayTitle} — {NBS_ROLE_DEFINITIONS[r].badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a display role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="System Admin">System Admin</SelectItem>
                  <SelectItem value="Executive Chef">Executive Chef</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Caterer">Caterer</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Tier</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIER_DEFINITIONS.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.label} — {tier.tagline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 mt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{initialData ? "Save changes" : "Add User"}</Button>
        </div>
      </form>
    </Form>
  );
};
