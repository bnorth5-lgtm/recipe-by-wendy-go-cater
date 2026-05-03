import React, { useState } from "react";
import { Star, MapPin, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Vendor {
  id: string;
  name: string;
  price: number;
  distance: number;
  isStarred: boolean;
}

interface ProcurementHUDProps {
  elementType: string | null;
}

// Simulated database of local vendors
const VENDOR_DB: Record<string, Vendor[]> = {
  floral_arch: [
    { id: "v1", name: "Stonington Blooms", price: 450, distance: 12, isStarred: true },
    { id: "v2", name: "Coastal Florals", price: 380, distance: 28, isStarred: false },
    { id: "v3", name: "New England Arches", price: 520, distance: 8, isStarred: false },
  ],
  pipe_drape: [
    { id: "v4", name: "Event Drape Co.", price: 200, distance: 15, isStarred: false },
    { id: "v5", name: "Luxe Linens & Drape", price: 250, distance: 5, isStarred: true },
  ],
  table_round: [
    { id: "v6", name: "Party Rentals Plus", price: 18, distance: 10, isStarred: true },
    { id: "v7", name: "Discount Tables", price: 12, distance: 45, isStarred: false },
  ],
  table_rect: [
    { id: "v6", name: "Party Rentals Plus", price: 15, distance: 10, isStarred: true },
    { id: "v7", name: "Discount Tables", price: 10, distance: 45, isStarred: false },
  ]
};

export const ProcurementHUD: React.FC<ProcurementHUDProps> = ({ elementType }) => {
  const [starredVendors, setStarredVendors] = useState<Set<string>>(new Set(["v1", "v5", "v6"]));

  if (!elementType) {
    return (
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500 text-sm">
        Select an element on the map to view Market Benchmarks.
      </div>
    );
  }

  // Find vendors for this element type, default to empty if none specific
  const baseVendors = VENDOR_DB[elementType] || [
    { id: "v_gen1", name: "General Event Supply", price: 150, distance: 20, isStarred: false },
    { id: "v_gen2", name: "Premium Rentals", price: 220, distance: 15, isStarred: true }
  ];

  // Apply current starred state and sort (Starred first, then by price)
  const vendors = baseVendors.map(v => ({
    ...v,
    isStarred: starredVendors.has(v.id)
  })).sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return a.price - b.price;
  });

  const toggleStar = (id: string) => {
    const newStarred = new Set(starredVendors);
    if (newStarred.has(id)) {
      newStarred.delete(id);
    } else {
      newStarred.add(id);
    }
    setStarredVendors(newStarred);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#fbbf24]" />
        <h4 className="font-serif text-[#fbbf24] font-semibold text-sm">Market Benchmarks</h4>
      </div>
      
      <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto">
        {vendors.map(vendor => (
          <div 
            key={vendor.id} 
            className={cn(
              "p-3 rounded-lg border transition-all",
              vendor.isStarred 
                ? "bg-amber-900/10 border-amber-500/30" 
                : "bg-slate-950 border-slate-800"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-200">{vendor.name}</span>
                  {vendor.isStarred && <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 border-amber-500/50 text-amber-400">Preferred</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {vendor.distance} mi</span>
                  {vendor.distance > 25 && <span className="flex items-center gap-1 text-amber-500/70"><Truck className="w-3 h-3" /> Delivery Fee</span>}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={() => toggleStar(vendor.id)}
              >
                <Star className={cn("w-4 h-4", vendor.isStarred ? "fill-amber-400 text-amber-400" : "text-slate-600")} />
              </Button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-400">Est. Price</span>
              <span className="font-bold text-emerald-400">${vendor.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component since we don't import Badge directly here to keep it simple
function Badge({ children, className, variant }: any) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>{children}</span>;
}
