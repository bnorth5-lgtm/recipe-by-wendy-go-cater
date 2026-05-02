/**
 * nationalSourcing.ts
 *
 * Simulates a regional vendor search based on a US venue ZIP code.
 * Returns the top 3 vendor categories — Wholesale Food, Event Rentals,
 * and Local Staffing Agencies — with plausible regional contacts.
 *
 * No external API is called; this is intentionally deterministic so the
 * feature works fully offline and at zero cost.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type VendorType = "wholesale_food" | "event_rentals" | "staffing";

export interface RegionalVendor {
  name: string;
  type: VendorType;
  /** Simulated local phone — format: (NXX) NXX-XXXX */
  phone: string;
  /** Simulated or real-world website */
  website: string;
  specialty: string;
  /** Star rating 1–5 */
  rating: number;
  /** True for Sysco / US Foods national branches */
  isNational: boolean;
}

export interface VendorCategory {
  id: VendorType;
  label: string;
  description: string;
  vendors: RegionalVendor[];
}

export interface RegionalSourcing {
  zipCode: string;
  /** e.g. "Northeast", "Southeast", "Pacific West" */
  region: string;
  /** Human-friendly label for the major metro served */
  majorCity: string;
  categories: VendorCategory[];
}

// ── Region map (first digit of ZIP → region name + anchor city) ───────────────

interface RegionMeta {
  name: string;
  majorCity: string;
  areaCode: string;
  foodVendors: Omit<RegionalVendor, "type">[];
  rentalVendors: Omit<RegionalVendor, "type">[];
  staffingVendors: Omit<RegionalVendor, "type">[];
}

const REGIONS: Record<string, RegionMeta> = {
  "0": {
    name: "Northeast",
    majorCity: "Boston / New England",
    areaCode: "617",
    foodVendors: [
      {
        name: "Sysco Boston",
        phone: "(617) 350-1200",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "US Foods New England",
        phone: "(617) 445-9800",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, fresh proteins",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Baldor Specialty Foods",
        phone: "(617) 821-5300",
        website: "baldorfood.com",
        specialty: "Premium produce, specialty & artisan imports",
        rating: 4.8,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "New England Party Rentals",
        phone: "(617) 236-4800",
        website: "nepartyrentals.com",
        specialty: "Tents, china, linens, catering equipment",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Party Rental Ltd. – Boston",
        phone: "(617) 783-2020",
        website: "partyrentalltd.com",
        specialty: "Fine china, flatware, glassware, specialty décor",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "Peterson Party Center",
        phone: "(781) 344-5200",
        website: "petersonpartycenter.com",
        specialty: "Full-service event tents and catering infrastructure",
        rating: 4.5,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Catersource Staffing – Boston",
        phone: "(617) 556-4100",
        website: "catersource.com/staffing",
        specialty: "Certified servers, bartenders, event captains",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "PRG Event Staffing",
        phone: "(617) 424-7700",
        website: "prgevents.com",
        specialty: "Front-of-house, kitchen, and setup crews",
        rating: 4.4,
        isNational: false,
      },
      {
        name: "Hospitality Staffing Solutions",
        phone: "(617) 737-5300",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
    ],
  },
  "1": {
    name: "Mid-Atlantic",
    majorCity: "New York / Philadelphia",
    areaCode: "212",
    foodVendors: [
      {
        name: "Sysco Metro New York",
        phone: "(212) 312-6200",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "US Foods – New York",
        phone: "(212) 688-1000",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, fresh proteins",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Baldor Specialty Foods – NYC",
        phone: "(718) 388-3000",
        website: "baldorfood.com",
        specialty: "Premium produce, specialty imports, seafood",
        rating: 4.9,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Party Rental Ltd. – Metro NY",
        phone: "(201) 727-4700",
        website: "partyrentalltd.com",
        specialty: "Fine china, crystal, linen, specialty décor",
        rating: 4.8,
        isNational: false,
      },
      {
        name: "EventSource NYC",
        phone: "(212) 741-3600",
        website: "eventsourcenyc.com",
        specialty: "High-end lounge furniture, staging, AV",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "Brook Furniture Rental",
        phone: "(212) 889-7100",
        website: "bfr.com",
        specialty: "Upscale furniture, bars, lounge seating",
        rating: 4.5,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – NYC",
        phone: "(212) 727-7300",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "CHS Event Staffing",
        phone: "(212) 302-4700",
        website: "chseventstaffing.com",
        specialty: "Union & non-union server crews, bartenders",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Temp Talent Group",
        phone: "(212) 505-1200",
        website: "temptalent.com",
        specialty: "Full-service event staffing and management",
        rating: 4.5,
        isNational: false,
      },
    ],
  },
  "2": {
    name: "Mid-Atlantic South",
    majorCity: "Washington D.C. / Baltimore",
    areaCode: "202",
    foodVendors: [
      {
        name: "Sysco Washington D.C.",
        phone: "(202) 554-1300",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "US Foods – Baltimore",
        phone: "(410) 644-3100",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Chesapeake seafood",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Profish Ltd.",
        phone: "(202) 529-7174",
        website: "profish.com",
        specialty: "Premium sustainable seafood, local Mid-Atlantic fish",
        rating: 4.8,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Rentals Unlimited – DC",
        phone: "(301) 345-4400",
        website: "rentalsunlimited.com",
        specialty: "Tents, tables, chairs, linen, china",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "DC Event Rentals",
        phone: "(202) 882-6500",
        website: "dceventrentals.com",
        specialty: "Specialty glassware, furniture, staging",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Select Event Group",
        phone: "(301) 424-3500",
        website: "selecteventgroup.com",
        specialty: "High-end linen, china, complete event packages",
        rating: 4.7,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – DC",
        phone: "(202) 466-7700",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Capitol Staffing Group",
        phone: "(202) 332-1400",
        website: "capitolstaffing.com",
        specialty: "White-glove service staff, corporate event crews",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Staffmark Hospitality – Baltimore",
        phone: "(410) 727-8300",
        website: "staffmark.com",
        specialty: "Full-service event and hospitality staffing",
        rating: 4.4,
        isNational: false,
      },
    ],
  },
  "3": {
    name: "Southeast",
    majorCity: "Atlanta / Miami",
    areaCode: "404",
    foodVendors: [
      {
        name: "Sysco Atlanta",
        phone: "(404) 349-6700",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "US Foods – Southeast",
        phone: "(404) 292-0200",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Southern specialties",
        rating: 4.5,
        isNational: true,
      },
      {
        name: "Atlanta Restaurant Associates",
        phone: "(404) 875-2200",
        website: "atlantarestaurant.com",
        specialty: "Local produce, specialty meats, artisan goods",
        rating: 4.6,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Peachtree Tent & Event",
        phone: "(404) 351-9700",
        website: "peachtreeevent.com",
        specialty: "Specialty tents, clear-top structures, flooring",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "AFR Event Furnishings – Atlanta",
        phone: "(404) 460-8700",
        website: "afrevents.com",
        specialty: "Upscale furniture, bars, lounge collections",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Mosaic Event Rentals",
        phone: "(404) 355-1999",
        website: "mosaiceventrentals.com",
        specialty: "Unique rentals, vintage items, specialty linen",
        rating: 4.5,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – Atlanta",
        phone: "(404) 659-6600",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Southern Staffing Group",
        phone: "(404) 233-4800",
        website: "southernstaffinggroup.com",
        specialty: "Experienced servers, bartenders, event captains",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Hire Standards Staffing",
        phone: "(404) 781-3200",
        website: "hirestandards.com",
        specialty: "Hospitality and event staffing across SE states",
        rating: 4.4,
        isNational: false,
      },
    ],
  },
  "4": {
    name: "Great Lakes",
    majorCity: "Chicago / Detroit",
    areaCode: "312",
    foodVendors: [
      {
        name: "Sysco Chicago",
        phone: "(312) 738-8400",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "US Foods – Chicago",
        phone: "(312) 644-7600",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Midwest proteins",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Chicago International Produce",
        phone: "(312) 226-0300",
        website: "chicagoproduce.com",
        specialty: "Premium produce, mushrooms, specialty imports",
        rating: 4.7,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Windy City Linen",
        phone: "(312) 829-5000",
        website: "windycitylinen.com",
        specialty: "Designer linens, napkins, specialty overlays",
        rating: 4.8,
        isNational: false,
      },
      {
        name: "Tablescapes Event Rentals",
        phone: "(312) 243-7700",
        website: "tablescapesrentals.com",
        specialty: "Fine china, flatware, charger plates, glassware",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "Keating Events – Chicago",
        phone: "(312) 280-5200",
        website: "keatingevents.com",
        specialty: "Tents, staging, infrastructure for large events",
        rating: 4.6,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – Chicago",
        phone: "(312) 368-7100",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "Great Lakes Event Staff",
        phone: "(312) 559-8800",
        website: "greatlakesstaffing.com",
        specialty: "Union-affiliated food & beverage service crews",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Staff Zone Hospitality",
        phone: "(312) 922-4000",
        website: "staffzone.com",
        specialty: "Day-of staffing, large-scale event deployment",
        rating: 4.4,
        isNational: false,
      },
    ],
  },
  "5": {
    name: "Upper Midwest",
    majorCity: "Minneapolis / Milwaukee",
    areaCode: "612",
    foodVendors: [
      {
        name: "Sysco Minnesota",
        phone: "(612) 333-8770",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "US Foods – Minneapolis",
        phone: "(612) 546-8000",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, local dairy & grains",
        rating: 4.5,
        isNational: true,
      },
      {
        name: "Coastal Seafood – Minneapolis",
        phone: "(612) 729-0037",
        website: "coastalseafoods.com",
        specialty: "Premium fresh and frozen seafood, nightly flights",
        rating: 4.7,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Abbey Party Rents",
        phone: "(952) 881-5773",
        website: "abbeypartyrents.com",
        specialty: "Tents, tables, chairs, specialty linen",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Connie's Rental – Minneapolis",
        phone: "(612) 870-2526",
        website: "conniesrental.com",
        specialty: "China, flatware, glassware, event essentials",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Room & Board Events",
        phone: "(612) 375-4000",
        website: "roomandboard.com/events",
        specialty: "Contemporary furniture and lounge rentals",
        rating: 4.7,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – MN",
        phone: "(612) 332-5800",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "North Star Event Staff",
        phone: "(612) 225-1900",
        website: "northstareventstaffing.com",
        specialty: "Full-service event staffing, Midwest markets",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Shiftgig Hospitality – MN",
        phone: "(612) 421-5500",
        website: "shiftgig.com",
        specialty: "On-demand hospitality workers, flexible scheduling",
        rating: 4.3,
        isNational: false,
      },
    ],
  },
  "6": {
    name: "Central Plains",
    majorCity: "Kansas City / St. Louis",
    areaCode: "816",
    foodVendors: [
      {
        name: "Sysco Kansas City",
        phone: "(816) 483-2900",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "US Foods – Kansas City",
        phone: "(816) 421-4600",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Central Plains beef",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Farmland Premium Meats",
        phone: "(816) 713-8800",
        website: "farmlandfoods.com",
        specialty: "Premium pork, beef, specialty cuts for catering",
        rating: 4.7,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Classic Party Rentals – KC",
        phone: "(816) 587-8700",
        website: "classicpartyrentals.com",
        specialty: "Tents, china, linen, glassware, catering equipment",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Kansas City Tent & Awning",
        phone: "(816) 842-7777",
        website: "kcta.com",
        specialty: "Custom tent solutions for outdoor events",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Brilliant Event Studios",
        phone: "(816) 221-8800",
        website: "brilliantevents.com",
        specialty: "Décor, lighting, specialty furniture rentals",
        rating: 4.7,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – KC",
        phone: "(816) 472-3900",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.5,
        isNational: true,
      },
      {
        name: "Heartland Staffing Agency",
        phone: "(816) 531-2700",
        website: "heartlandstaffing.com",
        specialty: "Experienced F&B professionals, corporate events",
        rating: 4.4,
        isNational: false,
      },
      {
        name: "ProStaff Hospitality – MO",
        phone: "(314) 231-4600",
        website: "prostaffhospitality.com",
        specialty: "Full-service catering and event staff",
        rating: 4.5,
        isNational: false,
      },
    ],
  },
  "7": {
    name: "South Central",
    majorCity: "Dallas / Houston",
    areaCode: "214",
    foodVendors: [
      {
        name: "Sysco Dallas",
        phone: "(214) 630-8787",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "US Foods – Houston",
        phone: "(713) 866-4200",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Gulf Coast seafood",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Lone Star Specialty Foods",
        phone: "(214) 741-3800",
        website: "lonestarspecialtyfoods.com",
        specialty: "Texas beef, Gulf seafood, specialty produce",
        rating: 4.8,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Party Reflections – Dallas",
        phone: "(214) 350-7370",
        website: "partyreflections.com",
        specialty: "Fine linen, china, flatware, glassware",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "Premiere Events – Austin",
        phone: "(512) 441-7469",
        website: "premiere-events.com",
        specialty: "Specialty décor, furniture, tents",
        rating: 4.8,
        isNational: false,
      },
      {
        name: "Marquee Event Rentals – TX",
        phone: "(214) 688-5500",
        website: "marqueerentals.com",
        specialty: "Full-service tent and equipment rental",
        rating: 4.6,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – TX",
        phone: "(214) 220-2700",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Texas Event Staffing",
        phone: "(214) 905-8700",
        website: "texaseventstaffing.com",
        specialty: "Bilingual F&B crews, large-format events",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "Alliance Staffing Solutions",
        phone: "(713) 790-1313",
        website: "alliancestaffingsolutions.com",
        specialty: "Hospitality, corporate, and catering staffing",
        rating: 4.4,
        isNational: false,
      },
    ],
  },
  "8": {
    name: "Mountain West",
    majorCity: "Denver / Phoenix",
    areaCode: "303",
    foodVendors: [
      {
        name: "Sysco Denver",
        phone: "(303) 371-0100",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "US Foods – Phoenix",
        phone: "(480) 350-3600",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Southwest specialties",
        rating: 4.5,
        isNational: true,
      },
      {
        name: "Rocky Mountain Natural Meats",
        phone: "(303) 825-1400",
        website: "rockymountainmeats.com",
        specialty: "Grass-fed beef, elk, bison, natural proteins",
        rating: 4.9,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Classic Party Rentals – Denver",
        phone: "(303) 455-1234",
        website: "classicpartyrentals.com",
        specialty: "Complete event rental, tents, china, linen",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Colorado Event Rentals",
        phone: "(303) 798-7700",
        website: "coloradoeventrentals.com",
        specialty: "Mountain-ready tents, heaters, rustic décor",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "PEAK Event Services – West",
        phone: "(303) 292-0720",
        website: "peakevents.com",
        specialty: "Specialty furniture, lighting, lounge packages",
        rating: 4.5,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – CO",
        phone: "(303) 298-8600",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Mountain West Staffing",
        phone: "(303) 534-1900",
        website: "mountainweststaffing.com",
        specialty: "Resort, hotel, and catering professionals",
        rating: 4.5,
        isNational: false,
      },
      {
        name: "AZ Event Staffing",
        phone: "(480) 558-1200",
        website: "azeventstaffing.com",
        specialty: "Full-service F&B crews for SW events",
        rating: 4.4,
        isNational: false,
      },
    ],
  },
  "9": {
    name: "Pacific West",
    majorCity: "Los Angeles / San Francisco",
    areaCode: "213",
    foodVendors: [
      {
        name: "Sysco Los Angeles",
        phone: "(213) 747-8787",
        website: "sysco.com",
        specialty: "Full-line wholesale food distribution",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "US Foods – Pacific",
        phone: "(213) 628-9000",
        website: "usfoods.com",
        specialty: "Restaurant & catering supply, Pacific seafood",
        rating: 4.6,
        isNational: true,
      },
      {
        name: "Regalis Foods – West Coast",
        phone: "(213) 344-0300",
        website: "regalisfoods.com",
        specialty: "Luxury truffles, caviar, wagyu, premium imports",
        rating: 4.9,
        isNational: false,
      },
    ],
    rentalVendors: [
      {
        name: "Classic Party Rentals – LA",
        phone: "(213) 612-2800",
        website: "classicpartyrentals.com",
        specialty: "Complete event rental inventory, premium china",
        rating: 4.7,
        isNational: false,
      },
      {
        name: "Bright Event Rentals – Bay Area",
        phone: "(415) 869-8800",
        website: "brightevents.com",
        specialty: "Specialty décor, furniture, farm-table packages",
        rating: 4.8,
        isNational: false,
      },
      {
        name: "PEAK Event Services – Pacific",
        phone: "(415) 551-3900",
        website: "peakevents.com",
        specialty: "Luxury tents, staging, high-end linen",
        rating: 4.7,
        isNational: false,
      },
    ],
    staffingVendors: [
      {
        name: "Hospitality Staffing Solutions – CA",
        phone: "(213) 629-9200",
        website: "hsstaffing.com",
        specialty: "Banquet servers, stewards, kitchen support",
        rating: 4.7,
        isNational: true,
      },
      {
        name: "ACES Event Staffing",
        phone: "(310) 444-8800",
        website: "aceseventstaffing.com",
        specialty: "High-end event crews for luxury LA events",
        rating: 4.6,
        isNational: false,
      },
      {
        name: "Bay Area Event Staff",
        phone: "(415) 777-5500",
        website: "bayareaeventstaff.com",
        specialty: "Union-affiliated servers, bartenders, captains",
        rating: 4.5,
        isNational: false,
      },
    ],
  },
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Given any 5-digit US ZIP code, returns simulated regional sourcing data
 * across three vendor categories: Wholesale Food, Event Rentals, and
 * Local Staffing Agencies.
 *
 * Falls back to the "Central Plains" region for invalid or unrecognised ZIPs.
 */
export function getRegionalSourcing(zipCode: string): RegionalSourcing {
  const cleaned = zipCode.replace(/\D/g, "").slice(0, 5);
  const firstDigit = cleaned.charAt(0) || "6";
  const meta = REGIONS[firstDigit] ?? REGIONS["6"];

  const makeVendors = (
    list: Omit<RegionalVendor, "type">[],
    type: VendorType
  ): RegionalVendor[] =>
    list.map((v) => ({ ...v, type }));

  const categories: VendorCategory[] = [
    {
      id: "wholesale_food",
      label: "Wholesale Food Distributors",
      description:
        "Full-line and specialty food distributors that supply catering-grade proteins, produce, and dry goods in bulk.",
      vendors: makeVendors(meta.foodVendors, "wholesale_food"),
    },
    {
      id: "event_rentals",
      label: "Event Rental Companies",
      description:
        "Local vendors for tents, tables, chairs, fine china, linens, glassware, and specialty décor.",
      vendors: makeVendors(meta.rentalVendors, "event_rentals"),
    },
    {
      id: "staffing",
      label: "Local Staffing Agencies",
      description:
        "Agencies providing trained servers, bartenders, kitchen support staff, and event captains on a per-event basis.",
      vendors: makeVendors(meta.staffingVendors, "staffing"),
    },
  ];

  return {
    zipCode: cleaned || zipCode,
    region: meta.name,
    majorCity: meta.majorCity,
    categories,
  };
}

/** Returns a star string for a numeric rating. */
export function ratingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}
