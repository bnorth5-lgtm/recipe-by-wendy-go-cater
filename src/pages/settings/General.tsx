"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useCateringStore } from "@/store/cateringStore";

// Define the schema for general settings form
const generalSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  defaultTaxRate: z.coerce.number().min(0).max(1, "Tax rate must be between 0 and 1 (e.g., 0.08 for 8%)"),
  defaultMarkupPercentage: z.coerce.number().min(0).max(1, "Markup percentage must be between 0 and 1 (e.g., 0.20 for 20%)"),
  globalLowStockThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
  currencySymbol: z.string().min(1, "Currency symbol is required").max(3, "Currency symbol should be brief (e.g., $, €, £)"),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

const GeneralSettings = () => {
  const {
    businessName,
    defaultTaxRate,
    defaultMarkupPercentage,
    globalLowStockThreshold,
    currencySymbol,
    setBusinessName,
    setDefaultTaxRate,
    setDefaultMarkupPercentage,
    setGlobalLowStockThreshold,
    setCurrencySymbol,
  } = useCateringStore();

  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      businessName: businessName,
      defaultTaxRate: defaultTaxRate,
      defaultMarkupPercentage: defaultMarkupPercentage,
      globalLowStockThreshold: globalLowStockThreshold,
      currencySymbol: currencySymbol,
    },
  });

  // Reset form values when store values change (e.g., on initial load or if another component updates them)
  React.useEffect(() => {
    form.reset({
      businessName: businessName,
      defaultTaxRate: defaultTaxRate,
      defaultMarkupPercentage: defaultMarkupPercentage,
      globalLowStockThreshold: globalLowStockThreshold,
      currencySymbol: currencySymbol,
    });
  }, [businessName, defaultTaxRate, defaultMarkupPercentage, globalLowStockThreshold, currencySymbol, form]);

  const onSubmit = (data: GeneralSettingsFormData) => {
    setBusinessName(data.businessName);
    setDefaultTaxRate(data.defaultTaxRate);
    setDefaultMarkupPercentage(data.defaultMarkupPercentage);
    setGlobalLowStockThreshold(data.globalLowStockThreshold);
    setCurrencySymbol(data.currencySymbol);
    toast.success("General settings updated successfully!");
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">General Settings</h1>
        <p className="text-xl text-muted-foreground">
          Configure core business information and default values.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Business Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Update your company's name and default operational settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 py-3">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cronkhite Catering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currencySymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Tax Rate (e.g., 0.08 for 8%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.08" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultMarkupPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Inventory Markup Percentage (e.g., 0.20 for 20%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.20" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="globalLowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Global Low Stock Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save General Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default GeneralSettings;