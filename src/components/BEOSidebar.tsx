import React, { useState } from "react";
import { useEventContext } from "@/context/EventContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Truck, Users, Package, DollarSign, Printer, ChefHat, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateProposalPDF } from "@/logic/PDFGenerator";
import { useBrand } from "@/context/BrandContext";
import { MapElementData } from "./VenueMap/VenueArchitect";

export const BEOSidebar = ({ elements = [] }: { elements?: MapElementData[] }) => {
  const { eventState } = useEventContext();
  const { brand } = useBrand();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Layout Dynamic Calculations
  const tablesCount = elements.filter((e) => e.type === "table_round_60").length;
  
  // Culinary Logic: Every 60_round table adds $1,500
  const layoutFoodCost = tablesCount * 1500;
  
  // Labor Logic: 1 staff member per 2 tables ($300 per staff)
  const layoutStaffCount = Math.ceil(tablesCount / 2);
  const layoutLaborCost = layoutStaffCount * 300;

  // Use context defaults if no elements, else use layout calculations
  const dynamicGuests = tablesCount > 0 ? elements.reduce((sum, el) => sum + (el.guests || 0), 0) : eventState.totalGuests;
  const dynamicStaffCount = tablesCount > 0 ? layoutStaffCount : eventState.staffCount;
  const laborCost = tablesCount > 0 ? layoutLaborCost : (eventState.staffCount * eventState.hourlyRate * eventState.estimatedHours);
  const foodCost = tablesCount > 0 ? layoutFoodCost : (eventState.menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * eventState.totalGuests);
  
  // Logistics Cost (includes Remote Site Surcharge if > 30 miles)
  const baseLogistics = eventState.mileage * 2 * 0.725; // Round trip mileage
  const remoteSurcharge = eventState.mileage > 30 ? 250 : 0;
  const logisticsCost = baseLogistics + remoteSurcharge;
  
  const atmosphereCost = eventState.inventoryCosts;
  
  // Culinary Cost (Food + Labor)
  const culinaryCost = foodCost + laborCost;
  
  // Total Cost calculation
  const totalCost = culinaryCost + atmosphereCost + logisticsCost;

  // Simulated Revenue dynamically scales to maintain a healthy margin (or defaults to $125/head if no map layout)
  const targetMargin = eventState.margin_goal ? (eventState.margin_goal / 100) : 0.70;
  const estimatedRevenue = tablesCount > 0 ? (totalCost / (1 - targetMargin)) : (dynamicGuests * 125);
  
  const margin = estimatedRevenue > 0 ? (estimatedRevenue - totalCost) / estimatedRevenue : 0;
  const isHealthyMargin = margin >= 0.70;

  // Margin Breakdown
  const foodCostPercent = estimatedRevenue > 0 ? (foodCost / estimatedRevenue) * 100 : 0;
  const laborCostPercent = estimatedRevenue > 0 ? (laborCost / estimatedRevenue) * 100 : 0;
  const overheadPercent = estimatedRevenue > 0 ? ((atmosphereCost + logisticsCost) / estimatedRevenue) * 100 : 0;

  // Specialty Stations
  const interactiveItems = eventState.menuItems.filter(item => item.isInteractive);

  const handlePrintPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Pass the ID of the map container and brand state
      await generateProposalPDF(eventState, "venue-map-canvas", brand);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-2xl h-full">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h3 className="font-serif text-xl text-white font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#fbbf24]" />
          Live BEO
        </h3>
        
        {/* Live Sync Indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Sync</span>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {/* Event Title */}
        <div className="text-center py-2">
          <h2 className="text-2xl font-bold text-[#fbbf24] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {eventState.eventName}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Sales Proposal</p>
        </div>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Guests</span>
            </div>
            <p className="text-lg font-bold text-white">{dynamicGuests}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs uppercase tracking-wider">Staff</span>
            </div>
            <p className="text-lg font-bold text-white">{dynamicStaffCount}</p>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Cost Breakdown Buckets */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Investment Breakdown</h4>
          
          {/* Culinary Bucket */}
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-[#fbbf24]">
                <ChefHat className="w-4 h-4" />
                <span className="font-serif font-semibold">Culinary</span>
              </div>
              <span className="font-bold text-white">${culinaryCost.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-400 pl-6 space-y-1">
              <div className="flex justify-between"><span>Food & Beverage</span><span>${foodCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Service Labor</span><span>${laborCost.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Atmosphere Bucket */}
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-[#fbbf24]">
                <Sparkles className="w-4 h-4" />
                <span className="font-serif font-semibold">Atmosphere</span>
              </div>
              <span className="font-bold text-white">${atmosphereCost.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-400 pl-6">
              <div className="flex justify-between"><span>Rentals & Design</span><span>${atmosphereCost.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Logistics Bucket */}
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-[#fbbf24]">
                <Truck className="w-4 h-4" />
                <span className="font-serif font-semibold">Logistics</span>
              </div>
              <span className="font-bold text-white">${logisticsCost.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-400 pl-6">
              <div className="flex justify-between"><span>Transport & Setup</span><span>${logisticsCost.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* Specialty Stations */}
        {interactiveItems.length > 0 && (
          <>
            <Separator className="bg-slate-800" />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Specialty Stations</h4>
              <div className="space-y-2">
                {interactiveItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-amber-950/20 border border-amber-900/30 p-2 rounded-md">
                    <span className="text-sm text-amber-100 flex items-center gap-2">
                      <span>🎭</span> {item.name}
                    </span>
                    <span className="text-xs text-amber-500/70 uppercase font-bold">Interactive</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="bg-slate-800" />

        {/* Totals & Margin */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Investment</span>
            <span className="font-bold text-white">${totalCost.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Est. Revenue</span>
            <span className="font-bold text-emerald-400">${estimatedRevenue.toFixed(2)}</span>
          </div>

          <div className="relative group">
            <div className={cn(
              "p-3 rounded-lg border-2 mt-4 transition-colors cursor-help",
              isHealthyMargin 
                ? "bg-emerald-900/20 border-[#fbbf24] shadow-[0_0_15px_rgba(234,179,8,0.15)]" 
                : "bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            )}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-serif text-white text-sm">Profit Shield</h4>
                {!isHealthyMargin && <span className="text-[9px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Warning</span>}
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span className={isHealthyMargin ? "text-[#fbbf24]" : "text-amber-500"}>
                  {(margin * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Target Margin: 70.0%</p>
            </div>

            {/* Margin Breakdown Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 text-xs space-y-1.5">
                <p className="font-bold text-white mb-2 border-b border-slate-700 pb-1">Margin Breakdown</p>
                <div className="flex justify-between"><span className="text-slate-300">Food Cost:</span><span className="text-amber-400 font-medium">{foodCostPercent.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Labor Cost:</span><span className="text-amber-400 font-medium">{laborCostPercent.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Overhead/Logistics:</span><span className="text-amber-400 font-medium">{overheadPercent.toFixed(1)}%</span></div>
                <div className="flex justify-between mt-1 pt-1 border-t border-slate-700"><span className="text-white font-bold">Net Margin:</span><span className="text-emerald-400 font-bold">{(margin * 100).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="pt-4 mt-auto">
        <Button 
          onClick={handlePrintPDF}
          disabled={isGeneratingPDF}
          className="w-full bg-[#fbbf24] text-slate-900 hover:bg-[#fbbf24]/90 font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)] gap-2"
        >
          {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          {isGeneratingPDF ? "Generating PDF..." : "Print to PDF"}
        </Button>
      </div>
    </div>
  );
};
