"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, Utensils, Shirt, MapPin, Phone, Clock, ExternalLink } from "lucide-react";

// Define a type for a generic vendor item (placeholder structure)
interface Vendor {
  id: string;
  name: string;
  type: "Food & Beverage" | "Restaurant Equipment" | "Linen Service";
  address: string;
  phone?: string;
  hours?: string;
  wazeLink?: string;
  iosMapsLink?: string;
}

export const VendorsCard: React.FC = () => {
  // Placeholder data for vendors. In a real application, this would come from an API.
  const placeholderVendors: Vendor[] = [
    {
      id: "v1",
      name: "Local Food Supply Co.",
      type: "Food & Beverage",
      address: "123 Main St, Anytown, NH 03860",
      phone: "(603) 555-1234",
      hours: "Mon-Fri: 8 AM - 5 PM",
      wazeLink: "https://waze.com/ul?q=123%20Main%20St,%20Anytown,%20NH%2003860",
      iosMapsLink: "maps://?q=123%20Main%20St,%20Anytown,%20NH%2003860",
    },
    {
      id: "v2",
      name: "Harrison Restaurant Gear",
      type: "Restaurant Equipment",
      address: "456 Oak Ave, Harrison, ME 04040",
      phone: "(207) 555-5678",
      hours: "Mon-Sat: 9 AM - 6 PM",
      wazeLink: "https://waze.com/ul?q=456%20Oak%20Ave,%20Harrison,%20ME%2004040",
      iosMapsLink: "maps://?q=456%20Oak%20Ave,%20Harrison,%20ME%2004040",
    },
    {
      id: "v3",
      name: "Seacoast Linen Services",
      type: "Linen Service",
      address: "789 Beach Rd, Coastal City, NH 03801",
      phone: "(603) 555-9012",
      hours: "Mon-Fri: 7 AM - 4 PM",
      wazeLink: "https://waze.com/ul?q=789%20Beach%20Rd,%20Coastal%20City,%20NH%2003801",
      iosMapsLink: "maps://?q=789%20Beach%20Rd,%20Coastal%20City,%20NH%2003801",
    },
    {
      id: "v4",
      name: "Maine Produce Market",
      type: "Food & Beverage",
      address: "101 Farm Ln, Bridgton, ME 04009",
      phone: "(207) 555-3456",
      hours: "Daily: 7 AM - 7 PM",
      wazeLink: "https://waze.com/ul?q=101%20Farm%20Ln,%20Bridgton,%20ME%04009",
      iosMapsLink: "maps://?q=101%20Farm%20Ln,%20Bridgton,%20ME%04009",
    },
    {
      id: "v5",
      name: "Kitchen King Supplies",
      type: "Restaurant Equipment",
      address: "22 Industrial Way, Portland, ME 04101",
      phone: "(207) 555-7890",
      hours: "Mon-Fri: 8:30 AM - 5:30 PM",
      wazeLink: "https://waze.com/ul?q=22%20Industrial%20Way,%20Portland,%20ME%2004101",
      iosMapsLink: "maps://?q=22%20Industrial%20Way,%20Portland,%20ME%2004101",
    },
  ];

  const getIconForVendorType = (type: Vendor["type"]) => {
    switch (type) {
      case "Food & Beverage":
        return <Utensils className="h-4 w-4 text-muted-foreground" />;
      case "Restaurant Equipment":
        return <Store className="h-4 w-4 text-muted-foreground" />;
      case "Linen Service":
        return <Shirt className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Store className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium">
          Vendors
        </CardTitle>
        <Store className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <CardDescription className="text-xs text-muted-foreground mb-3">
          Food, Equipment, and Linen Services in your area.
        </CardDescription>
        <ScrollArea className="h-[200px] flex-1 pr-4">
          <div className="space-y-2">
            {placeholderVendors.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No vendors found. This feature requires API integration for real-time data.</p>
            ) : (
              placeholderVendors.map((vendor) => (
                <div key={vendor.id} className="border p-2 rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {getIconForVendorType(vendor.type)}
                    <h4 className="font-semibold text-sm">{vendor.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 ml-6">
                    <MapPin className="h-3 w-3" /> {vendor.address}
                  </p>
                  {vendor.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 ml-6">
                      <Phone className="h-3 w-3" /> {vendor.phone}
                    </p>
                  )}
                  {vendor.hours && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 ml-6">
                      <Clock className="h-3 w-3" /> {vendor.hours}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2 ml-6">
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
        </ScrollArea>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          To get real-time vendor data, you would need to integrate with a mapping/business API (e.g., Google Places API) and potentially a backend service to handle secure API key management and geospatial queries.
        </p>
      </CardContent>
    </Card>
  );
};