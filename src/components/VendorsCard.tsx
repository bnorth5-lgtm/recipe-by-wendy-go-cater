"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, Utensils, Shirt, MapPin, Phone, Clock, ExternalLink, Building2 } from "lucide-react"; // Added Building2 for rentals
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components

// Define a type for a generic vendor item
interface Vendor {
  id: string;
  name: string;
  type: "Food & Beverage" | "Linen Service" | "Restaurant Equipment"; // Original types
  category: "Food Vendors" | "Linen Vendors" | "Catering Rentals"; // New categories for display
  address: string;
  phone?: string;
  hours?: string;
  wazeLink?: string;
  iosMapsLink?: string;
}

export const VendorsCard: React.FC = () => {
  // Placeholder data for vendors. Categorized for the new structure.
  const placeholderVendors: Vendor[] = [
    {
      id: "v1",
      name: "Local Food Supply Co.",
      type: "Food & Beverage",
      category: "Food Vendors",
      address: "123 Main St, Anytown, NH 03860",
      phone: "(603) 555-1234",
      hours: "Mon-Fri: 8 AM - 5 PM",
      wazeLink: "https://waze.com/ul?q=123%20Main%20St,%20Anytown,%20NH%2003860",
      iosMapsLink: "maps://?q=123%20Main%20St,%20Anytown,%20NH%2003860",
    },
    {
      id: "v4",
      name: "Maine Produce Market",
      type: "Food & Beverage",
      category: "Food Vendors",
      address: "101 Farm Ln, Bridgton, ME 04009",
      phone: "(207) 555-3456",
      hours: "Daily: 7 AM - 7 PM",
      wazeLink: "https://waze.com/ul?q=101%20Farm%20Ln,%20Bridgton,%20ME%04009",
      iosMapsLink: "maps://?q=101%20Farm%20Ln,%20Bridgton,%20ME%04009",
    },
    {
      id: "v6",
      name: "Gourmet Meats & Seafood",
      type: "Food & Beverage",
      category: "Food Vendors",
      address: "200 Ocean Dr, Coastal City, NH 03801",
      phone: "(603) 555-1122",
      hours: "Tue-Sat: 9 AM - 6 PM",
      wazeLink: "https://waze.com/ul?q=200%20Ocean%20Dr,%20Coastal%20City,%20NH%2003801",
      iosMapsLink: "maps://?q=200%20Ocean%20Dr,%20Coastal%20City,%20NH%2003801",
    },
    {
      id: "v3",
      name: "Seacoast Linen Services",
      type: "Linen Service",
      category: "Linen Vendors",
      address: "789 Beach Rd, Coastal City, NH 03801",
      phone: "(603) 555-9012",
      hours: "Mon-Fri: 7 AM - 4 PM",
      wazeLink: "https://waze.com/ul?q=789%20Beach%20Rd,%20Coastal%20City,%20NH%2003801",
      iosMapsLink: "maps://?q=789%20Beach%20Rd,%20Coastal%20City,%20NH%2003801",
    },
    {
      id: "v7",
      name: "Elegant Linens & More",
      type: "Linen Service",
      category: "Linen Vendors",
      address: "300 Fabric Way, Textile Town, ME 04001",
      phone: "(207) 555-3344",
      hours: "Mon-Fri: 8 AM - 5 PM",
      wazeLink: "https://waze.com/ul?q=300%20Fabric%20Way,%20Textile%20Town,%20ME%2004001",
      iosMapsLink: "maps://?q=300%20Fabric%20Way,%20Textile%20Town,%20ME%04001",
    },
    {
      id: "v2",
      name: "Harrison Restaurant Gear",
      type: "Restaurant Equipment",
      category: "Catering Rentals",
      address: "456 Oak Ave, Harrison, ME 04040",
      phone: "(207) 555-5678",
      hours: "Mon-Sat: 9 AM - 6 PM",
      wazeLink: "https://waze.com/ul?q=456%20Oak%20Ave,%20Harrison,%20ME%2004040",
      iosMapsLink: "maps://?q=456%20Oak%20Ave,%20Harrison,%20ME%04040",
    },
    {
      id: "v5",
      name: "Kitchen King Supplies",
      type: "Restaurant Equipment",
      category: "Catering Rentals",
      address: "22 Industrial Way, Portland, ME 04101",
      phone: "(207) 555-7890",
      hours: "Mon-Fri: 8:30 AM - 5:30 PM",
      wazeLink: "https://waze.com/ul?q=22%20Industrial%20Way,%20Portland,%20ME%2004101",
      iosMapsLink: "maps://?q=22%20Industrial%20Way,%20Portland,%20ME%2004101",
    },
    {
      id: "v8",
      name: "Event Essentials Rentals",
      type: "Restaurant Equipment",
      category: "Catering Rentals",
      address: "500 Party Blvd, Event City, NH 03801",
      phone: "(603) 555-6677",
      hours: "Mon-Sat: 9 AM - 7 PM",
      wazeLink: "https://waze.com/ul?q=500%20Party%20Blvd,%20Event%20City,%20NH%2003801",
      iosMapsLink: "maps://?q=500%20Party%20Blvd,%20Event%20City,%20NH%2003801",
    },
  ];

  const getIconForVendorCategory = (category: Vendor["category"]) => {
    switch (category) {
      case "Food Vendors":
        return <Utensils className="h-4 w-4 text-muted-foreground" />;
      case "Linen Vendors":
        return <Shirt className="h-4 w-4 text-muted-foreground" />;
      case "Catering Rentals":
        return <Building2 className="h-4 w-4 text-muted-foreground" />; // Using Building2 for rentals
      default:
        return <Store className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderVendorList = (vendors: Vendor[]) => (
    <div className="space-y-2">
      {vendors.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No vendors in this category.</p>
      ) : (
        vendors.map((vendor) => (
          <div key={vendor.id} className="border p-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{vendor.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 ml-0"> {/* Removed ml-6 */}
              <MapPin className="h-3 w-3" /> {vendor.address}
            </p>
            {vendor.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 ml-0"> {/* Removed ml-6 */}
                <Phone className="h-3 w-3" /> {vendor.phone}
              </p>
            )}
            {vendor.hours && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 ml-0"> {/* Removed ml-6 */}
                <Clock className="h-3 w-3" /> {vendor.hours}
              </p>
            )}
            <div className="flex gap-2 mt-2 ml-0"> {/* Removed ml-6 */}
              {vendor.wazeLink && (
                <a href={vendor.wazeLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Waze
                </a>
              )}
              {vendor.iosMapsLink && (
                <a href={vendor.iosMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> iOS Maps
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const foodVendors = placeholderVendors.filter(v => v.category === "Food Vendors");
  const linenVendors = placeholderVendors.filter(v => v.category === "Linen Vendors");
  const cateringRentals = placeholderVendors.filter(v => v.category === "Catering Rentals");

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-2xl font-semibold text-primary">
          Vendor Directory
        </CardTitle>
        <Store className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <CardDescription className="text-muted-foreground mb-3">
          Browse and manage your essential catering partners.
        </CardDescription>
        <ScrollArea className="flex-1 pr-4">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="food-vendors">
              <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                {getIconForVendorCategory("Food Vendors")} Food Vendors
              </AccordionTrigger>
              <AccordionContent>
                {renderVendorList(foodVendors)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="linen-vendors">
              <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                {getIconForVendorCategory("Linen Vendors")} Linen Vendors
              </AccordionTrigger>
              <AccordionContent>
                {renderVendorList(linenVendors)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="catering-rentals">
              <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                {getIconForVendorCategory("Catering Rentals")} Catering Rentals
              </AccordionTrigger>
              <AccordionContent>
                {renderVendorList(cateringRentals)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          To get real-time vendor data, you would need to integrate with a mapping/business API (e.g., Google Places API) and potentially a backend service to handle secure API key management and geospatial queries.
        </p>
      </CardContent>
    </Card>
  );
};