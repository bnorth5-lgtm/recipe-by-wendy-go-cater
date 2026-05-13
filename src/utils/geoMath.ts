export type ElementType =
  | "table_round_60"
  | "table_rect"
  | "high_top"
  | "deuce"
  | "dance_floor"
  | "bar"
  /** Portable module (Harrison reconcile: TL @ 3′ intersections, same footing as staging kitchen). */
  | "bar_portable"
  | "buffet"
  | "cake"
  | "stage"
  | "pipe_drape"
  | "floral_arch"
  | "tent_40x60"
  | "string_lights"
  | "staging_kitchen"
  | "power_drop"
  | "exit_sign"
  | "audio_hub"
  | "water_access"
  | "bathroom"
  | "staff_member";

export interface MapElementData {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  guests: number;
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
  /** Harrison CAD slab datum (Diamond Snap manifests). */
  elevationFt?: number;
}

export const TARGET_MARGIN = 0.70;
export const REVENUE_PER_GUEST_DEFAULT = 125;
export const LABOR_PER_STAFF = 300;
export const FOOD_PER_TABLE = 1500;

export const BLUEPRINT_PIXELS_PER_FOOT = 20;
export const GRID_MAGNET_FT = 3;

export const HARRISON_DIAMOND_TABLE_DIAMETER_PX = 100;

export const HARRISON_DIAMOND_180_TARGET_GUESTS = 180;
export const HARRISON_DIAMOND_180_TABLES = 12;
export const HARRISON_DIAMOND_180_GUESTS_PER_TABLE = 15;

export const HARRISON_MASTER_ELEVATION_FT = 1.9;

export function gridStridePx(pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT): number {
  return pixelsPerFoot * GRID_MAGNET_FT;
}

/** 3′ grid intersections (north-west reference for rectilinear assets). */
export function snapToGridIntersect3Ft(
  px: number,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): number {
  const g = gridStridePx(pixelsPerFoot);
  return Math.round(px / g) * g;
}

export function gridSnapBlueprintPx(
  px: number,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): number {
  return snapToGridIntersect3Ft(px, pixelsPerFoot);
}

/** Centers of each 3′×3′ module (preferred for round table centroids). */
export function snapGridCellCenter3Ft(
  px: number,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): number {
  const g = gridStridePx(pixelsPerFoot);
  return Math.round((px - g / 2) / g) * g + g / 2;
}

export function roundTableTopLeftFromSnappedCenters(
  centerXPx: number,
  centerYPx: number,
  diameterPx: number = HARRISON_DIAMOND_TABLE_DIAMETER_PX,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): { x: number; y: number } {
  const cx = snapGridCellCenter3Ft(centerXPx, pixelsPerFoot);
  const cy = snapGridCellCenter3Ft(centerYPx, pixelsPerFoot);
  const half = diameterPx / 2;
  return {
    x: snapToGridIntersect3Ft(cx - half, pixelsPerFoot),
    y: snapToGridIntersect3Ft(cy - half, pixelsPerFoot),
  };
}

export function serviceLaneWidthPx(pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT): number {
  return gridStridePx(pixelsPerFoot);
}

function elevate(el: Omit<MapElementData, "elevationFt">): MapElementData {
  return { ...el, elevationFt: HARRISON_MASTER_ELEVATION_FT };
}

function appendDiamondStaffRibbonGrid(
  out: MapElementData[],
  tableCenters: { cx: number; cy: number }[],
  staffCount: number,
  tentInnerLeft: number,
  tentInnerRight: number,
  kitchenY: number,
  staffPx: number,
  pixelsPerFoot: number,
): void {
  if (staffCount <= 0) return;

  const g = gridStridePx(pixelsPerFoot);
  const gxLoc = (n: number) => snapToGridIntersect3Ft(n, pixelsPerFoot);
  const half = staffPx / 2;

  let apronYCenter: number;
  if (tableCenters.length > 0) {
    const maxTableBottom =
      Math.max(...tableCenters.map((t) => t.cy)) + HARRISON_DIAMOND_TABLE_DIAMETER_PX / 2;
    apronYCenter = snapGridCellCenter3Ft((maxTableBottom + kitchenY) / 2, pixelsPerFoot);
  } else {
    apronYCenter = snapGridCellCenter3Ft(kitchenY - 3 * g, pixelsPerFoot);
  }

  /** Keep apron belts south of banquet mass and north of staging kitchen sill. */
  const apronClampMax = gxLoc(kitchenY - staffPx - g / 2);

  let placed = 0;
  for (let ribbon = 0; ribbon < 2 && placed < staffCount; ribbon++) {
    const ribbonYCenterCandidate = apronYCenter + ribbon * g;
    const ribbonYCenter = snapGridCellCenter3Ft(
      Math.min(ribbonYCenterCandidate, apronClampMax),
      pixelsPerFoot,
    );
    /** Second ribbon skips if collapsing into staging zone. */
    if (ribbon > 0 && ribbonYCenter >= apronClampMax) break;

    let xi = gxLoc(tentInnerLeft + Math.max(g, staffPx));
    while (placed < staffCount && xi <= gxLoc(tentInnerRight - Math.max(g, staffPx))) {
      out.push(
        elevate({
          id: crypto.randomUUID(),
          type: "staff_member",
          x: gxLoc(xi - half),
          y: gxLoc(ribbonYCenter - half),
          rotation: 0,
          guests: 0,
          vendorAssigned: true,
          selfPerform: false,
        }),
      );
      placed++;
      xi += g;
    }
  }
}

/**
 * Strict post-pass applied after programmatic placement (Diamond Snap reconcile / drag recovery).
 *
 * **Production / Vercel:** canonical final mutation before Coordinate Lock payloads (`setElements`,
 * `broadcastManifestCoordinateLock`, `harrison_build_manifest`). Keeps Portable bars, staging,
 * and tables quantized to the 3′ Harrison grid inside the optimized Vite bundle.
 */
export function reconcileDiamondManifestToGridStrict(
  elements: MapElementData[],
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): MapElementData[] {
  const gx = (n: number) => snapToGridIntersect3Ft(n, pixelsPerFoot);

  return elements.map((el) => {
    const base = { ...el };

    switch (base.type) {
      case "tent_40x60":
      case "staging_kitchen":
      case "stage":
      case "power_drop":
      case "staff_member":
      case "bar":
      case "bar_portable":
        return { ...base, x: gx(base.x), y: gx(base.y), elevationFt: HARRISON_MASTER_ELEVATION_FT };
      case "table_round_60": {
        const cxRaw = base.x + HARRISON_DIAMOND_TABLE_DIAMETER_PX / 2;
        const cyRaw = base.y + HARRISON_DIAMOND_TABLE_DIAMETER_PX / 2;
        const snapped = roundTableTopLeftFromSnappedCenters(
          cxRaw,
          cyRaw,
          HARRISON_DIAMOND_TABLE_DIAMETER_PX,
          pixelsPerFoot,
        );
        return { ...base, x: snapped.x, y: snapped.y, elevationFt: HARRISON_MASTER_ELEVATION_FT };
      }
      default:
        return base;
    }
  });
}

export const generateDiamondSnapElements = (
  targetGuests: number,
  pixelsPerFoot: number = BLUEPRINT_PIXELS_PER_FOOT,
): MapElementData[] => {
  const g = gridStridePx(pixelsPerFoot);
  const gx = (v: number) => snapToGridIntersect3Ft(v, pixelsPerFoot);

  const isDiamond180 = targetGuests === HARRISON_DIAMOND_180_TARGET_GUESTS;
  const tablesNeeded =
    isDiamond180
      ? HARRISON_DIAMOND_180_TABLES
      : Math.min(24, Math.max(6, Math.ceil(targetGuests / 15)));
  const guestsPer =
    tablesNeeded <= 0
      ? 0
      : isDiamond180
        ? HARRISON_DIAMOND_180_GUESTS_PER_TABLE
        : Math.max(10, Math.round(targetGuests / tablesNeeded));

  const snapElements: MapElementData[] = [];

  const tentEl = elevate({
    id: crypto.randomUUID(),
    type: "tent_40x60",
    x: gx(150),
    y: gx(50),
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });
  snapElements.push(tentEl);

  const tentInnerLeft = tentEl.x + g;
  const tentInnerRight = tentEl.x + 1200 - g;
  const tentInnerTop = tentEl.y + g;
  const tentInnerBottom = tentEl.y + 800 - g;

  const stageEl = elevate({
    id: crypto.randomUUID(),
    type: "stage",
    x: gx(620),
    y: gx(tentInnerTop + g),
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });
  snapElements.push(stageEl);

  snapElements.push(
    elevate({
      id: crypto.randomUUID(),
      type: "power_drop",
      x: gx(stageEl.x + 240),
      y: gx(stageEl.y + g),
      rotation: 0,
      guests: 0,
      vendorAssigned: true,
      selfPerform: false,
    }),
  );

  const COLS = 4;
  const CELL_STEP = g * 3;
  const ROW_STAGGER = CELL_STEP / 2;
  const radial = HARRISON_DIAMOND_TABLE_DIAMETER_PX / 2;

  /** Seed centroid for first table (south-west quadrant inside tent usable box). */
  const seedCx = snapGridCellCenter3Ft(tentInnerLeft + CELL_STEP + radial, pixelsPerFoot);
  const seedCy = snapGridCellCenter3Ft(tentInnerTop + CELL_STEP + 2 * radial, pixelsPerFoot);

  const tentativeCenters: { cx: number; cy: number }[] = [];

  for (let ti = 0; ti < tablesNeeded; ti++) {
    const row = Math.floor(ti / COLS);
    const col = ti % COLS;
    const cxRaw = seedCx + col * CELL_STEP + (row % 2) * ROW_STAGGER;
    const cyRaw = seedCy + row * CELL_STEP;
    tentativeCenters.push({
      cx: snapGridCellCenter3Ft(cxRaw, pixelsPerFoot),
      cy: snapGridCellCenter3Ft(cyRaw, pixelsPerFoot),
    });
  }

  /** Pan block laterally until circular hull clears tent sidewalls. */
  let shiftCx = 0;
  if (tentativeCenters.length > 0) {
    const minHull = Math.min(...tentativeCenters.map((p) => p.cx - radial));
    const maxHull = Math.max(...tentativeCenters.map((p) => p.cx + radial));

    const pad = g / 8;
    if (minHull < tentInnerLeft + pad) shiftCx += tentInnerLeft + pad - minHull;
    if (maxHull > tentInnerRight - pad) shiftCx -= maxHull - (tentInnerRight - pad);

    shiftCx = snapToGridIntersect3Ft(shiftCx, pixelsPerFoot);
  }

  const tableCenters = tentativeCenters.map((p) => ({
    cx: snapGridCellCenter3Ft(p.cx + shiftCx, pixelsPerFoot),
    cy: snapGridCellCenter3Ft(p.cy, pixelsPerFoot),
  }));

  for (const c of tableCenters) {
    const tl = roundTableTopLeftFromSnappedCenters(
      c.cx,
      c.cy,
      HARRISON_DIAMOND_TABLE_DIAMETER_PX,
      pixelsPerFoot,
    );

    snapElements.push(
      elevate({
        id: crypto.randomUUID(),
        type: "table_round_60",
        ...tl,
        rotation: 45,
        guests: guestsPer,
        vendorAssigned: true,
        selfPerform: false,
        linen: "white_cotton",
        napkin: "white",
        glassware: "standard",
        centerpieceStyle: "low_lush",
      }),
    );
  }

  const KITCHEN_W = 200;
  const KITCHEN_H = 100;

  /** Bottom-most permissible kitchen row clearing floor apron. */
  const ky = gx(tentInnerBottom - KITCHEN_H - g / 6);
  const medianCxSnap =
    tableCenters.length > 0
      ? snapGridCellCenter3Ft(
          tableCenters.reduce((sum, q) => sum + q.cx, 0) / tableCenters.length,
          pixelsPerFoot,
        )
      : snapGridCellCenter3Ft((tentInnerLeft + tentInnerRight) / 2, pixelsPerFoot);

  const kitchenEl = elevate({
    id: crypto.randomUUID(),
    type: "staging_kitchen",
    x: gx(medianCxSnap - KITCHEN_W / 2),
    y: ky,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  });
  snapElements.push(kitchenEl);

  const staffCount = Math.min(12, targetGuests >= 175 ? 12 : Math.ceil(targetGuests / 20));
  appendDiamondStaffRibbonGrid(
    snapElements,
    tableCenters,
    staffCount,
    tentInnerLeft,
    tentInnerRight,
    kitchenEl.y,
    20,
    pixelsPerFoot,
  );

  return reconcileDiamondManifestToGridStrict(snapElements, pixelsPerFoot);
};
