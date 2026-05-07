export type ElementType = "table_round_60" | "table_rect" | "high_top" | "deuce" | "dance_floor" | "bar" | "buffet" | "cake" | "stage" | "pipe_drape" | "floral_arch" | "tent_40x60" | "string_lights" | "staging_kitchen" | "power_drop" | "exit_sign" | "audio_hub" | "water_access" | "bathroom" | "staff_member";

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

export const TARGET_MARGIN = 0.70;
export const REVENUE_PER_GUEST_DEFAULT = 125;
export const LABOR_PER_STAFF = 300;
export const FOOD_PER_TABLE = 1500;

export const generateDiamondSnapElements = (targetGuests: number): MapElementData[] => {
  const tablesNeeded = Math.ceil(targetGuests / 10); // Using 60" rounds (10 guests each based on BEO logic)
  const snapElements: MapElementData[] = [];
  
  // 1. Anchor: Tent & Stage
  const stageX = 600;
  const stageY = 100;
  
  snapElements.push({
    id: crypto.randomUUID(),
    type: "tent_40x60",
    x: 150,
    y: 50,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false
  });

  snapElements.push({
    id: crypto.randomUUID(),
    type: "stage",
    x: stageX,
    y: stageY,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false
  });

  // Add Power Drop near stage
  snapElements.push({
    id: crypto.randomUUID(),
    type: "power_drop",
    x: stageX + 240,
    y: stageY + 60,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false
  });

  // 2. Execute Staggered Offset Grid (Diamond Snap)
  // 45-degree service runways.
  const startX = 200;
  const startY = 300;
  const spacingX = 140; // 100px table + 40px runway
  const spacingY = 120;
  
  for (let i = 0; i < tablesNeeded; i++) {
     const row = Math.floor(i / 5);
     const col = i % 5;
     const offsetX = (row % 2 === 1) ? (spacingX / 2) : 0;
     
     snapElements.push({
       id: crypto.randomUUID(),
       type: "table_round_60",
       x: startX + (col * spacingX) + offsetX,
       y: startY + (row * spacingY),
       rotation: 45, 
       guests: 10,
       vendorAssigned: true,
       selfPerform: false,
       linen: "white_cotton",
       napkin: "white",
       glassware: "standard",
       centerpieceStyle: "low_lush"
     });
  }

  // Add staging kitchen
  snapElements.push({
    id: crypto.randomUUID(),
    type: "staging_kitchen",
    x: 100,
    y: 700,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false
  });

  return snapElements;
};
