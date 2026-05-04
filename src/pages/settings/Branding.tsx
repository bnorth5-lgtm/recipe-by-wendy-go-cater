"use client";

import React, { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useBrand } from "@/context/BrandContext";
import { Palette, Type, Image as ImageIcon, Building, Phone, Mail } from "lucide-react";

// Define the schema for branding settings form
const brandingSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  primaryColor: z.string().min(1, "Primary color is required (Hex format)"),
  contactPhone: z.string().min(1, "Phone number is required"),
  contactEmail: z.string().email("Must be a valid email"),
});

type BrandingSettingsFormData = z.infer<typeof brandingSettingsSchema>;

const BrandingSettings = () => {
  const { brand, updateBrand } = useBrand();

  const form = useForm<BrandingSettingsFormData>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      companyName: brand.companyName,
      logoUrl: brand.logoUrl || "",
      primaryColor: brand.primaryColor,
      contactPhone: brand.contactPhone,
      contactEmail: brand.contactEmail,
    },
  });

  // Reset form values when store values change
  useEffect(() => {
    form.reset({
      companyName: brand.companyName,
      logoUrl: brand.logoUrl || "",
      primaryColor: brand.primaryColor,
      contactPhone: brand.contactPhone,
      contactEmail: brand.contactEmail,
    });
  }, [brand, form]);

  const onSubmit = (data: BrandingSettingsFormData) => {
    updateBrand({
      companyName: data.companyName,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
    });
    toast.success("Branding settings updated successfully!");
  };

  // Available font options (can be expanded)
  const fontOptions = [
    { label: "Inter (Sans-serif)", value: "Inter, sans-serif" },
    { label: "Playfair Display (Serif)", value: "Playfair Display, serif" },
    { label: "Roboto (Sans-serif)", value: "Roboto, sans-serif" },
    { label: "Open Sans (Sans-serif)", value: "Open Sans, sans-serif" },
    { label: "Lato (Sans-serif)", value: "Lato, sans-serif" },
    { label: "Montserrat (Sans-serif)", value: "Montserrat, sans-serif" },
    { label: "Merriweather (Serif)", value: "Merriweather, serif" },
    { label: "Lora (Serif)", value: "Lora, serif" },
  ];

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">Branding Settings</h1>
        <p className="text-xl text-muted-foreground">
          Customize your application's branding and appearance.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Visual Identity</CardTitle>
            <CardDescription className="text-muted-foreground">
              Define your brand's logo, primary colors, and typography.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 py-3">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" /> Company Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Delicious Catering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Logo URL (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., https://yourdomain.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Current Logo Preview:</p>
                          <img src={field.value} alt="Logo Preview" className="max-h-24 max-w-xs object-contain mt-1 border rounded-md p-1" />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Primary Color (Hex)
                      </FormLabel>
                      <FormControl>
                        <Input type="color" className="h-10 w-24 p-1 cursor-pointer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Contact Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="events@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4">Save Branding Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default BrandingSettings;