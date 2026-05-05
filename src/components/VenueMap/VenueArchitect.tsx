import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Trash2, Users, Wine, Utensils, Flower2, GripHorizontal, Square, Crosshair, Tent, Lightbulb, Flame, Zap, Clock, ListChecks, ChefHat, Send, DoorOpen, Volume2, Droplets, Bath, HardHat, CloudRain, Wind } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ExecutionProgress } from "../ExecutionProgress";
import { ProcurementHUD } from "../ProcurementHUD";
import { BEOSidebar } from "@/components/BEOSidebar";
import { useEventContext } from "@/context/EventContext";
import { useCateringStore } from "@/store/cateringStore";
import { cn } from "@/lib/utils";

export type ElementType = "table_round_60" | "table_rect" | "high_top" | "deuce" | "dance_floor" | "bar" | "buffet" | "cake" | "stage" | "pipe_drape" | "floral_arch" | "tent_40x60" | "string_lights" | "staging_kitchen" | "power_drop" | "exit_sign" | "audio_hub" | "water_access" | "bathroom";

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
  hasSidewalls?: boolean;
  showSafetyRadius?: boolean;
  timeEventName?: string;
  timeEventTime?: number;
  timeEventType?: "general" | "food_service" | "entertainment";
}

// Scale: 20px = 1 foot
const PIXELS_PER_FOOT = 20;

const ELEMENT_CONFIG: Record<ElementType, { label: string; icon: React.ElementType; width: number; height: number; shape: "circle" | "rect" | "line", color: string }> = {
  table_round_60: { label: "60\" Round", icon: Users, width: 100, height: 100, shape: "circle", color: "bg-slate-800" }, // 5ft
  table_rect: { label: "8ft Rect", icon: Users, width: 160, height: 60, shape: "rect", color: "bg-slate-800" }, // 8ft x 3ft
  high_top: { label: "High-Top", icon: Wine, width: 60, height: 60, shape: "circle", color: "bg-slate-700" }, // 3ft
  deuce: { label: "2-Top Deuce", icon: Users, width: 60, height: 60, shape: "rect", color: "bg-slate-700" }, // 3ft x 3ft
  dance_floor: { label: "Dance Tile", icon: Square, width: 80, height: 80, shape: "rect", color: "bg-indigo-950 border-indigo-500/50" }, // 4ft x 4ft
  bar: { label: "Bar Station", icon: Wine, width: 120, height: 40, shape: "rect", color: "bg-indigo-900/80" }, // 6ft x 2ft
  buffet: { label: "Buffet", icon: Utensils, width: 160, height: 60, shape: "rect", color: "bg-emerald-900/80" }, // 8ft x 3ft
  cake: { label: "Cake Table", icon: Utensils, width: 60, height: 60, shape: "circle", color: "bg-pink-900/80" }, // 3ft
  stage: { label: "Stage", icon: Users, width: 240, height: 120, shape: "rect", color: "bg-amber-900/50" }, // 12ft x 6ft
  pipe_drape: { label: "Pipe & Drape", icon: GripHorizontal, width: 160, height: 10, shape: "line", color: "bg-slate-600" }, // 8ft
  floral_arch: { label: "Floral Arch", icon: Flower2, width: 80, height: 20, shape: "line", color: "bg-emerald-700" }, // 4ft
  tent_40x60: { label: "40x60 Tent", icon: Tent, width: 1200, height: 800, shape: "rect", color: "bg-amber-50/5 border-4 border-dashed border-amber-200/30 backdrop-blur-[2px]" },
  string_lights: { label: "String Lights", icon: Lightbulb, width: 400, height: 20, shape: "line", color: "bg-transparent border border-dashed border-amber-500/20" },
  staging_kitchen: { label: "Staging Kitchen", icon: Flame, width: 200, height: 100, shape: "rect", color: "bg-red-950/80 border-red-500/50" },
  power_drop: { label: "Power Drop", icon: Zap, width: 40, height: 40, shape: "circle", color: "bg-yellow-500 text-slate-900 border-yellow-400" },
  audio_hub: { label: "Audio Hub", icon: Volume2, width: 40, height: 40, shape: "circle", color: "bg-blue-500 text-white border-blue-400" },
  water_access: { label: "Water Access", icon: Droplets, width: 40, height: 40, shape: "circle", color: "bg-cyan-500 text-slate-900 border-cyan-400" },
  bathroom: { label: "Bathroom", icon: Bath, width: 120, height: 120, shape: "rect", color: "bg-slate-200 text-slate-800 border-slate-400" },
  exit_sign: { label: "EXIT", icon: DoorOpen, width: 60, height: 30, shape: "rect", color: "bg-red-600 text-white font-bold border-red-400" },
};

export const VenueArchitect = () => {
  const [elements, setElements] = useState<MapElementData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isHoveringMap, setIsHoveringMap] = useState(false);
  const [isOutdoorMode, setIsOutdoorMode] = useState(false);
  const [showInfraOverlay, setShowInfraOverlay] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const [windDirection, setWindDirection] = useState<string>("SE"); // Default blowing SE
  const [globalTime, setGlobalTime] = useState<number>(16); // 16.0 = 4:00 PM, 22.0 = 10:00 PM
  const [rightSidebarTab, setRightSidebarTab] = useState<"properties" | "timeline" | "logistics">("properties");
  const [selectedSignatureDish, setSelectedSignatureDish] = useState<string>("Blueberry Cranberry Bread");
  const containerRef = useRef<HTMLDivElement>(null);
  const crosshairXRef = useRef<HTMLDivElement>(null);
  const crosshairYRef = useRef<HTMLDivElement>(null);
  const crosshairLabelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const formatTime = (decimalTime: number) => {
    const hours = Math.floor(decimalTime);
    const mins = Math.round((decimalTime - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleAddElement = (type: ElementType) => {
    const snap = PIXELS_PER_FOOT;
    const rawX = 100 + Math.random() * 50;
    const rawY = 100 + Math.random() * 50;
    
    const newElement: MapElementData = {
      id: crypto.randomUUID(),
      type,
      x: Math.round(rawX / snap) * snap,
      y: Math.round(rawY / snap) * snap,
      rotation: 0,
      guests: type === "table_round_60" ? 8 : type === "table_rect" ? 8 : type === "deuce" ? 2 : type === "high_top" ? 4 : 0,
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

  // Calculate inventory cost, respecting selfPerform
  const simulatedInventoryCost = elements.reduce((sum, e) => {
    if (e.selfPerform) return sum;
    if (e.type.startsWith("table") || e.type === "high_top" || e.type === "deuce") return sum + 45; // $45 per table rentals
    if (e.type === "floral_arch") return sum + 450;
    if (e.type === "pipe_drape") return sum + 200;
    if (e.type === "dance_floor") return sum + 25; // $25 per tile
    if (e.type === "tent_40x60") return sum + 1500 + (e.hasSidewalls ? 300 : 0);
    if (e.type === "string_lights") return sum + 45;
    if (e.type === "power_drop") return sum + 150;
    if (e.type === "staging_kitchen") return sum + 500;
    return sum + 50; // generic station cost
  }, 0);

  const occupiedSqFt = elements.reduce((sum, el) => {
    const config = ELEMENT_CONFIG[el.type];
    return sum + ((config.width * config.height) / (PIXELS_PER_FOOT * PIXELS_PER_FOOT));
  }, 0);

  const { eventState, updateEventState } = useEventContext();
  const inventory = useCateringStore((state) => state.inventory);
  const updateInventoryItem = useCateringStore((state) => state.updateInventoryItem);
  const addInventoryItem = useCateringStore((state) => state.addInventoryItem);

  // Timeline & Logistics Data
  const timelineEvents = elements.filter(e => e.timeEventTime !== undefined && e.timeEventName).sort((a, b) => a.timeEventTime! - b.timeEventTime!);
  const isSunset = globalTime >= 20.25; // 8:15 PM
  
  const tablesCount = elements.filter(e => e.type.startsWith("table") || e.type === "deuce" || e.type === "high_top").length;
  const tentsCount = elements.filter(e => e.type === "tent_40x60").length;
  const chairsCount = elements.reduce((sum, e) => sum + e.guests, 0);
  const powerDropsCount = elements.filter(e => e.type === "power_drop").length;

  const estimatedLaborServers = Math.floor(tablesCount / 10) + (tablesCount % 10 > 0 ? 1 : 0);
  const eventDurationHours = 6; // 4 PM to 10 PM
  const laborCost = estimatedLaborServers * 25 * eventDurationHours;
  
  const tablesCost = tablesCount * 16.50;
  const chairsCost = chairsCount * 2.50;
  const tentsCost = tentsCount * 1500;
  const powerDropsCost = powerDropsCount * 150;
  const stringLightsCost = elements.filter(e => e.type === "string_lights").length * 45;
  const stagingKitchenCost = elements.filter(e => e.type === "staging_kitchen").length * 500;
  const danceFloorCost = elements.filter(e => e.type === "dance_floor").length * 250;

  const totalEstimatedValue = tablesCost + chairsCost + tentsCost + powerDropsCost + stringLightsCost + stagingKitchenCost + danceFloorCost + laborCost;

  const handleKitchenSync = () => {
    // Ensure the dish is in the event state for the Chef View to read
    const currentItems = eventState.menuItems || [];
    if (!currentItems.find(i => i.name === selectedSignatureDish)) {
      updateEventState({
        menuItems: [...currentItems, { id: crypto.randomUUID(), name: selectedSignatureDish, price: 0, category: 'Culinary' }]
      });
    }
    navigate(`/chef/${eventState.eventId || 'current'}`);
  };

  // Weather Math Helpers
  const getWindAngle = (dir: string) => {
    const map: Record<string, number> = {
      "N": -Math.PI / 2,
      "NE": -Math.PI / 4,
      "E": 0,
      "SE": Math.PI / 4,
      "S": Math.PI / 2,
      "SW": 3 * Math.PI / 4,
      "W": Math.PI,
      "NW": -3 * Math.PI / 4
    };
    return map[dir] || 0;
  };

  const isPointInTriangle = (p: {x:number, y:number}, p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    const A = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    const sign = A < 0 ? -1 : 1;
    const s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    const t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;
    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
  };

  const doLineSegmentsIntersect = (p1: any, p2: any, p3: any, p4: any) => {
    const ccw = (A: any, B: any, C: any) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  };

  const doesLineIntersectRect = (p1: any, p2: any, rect: {left:number, right:number, top:number, bottom:number}) => {
    const tl = {x: rect.left, y: rect.top};
    const tr = {x: rect.right, y: rect.top};
    const bl = {x: rect.left, y: rect.bottom};
    const br = {x: rect.right, y: rect.bottom};
    return doLineSegmentsIntersect(p1, p2, tl, tr) ||
           doLineSegmentsIntersect(p1, p2, tr, br) ||
           doLineSegmentsIntersect(p1, p2, br, bl) ||
           doLineSegmentsIntersect(p1, p2, bl, tl) ||
           (p1.x >= rect.left && p1.x <= rect.right && p1.y >= rect.top && p1.y <= rect.bottom); // point inside
  };

  // Pre-calculate weather effects
  const { smokedElementIds, muddyPathTableIds, smokeTriangle } = useMemo(() => {
    const smoked = new Set<string>();
    const muddy = new Set<string>();
    let triangle: {p1: any, p2: any, p3: any} | null = null;

    const kitchen = elements.find(e => e.type === "staging_kitchen");
    const tents = elements.filter(e => e.type === "tent_40x60");

    if (kitchen) {
      const kX = kitchen.x + ELEMENT_CONFIG.staging_kitchen.width / 2;
      const kY = kitchen.y + ELEMENT_CONFIG.staging_kitchen.height / 2;
      
      // Smoke
      const angle = getWindAngle(windDirection);
      const L = 800; // 40ft plume
      const spread = Math.PI / 6; // 30 deg half-spread
      triangle = {
        p1: { x: kX, y: kY },
        p2: { x: kX + L * Math.cos(angle - spread), y: kY + L * Math.sin(angle - spread) },
        p3: { x: kX + L * Math.cos(angle + spread), y: kY + L * Math.sin(angle + spread) }
      };

      elements.forEach(el => {
        if (el.type.startsWith("table") || el.type === "bar" || el.type === "high_top" || el.type === "deuce") {
          const cX = el.x + ELEMENT_CONFIG[el.type].width / 2;
          const cY = el.y + ELEMENT_CONFIG[el.type].height / 2;
          if (isPointInTriangle({x: cX, y: cY}, triangle.p1, triangle.p2, triangle.p3)) {
            smoked.add(el.id);
          }

          // Muddy Paths
          if (isRaining) {
            let isMuddy = false;
            for (const tent of tents) {
              const rect = {
                left: tent.x - 40,
                right: tent.x + ELEMENT_CONFIG.tent_40x60.width + 40,
                top: tent.y - 40,
                bottom: tent.y + ELEMENT_CONFIG.tent_40x60.height + 40
              };
              if (doesLineIntersectRect({x: kX, y: kY}, {x: cX, y: cY}, rect)) {
                isMuddy = true;
                break;
              }
            }
            if (isMuddy) muddy.add(el.id);
          }
        }
      });
    }
    return { smokedElementIds: smoked, muddyPathTableIds: muddy, smokeTriangle: triangle };
  }, [elements, windDirection, isRaining]);

  // Logistics & Setup Timer Math
  const {
    hubsCount,
    setupMins,
    loadOutMins,
    totalServiceFeet,
    totalLoops,
    serviceMileage,
    avgDistanceFt,
    safetyHazardsCount,
    safetyLines,
    efficiencyScore,
    scoreColor
  } = useMemo(() => {
    const _hubsCount = elements.filter(e => ["power_drop", "audio_hub", "water_access"].includes(e.type)).length;
    const _setupMins = (tablesCount * 5) + (chairsCount * 1) + (tentsCount * 60) + (elements.find(e => e.type === "staging_kitchen") ? 30 : 0) + (_hubsCount * 10) + (elements.filter(e => e.type === "dance_floor").length * 5);
    const _loadOutMins = Math.round(_setupMins * 0.7);

    // Travel Distance Math
    let _totalServiceFeet = 0;
    let _totalLoops = 0;
    const kitchen = elements.find(e => e.type === "staging_kitchen");
    if (kitchen) {
      const K = { x: kitchen.x + ELEMENT_CONFIG.staging_kitchen.width / 2, y: kitchen.y + ELEMENT_CONFIG.staging_kitchen.height / 2 };
      elements.filter(e => e.type.startsWith("table") || e.type === "high_top" || e.type === "deuce").forEach(t => {
        const T = { x: t.x + ELEMENT_CONFIG[t.type as ElementType].width / 2, y: t.y + ELEMENT_CONFIG[t.type as ElementType].height / 2 };
        const distPx = Math.hypot(T.x - K.x, T.y - K.y);
        const distFt = distPx / PIXELS_PER_FOOT;
        const loops = t.guests * 3; // Assume 3 trips per guest (drinks, main, clear)
        _totalServiceFeet += (distFt * 2) * loops; // round trip
        _totalLoops += loops;
      });
    }
    const _serviceMileage = _totalServiceFeet / 5280;
    const _avgDistanceFt = _totalLoops > 0 ? (_totalServiceFeet / 2) / _totalLoops : 0;

    // Efficiency Score Math
    let _safetyHazardsCount = 0;
    const ccw = (A: {x:number,y:number}, B: {x:number,y:number}, C: {x:number,y:number}) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    const intersect = (A: {x:number,y:number}, B: {x:number,y:number}, C: {x:number,y:number}, D: {x:number,y:number}) => ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
    
    const hubs = elements.filter(e => ["power_drop", "audio_hub", "water_access"].includes(e.type));
    const _safetyLines: any[] = [];
    hubs.forEach((hub, i) => {
      let nearest = null;
      let minDist = Infinity;
      hubs.forEach((other, j) => {
        if (i === j) return;
        const d = Math.hypot(hub.x - other.x, hub.y - other.y);
        if (d < minDist) { minDist = d; nearest = other; }
      });
      if (nearest) {
        const exists = _safetyLines.find(l => (l.h1.id === hub.id && l.h2.id === nearest.id) || (l.h1.id === nearest.id && l.h2.id === hub.id));
        if (!exists) _safetyLines.push({ h1: hub, h2: nearest });
      }
    });

    if (kitchen) {
      const K = { x: kitchen.x + ELEMENT_CONFIG.staging_kitchen.width / 2, y: kitchen.y + ELEMENT_CONFIG.staging_kitchen.height / 2 };
      _safetyLines.forEach(line => {
        const c1 = ELEMENT_CONFIG[line.h1.type as ElementType];
        const c2 = ELEMENT_CONFIG[line.h2.type as ElementType];
        const A = { x: line.h1.x + c1.width / 2, y: line.h1.y + c1.height / 2 };
        const B = { x: line.h2.x + c2.width / 2, y: line.h2.y + c2.height / 2 };
        let isHazard = false;
        elements.filter(e => e.type.startsWith("table") || e.type === "high_top" || e.type === "deuce").forEach(t => {
          const T = { x: t.x + ELEMENT_CONFIG[t.type as ElementType].width / 2, y: t.y + ELEMENT_CONFIG[t.type as ElementType].height / 2 };
          if (intersect(A, B, K, T)) isHazard = true;
        });
        if (isHazard) _safetyHazardsCount++;
      });
    }

    let _efficiencyScore = 100;
    if (_avgDistanceFt > 30) _efficiencyScore -= (_avgDistanceFt - 30) * 0.5;
    _efficiencyScore -= _safetyHazardsCount * 5;
    _efficiencyScore -= muddyPathTableIds.size * 2;
    _efficiencyScore = Math.max(1, Math.min(100, Math.round(_efficiencyScore)));

    let _scoreColor = "text-emerald-400";
    if (_efficiencyScore < 70) _scoreColor = "text-amber-400";
    if (_efficiencyScore < 50) _scoreColor = "text-red-400";

    return {
      hubsCount: _hubsCount,
      setupMins: _setupMins,
      loadOutMins: _loadOutMins,
      totalServiceFeet: _totalServiceFeet,
      totalLoops: _totalLoops,
      serviceMileage: _serviceMileage,
      avgDistanceFt: _avgDistanceFt,
      safetyHazardsCount: _safetyHazardsCount,
      safetyLines: _safetyLines,
      efficiencyScore: _efficiencyScore,
      scoreColor: _scoreColor
    };
  }, [elements, tablesCount, chairsCount, tentsCount, muddyPathTableIds]);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Sync to global context whenever these values change
  useEffect(() => {
    updateEventState({
      totalGuests,
      staffCount: requiredStaff,
      inventoryCosts: simulatedInventoryCost,
      globalTime,
      estimatedTotalValue: totalEstimatedValue,
      timelineEvents: timelineEvents.map(e => ({
        id: e.id,
        name: e.timeEventName!,
        time: e.timeEventTime!,
        type: e.timeEventType || "general"
      }))
    });

    // Sync to Inventory Vault
    if (eventState.menuItems && eventState.menuItems.length > 0) {
      eventState.menuItems.forEach(menuItem => {
        const existingItem = inventory.find(i => i.name === menuItem.name);
        const requiredPortions = totalGuests * (menuItem.quantity || 1);
        
        if (existingItem) {
          if (existingItem.requiredPortions !== requiredPortions) {
            updateInventoryItem({ ...existingItem, requiredPortions });
          }
        } else {
          // Auto-create the menu item in inventory if it doesn't exist
          addInventoryItem({
            name: menuItem.name,
            category: "Food Ingredient",
            currentStock: 0,
            unit: "portions",
            lowStockThreshold: 10,
            costPerUnit: menuItem.price || 0,
            markupPercentage: 0.20,
            requiredPortions
          });
        }
      });
    }
  }, [totalGuests, requiredStaff, simulatedInventoryCost, globalTime, totalEstimatedValue, elements, updateEventState, eventState.menuItems, inventory, updateInventoryItem, addInventoryItem]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50 min-h-screen">
      <ExecutionProgress percentage={progressPercentage} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar - Now the Live BEO Sidebar */}
        <BEOSidebar />

        {/* Canvas Area */}
        <div 
          id="venue-map-canvas" 
          className="flex-1 relative overflow-hidden cursor-crosshair transition-colors duration-700" 
          style={{ backgroundColor: isOutdoorMode ? '#064e3b' : '#0f172a' }}
          ref={containerRef} 
          onClick={() => setSelectedId(null)}
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (crosshairXRef.current) crosshairXRef.current.style.left = `${x}px`;
            if (crosshairYRef.current) crosshairYRef.current.style.top = `${y}px`;
            if (crosshairLabelRef.current) {
              crosshairLabelRef.current.style.left = `${x + 10}px`;
              crosshairLabelRef.current.style.top = `${y + 10}px`;
              crosshairLabelRef.current.innerText = `${Math.round(x / PIXELS_PER_FOOT)}' , ${Math.round(y / PIXELS_PER_FOOT)}'`;
            }
          }}
          onMouseEnter={() => setIsHoveringMap(true)}
          onMouseLeave={() => setIsHoveringMap(false)}
        >
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{
            backgroundImage: isOutdoorMode ? `
              linear-gradient(rgba(251, 191, 36, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.15) 1px, transparent 1px),
              linear-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.2) 1px, transparent 1px)
            ` : `
              linear-gradient(rgba(251, 191, 36, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
            backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px'
          }} />

          {/* Weather Overlay SVG */}
          <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: '100%', height: '100%' }}>
            {/* Drip Zones */}
            {isRaining && tents.map(tent => (
              <rect 
                key={`drip-${tent.id}`}
                x={tent.x - 40} y={tent.y - 40} 
                width={ELEMENT_CONFIG.tent_40x60.width + 80} 
                height={ELEMENT_CONFIG.tent_40x60.height + 80}
                fill="rgba(51, 65, 85, 0.5)" // slate-700/50
                stroke="#3b82f6" // blue-500
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            ))}

            {/* Muddy Paths */}
            {isRaining && kitchen && elements.filter(e => muddyPathTableIds.has(e.id)).map(table => {
              const kX = kitchen.x + ELEMENT_CONFIG.staging_kitchen.width / 2;
              const kY = kitchen.y + ELEMENT_CONFIG.staging_kitchen.height / 2;
              const tX = table.x + ELEMENT_CONFIG[table.type].width / 2;
              const tY = table.y + ELEMENT_CONFIG[table.type].height / 2;
              return (
                <line 
                  key={`mud-${table.id}`}
                  x1={kX} y1={kY} x2={tX} y2={tY}
                  stroke="#78350f" // amber-900 (mud brown)
                  strokeWidth="4"
                  strokeDasharray="8,4"
                  opacity="0.8"
                />
              );
            })}

            {/* Smoke Plume */}
            {smokeTriangle && (
              <polygon 
                points={`${smokeTriangle.p1.x},${smokeTriangle.p1.y} ${smokeTriangle.p2.x},${smokeTriangle.p2.y} ${smokeTriangle.p3.x},${smokeTriangle.p3.y}`}
                fill="rgba(148, 163, 184, 0.5)" // slate-400/50
                className="mix-blend-screen"
              />
            )}
          </svg>

          {/* Power Drop Connections */}
          <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: '100%', height: '100%' }}>
            {/* Draw Red Gap Lines */}
            {elements.map((el1, i) => {
              return elements.slice(i + 1).map(el2 => {
                // Skip tents and string lights for gap check
                if (el1.type === "tent_40x60" || el2.type === "tent_40x60" || el1.type === "string_lights" || el2.type === "string_lights") return null;

                const c1 = ELEMENT_CONFIG[el1.type];
                const c2 = ELEMENT_CONFIG[el2.type];

                const rect1 = { left: el1.x, right: el1.x + c1.width, top: el1.y, bottom: el1.y + c1.height };
                const rect2 = { left: el2.x, right: el2.x + c2.width, top: el2.y, bottom: el2.y + c2.height };

                const hGap = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
                const vGap = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
                
                const dist = Math.sqrt(hGap * hGap + vGap * vGap);

                // If gap is less than 36 inches (60px) and they are not intersecting
                if (dist > 0 && dist < 60) {
                  // Find closest points for the line
                  const x1 = el1.x + c1.width / 2;
                  const y1 = el1.y + c1.height / 2;
                  const x2 = el2.x + c2.width / 2;
                  const y2 = el2.y + c2.height / 2;

                  return (
                    <g key={`gap-${el1.id}-${el2.id}`}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" opacity="0.8" />
                      <text x={(x1+x2)/2} y={(y1+y2)/2 - 5} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">
                        &lt; 36"
                      </text>
                    </g>
                  );
                }
                return null;
              });
            })}

            {/* Draw Power Drop Lines */}
            {elements.filter(e => e.type === "power_drop").map(drop => {
              const targets = elements.filter(e => e.type === "stage" || e.type === "string_lights");
              if (targets.length === 0) return null;
              
              let nearest = targets[0];
              let minDist = Infinity;
              
              targets.forEach(t => {
                const dx = t.x - drop.x;
                const dy = t.y - drop.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                  minDist = dist;
                  nearest = t;
                }
              });
              
              const dropConfig = ELEMENT_CONFIG.power_drop;
              const targetConfig = ELEMENT_CONFIG[nearest.type];
              
              return (
                <line 
                  key={`line-${drop.id}`}
                  x1={drop.x + dropConfig.width / 2} 
                  y1={drop.y + dropConfig.height / 2} 
                  x2={nearest.x + targetConfig.width / 2} 
                  y2={nearest.y + targetConfig.height / 2} 
                  stroke="#fbbf24" 
                  strokeWidth="2" 
                  strokeDasharray="5,5" 
                  opacity="0.5" 
                />
              );
            })}

            {/* Draw Safety Lines (Infrastructure Overlay) */}
            {showInfraOverlay && (() => {
              // Helper for line intersection
              const ccw = (A: {x:number,y:number}, B: {x:number,y:number}, C: {x:number,y:number}) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
              const intersect = (A: {x:number,y:number}, B: {x:number,y:number}, C: {x:number,y:number}, D: {x:number,y:number}) => ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);

              const hubs = elements.filter(e => ["power_drop", "audio_hub", "water_access"].includes(e.type));
              const kitchen = elements.find(e => e.type === "staging_kitchen");
              const tables = elements.filter(e => e.type.startsWith("table") || e.type === "high_top" || e.type === "deuce");

              const safetyLines: any[] = [];
              hubs.forEach((hub, i) => {
                let nearest = null;
                let minDist = Infinity;
                hubs.forEach((other, j) => {
                  if (i === j) return;
                  const d = Math.hypot(hub.x - other.x, hub.y - other.y);
                  if (d < minDist) { minDist = d; nearest = other; }
                });
                if (nearest) {
                  const exists = safetyLines.find(l => (l.h1.id === hub.id && l.h2.id === nearest.id) || (l.h1.id === nearest.id && l.h2.id === hub.id));
                  if (!exists) safetyLines.push({ h1: hub, h2: nearest });
                }
              });

              return safetyLines.map((line, i) => {
                const c1 = ELEMENT_CONFIG[line.h1.type as ElementType];
                const c2 = ELEMENT_CONFIG[line.h2.type as ElementType];
                const A = { x: line.h1.x + c1.width / 2, y: line.h1.y + c1.height / 2 };
                const B = { x: line.h2.x + c2.width / 2, y: line.h2.y + c2.height / 2 };

                let isHazard = false;
                if (kitchen) {
                  const K = { x: kitchen.x + ELEMENT_CONFIG.staging_kitchen.width / 2, y: kitchen.y + ELEMENT_CONFIG.staging_kitchen.height / 2 };
                  tables.forEach(t => {
                    const T = { x: t.x + ELEMENT_CONFIG[t.type as ElementType].width / 2, y: t.y + ELEMENT_CONFIG[t.type as ElementType].height / 2 };
                    if (intersect(A, B, K, T)) isHazard = true;
                  });
                }

                return (
                  <line 
                    key={`safety-${i}`}
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke="#f97316" // Orange-500
                    strokeWidth={isHazard ? "4" : "2"}
                    strokeDasharray="8,4"
                    className={isHazard ? "animate-pulse" : ""}
                    opacity="0.8"
                  />
                );
              });
            })()}
          </svg>

          {/* Bathroom Heatmap (Infrastructure Overlay) */}
          {showInfraOverlay && elements.filter(e => e.type === "bathroom").map(b => (
            <svg key={`heatmap-${b.id}`} className="absolute inset-0 pointer-events-none z-0" style={{ width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id={`heat-${b.id}`}>
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </radialGradient>
              </defs>
              <circle cx={b.x + ELEMENT_CONFIG.bathroom.width / 2} cy={b.y + ELEMENT_CONFIG.bathroom.height / 2} r={600} fill={`url(#heat-${b.id})`} />
            </svg>
          ))}

          {/* Precision Crosshair */}
          {isHoveringMap && (
            <>
              <div ref={crosshairXRef} className="absolute top-0 bottom-0 border-l border-dashed border-[#fbbf24]/40 pointer-events-none z-30" />
              <div ref={crosshairYRef} className="absolute left-0 right-0 border-t border-dashed border-[#fbbf24]/40 pointer-events-none z-30" />
              <div ref={crosshairLabelRef} className="absolute bg-slate-900/80 text-[#fbbf24] text-[10px] px-2 py-1 rounded border border-[#fbbf24]/30 pointer-events-none z-30" />
            </>
          )}

          {/* Square Footage Counter */}
          <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-xl shadow-2xl z-40 pointer-events-none">
            <h4 className="font-serif text-[#fbbf24] text-sm mb-1">Space Utilization</h4>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-400">Occupied Area:</span>
              <span className="font-bold text-white">{Math.round(occupiedSqFt)} sq ft</span>
            </div>
          </div>

          {/* Elements Palette (Floating & Draggable) */}
          <motion.div 
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            className="absolute top-6 left-6 w-48 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 flex flex-col gap-4 z-40 rounded-xl shadow-2xl cursor-move"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-[#fbbf24] font-bold">Elements</h3>
              <GripHorizontal className="w-5 h-5 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((type) => {
                const config = ELEMENT_CONFIG[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2 bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the palette when clicking a button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddElement(type);
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] text-center leading-tight whitespace-normal">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            
            <Separator className="bg-slate-700 my-1" />
            
            <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
              <Label className="text-xs text-slate-300 cursor-pointer" htmlFor="outdoor-mode">Outdoor Mode</Label>
              <Switch id="outdoor-mode" checked={isOutdoorMode} onCheckedChange={setIsOutdoorMode} />
            </div>

            <Separator className="bg-slate-700 my-1" />

            <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
              <Label className="text-xs text-slate-300 cursor-pointer" htmlFor="infra-mode">Safety & Infra Overlay</Label>
              <Switch id="infra-mode" checked={showInfraOverlay} onCheckedChange={setShowInfraOverlay} />
            </div>

            <Separator className="bg-slate-700 my-1" />

            <div className="flex flex-col gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300 cursor-pointer flex items-center gap-1" htmlFor="rain-mode">
                  <CloudRain className="w-3 h-3 text-blue-400" /> Rain Sim
                </Label>
                <Switch id="rain-mode" checked={isRaining} onCheckedChange={setIsRaining} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <Label className="text-xs text-slate-300 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" /> Wind Dir
                </Label>
                <Select value={windDirection} onValueChange={setWindDirection}>
                  <SelectTrigger className="w-[70px] h-6 text-[10px] bg-slate-900 border-slate-700 text-white px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white min-w-[70px]">
                    {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map(d => (
                      <SelectItem key={d} value={d} className="text-[10px]">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-slate-700 my-1" />
            
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
              <h4 className="font-serif text-[#fbbf24] mb-2 text-sm">Staffing</h4>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Guests:</span>
                <span className="font-bold text-white">{totalGuests}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Staff (1:15):</span>
                <span className="font-bold text-amber-400">{requiredStaff}</span>
              </div>
            </div>
          </motion.div>

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

          {/* Worker Dots (Yellow) Animation */}
          {elements.find(e => e.type === "staging_kitchen") && elements.filter(e => e.type.startsWith("table") || e.type === "high_top" || e.type === "deuce").map((table, index) => {
            const kitchen = elements.find(e => e.type === "staging_kitchen")!;
            const kX = kitchen.x + ELEMENT_CONFIG[kitchen.type].width / 2;
            const kY = kitchen.y + ELEMENT_CONFIG[kitchen.type].height / 2;
            const tX = table.x + ELEMENT_CONFIG[table.type].width / 2;
            const tY = table.y + ELEMENT_CONFIG[table.type].height / 2;
            
            // Only show 1 worker dot per table for visual clarity
            return (
              <motion.div
                key={`worker-${table.id}`}
                className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] z-40 pointer-events-none"
                animate={{
                  x: [kX, tX, kX],
                  y: [kY, tY, kY],
                }}
                transition={{
                  duration: 8 + (index % 4) * 2, // Randomize speed a bit
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.5 // Stagger starts
                }}
              />
            );
          })}

          {/* Render Elements */}
          {elements.map((el) => {
            const config = ELEMENT_CONFIG[el.type];
            const isSelected = el.id === selectedId;
            const isActiveEvent = el.timeEventTime !== undefined && globalTime >= el.timeEventTime && globalTime < el.timeEventTime + 1; // Active for 1 hour
            const isSmoked = smokedElementIds.has(el.id);
            
            return (
              <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                dragConstraints={containerRef}
                onDragEnd={(e, info) => {
                  const snap = PIXELS_PER_FOOT;
                  const newX = Math.round((el.x + info.offset.x) / snap) * snap;
                  const newY = Math.round((el.y + info.offset.y) / snap) * snap;
                  updateElement(el.id, { x: newX, y: newY });
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
                  zIndex: isSelected ? 50 : (el.type === 'tent_40x60' ? 0 : 10),
                }}
                initial={false}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  boxShadow: isSelected ? "0 0 0 2px #fbbf24, 0 0 20px rgba(234,179,8,0.4)" : "none",
                }}
              >
                <div className={cn(
                  "w-full h-full flex items-center justify-center transition-colors relative",
                  el.type !== "tent_40x60" && el.type !== "string_lights" && el.type !== "exit_sign" && "border-2 border-slate-600",
                  el.type === "tent_40x60" && el.hasSidewalls ? "bg-amber-50/5 border-4 border-solid border-white backdrop-blur-[2px]" : config.color,
                  config.shape === "circle" ? "rounded-full" : "rounded-md",
                  isSelected && "border-[#fbbf24] border-solid border-2",
                  isSmoked && "border-orange-500 border-4 shadow-[0_0_20px_rgba(249,115,22,0.6)] bg-orange-900/50"
                )}>
                  {el.type === "staging_kitchen" && el.showSafetyRadius && (
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 border-2 border-dashed border-red-500/50 pointer-events-none" 
                      style={{ width: config.width + 400, height: config.width + 400 }} // 10ft radius = 20ft diameter = 400px
                    />
                  )}
                  {el.type === "string_lights" && (
                    <div className="absolute inset-0 flex items-center justify-between px-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-1000", isSunset ? "bg-amber-100 shadow-[0_0_15px_rgba(251,191,36,1)] scale-125" : "bg-amber-700/50 shadow-none")} />
                      ))}
                    </div>
                  )}
                  {el.type === "tent_40x60" && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fbbf24\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
                  )}
                  <span className={cn("font-bold z-10", el.type === "tent_40x60" ? "text-amber-200/40 text-4xl" : "text-xs text-white/70")}>
                    {config.label.split(" ")[0]}
                  </span>
                </div>

                {/* Active Event Label */}
                {isActiveEvent && el.timeEventName && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#fbbf24] text-slate-900 text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap animate-bounce shadow-[0_0_10px_rgba(234,179,8,0.5)] z-50">
                    {formatTime(el.timeEventTime!)} - {el.timeEventName}
                  </div>
                )}

                {/* Exit Sign Animation */}
                {el.type === "exit_sign" && (
                  <div className="absolute inset-0 rounded-md animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)] border-2 border-red-400 pointer-events-none" />
                )}

                {/* Guest Dots */}
                {el.guests > 0 && (
                  <div className="absolute inset-[-15px] pointer-events-none">
                    {Array.from({ length: el.guests }).map((_, i) => {
                      let dotX, dotY;
                      if (config.shape === "circle") {
                        const angle = (i / el.guests) * Math.PI * 2;
                        const radius = config.width / 2 + 10;
                        dotX = config.width / 2 + Math.cos(angle) * radius - 4;
                        dotY = config.height / 2 + Math.sin(angle) * radius - 4;
                      } else {
                        // Rectangular perimeter distribution
                        const w = config.width + 20;
                        const h = config.height + 20;
                        const perimeter = 2 * w + 2 * h;
                        const d = (i / el.guests) * perimeter;
                        
                        if (d < w) { // Top edge
                          dotX = d - 10;
                          dotY = -10 - 4;
                        } else if (d < w + h) { // Right edge
                          dotX = w - 10 - 4;
                          dotY = (d - w) - 10;
                        } else if (d < 2 * w + h) { // Bottom edge
                          dotX = w - (d - (w + h)) - 10;
                          dotY = h - 10 - 4;
                        } else { // Left edge
                          dotX = -10 - 4;
                          dotY = h - (d - (2 * w + h)) - 10;
                        }
                      }
                      
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

        {/* Global Clock Slider */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-xl shadow-2xl z-40 flex items-center gap-4 w-[400px]">
          <Clock className="w-5 h-5 text-[#fbbf24]" />
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
              <span>4:00 PM</span>
              <span className="text-[#fbbf24] text-sm">{formatTime(globalTime)}</span>
              <span>10:00 PM</span>
            </div>
            <input 
              type="range" 
              min="16" 
              max="22" 
              step="0.25" 
              value={globalTime} 
              onChange={(e) => setGlobalTime(parseFloat(e.target.value))}
              className="w-full accent-[#fbbf24]"
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar (Details) */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-2xl h-full">
        <Tabs value={rightSidebarTab} onValueChange={(v: any) => setRightSidebarTab(v)} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-950 border border-slate-800 p-1 rounded-lg mb-4">
            <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Run of Show</TabsTrigger>
            <TabsTrigger value="logistics" className="text-xs">Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="flex-1 overflow-y-auto pr-2">
            {selectedElement ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl text-white font-bold">Properties</h3>
                  <Button variant="ghost" size="icon" onClick={() => updateElement(selectedElement.id, { rotation: selectedElement.rotation + 45 })}>
                    <span className="text-xs">Rotate</span>
                  </Button>
                </div>
                
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

                {selectedElement.type === "tent_40x60" && (
                  <div className="space-y-2 pt-4">
                    <Label className="text-slate-300">Tent Sidewalls (+$300)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={selectedElement.hasSidewalls || false} 
                        onCheckedChange={(checked) => updateElement(selectedElement.id, { hasSidewalls: checked })}
                      />
                      <span className="text-xs text-slate-400">Enclose tent with solid walls</span>
                    </div>
                  </div>
                )}

                {selectedElement.type === "staging_kitchen" && (
                  <div className="space-y-2 pt-4">
                    <Label className="text-slate-300">Safety Radius (10ft)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={selectedElement.showSafetyRadius || false} 
                        onCheckedChange={(checked) => updateElement(selectedElement.id, { showSafetyRadius: checked })}
                      />
                      <span className="text-xs text-slate-400">Show 10ft fire safety clearance</span>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-800" />
                <h4 className="font-serif text-[#fbbf24] text-lg">Timeline Event</h4>
                <div className="space-y-2">
                  <Label className="text-slate-300">Event Name</Label>
                  <Input 
                    placeholder="e.g., Band Start" 
                    value={selectedElement.timeEventName || ""} 
                    onChange={(e) => updateElement(selectedElement.id, { timeEventName: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Time (Decimal 16-22)</Label>
                  <Input 
                    type="number"
                    min={16}
                    max={22}
                    step={0.25}
                    value={selectedElement.timeEventTime || ""} 
                    onChange={(e) => updateElement(selectedElement.id, { timeEventTime: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">16 = 4 PM, 20.25 = 8:15 PM</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Event Type</Label>
                  <Select value={selectedElement.timeEventType || "general"} onValueChange={(v: any) => updateElement(selectedElement.id, { timeEventType: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="food_service">Food Service</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="pt-6 space-y-3 pb-6">
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                <Crosshair className="w-12 h-12 mb-4 opacity-20" />
                <p>Select an element on the map to view and edit its properties.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto pr-2">
            <h3 className="font-serif text-xl text-white font-bold mb-4">Run of Show</h3>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No timeline events assigned to map elements yet.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-400 group-[.is-active]:text-[#fbbf24] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-900/50 shadow">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-200">{event.timeEventName}</div>
                        <time className="font-mono text-xs font-medium text-[#fbbf24]">{formatTime(event.timeEventTime!)}</time>
                      </div>
                      <div className="text-xs text-slate-500">Element: {ELEMENT_CONFIG[event.type].label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logistics" className="flex-1 overflow-y-auto pr-2 flex flex-col">
            <h3 className="font-serif text-xl text-white font-bold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#fbbf24]" />
              Logistics & Setup Timer
            </h3>
            
            <div className="space-y-4 flex-1">
              {/* Wendy Efficiency Score */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm text-slate-300 font-bold">Wendy Efficiency Score</h4>
                  <p className="text-xs text-slate-500">Based on travel distance & hazards</p>
                </div>
                <div className={`text-4xl font-black font-serif ${scoreColor}`}>
                  {efficiencyScore}
                </div>
              </div>

              {/* Setup Clock */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Setup & Load-Out Clock
                </h4>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between"><span>Estimated Setup</span> <span className="font-bold text-white">{formatDuration(setupMins)}</span></div>
                  <div className="flex justify-between"><span>Estimated Load-Out</span> <span className="font-bold text-white">{formatDuration(loadOutMins)}</span></div>
                </div>
              </div>

              {/* Travel Distance Math */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-orange-400" /> Travel Distance Math
                </h4>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between"><span>Total Service Mileage</span> <span className="font-bold text-white">{serviceMileage.toFixed(2)} mi</span></div>
                  <div className="flex justify-between"><span>Avg Table Distance</span> <span className="font-bold text-white">{Math.round(avgDistanceFt)} ft</span></div>
                  <div className="flex justify-between"><span>Worker Loops</span> <span className="font-bold text-white">{totalLoops}</span></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Asset Count</h4>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Users className="w-4 h-4" /> Tables</span> <span className="font-bold text-white">{tablesCount}x</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Users className="w-4 h-4" /> Chairs (Guests)</span> <span className="font-bold text-white">{chairsCount}x</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Tent className="w-4 h-4" /> Tents</span> <span className="font-bold text-white">{tentsCount}x</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Hubs (Power/Audio/Water)</span> <span className="font-bold text-white">{hubsCount}x</span></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Cost Analysis (MarketWatch)</h4>
                <div className="space-y-2 text-sm text-slate-400">
                  {tablesCount > 0 && <div className="flex justify-between"><span>Tables (${16.50.toFixed(2)}/ea)</span> <span className="font-bold text-white">${tablesCost.toFixed(2)}</span></div>}
                  {chairsCount > 0 && <div className="flex justify-between"><span>Chairs (${2.50.toFixed(2)}/ea)</span> <span className="font-bold text-white">${chairsCost.toFixed(2)}</span></div>}
                  {tentsCount > 0 && <div className="flex justify-between"><span>Tents ($1500.00/ea)</span> <span className="font-bold text-white">${tentsCost.toFixed(2)}</span></div>}
                  {powerDropsCount > 0 && <div className="flex justify-between"><span>Power Drops ($150.00/ea)</span> <span className="font-bold text-white">${powerDropsCost.toFixed(2)}</span></div>}
                  {stringLightsCost > 0 && <div className="flex justify-between"><span>String Lights ($45.00/ea)</span> <span className="font-bold text-white">${stringLightsCost.toFixed(2)}</span></div>}
                  {stagingKitchenCost > 0 && <div className="flex justify-between"><span>Staging Kitchen ($500.00/ea)</span> <span className="font-bold text-white">${stagingKitchenCost.toFixed(2)}</span></div>}
                  {danceFloorCost > 0 && <div className="flex justify-between"><span>Dance Floor ($250.00/ea)</span> <span className="font-bold text-white">${danceFloorCost.toFixed(2)}</span></div>}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Labor Estimator</h4>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between"><span>Servers (1 per 10 tables)</span> <span className="font-bold text-white">{estimatedLaborServers}</span></div>
                  <div className="flex justify-between"><span>Rate ($25/hr x 6 hrs)</span> <span className="font-bold text-white">${laborCost.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#fbbf24]" /> Menu Planner
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Signature Dish</Label>
                    <Select value={selectedSignatureDish} onValueChange={setSelectedSignatureDish}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs h-8">
                        <SelectValue placeholder="Select Dish" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="Blueberry Cranberry Bread">Blueberry Cranberry Bread</SelectItem>
                        <SelectItem value="Wendy's Signature Quiche">Wendy's Signature Quiche</SelectItem>
                        <SelectItem value="Herb-Crusted Salmon">Herb-Crusted Salmon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Dynamic Prep List</div>
                    <div className="text-sm text-white">
                      {chairsCount === 0 ? (
                        <span className="text-slate-500 italic">Add guests to map to calculate prep.</span>
                      ) : (
                        <span>
                          If <strong className="text-[#fbbf24]">{chairsCount} guests</strong>, you need <strong className="text-[#fbbf24]">{
                            selectedSignatureDish === "Blueberry Cranberry Bread" ? Math.ceil(chairsCount / 8) + " loaves" : 
                            selectedSignatureDish === "Wendy's Signature Quiche" ? Math.ceil(chairsCount / 6) + " quiches" : 
                            chairsCount + " portions"
                          }</strong> of {selectedSignatureDish}.
                        </span>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleKitchenSync}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    size="sm"
                  >
                    <Send className="w-3 h-3 mr-2 text-[#fbbf24]" /> Kitchen Sync
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg">
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Total Estimated Value</span>
                <span className="text-2xl font-serif font-bold text-white">${totalEstimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};