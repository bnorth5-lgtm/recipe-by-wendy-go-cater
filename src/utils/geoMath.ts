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

/** Blueprint scale (VenueArchitect) — used for Diamond Snap grid reconciliation. */
export const BLUEPRINT_PIXELS_PER_FOOT = 20;
export const GRID_MAGNET_FT = 3;

/**
 * Matches VenueArchitect3D stage slab (lift 1.85 + skin); single datum when manifest elevation is flattened.
 */
export const HARRISON_MASTER_ELEVATION_FT = 1.9;

export function gridSnapBlueprintPx(px: number, pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT): number {
  const g = pixelsPerFoot * GRID_MAGNET_FT;
  return Math.round(px / g) * g;
}

function appendDiamondStaffRibbon(
  out: MapElementData[],
  staffCount: number,
  pixelsPerFoot: number,
): void {
  const kitchen = out.find((e) => e.type === "staging_kitchen");
  if (!kitchen || staffCount <= 0) return;

  const grid = pixelsPerFoot * GRID_MAGNET_FT;
  const colsFirstRow = Math.min(6, staffCount);
  const rows = Math.ceil(staffCount / colsFirstRow);
  let placed = 0;

  for (let row = 0; row < rows && placed < staffCount; row++) {
    const countThisRow =
      row === 0 ? colsFirstRow : Math.min(colsFirstRow, staffCount - placed);
    for (let c = 0; c < countThisRow && placed < staffCount; c++) {
      const rawX = kitchen.x + c * grid;
      const rawY = kitchen.y - grid - row * grid;
      const sx = gridSnapBlueprintPx(rawX, pixelsPerFoot);
      const sy = gridSnapBlueprintPx(rawY, pixelsPerFoot);

      out.push({
        id: crypto.randomUUID(),
        type: "staff_member",
        x: sx,
        y: sy,
        rotation: 0,
        guests: 0,
        vendorAssigned: true,
        selfPerform: false,
      });
      placed++;
    }
  }
}

export const generateDiamondSnapElements = (
  targetGuests: number,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): MapElementData[] => {
  const tablesNeeded = Math.ceil(targetGuests / 10); // Using 60" rounds (10 guests each based on BEO logic)
  const snapElements: MapElementData[] = [];
  const gx = (v: number) => gridSnapBlueprintPx(v, pixelsPerFoot);

  // 1. Anchor: Tent & Stage (3' magnetism-aligned)
  const stageX = gx(600);
  const stageY = gx(100);

  snapElements.push({
    id: crypto.randomUUID(),
    type: "tent_40x60",
    x: gx(150),
    y: gx(50),
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });

  snapElements.push({
    id: crypto.randomUUID(),
    type: "stage",
    x: stageX,
    y: stageY,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });

  snapElements.push({
    id: crypto.randomUUID(),
    type: "power_drop",
    x: gx(stageX + 240),
    y: gx(stageY + 60),
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });

  const rawStartX = 200;
  const rawStartY = 300;
  const rawDx = 140;
  const rawDy = 120;

  for (let i = 0; i < tablesNeeded; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const offsetHalf = row % 2 === 1 ? rawDx / 2 : 0;

    snapElements.push({
      id: crypto.randomUUID(),
      type: "table_round_60",
      x: gx(rawStartX + col * rawDx + offsetHalf),
      y: gx(rawStartY + row * rawDy),
      rotation: 45,
      guests: 10,
      vendorAssigned: true,
      selfPerform: false,
      linen: "white_cotton",
      napkin: "white",
      glassware: "standard",
      centerpieceStyle: "low_lush",
    });
  }

  snapElements.push({
    id: crypto.randomUUID(),
    type: "staging_kitchen",
    x: gx(100),
    y: gx(700),
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });

  const serversRibbon = targetGuests >= 175 ? 12 : Math.min(12, Math.ceil(targetGuests / 20));
  appendDiamondStaffRibbon(snapElements, serversRibbon, pixelsPerFoot);

  return snapElements;
};
