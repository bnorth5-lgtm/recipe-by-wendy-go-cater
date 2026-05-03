import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Trash2, Users, Wine, Utensils, Flower2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ExecutionProgress } from "../ExecutionProgress";
import { ProcurementHUD } from "../ProcurementHUD";
import { cn } from "@/lib/utils";

export type ElementType = "table_round" | "table_rect" | "bar" | "buffet" | "cake" | "stage" | "pipe_drape" | "floral_arch";

export interface MapElementData {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  guests: number;
  // Inventory & Atmosphere
  linen?: string;
  napkin?: string;
  glassware?: string;
  centerpieceStyle?: string;
  floralType?: string;
  vendorAssigned: boolean;
  selfPerform: boolean;
}

const ELEMENT_CONFIG: Record<ElementType, { label: string; icon: React.ElementType; width: number; height: number; shape: "circle" | "rect" | "line", color: string }> = {
  table_round: { label: "60\" Round Table", icon: Users, width: 80, height: 80, shape: "circle", color: "bg-slate-800" },
  table_rect: { label: "8ft Rect Table", icon: Users, width: 120, height: 40, shape: "rect", color: "bg-slate-800" },
  bar: { label: "Bar Station", icon: Wine, width: 100, height: 40, shape: "rect", color: "bg-indigo-900/80" },
  buffet: { label: "Buffet Station", icon: Utensils, width: 160, height: 50, shape: "rect", color: "bg-emerald-900/80" },
  cake: { label: "Cake Table", icon: Utensils, width: 50, height: 50, shape: "circle", color: "bg-pink-900/80" },
  stage: { label: "Stage", icon: Users, width: 200, height: 80, shape: "rect", color: "bg-amber-900/50" },
  pipe_drape: { label: "Pipe & Drape", icon: GripHorizontal, width: 150, height: 10, shape: "line", color: "bg-slate-600" },
  floral_arch: { label: "Floral Arch", icon: Flower2, width: 80, height: 20, shape: "line", color: "bg-emerald-700" },
};

export const VenueArchitect = () => {
  const [elements, setElements] = useState<MapElementData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddElement = (type: ElementType) => {
    const newElement: MapElementData = {
      id: crypto.randomUUID(),
      type,
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      rotation: 0,
      guests: type.startsWith("table") ? 8 : 0,
      vendorAssigned: false,
      selfPerform: false,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<MapElementData>) => {
    setElements(elements.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  const handleApplyStyleToAll = () => {
    if (!selectedElement || !selectedElement.type.startsWith("table")) return;
    
    const updates = {
      linen: selectedElement.linen,
      napkin: selectedElement.napkin,
      glassware: selectedElement.glassware,
      centerpieceStyle: selectedElement.centerpieceStyle,
      floralType: selectedElement.floralType,
      vendorAssigned: selectedElement.vendorAssigned,
      selfPerform: selectedElement.selfPerform,
    };

    setElements(elements.map(e => 
      e.type.startsWith("table") ? { ...e, ...updates } : e
    ));
  };

  const progressPercentage = useMemo(() => {
    if (elements.length === 0) return 0;
    const completed = elements.filter(e => {
      if (e.type.startsWith("table")) {
        return e.linen && e.napkin && e.glassware && e.centerpieceStyle && e.vendorAssigned;
      }
      return e.vendorAssigned; // Stations just need a vendor for now
    }).length;
    return (completed / elements.length) * 100;
  }, [elements]);

  const totalGuests = elements.reduce((sum, e) => sum + (e.guests || 0), 0);
  const requiredStaff = Math.ceil(totalGuests / 15);

  // Simulated Profit Shield Calculation
  const simulatedRevenue = totalGuests * 125; // $125 per head average
  const simulatedLabor = requiredStaff * 25 * 6; // 6 hours
  const simulatedLogistics = 150;
  
  // Calculate inventory cost, respecting selfPerform
  const simulatedInventoryCost = elements.reduce((sum, e) => {
    if (e.selfPerform) return sum;
    if (e.type.startsWith("table")) return sum + 45; // $45 per table rentals
    if (e.type === "floral_arch") return sum + 450;
    if (e.type === "pipe_drape") return sum + 200;
    return sum + 50; // generic station cost
  }, 0);

  const totalCost = simulatedLabor + simulatedLogistics + simulatedInventoryCost;
  const margin = simulatedRevenue > 0 ? (simulatedRevenue - totalCost) / simulatedRevenue : 0;
  const isHealthyMargin = margin >= 0.70;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50 min-h-screen">
      <ExecutionProgress percentage={progressPercentage} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10">
          <div className={cn(
            "p-4 rounded-xl border-2 transition-colors",
            isHealthyMargin ? "bg-emerald-900/20 border-[#fbbf24] shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          )}>
            <h4 className="font-serif text-white mb-1">Profit Shield</h4>
            <div className="text-2xl font-bold mb-1 flex items-center gap-2">
              <span className={isHealthyMargin ? "text-[#fbbf24]" : "text-amber-500"}>
                {(margin * 100).toFixed(1)}%
              </span>
              {!isHealthyMargin && <span className="text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Warning</span>}
            </div>
            <p className="text-xs text-slate-400">Target: 70.0%</p>
          </div>

          <h3 className="font-serif text-xl text-[#fbbf24] font-bold mt-2">Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((type) => {
              const config = ELEMENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-20 gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all"
                  onClick={() => handleAddElement(type)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] text-center leading-tight whitespace-normal">{config.label}</span>
                </Button>
              );
            })}
          </div>
          
          <Separator className="bg-slate-800 my-2" />
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-serif text-[#fbbf24] mb-2">Staffing Overview</h4>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Total Guests:</span>
              <span className="font-bold">{totalGuests}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Req. Staff (1:15):</span>
              <span className="font-bold text-amber-400">{requiredStaff}</span>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden" ref={containerRef} onClick={() => setSelectedId(null)}>
          {/* Grid Background */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          {/* Staffing Dots (Service Entry) */}
          {requiredStaff > 0 && (
            <div className="absolute bottom-8 left-8 bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 backdrop-blur-sm">
              <p className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">Service Entry (Staff)</p>
              <div className="flex flex-wrap gap-2 max-w-[200px]">
                {Array.from({ length: requiredStaff }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" title="Staff Member" />
                ))}
              </div>
            </div>
          )}

          {/* Render Elements */}
          {elements.map((el) => {
            const config = ELEMENT_CONFIG[el.type];
            const isSelected = el.id === selectedId;
            
            return (
              <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                dragConstraints={containerRef}
                onDragEnd={(e, info) => {
                  updateElement(el.id, { x: el.x + info.offset.x, y: el.y + info.offset.y });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                className="absolute cursor-move origin-center"
                style={{
                  x: el.x,
                  y: el.y,
                  rotate: el.rotation,
                  width: config.width,
                  height: config.height,
                  zIndex: isSelected ? 50 : 10,
                }}
                initial={false}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  boxShadow: isSelected ? "0 0 0 2px #fbbf24, 0 0 20px rgba(234,179,8,0.4)" : "none",
                }}
              >
                <div className={cn(
                  "w-full h-full flex items-center justify-center border-2 border-slate-600 transition-colors",
                  config.color,
                  config.shape === "circle" ? "rounded-full" : "rounded-md",
                  isSelected && "border-[#fbbf24]"
                )}>
                  <span className="text-xs font-bold text-white/70">{config.label.split(" ")[0]}</span>
                </div>

                {/* Guest Dots */}
                {el.guests > 0 && (
                  <div className="absolute inset-[-15px] pointer-events-none">
                    {Array.from({ length: el.guests }).map((_, i) => {
                      const angle = (i / el.guests) * Math.PI * 2;
                      const radius = config.shape === "circle" ? config.width / 2 + 10 : config.width / 2 + 10; // Simplified for rect
                      const dotX = config.width / 2 + Math.cos(angle) * radius - 4;
                      const dotY = config.height / 2 + Math.sin(angle) * radius - 4;
                      return (
                        <div 
                          key={i} 
                          className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"
                          style={{ left: dotX, top: dotY }}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right Sidebar (Details) */}
        {selectedElement && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto z-10 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-2xl text-white font-bold">Properties</h3>
              <Button variant="ghost" size="icon" onClick={() => updateElement(selectedElement.id, { rotation: selectedElement.rotation + 45 })}>
                <span className="text-xs">Rotate</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              {selectedElement.type.startsWith("table") && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Guests at Table</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      max={12} 
                      value={selectedElement.guests}
                      onChange={(e) => updateElement(selectedElement.id, { guests: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <Separator className="bg-slate-800" />
                  <h4 className="font-serif text-[#fbbf24] text-lg">Inventory Selection</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Linens</Label>
                    <Select value={selectedElement.linen} onValueChange={(v) => updateElement(selectedElement.id, { linen: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Linen" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="white_cotton">White Cotton</SelectItem>
                        <SelectItem value="ivory_damask">Ivory Damask</SelectItem>
                        <SelectItem value="black_polyester">Black Polyester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Napkins</Label>
                    <Select value={selectedElement.napkin} onValueChange={(v) => updateElement(selectedElement.id, { napkin: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Napkin" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="gold">Gold Accent</SelectItem>
                        <SelectItem value="navy">Navy Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Glassware</Label>
                    <Select value={selectedElement.glassware} onValueChange={(v) => updateElement(selectedElement.id, { glassware: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Glassware" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="standard">Standard Water/Wine</SelectItem>
                        <SelectItem value="crystal">Crystal Stemware</SelectItem>
                        <SelectItem value="gold_rim">Gold-Rimmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-800" />
                  <h4 className="font-serif text-[#fbbf24] text-lg">Atmosphere</h4>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Centerpiece Style</Label>
                    <Select value={selectedElement.centerpieceStyle} onValueChange={(v) => updateElement(selectedElement.id, { centerpieceStyle: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Style" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="low_lush">Low & Lush</SelectItem>
                        <SelectItem value="tall_elegant">Tall & Elegant</SelectItem>
                        <SelectItem value="candles_only">Candles Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Floral Type</Label>
                    <Input 
                      placeholder="e.g., White Roses & Eucalyptus"
                      value={selectedElement.floralType || ""}
                      onChange={(e) => updateElement(selectedElement.id, { floralType: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label className="text-slate-300">Self-Perform (In-House Override)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={selectedElement.selfPerform} 
                        onCheckedChange={(checked) => updateElement(selectedElement.id, { selfPerform: checked })}
                      />
                      <span className="text-xs text-slate-400">If ON, cost is $0 (increases profit margin)</span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2 pt-4">
                <Label className="text-slate-300">Vendor Assigned?</Label>
                <Select value={selectedElement.vendorAssigned ? "yes" : "no"} onValueChange={(v) => updateElement(selectedElement.id, { vendorAssigned: v === "yes" })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="no">Pending</SelectItem>
                    <SelectItem value="yes">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ProcurementHUD elementType={selectedElement.type} />

              <div className="pt-6 space-y-3">
                {selectedElement.type.startsWith("table") && (
                  <Button 
                    onClick={handleApplyStyleToAll}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Apply Style to All Tables
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setElements(elements.filter(e => e.id !== selectedElement.id));
                    setSelectedId(null);
                  }}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Element
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};