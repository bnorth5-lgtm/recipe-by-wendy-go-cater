import type { MapElementData } from "@/utils/geoMath";
import { generateDiamondSnapElements, BLUEPRINT_PIXELS_PER_FOOT } from "@/utils/geoMath";

export interface SalesVenueTemplate {
  id: string;
  name: string;
  tagline?: string;
  buildElements: () => MapElementData[];
}

const demoSeed: MapElementData[] = [
  {
    id: "sale-tent-1",
    type: "tent_40x60",
    x: 200,
    y: 80,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  },
  {
    id: "sale-kitchen",
    type: "staging_kitchen",
    x: 120,
    y: 620,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  },
  ...[0, 1, 2].map<MapElementData>((i) => ({
    id: `sale-table-${i}`,
    type: "table_round_60",
    x: 320 + i * 160,
    y: 360,
    rotation: 45,
    guests: 8,
    vendorAssigned: true,
    selfPerform: false,
    linen: "white_cotton",
    napkin: "white",
    glassware: "standard",
    centerpieceStyle: "low_lush",
  })),
  {
    id: "sale-cake",
    type: "cake",
    x: 520,
    y: 200,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  },
  {
    id: "sale-bar",
    type: "bar",
    x: 420,
    y: 500,
    rotation: 0,
    guests: 0,
    vendorAssigned: true,
    selfPerform: false,
  },
];

export const SALES_VENUE_TEMPLATES: SalesVenueTemplate[] = [
  {
    id: "harrison_180_diamond",
    name: "Harrison Field Gala — Diamond 180",
    tagline: "Locked manifest · marquee outdoor story",
    buildElements: () => generateDiamondSnapElements(180, BLUEPRINT_PIXELS_PER_FOOT),
  },
  {
    id: "intimate_sale_deck",
    name: "Intimate Sale Deck (24 tops)",
    tagline: "Cake + bar vignette for upsell narration",
    buildElements: () => demoSeed.map((e) => ({ ...e, id: crypto.randomUUID() })),
  },
  {
    id: "blank_canvas",
    name: "Blank canvas",
    tagline: "Start from minimal tent shell",
    buildElements: () => [
      {
        id: crypto.randomUUID(),
        type: "tent_40x60",
        x: 240,
        y: 120,
        rotation: 0,
        guests: 0,
        vendorAssigned: true,
        selfPerform: false,
      },
    ],
  },
];

export function resolveSalesVenueTemplate(id: string): MapElementData[] {
  const tpl = SALES_VENUE_TEMPLATES.find((t) => t.id === id);
  return tpl ? tpl.buildElements() : SALES_VENUE_TEMPLATES[0].buildElements();
}
