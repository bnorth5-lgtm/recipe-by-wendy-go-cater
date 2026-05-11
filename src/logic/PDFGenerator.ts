import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { EventState } from "@/context/EventContext";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";
import { PACKET_01_12_GOLD_DATA_URI } from "@/branding/packet-01-12-gold-data-uri";

const NAVY_RGB: [number, number, number] = [10, 22, 40]; // #0a1628 (dashboard hero strip)

const DCE_SIGNATURE_LEGAL_FOOTER =
  "This DCE Masterpiece is a binding agreement for the Harrison, Maine Infrastructure-Zero Demo.";

/** Options for ceremonial seal timestamps on the Signature Block */
export interface ProposalPdfOptions {
  sealIssuedAtISO?: string;
}

function decodePacketForPdf(): { dataUrl: string; format: "JPEG" | "PNG" } | null {
  const uri = PACKET_01_12_GOLD_DATA_URI.trim();
  if (uri.includes("image/svg+xml")) return null;
  if (uri.includes("image/png")) return { dataUrl: uri, format: "PNG" };
  if (/image\/jpe?g/i.test(uri)) return { dataUrl: uri, format: "JPEG" };
  return null;
}

function drawPacketHeaderBand(
  doc: jsPDF,
  margin: number,
  contentWidth: number,
  startY: number
): number {
  const bandH = 1.02;
  doc.setFillColor(NAVY_RGB[0], NAVY_RGB[1], NAVY_RGB[2]);
  doc.rect(margin, startY, contentWidth, bandH, "F");

  const packet = decodePacketForPdf();
  if (packet) {
    try {
      const props = doc.getImageProperties(packet.dataUrl);
      const maxW = contentWidth - 0.45;
      const maxH = bandH - 0.14;
      const ratio = props.width / props.height;
      let iw = maxW;
      let ih = iw / ratio;
      if (ih > maxH) {
        ih = maxH;
        iw = ih * ratio;
      }
      const ix = margin + (contentWidth - iw) / 2;
      const iy = startY + (bandH - ih) / 2;
      doc.addImage(packet.dataUrl, packet.format, ix, iy, iw, ih);
    } catch {
      /* fall through */
    }
  }

  return startY + bandH + 0.16;
}

function appendEbWMasterpieceSignatureBlock(
  doc: jsPDF,
  margin: number,
  contentWidth: number,
  gold: number[],
  slate: number[],
  slateLight: number[],
  companyName: string,
  sealIssuedAtISO: string
): void {
  doc.addPage();
  let y = margin;

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("DCE Masterpiece — Signature Module", margin, y);
  y += 0.35;

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.02);
  doc.line(margin, y, margin + contentWidth, y);
  y += 0.35;

  const humanStamp = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date(sealIssuedAtISO));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Client Acceptance", margin, y);
  y += 0.22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  const acceptBody =
    `The undersigned acknowledges review of this DCE proposal and intends this document as authorization to proceed according to its investment schedule, amendments, ` +
    `and venue allowances for ${companyName}.`;
  doc.splitTextToSize(acceptBody, contentWidth).forEach((line: string) => {
    doc.text(line, margin, y);
    y += 0.16;
  });
  y += 0.06;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("Timestamp:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(humanStamp, margin + 0.82, y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text(`(UTC reference: ${sealIssuedAtISO})`, margin, y + 0.14);
  y += 0.52;

  doc.setDrawColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.line(margin, y, margin + 3.2, y);
  y += 0.18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text("Printed name & title (Client)", margin, y);
  y += 0.55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("DCE Authorized Signature", margin, y);
  y += 0.22;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("Delicious Catering & Events by Wendy — DCE brand authority", margin, y);
  y += 0.35;

  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(margin, y, margin + 3.5, y);
  y += 0.18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text("Wendy — DCE Culinary Command", margin, y);
  y += 0.55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Legal notice", margin, y);
  y += 0.18;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  const legalLines = doc.splitTextToSize(DCE_SIGNATURE_LEGAL_FOOTER, contentWidth);
  legalLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 0.14;
  });
}

export const ExportMasterpiecePDF = async (
  mapElementId: string,
  eventDetails: { name: string; totalCost: number; region: string; items: { name: string; cost: number; source: string }[] }
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const margin = 0.5;
  const pageWidth = 8.5;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const gold = [251, 191, 36];
  const slate = [15, 23, 42];
  const slateLight = [100, 116, 139];

  let currentY = drawPacketHeaderBand(doc, margin, contentWidth, margin);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("DCE Masterpiece Ledger", margin, currentY);
  currentY += 0.32;

  doc.setFontSize(13);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(`Event: ${eventDetails.name} | Region: ${eventDetails.region}`, margin, currentY);
  currentY += 0.48;

  // --- 3D MAP VIEW (Harrison Field) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("1. Harrison Field Layout", margin, currentY);
  currentY += 0.3;

  const mapEl = document.getElementById(mapElementId);
  if (mapEl) {
    try {
      const canvas = await html2canvas(mapEl, { scale: 2, useCORS: true, backgroundColor: "#0f172a" });
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const imgProps = doc.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      // Check page break
      if (currentY + pdfHeight > 10.5) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.addImage(imgData, "JPEG", margin, currentY, contentWidth, pdfHeight);
      currentY += pdfHeight + 0.5;
    } catch (err) {
      console.error("Failed to capture map:", err);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.text("[Map Capture Failed]", margin, currentY);
      currentY += 0.5;
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.text("[Map Element Not Found]", margin, currentY);
    currentY += 0.5;
  }

  // --- ITEMIZED COST LIST (Scout_NBS) ---
  if (currentY > 9) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("2. Market Intelligence (Scout_NBS)", margin, currentY);
  currentY += 0.3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  eventDetails.items.forEach(item => {
    if (currentY > 10.5) { doc.addPage(); currentY = margin; }
    doc.text(`• ${item.name}: $${item.cost.toFixed(2)} (Source: ${item.source})`, margin + 0.2, currentY);
    currentY += 0.25;
  });

  currentY += 0.25;
  doc.setFont("helvetica", "bold");
  doc.text(`Total Estimated Cost: $${eventDetails.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin, currentY);
  currentY += 0.5;

  // --- SIGNATURE PAPERS (Legal_Eagle) ---
  if (currentY > 8) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("3. Legal Eagle Clauses & Signatures", margin, currentY);
  currentY += 0.3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const legalText = [
    "1. INFRASTRUCTURE ZERO: Client acknowledges that off-grid events require specialized power and water protocols. Any deviation from the agreed 100ft power run limit voids the service guarantee.",
    "2. PROFIT LOCK: Prices are secured based on real-time Scout_NBS market data. Significant market fluctuations prior to the 30-day lock-in may require adjustments.",
    "3. LIABILITY: Delicious Catering & Events by Wendy is not liable for weather-related disruptions to outdoor structures (e.g., 40x60 tents) beyond standard safety ratings."
  ];

  legalText.forEach(clause => {
    const lines = doc.splitTextToSize(clause, contentWidth);
    lines.forEach((line: string) => {
      if (currentY > 10.5) { doc.addPage(); currentY = margin; }
      doc.text(line, margin, currentY);
      currentY += 0.2;
    });
    currentY += 0.1;
  });

  currentY += 0.5;
  doc.line(margin, currentY, margin + 3, currentY);
  doc.text("Client Signature", margin, currentY + 0.2);
  
  doc.line(margin + 4, currentY, margin + 7, currentY);
  doc.text("Date", margin + 4, currentY + 0.2);

  appendEbWMasterpieceSignatureBlock(
    doc,
    margin,
    contentWidth,
    gold,
    slate,
    slateLight,
    NBS_COMPANY_CONFIG.legalName,
    new Date().toISOString()
  );

  // Save PDF
  doc.save(`DCE_Masterpiece_${eventDetails.name.replace(/\s+/g, '_')}.pdf`);
  return { success: true };
};

export const generateProposalPDF = async (
  eventState: EventState,
  mapElementId: string,
  brandState?: any,
  options?: ProposalPdfOptions
) => {
  // 1. Initialize PDF: Letter size (8.5 x 11 inches), 0.5 inch margins
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const margin = 0.5;
  const pageWidth = 8.5;
  const contentWidth = pageWidth - margin * 2;
  const sealIssuedAtISO = options?.sealIssuedAtISO ?? new Date().toISOString();

  // Colors
  const gold = [251, 191, 36]; // #fbbf24
  const slate = [15, 23, 42]; // slate-950
  const slateLight = [100, 116, 139]; // slate-500

  const companyName = brandState?.companyName || NBS_COMPANY_CONFIG.legalName;
  const primaryColorHex = brandState?.primaryColor || "#fbbf24";

  // Convert hex to rgb for jsPDF
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [251, 191, 36]; // Default gold
  };
  const brandColor = hexToRgb(primaryColorHex);

  const contactInfo = brandState ? `${brandState.contactPhone} | ${brandState.contactEmail}` : "New Hampshire LLC";

  const blueprintTitle = brandState?.selectedTier === "production"
    ? "DCE ~ MainVision Production Blueprint"
    : brandState?.selectedTier === "staffed"
      ? "DCE ~ Delicious Staffed Events Blueprint"
      : "DCE ~ Delicious Express & Setup Blueprint";

  // --- HEADER — navy hero strip + PACKET brand art (dashboard parity)
  let currentY = drawPacketHeaderBand(doc, margin, contentWidth, margin);

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(companyName, margin, currentY);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  currentY += 0.22;
  doc.text(`${contactInfo} · ${blueprintTitle}`, margin, currentY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  currentY += 0.32;
  doc.text(eventState.eventName, margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  currentY += 0.22;
  doc.text(`Guests: ${eventState.totalGuests} | Staff: ${eventState.staffCount}`, margin, currentY);

  currentY += 0.34;

  // --- MAP SNAPSHOT ---
  const mapElement = document.getElementById(mapElementId);
  if (mapElement) {
    try {
      // Temporarily adjust styles for a cleaner capture if needed
      const canvas = await html2canvas(mapElement, {
        scale: 2, // High fidelity
        useCORS: true,
        backgroundColor: "#0f172a", // Match slate-950 background
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Calculate aspect ratio to fit within content width
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Draw map title
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
      doc.text("Venue Architecture & Atmosphere", margin, currentY);
      currentY += 0.2;

      // Draw image
      doc.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 0.4;
    } catch (error) {
      console.error("Failed to capture map snapshot:", error);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("[Map Snapshot Unavailable]", margin, currentY);
      currentY += 0.3;
    }
  }

  // Check if we need a new page for pricing
  if (currentY > 7.5) {
    doc.addPage();
    currentY = margin + 0.3;
  }

  // --- PRICING BUCKETS ---
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Investment Breakdown", margin, currentY);
  currentY += 0.3;

  // Calculations
  const laborCost = eventState.staffCount * eventState.hourlyRate * eventState.estimatedHours;
  const baseLogistics = eventState.mileage * 2 * 0.725;
  const remoteSurcharge = eventState.mileage > 30 ? 250 : 0;
  const logisticsCost = baseLogistics + remoteSurcharge;
  const atmosphereCost = eventState.inventoryCosts;
  const foodCost = eventState.menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * eventState.totalGuests;
  const culinaryCost = foodCost + laborCost;
  const totalCost = culinaryCost + atmosphereCost + logisticsCost;
  const estimatedRevenue = eventState.totalGuests * 125;

  const drawBucket = (title: string, amount: number, details: string[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(title, margin, currentY);
    
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(`$${amount.toFixed(2)}`, margin + contentWidth - 1, currentY, { align: "right" });
    
    currentY += 0.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
    details.forEach(detail => {
      doc.text(`• ${detail}`, margin + 0.2, currentY);
      currentY += 0.15;
    });
    currentY += 0.2;
  };

  drawBucket("Culinary", culinaryCost, [
    `Food & Beverage: $${foodCost.toFixed(2)}`,
    `Service Labor: $${laborCost.toFixed(2)}`
  ]);

  drawBucket("Atmosphere", atmosphereCost, [
    `Rentals & Design: $${atmosphereCost.toFixed(2)}`
  ]);

  drawBucket("Logistics", logisticsCost, [
    `Transport & Setup: $${logisticsCost.toFixed(2)}`
  ]);

  // Totals — bucket amounts sum to totalCost; client baseline quote is separate (avoids looking like a sign / math error)
  currentY += 0.1;
  doc.setLineWidth(0.02);
  doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 0.3;

  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Total estimated delivery cost", margin, currentY);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(`$${totalCost.toFixed(2)}`, margin + contentWidth - 1, currentY, { align: "right" });
  currentY += 0.32;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text("Matches Culinary + Atmosphere + Logistics above.", margin, currentY);
  currentY += 0.36;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Illustrative client quote (baseline)", margin, currentY);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`$${estimatedRevenue.toFixed(2)}`, margin + contentWidth - 1, currentY, { align: "right" });
  currentY += 0.22;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text(`$125 × ${eventState.totalGuests} guests (planning estimate).`, margin, currentY);
  currentY += 0.42;

  // --- LEGAL FOOTER & QR CODE ---
  // Ensure footer is at the bottom of the page or on a new page
  if (currentY > 9.0) {
    doc.addPage();
    currentY = margin + 0.3;
  } else {
    currentY = 9.0; // Push to bottom
  }

  doc.setDrawColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 0.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.text(`Terms & Conditions (${companyName})`, margin, currentY);
  currentY += 0.15;

  doc.setFont("helvetica", "normal");
  const legalText = `Force Majeure: ${companyName} shall not be liable for any failure to perform its obligations where such failure is as a result of Acts of Nature (including fire, flood, earthquake, storm, hurricane or other natural disaster), war, invasion, act of foreign enemies, hostilities, rebellion, terrorist activities, government sanction, blockage, embargo, labor dispute, strike, lockout or interruption or failure of electricity or telephone service.
Attrition: Final guest counts must be guaranteed 14 days prior to the event. The client will be billed for the guaranteed number or the actual number of guests served, whichever is greater.
Liability: The company's liability for any claim arising out of or relating to this agreement shall not exceed the total amount paid by the client under this agreement.`;

  // Leave room for QR code on the right (approx 1.5 inches)
  const legalTextWidth = contentWidth - 1.5;
  const splitLegalText = doc.splitTextToSize(legalText, legalTextWidth);
  doc.text(splitLegalText, margin, currentY);

  // Generate and add QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(
      `Event Profit Blueprint: ${eventState.eventName}\nDelivery cost: $${totalCost.toFixed(2)}\nClient quote: $${estimatedRevenue.toFixed(2)}`,
      {
        width: 100,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      }
    );
    
    // Place QR code in the bottom right corner
    doc.addImage(qrDataUrl, "PNG", margin + contentWidth - 1.2, currentY - 0.2, 1.2, 1.2);
    
    doc.setFontSize(6);
    doc.text("Scan to View Event Blueprint", margin + contentWidth - 1.2, currentY + 1.1);
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  appendEbWMasterpieceSignatureBlock(
    doc,
    margin,
    contentWidth,
    gold,
    slate,
    slateLight,
    companyName,
    sealIssuedAtISO
  );

  doc.save(`DCE_Masterpiece_${eventState.eventName.replace(/\s+/g, "_")}.pdf`);
};
