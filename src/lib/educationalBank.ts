/**
 * Educational Bank — Catering By Wendy Knowledge Base
 *
 * Authoritative Q&A content for the NBS Concierge chat widget and the
 * in-app Educational Bank page.  All answers are written in the
 * "hotel concierge" voice: warm, formal, precise, and unhurried.
 *
 * Matching: weighted keyword scoring — multi-word phrases score 3,
 * single keywords score 1.  Score > 0 → use this entry; 0 → escalate.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KBEntry {
  id: string;
  title: string;
  category: "BEO" | "Service Tiers" | "Logistics" | "Staffing" | "Finance" | "Culinary";
  keywords: string[];
  shortAnswer: string;
  fullAnswer: string;
  followUps: string[];
}

export interface KBMatch {
  entry: KBEntry;
  score: number;
}

export const ESCALATION_EMAIL = "northbusinessservices@gmail.com";

// ── Knowledge Base ────────────────────────────────────────────────────────────

export const KNOWLEDGE_BASE: KBEntry[] = [
  // ─── BEO Basics ─────────────────────────────────────────────────────────────
  {
    id: "beo-overview",
    title: "How to Read a Banquet Event Order (BEO)",
    category: "BEO",
    keywords: [
      "beo",
      "banquet event order",
      "banquet order",
      "event order",
      "read beo",
      "what is a beo",
      "what is beo",
      "beo mean",
      "beo document",
      "beo form",
      "understand beo",
    ],
    shortAnswer:
      "A BEO is the master contract for your event — covering the menu, timeline, staffing, and billing in one authoritative document.",
    fullAnswer: `A Banquet Event Order — commonly called a BEO — is the definitive contract that governs every detail of your catering event. Our kitchen team, service captain, and venue contact all operate from this single document on the day of your event.

<strong>The Event Header</strong> — Confirms your event name, venue, date, service start and end times, and the guaranteed guest count. This count is locked in forty-eight hours prior and forms the basis for our staffing and food quantities.

<strong>The Menu Section</strong> — Lists every course in service order, from passed hors d'oeuvres through dessert, along with all noted dietary accommodations (vegetarian, vegan, nut-free, gluten-free). Please review this section with particular care; changes beyond this stage may affect your final pricing.

<strong>The Run of Show / Timeline</strong> — The heartbeat of your event. It details kitchen prep start time, each service window, bar program schedule, and final breakdown time. Our team follows this timeline to the minute.

<strong>Staffing</strong> — Lists the number and roles of all personnel assigned to your event: event captain, servers, kitchen staff, and bar crew.

<strong>Special Instructions</strong> — Captures everything unique to your event: room layout diagram, décor and floral notes, music handoff cues, and VIP table designations.

<strong>The Financial Summary</strong> — Closes the document with subtotals, service charge, applicable tax, and the balance due. We recommend reviewing this carefully alongside your original proposal.

Should you receive your BEO and have questions about any section, I am most delighted to assist you.`,
    followUps: [
      "What is a guaranteed guest count?",
      "When is my final payment due?",
      "How much notice do you need for dietary changes?",
    ],
  },

  // ─── BEO — Timeline & Sections ─────────────────────────────────────────────
  {
    id: "beo-timeline",
    title: "BEO Timeline and Run of Show",
    category: "BEO",
    keywords: [
      "run of show",
      "beo timeline",
      "event timeline",
      "service window",
      "beo checklist",
      "beo schedule",
      "beo breakdown",
      "event schedule",
      "guaranteed guest count",
      "guest count",
      "guest guarantee",
    ],
    shortAnswer:
      "The BEO timeline maps out every service window, from kitchen prep through breakdown — our team follows it to the minute.",
    fullAnswer: `The Run of Show is the document that transforms your vision into an executable sequence. Each entry carries a precise time, a responsible team member, and a deliverable.

<strong>A Typical 6:00 PM Dinner Timeline:</strong>
<ul>
<li>12:00 PM — Rental delivery received and inventoried</li>
<li>1:00 PM — Kitchen crew arrives; prep commences</li>
<li>2:00 PM — Front-of-house crew arrives; tables, linens, and place settings dressed</li>
<li>3:30 PM — Bar program staged and stocked</li>
<li>5:00 PM — Final walk-through with client or coordinator</li>
<li>5:30 PM — Passed hors d'oeuvres begin</li>
<li>6:00 PM — Doors open; first-course service</li>
<li>9:30 PM — Dessert and coffee service</li>
<li>10:00 PM — Service concludes; breakdown begins</li>
<li>11:30 PM — Venue cleared; rental items staged for morning pickup</li>
</ul>

<strong>The Guaranteed Guest Count</strong> is confirmed forty-eight hours prior to your event. This number determines the final food quantities ordered, the staffing levels, and your final invoice. Counts may increase up to this deadline; decreases after that point are typically not reflected in the invoice as food has been procured.

<strong>Breakdown</strong> typically takes ninety minutes to two hours. Our crew manages all food consolidation, equipment cleaning, and waste removal, leaving your venue in pristine condition.`,
    followUps: [
      "How many staff will you bring to my event?",
      "What happens if my guest count changes?",
      "How early should I arrive on event day?",
    ],
  },

  // ─── Service Tiers ──────────────────────────────────────────────────────────
  {
    id: "service-tiers",
    title: "Catering By Wendy Service Tiers",
    category: "Service Tiers",
    keywords: [
      "tier",
      "service level",
      "service plan",
      "basic plan",
      "professional plan",
      "enterprise plan",
      "basic tier",
      "professional tier",
      "enterprise tier",
      "what do you offer",
      "subscription",
      "pricing plan",
      "upgrade",
      "plan difference",
      "what is included",
      "features",
    ],
    shortAnswer:
      "We offer three service levels — Basic (browse), Professional (pricing intelligence), and Enterprise (full agent suite) — each designed for a distinct stage of catering engagement.",
    fullAnswer: `Catering By Wendy offers three thoughtfully designed service levels to match precisely where you are in your catering journey.

<strong>Basic — Browse &amp; Explore</strong>
Our introductory level grants full read access to our menu collection, recipe library, and ingredient search. It is ideally suited for prospective clients reviewing our offerings or new team members familiarizing themselves with our repertoire. No import or pricing tools are included.

<strong>Professional — Price Intelligence</strong>
Our most-selected plan for active caterers and event coordinators. Professional encompasses everything in Basic, and adds:
<ul>
<li>Recipe import from any URL, PDF, or image (OCR)</li>
<li>Live local market ingredient pricing and cost comparisons</li>
<li>Full cost-per-serving analysis and recipe scaling</li>
</ul>

<strong>Enterprise — Full Agent Suite</strong>
Our premier offering, crafted for established catering operations that demand the full toolkit:
<ul>
<li>Everything in Professional</li>
<li>AI agent tools — local LLM-assisted planning and Q&amp;A</li>
<li>Broad market pricing analysis across regional suppliers</li>
<li>Exclusive access to the Educational Bank — the knowledge resource you are exploring right now</li>
</ul>

To discuss which level best serves your operation, or to arrange an upgrade, please reach out at <a href="mailto:northbusinessservices@gmail.com" style="color:#58a6ff;text-decoration:underline">northbusinessservices@gmail.com</a> and we will arrange a brief consultation at your convenience.`,
    followUps: [
      "How do I upgrade my service level?",
      "What is the Educational Bank?",
      "Can I try Professional before committing?",
    ],
  },

  // ─── Rental Logistics ───────────────────────────────────────────────────────
  {
    id: "rentals",
    title: "Equipment & Rental Logistics",
    category: "Logistics",
    keywords: [
      "rental",
      "rent",
      "equipment",
      "linen",
      "linens",
      "chair",
      "chairs",
      "table",
      "tables",
      "tent",
      "china",
      "dishes",
      "glassware",
      "flatware",
      "silverware",
      "place settings",
      "tableware",
      "rental company",
      "rental delivery",
      "what do you provide",
      "what is included",
      "bring",
    ],
    shortAnswer:
      "Rentals follow a tiered reservation timeline — tents 6–8 weeks out, furnishings 2–3 weeks, place settings 1–2 weeks. We coordinate delivery and returns on your behalf.",
    fullAnswer: `Equipment rentals are a cornerstone of a beautifully executed event, and we coordinate them seamlessly through our established network of trusted rental partners.

<strong>Reservation Timeline:</strong>
<ul>
<li><strong>Tents &amp; outdoor structures</strong> — Six to eight weeks in advance. Peak-season availability is limited; early reservation is strongly advised.</li>
<li><strong>Tables, chairs &amp; linens</strong> — Two to three weeks prior to your event date, with adjustments possible up to one week out.</li>
<li><strong>China, glassware &amp; silverware</strong> — One to two weeks out. Final piece counts are adjusted at the forty-eight-hour mark alongside your guaranteed guest count.</li>
<li><strong>Audio/visual &amp; specialty equipment</strong> — Sourced and confirmed one week prior.</li>
</ul>

<strong>What We Bring vs. What Is Rented:</strong>
Catering By Wendy arrives fully equipped for food preparation — including all chafing dishes, serving platters, carving stations, and kitchen tools. Guest-facing items — tables, chairs, linens, china, and glassware — are typically rented and invoiced separately unless explicitly included in your proposal.

<strong>Day-of Delivery &amp; Return:</strong>
All rentals are coordinated to arrive at least one hour before our crew begins setup. We receive, inventory, and stage every piece. At the event's conclusion, our team cleans, consolidates, and prepares all rental items for pickup — leaving you with nothing to coordinate.

Should any rental item arrive damaged or incomplete, we manage the replacement directly with the vendor so that your event is never affected.`,
    followUps: [
      "What are your setup times?",
      "Do you bring your own serving equipment?",
      "How do I add linens to my proposal?",
    ],
  },

  // ─── Setup Times ────────────────────────────────────────────────────────────
  {
    id: "setup-times",
    title: "Setup Times & Day-of Logistics",
    category: "Logistics",
    keywords: [
      "setup time",
      "set up",
      "arrival time",
      "how early",
      "when do you arrive",
      "setup window",
      "how long to set up",
      "breakdown",
      "tear down",
      "cleanup",
      "when do you leave",
      "logistics",
      "day of",
      "day-of",
      "before event",
    ],
    shortAnswer:
      "Our setup windows scale with event size — 2 hours for intimate gatherings, up to 6 hours for grand events of 150+. We always complete a full walk-through one hour before service.",
    fullAnswer: `Our approach to setup is simple: we are fully prepared well before your first guest arrives, so that you are never waiting and never worrying.

<strong>Standard Setup Windows by Event Size:</strong>
<ul>
<li><strong>Intimate gatherings (up to 50 guests)</strong> — Our team arrives two hours prior to service.</li>
<li><strong>Mid-size events (51–149 guests)</strong> — We arrive three to four hours in advance.</li>
<li><strong>Grand events (150+ guests)</strong> — Setup begins four to six hours before service, with a comprehensive walk-through completed one hour prior to doors opening.</li>
</ul>

<strong>The Day-of Timeline (using a 6:00 PM service as an example):</strong>
<ul>
<li>12:00 PM — Rentals received, inventoried, and staged by our crew</li>
<li>1:00 PM — Kitchen prep commences</li>
<li>2:00 PM — Front-of-house setup: tables dressed, linens pressed and fitted, place settings arranged</li>
<li>3:30 PM — Bar program staged and fully stocked</li>
<li>5:00 PM — Walk-through with client or event coordinator</li>
<li>6:00 PM — Service begins</li>
<li>10:00 PM — Service concludes; breakdown begins</li>
<li>11:30 PM — Venue cleared; rental items staged for morning pickup</li>
</ul>

<strong>Breakdown &amp; Departure:</strong>
Our crew manages all food consolidation, dishware cleaning, and waste removal. The complete breakdown process takes approximately ninety minutes to two hours. We leave your venue in the same — or better — condition in which we found it.`,
    followUps: [
      "How many staff will you bring?",
      "What if I need an earlier setup time?",
      "When is my final guest count due?",
    ],
  },

  // ─── Staffing ───────────────────────────────────────────────────────────────
  {
    id: "staffing",
    title: "Staffing Ratios & Team Roles",
    category: "Staffing",
    keywords: [
      "staff",
      "staffing",
      "server",
      "servers",
      "bartender",
      "bartenders",
      "crew",
      "how many staff",
      "workers",
      "wait staff",
      "waitstaff",
      "service team",
      "event captain",
      "captain",
      "kitchen staff",
      "gratuity",
      "tip",
      "service charge",
    ],
    shortAnswer:
      "Our staffing ratios: 1 server per 8–10 guests (plated), 1 per 20–25 (buffet), 1 bartender per 75 guests. Every event includes a senior event captain as your single point of contact.",
    fullAnswer: `Our staffing ratios are calibrated to provide a gracious, unhurried experience for every guest in the room — never rushed, never understaffed.

<strong>Service Ratios by Format:</strong>
<ul>
<li><strong>Plated dinner service:</strong> One dedicated server per eight to ten guests — ensuring synchronized, timely course delivery.</li>
<li><strong>Buffet service:</strong> One attendant per twenty to twenty-five guests — managing station replenishment, guest assistance, and continuous cleanliness.</li>
<li><strong>Bar — beer &amp; wine:</strong> One bartender per seventy-five guests.</li>
<li><strong>Bar — full open bar:</strong> One bartender per fifty guests.</li>
<li><strong>Cocktail reception (passed hors d'oeuvres):</strong> One server per fifteen to twenty guests for smooth, continuous circulation.</li>
</ul>

<strong>Team Roles:</strong>
<ul>
<li><strong>Event Captain</strong> — Present for every event, the captain oversees the entire service team, coordinates directly with the kitchen, communicates any changes to you in real time, and serves as your single point of contact throughout the evening.</li>
<li><strong>Kitchen Lead</strong> — Manages all back-of-house operations, timing, and plating to specification.</li>
<li><strong>Service Staff</strong> — Trained in formal service protocols, dietary accommodation awareness, and hospitality standards.</li>
</ul>

<strong>Gratuity:</strong>
A service charge of twenty percent is applied to your final invoice and distributed among our entire team. Any additional gratuity for exceptional service is entirely at your discretion and is warmly appreciated by the individuals who made your evening memorable.`,
    followUps: [
      "What does the event captain do exactly?",
      "What are your setup times?",
      "Is gratuity included in my proposal?",
    ],
  },

  // ─── Pricing ────────────────────────────────────────────────────────────────
  {
    id: "pricing",
    title: "Catering Pricing Overview",
    category: "Finance",
    keywords: [
      "price",
      "pricing",
      "cost",
      "how much",
      "per person",
      "rate",
      "quote",
      "proposal",
      "estimate",
      "budget",
      "affordable",
      "expensive",
      "price range",
      "average cost",
      "catering cost",
      "total cost",
      "minimum",
    ],
    shortAnswer:
      "Our pricing begins with a precise cost-per-serving analysis and scales with service format. Typical ranges: $22–$35 corporate lunch, $42–$55 buffet dinner, $58–$75 plated dinner, $75–$95 wedding reception.",
    fullAnswer: `Our pricing is built on complete transparency. Every proposal begins with a detailed ingredient cost analysis — sourced from current market pricing — to which we apply our standard service markup, staffing costs, and any logistics specific to your event.

<strong>Typical Price-Per-Person Ranges:</strong>
<ul>
<li><strong>Corporate Box Lunch:</strong> $22–$35 per person</li>
<li><strong>Cocktail Reception (passed hors d'oeuvres):</strong> $18–$28 per person</li>
<li><strong>Buffet Dinner:</strong> $42–$55 per person</li>
<li><strong>Plated Three-Course Dinner:</strong> $58–$75 per person</li>
<li><strong>Wedding Reception (four-course):</strong> $75–$95 per person</li>
</ul>

These ranges reflect food and direct labor. <em>The following are invoiced separately unless otherwise specified in your proposal:</em> rental furnishings, specialty bar programs, florals, and audio/visual services.

<strong>Minimum Event Size:</strong>
We are pleased to accommodate events of all sizes; however, a minimum food and beverage spend applies to events below thirty guests. Please inquire for specific minimums based on your date and service style.

<strong>Custom Proposals:</strong>
Every event is unique, and we believe your proposal should reflect that precisely. We invite you to contact us at <a href="mailto:northbusinessservices@gmail.com" style="color:#58a6ff;text-decoration:underline">northbusinessservices@gmail.com</a> so that we may prepare a fully itemized, no-obligation proposal tailored to your vision.`,
    followUps: [
      "What is included in the service charge?",
      "When is my deposit due?",
      "Can I see a sample proposal?",
    ],
  },

  // ─── Payments & Deposits ────────────────────────────────────────────────────
  {
    id: "payments",
    title: "Payment Schedule & Deposits",
    category: "Finance",
    keywords: [
      "deposit",
      "payment",
      "pay",
      "invoice",
      "balance due",
      "when is payment",
      "payment schedule",
      "how much deposit",
      "refund",
      "cancellation",
      "credit card",
      "check",
      "bank transfer",
      "ach",
      "final payment",
      "down payment",
    ],
    shortAnswer:
      "A 25% deposit secures your date. 50% is due 30 days out. The balance is settled on or before event day.",
    fullAnswer: `Our payment schedule is designed to be clear, fair, and free of surprises.

<strong>Standard Payment Schedule:</strong>
<ul>
<li><strong>Deposit (25%)</strong> — Due upon signing of the catering agreement. This retainer is non-refundable and secures your event date exclusively for you.</li>
<li><strong>Second Payment (50%)</strong> — Due thirty days prior to your event, based on the estimated total in your proposal.</li>
<li><strong>Final Balance</strong> — Due on or before event day, adjusted to reflect your confirmed guaranteed guest count and any approved additions.</li>
</ul>

<strong>Accepted Payment Methods:</strong>
We accept personal or business check, bank transfer (ACH), and all major credit cards. A processing fee of 2.9% applies to credit card transactions; check and ACH carry no additional fees.

<strong>Cancellation Policy:</strong>
The deposit is non-refundable in all circumstances, as it covers date reservation and early planning costs. Cancellations received more than thirty days prior to the event will receive a full refund of the second payment. Cancellations within thirty days are subject to the full contracted amount.

For questions regarding your invoice, or to discuss a payment arrangement, please reach out at <a href="mailto:northbusinessservices@gmail.com" style="color:#58a6ff;text-decoration:underline">northbusinessservices@gmail.com</a>.`,
    followUps: [
      "What is your cancellation policy?",
      "How much is the service charge?",
      "Can I pay in installments?",
    ],
  },

  // ─── Dietary Accommodations ─────────────────────────────────────────────────
  {
    id: "dietary",
    title: "Dietary Accommodations & Allergies",
    category: "Culinary",
    keywords: [
      "dietary",
      "allergy",
      "allergies",
      "gluten",
      "gluten-free",
      "nut",
      "nut-free",
      "peanut",
      "vegan",
      "vegetarian",
      "dairy-free",
      "dairy free",
      "kosher",
      "halal",
      "low sodium",
      "special diet",
      "food restriction",
      "accommodate",
      "celiac",
    ],
    shortAnswer:
      "We routinely accommodate gluten-free, nut-free, vegan, vegetarian, dairy-free, and low-sodium needs. All restrictions must be submitted 72 hours prior so we may source appropriately.",
    fullAnswer: `Accommodating dietary needs is not merely a courtesy for us — it is a professional obligation we take seriously at every step of preparation.

<strong>Needs We Handle Routinely:</strong>
<ul>
<li><strong>Gluten-free</strong> — Prepared in a dedicated area with separate utensils and serving pieces; clearly labeled on the BEO and day-of.</li>
<li><strong>Nut-free</strong> — Full kitchen protocol applied; upon request, we can arrange an allergen-controlled environment for severe sensitivities.</li>
<li><strong>Vegan &amp; vegetarian</strong> — Full alternative courses for every menu stage, prepared to the same standard as the primary menu.</li>
<li><strong>Dairy-free</strong> — Sourcing and preparation adjustments made throughout all applicable courses.</li>
<li><strong>Kosher-style</strong> — Advance coordination required; please submit at least two weeks prior so appropriate sourcing arrangements can be confirmed.</li>
<li><strong>Low-sodium</strong> — Available with advance notice for any course.</li>
</ul>

<strong>Submission Deadline:</strong>
All dietary restrictions must be submitted no later than seventy-two hours prior to your event. This allows our kitchen team to source the appropriate ingredients and prepare dedicated portions.

<strong>Day-of Handling:</strong>
Every dietary accommodation is plated separately, labeled distinctly, and delivered to the correct guest by name when possible. For buffet events, allergen-safe stations are marked clearly with prominent signage.

Last-minute accommodations can sometimes be arranged — please ask, and we will do our very best.`,
    followUps: [
      "How do I submit dietary restrictions?",
      "Can you handle severe nut allergies?",
      "Where do I note dietary needs on the BEO?",
    ],
  },
];

// ── Matching Logic ────────────────────────────────────────────────────────────

/**
 * Score a question against the knowledge base and return the best match.
 * Returns null if no entry scores above zero.
 */
export function queryKnowledgeBase(question: string): KBMatch | null {
  const lower = question.toLowerCase().trim();
  if (!lower) return null;

  let best: KBMatch | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        // Multi-word phrases (spaces) get higher weight
        score += kw.includes(" ") ? 3 : 1;
      }
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { entry, score };
    }
  }

  return best;
}

// ── Response Builders ─────────────────────────────────────────────────────────

const CONCIERGE_OPENERS = [
  "Certainly — allow me to assist you with that.",
  "But of course — I am delighted to help.",
  "Excellent question — here is everything you need to know.",
  "My pleasure — please allow me to explain.",
  "Of course — I would be most happy to clarify.",
  "A wonderful question — here is our guidance on that.",
];

/** Returns a concierge-toned response for a matched KB entry. */
export function buildConciergeResponse(entry: KBEntry): string {
  const opener =
    CONCIERGE_OPENERS[Math.floor(Math.random() * CONCIERGE_OPENERS.length)];
  return `${opener}\n\n${entry.fullAnswer}`;
}

/** Returns the escalation message when no KB match is found. */
export function getEscalationMessage(): string {
  return `Thank you for your inquiry. While our knowledge base does not have a prepared answer for this particular question at this time, our team would be most delighted to assist you personally.\n\nPlease reach out directly to our events team at <a href="mailto:${ESCALATION_EMAIL}" style="color:#58a6ff;text-decoration:underline">${ESCALATION_EMAIL}</a> — we endeavor to respond within one business day.\n\nIs there anything else I may clarify for you today?`;
}

/** Returns a time-appropriate greeting for the concierge. */
export function getConciergeGreeting(): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${period}. I am your Catering By Wendy concierge — at your service.\n\nYou may ask me about <strong>Banquet Event Orders</strong>, <strong>service tiers</strong>, <strong>rental logistics</strong>, <strong>setup timelines</strong>, <strong>staffing</strong>, <strong>pricing</strong>, or <strong>dietary accommodations</strong>. I am here to assist.`;
}

/** Returns categories grouped for display. */
export function getKBByCategory(): Record<string, KBEntry[]> {
  const map: Record<string, KBEntry[]> = {};
  for (const entry of KNOWLEDGE_BASE) {
    if (!map[entry.category]) map[entry.category] = [];
    map[entry.category].push(entry);
  }
  return map;
}

/** Suggested quick questions shown in the chat widget. */
export const QUICK_QUESTIONS = [
  "How do I read a BEO?",
  "What are your service levels?",
  "What are your setup times?",
  "How does rental equipment work?",
  "What are your staffing ratios?",
  "How much does catering cost?",
];
