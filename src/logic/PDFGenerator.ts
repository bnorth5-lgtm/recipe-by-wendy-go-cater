import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { EventState } from "@/context/EventContext";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";

export const generateProposalPDF = async (
  eventState: EventState,
  mapElementId: string,
  brandState?: any
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
  let currentY = margin;

  // Colors
  const gold = [251, 191, 36]; // #fbbf24
  const slate = [15, 23, 42]; // slate-950
  const slateLight = [100, 116, 139]; // slate-500

  // --- HEADER ---
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

  // Company Name
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(companyName, margin, currentY + 0.3);
  
  // Credentials
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
  
  const contactInfo = brandState ? `${brandState.contactPhone} | ${brandState.contactEmail}` : "New Hampshire LLC";
  
  // Determine the Blueprint Title based on the selected door/tier
  // For this local implementation, we'll use a generic "Event Blueprint" if not specified, 
  // but if they came from Door 3 (Full Production), it would say "MainVision Production Blueprint"
  const blueprintTitle = brandState?.selectedTier === "production" 
    ? "RBW ~ MainVision Production Blueprint" 
    : brandState?.selectedTier === "staffed"
      ? "RBW ~ Delicious Staffed Events Blueprint"
      : "RBW ~ Delicious Express & Setup Blueprint";

  doc.text(`${contactInfo} · ${blueprintTitle}`, margin, currentY + 0.5);

  // Event Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(eventState.eventName, margin, currentY + 0.9);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Guests: ${eventState.totalGuests} | Staff: ${eventState.staffCount}`, margin, currentY + 1.1);

  currentY += 1.3;

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

  // Total Investment
  currentY += 0.1;
  doc.setLineWidth(0.02);
  doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 0.3;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text("Total Estimated Investment", margin, currentY);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`$${estimatedRevenue.toFixed(2)}`, margin + contentWidth - 1, currentY, { align: "right" });
  currentY += 0.5;

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
    const qrDataUrl = await QRCode.toDataURL(`Event Profit Blueprint: ${eventState.eventName}\nTotal: $${estimatedRevenue.toFixed(2)}`, {
      width: 100,
      margin: 1,
      color: {
        dark: "#0f172a", // slate-950
        light: "#ffffff"
      }
    });
    
    // Place QR code in the bottom right corner
    doc.addImage(qrDataUrl, "PNG", margin + contentWidth - 1.2, currentY - 0.2, 1.2, 1.2);
    
    doc.setFontSize(6);
    doc.text("Scan to View Event Blueprint", margin + contentWidth - 1.2, currentY + 1.1);
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Proposal_${eventState.eventName.replace(/\s+/g, "_")}.pdf`);
};
