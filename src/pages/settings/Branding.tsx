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
import { useCateringStore } from "@/store/cateringStore";
import { Palette, Type, Image as ImageIcon } from "lucide-react";

// Define the schema for branding settings form
const brandingSettingsSchema = z.object({
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  primaryColor: z.string().min(1, "Primary color is required (HSL format)"),
  secondaryColor: z.string().min(1, "Secondary color is required (HSL format)"),
  fontFamilyPrimary: z.string().min(1, "Primary font family is required"),
  fontFamilySecondary: z.string().min(1, "Secondary font family is required"),
});

type BrandingSettingsFormData = z.infer<typeof brandingSettingsSchema>;

const BrandingSettings = () => {
  const {
    logoUrl,
    primaryColor,
    secondaryColor,
    fontFamilyPrimary,
    fontFamilySecondary,
    setLogoUrl,
    setPrimaryColor,
    setSecondaryColor,
    setFontFamilyPrimary,
    setFontFamilySecondary,
  } = useCateringStore();

  const form = useForm<BrandingSettingsFormData>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      logoUrl: logoUrl,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      fontFamilyPrimary: fontFamilyPrimary,
      fontFamilySecondary: fontFamilySecondary,
    },
  });

  // Reset form values when store values change
  useEffect(() => {
    form.reset({
      logoUrl: logoUrl,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      fontFamilyPrimary: fontFamilyPrimary,
      fontFamilySecondary: fontFamilySecondary,
    });
  }, [logoUrl, primaryColor, secondaryColor, fontFamilyPrimary, fontFamilySecondary, form]);

  const onSubmit = (data: BrandingSettingsFormData) => {
    setLogoUrl(data.logoUrl || "");
    setPrimaryColor(data.primaryColor);
    setSecondaryColor(data.secondaryColor);
    setFontFamilyPrimary(data.fontFamilyPrimary);
    setFontFamilySecondary(data.fontFamilySecondary);
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
                        <Palette className="h-4 w-4" /> Primary Color (HSL)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10 70% 50%" {...field} />
                      </FormControl>
                      <FormMessage />
                      <div className="h-6 w-full rounded-md border mt-2" style={{ backgroundColor: `hsl(${field.value})` }}></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Secondary Color (HSL)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 20 40% 96.1%" {...field} />
                      </FormControl>
                      <FormMessage />
                      <div className="h-6 w-full rounded-md border mt-2" style={{ backgroundColor: `hsl(${field.value})` }}></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fontFamilyPrimary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4" /> Primary Font Family
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a primary font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: field.value }}>
                        Preview: The quick brown fox jumps over the lazy dog.
                      </p>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fontFamilySecondary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4" /> Secondary Font Family
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a secondary font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: field.value }}>
                        Preview: The quick brown fox jumps over the lazy dog.
                      </p>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save Branding Settings</Button>
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