"use client";

import React, { useRef, useState } from "react";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";
import { encryptData } from "@/lib/cloudVault";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CalendarDays,
  ChefHat,
  Clock,
  Download,
  FileText,
  History,
  MapPin,
  Phone,
  Globe,
  Printer,
  Sparkles,
  Truck,
  Users,
  Zap,
  Star,
  Building2,
  UtensilsCrossed,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCateringStore, formatQuantity } from "@/store/cateringStore";
import { useMarketRates } from "@/hooks/useMarketRates";
import { cn } from "@/lib/utils";
import {
  generateBEODocument,
  saveBEOToSupabase,
  fetchBEOHistory,
  fmt$,
  fmtDate,
  fmtServiceTime,
  styleLabel,
  type BEODocument,
  type BEOFormInput,
  type EventOrderRow,
  type EquipmentCategory,
} from "@/lib/beoGenerator";
import { getMarginHealth } from "@/logic/pricingEngine";
import { checkEquipmentConflict, type EquipmentConflict } from "@/logic/inventoryEngine";
import {
  getRegionalSourcing,
  type RegionalSourcing,
  type VendorCategory,
} from "@/lib/nationalSourcing";

// ── Print styles injected once ────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body > * { display: none !important; }
  #beo-print-root { display: block !important; }
  #beo-print-root { position: fixed; inset: 0; overflow: visible; background: white; }
  .print-hide { display: none !important; }
}
`;

function usePrintStyles() {
  React.useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = PRINT_STYLES;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
}

// ── Money + label helpers ─────────────────────────────────────────────────────

const CAT_COLORS: Record<EquipmentCategory, string> = {
  seating:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
  tableware:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300",
  kitchen:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300",
  bar: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300",
};

// ── BEO Document View (printable) ─────────────────────────────────────────────

interface BEODocumentViewProps {
  doc: BEODocument;
}

function BEODocumentView({ doc }: BEODocumentViewProps) {
  const marginHealth = getMarginHealth(doc.total, doc.totalCOGS);

  return (
    <div
      id="beo-print-root"
      className={cn(
        "bg-white text-gray-900 overflow-hidden print:shadow-none print:border-0 font-sans rounded-xl transition-all duration-500",
        marginHealth.isHealthy 
          ? "border-2 border-[#fbbf24] shadow-[0_0_20px_rgba(234,179,8,0.2)]" 
          : "border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      )}
    >
      {/* ── Header ── */}
      <div className="px-8 py-6 border-b-2 border-gray-900 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {NBS_COMPANY_CONFIG.legalName}
            </h1>
            <p className="text-sm mt-0.5">{NBS_COMPANY_CONFIG.mailingAddress}</p>
          </div>
          <div className="text-right text-sm space-y-0.5 shrink-0">
            <p>
              <span className="font-semibold">Invoice/Instruction Date:</span>{" "}
              {fmtDate(doc.generatedAt)}
            </p>
            <p>
              <span className="font-semibold">Order ID:</span>{" "}
              <strong>{doc.beoNumber}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* ── Event Details ── */}
        <section>
          <SectionHeading icon={<CalendarDays className="h-4 w-4" />}>
            Event Details
          </SectionHeading>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm sm:grid-cols-3">
            <InfoRow label="Event Date" value={fmtDate(doc.eventDate)} />
            <InfoRow
              label="Service Start"
              value={fmtServiceTime(doc.serviceTime)}
            />
            <InfoRow label="Service Style" value={styleLabel(doc.serviceStyle)} />
            <InfoRow label="Guest Count" value={`${doc.guestCount} guests`} />
            <InfoRow
              label="Venue"
              value={
                [doc.venueName, doc.venueZip].filter(Boolean).join(" · ") || "—"
              }
            />
          </div>
          {doc.specialInstructions && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20 print:border-gray-300 print:bg-gray-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 print:text-gray-500">
                Special Instructions
              </p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {doc.specialInstructions}
              </p>
            </div>
          )}
        </section>

        <Separator />

        {/* ── Itemized Menu + COGS ── */}
        <section>
          <SectionHeading icon={<ChefHat className="h-4 w-4" />}>
            Itemized Menu &amp; Cost of Goods
          </SectionHeading>

          {doc.menuSections.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">
              No recipes selected.
            </p>
          ) : (
            <div className="mt-3 space-y-5">
              {doc.menuSections.map((section) => (
                <div key={section.recipeId} className="rounded-lg border">
                  {/* Recipe header */}
                  <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/30 print:bg-gray-100 rounded-t-lg border-b">
                    <div>
                      <p className="font-semibold text-sm">{section.recipeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.category} · Original yield:{" "}
                        {section.originalYield} servings → scaled ×
                        {section.scaleFactor} for {doc.guestCount} guests
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">COGS</p>
                      <p className="font-bold text-base">
                        {fmt$(section.recipeCOGS)}
                      </p>
                    </div>
                  </div>

                  {/* Ingredient rows */}
                  <div className="divide-y">
                    {section.cogsItems.map((item, i) => {
                      const marketAvg = item.rateSource === "market_rate" ? item.pricePerUnit : (item.pricePerUnit * 0.85); // Simulated competitor average
                      const marginStatus = item.pricePerUnit > marketAvg ? "Premium" : "Healthy";
                      
                      return (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 sm:py-2 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.ingredientName}</span>
                              {/* BEO Benchmarking: MarketHint Badge */}
                              <span 
                                className="hidden sm:inline-flex text-[10px] items-center px-1.5 py-0.5 rounded-sm bg-slate-900 text-[#fbbf24] dark:bg-slate-100 dark:text-slate-900 font-medium whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity cursor-default animate-pulse" 
                                style={{ animationIterationCount: 3 }}
                                title="Market Benchmarking"
                              >
                                Market Avg: {fmt$(marketAvg)} | Yours: {fmt$(item.pricePerUnit)} | Margin: {marginStatus}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs block mt-0.5">
                              {item.scaledQuantity.toFixed(
                                item.scaledQuantity < 10 ? 2 : 1
                              )}{" "}
                              {item.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:shrink-0 mt-1 sm:mt-0">
                            {/* Rate badge */}
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5",
                                item.rateSource === "market_rate"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 print:bg-white"
                                  : item.rateSource === "inventory"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 print:bg-white"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              )}
                            >
                              {item.rateSource === "market_rate" && (
                                <Zap className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                              )}
                              {fmt$(item.pricePerUnit)}/{item.unit}
                            </span>
                            <span className="text-xs text-muted-foreground w-auto sm:w-20 text-left sm:text-right">
                              {item.rateLabel}
                            </span>
                            <span className="font-semibold text-sm w-auto sm:w-16 text-right">
                              {fmt$(item.lineCost)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* ── Equipment Needs ── */}
        <section>
          <SectionHeading icon={<Package className="h-4 w-4" />}>
            Equipment &amp; Rental Needs
          </SectionHeading>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-calculated for {doc.guestCount} guests ·{" "}
            {styleLabel(doc.serviceStyle)} · Est. total rental:{" "}
            <strong>{fmt$(doc.equipmentCost)}</strong>
          </p>

          {(["seating", "tableware", "kitchen", "bar"] as EquipmentCategory[]).map(
            (cat) => {
              const items = doc.equipmentNeeds.filter((e) => e.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="mt-4">
                  <p
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit border mb-2",
                      CAT_COLORS[cat]
                    )}
                  >
                    {cat}
                  </p>
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto w-full">
                      <Table className="hidden sm:table w-full">
                        <TableHeader>
                          <TableRow className="bg-muted/40 print:bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs text-right">Qty</TableHead>
                            <TableHead className="text-xs text-right">Rate</TableHead>
                            <TableHead className="text-xs text-right">
                              Est. Rental
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm py-2">
                                {item.item}
                              </TableCell>
                              <TableCell className="text-right text-sm py-2">
                                {item.qty}
                              </TableCell>
                              <TableCell className="text-right text-sm py-2 text-muted-foreground">
                                {fmt$(item.rentalCostPerUnit)}/ea
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium py-2">
                                {fmt$(item.totalRentalCost)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="sm:hidden flex flex-col p-2 space-y-2 bg-slate-50 dark:bg-slate-900/50">
                      {items.map((item, i) => (
                        <div key={i} className="bg-card border rounded-md p-3 shadow-sm">
                          <div className="font-semibold text-sm mb-1">{item.item}</div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Qty: {item.qty}</span>
                            <span>Rate: {fmt$(item.rentalCostPerUnit)}/ea</span>
                          </div>
                          <div className="flex justify-between text-sm mt-2 pt-2 border-t font-medium">
                            <span>Est. Rental</span>
                            <span>{fmt$(item.totalRentalCost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </section>

        <Separator />

        {/* ── Certified Block ── */}
        <div className="my-6 border-4 border-gray-900 p-6 text-center bg-gray-50 print:bg-white rounded-md shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">
            Certified Banquet Event Order
          </h2>
          <p className="text-sm text-gray-700 max-w-md mx-auto">
            This document outlines the confirmed services, pricing, and timeline. All execution must adhere strictly to these terms.
          </p>
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="inline-block w-16 h-[1px] bg-gray-400"></span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Authorized Official</span>
            <span className="inline-block w-16 h-[1px] bg-gray-400"></span>
          </div>
        </div>

        {/* ── Run of Show ── */}
        <section>
          <SectionHeading icon={<Clock className="h-4 w-4" />}>
            Run of Show (Timeline)
          </SectionHeading>
          <p className="mt-1 text-xs text-muted-foreground mb-3">
            Service start: <strong>{fmtServiceTime(doc.serviceTime)}</strong> ·{" "}
            {doc.guestCount} guests · {styleLabel(doc.serviceStyle)}
          </p>
          <div className="border rounded overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left hidden sm:table">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Task</th>
                    <th className="px-4 py-2 font-semibold text-gray-700 w-32">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {doc.runOfShow.map((entry, i) => (
                    <tr
                      key={i}
                      className={cn(
                        entry.isKeyMoment ? "bg-gray-200 font-bold" : "bg-white"
                      )}
                    >
                      <td className="px-4 py-2 font-mono text-xs">{entry.time}</td>
                      <td className="px-4 py-2">{entry.task}</td>
                      <td className="px-4 py-2 text-xs">
                        <Badge variant="outline">{entry.owner}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="sm:hidden flex flex-col divide-y bg-slate-50 dark:bg-slate-900/50">
              {doc.runOfShow.map((entry, i) => (
                <div key={i} className={cn("p-3 space-y-1.5", entry.isKeyMoment ? "bg-gray-200 dark:bg-gray-800" : "bg-card")}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-background border rounded">{entry.time}</span>
                    <Badge variant="outline" className="text-[10px]">{entry.owner}</Badge>
                  </div>
                  <p className={cn("text-sm", entry.isKeyMoment ? "font-bold" : "")}>{entry.task}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Financial Summary ── */}
        <section>
          <SectionHeading icon={<TrendingUp className="h-4 w-4" />}>
            Financial Summary
          </SectionHeading>

          <div className="mt-3 rounded-xl border overflow-hidden">
            <div className="divide-y">
              <FinRow label="Cost of Goods (COGS)" value={fmt$(doc.totalCOGS)} />
              <FinRow
                label="Labor (35% of COGS)"
                value={fmt$(doc.laborCost)}
              />
              <FinRow
                label="Equipment &amp; Rentals"
                value={fmt$(doc.equipmentCost)}
              />
              <FinRow
                label="Overhead &amp; Misc. (10%)"
                value={fmt$(doc.overheadCost)}
              />
              <FinRow
                label="Subtotal"
                value={fmt$(doc.subtotal)}
                bold
              />
              <FinRow
                label={`Tax (${(doc.taxRate * 100).toFixed(0)}%)`}
                value={fmt$(doc.taxAmount)}
              />
              <FinRow label="TOTAL" value={fmt$(doc.total)} bold accent />
              <FinRow
                label="Per-Person Rate"
                value={`${fmt$(doc.perPersonRate)} / guest`}
                bold
                accent
              />
            </div>
          </div>
        </section>

        {/* ── Local Sourcing Options ── */}
        {doc.venueZip && (() => {
          const sourcing: RegionalSourcing = getRegionalSourcing(doc.venueZip);
          return (
            <>
              <Separator />
              <section className="print-hide">
                <SectionHeading icon={<Truck className="h-4 w-4" />}>
                  Local Sourcing Options
                </SectionHeading>
                <p className="mt-1 text-xs text-muted-foreground mb-4">
                  Simulated regional vendor search for ZIP{" "}
                  <strong>{sourcing.zipCode}</strong> — {sourcing.region} ·{" "}
                  {sourcing.majorCity}
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {sourcing.categories.map((cat: VendorCategory) => (
                    <div
                      key={cat.id}
                      className="rounded-xl border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        {cat.id === "wholesale_food" && (
                          <UtensilsCrossed className="h-4 w-4 text-primary" />
                        )}
                        {cat.id === "event_rentals" && (
                          <Package className="h-4 w-4 text-primary" />
                        )}
                        {cat.id === "staffing" && (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-sm font-semibold">{cat.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                      <div className="space-y-3">
                        {cat.vendors.map((v, vi) => (
                          <div
                            key={vi}
                            className="rounded-lg border bg-background p-3 text-xs space-y-1"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold leading-tight">
                                {v.name}
                              </span>
                              {v.isNational && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[10px] h-4 px-1"
                                >
                                  National
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground">{v.specialty}</p>
                            <div className="flex items-center gap-3 pt-0.5">
                              <a
                                href={`tel:${v.phone.replace(/\D/g, "")}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {v.phone}
                              </a>
                              <a
                                href={`https://${v.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                {v.website}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 text-[11px]">
                              <Star className="h-3 w-3 fill-amber-500" />
                              <span>{v.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-muted-foreground/60 italic">
                  Vendor data is simulated for regional planning purposes. Always
                  verify availability and pricing directly with each vendor.
                </p>
              </section>
            </>
          );
        })()}

        <div className="border-t pt-6 mt-2 text-center text-xs text-muted-foreground print:block space-y-4">
          <p>
            {NBS_COMPANY_CONFIG.customizableFooter}
          </p>
          <p className="text-[#fbbf24] italic font-serif text-sm tracking-wide">
            Legacy Preserved — {fmtDate(doc.generatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Small layout helpers ──────────────────────────────────────────────────────

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function FinRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5 text-sm",
        accent && "bg-primary/5",
        bold && "font-semibold"
      )}
    >
      <span dangerouslySetInnerHTML={{ __html: label }} />
      <span className={accent ? "text-primary" : ""}>{value}</span>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const [history, setHistory] = useState<EventOrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetchBEOHistory()
      .then(setHistory)
      .catch((e) => setError(e?.message ?? "Could not load history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading BEO history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        {error}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground space-y-2">
        <History className="h-10 w-10 mx-auto opacity-30" />
        <p className="font-medium">No BEO history yet</p>
        <p className="text-sm">
          Generate your first BEO above — it will be saved here automatically.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[480px]">
      <div className="space-y-3 p-1">
        {history.map((row) => (
          <Card key={row.id} className="border hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">
                      {row.event_name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono shrink-0"
                    >
                      {row.beo_number}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] capitalize shrink-0"
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                    {row.event_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {fmtDate(row.event_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {row.guest_count} guests
                    </span>
                    {row.venue_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {row.venue_name}
                      </span>
                    )}
                    {row.venue_zip && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {row.venue_zip}
                      </span>
                    )}
                  </div>
                  {row.recipe_names?.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {row.recipe_names.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-lg font-bold text-primary">
                    {fmt$(row.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmt$(row.per_person_rate)}/guest
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    COGS {fmt$(row.cogs_total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const BEOGenerator = () => {
  usePrintStyles();

  const recipes = useCateringStore((s) => s.recipes);
  const inventory = useCateringStore((s) => s.inventory);
  const currentUser = useCateringStore((s) => s.currentUser);
  const defaultTaxRate = useCateringStore((s) => s.defaultTaxRate);

  const { data: competitorData, loading: ratesLoading } = useMarketRates();

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [serviceTime, setServiceTime] = useState("18:00");
  const [venueName, setVenueName] = useState("");
  const [venueZip, setVenueZip] = useState("");
  const [serviceStyle, setServiceStyle] =
    useState<BEOFormInput["serviceStyle"]>("plated");
  const [guestCount, setGuestCount] = useState<number>(50);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(
    new Set()
  );
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");

  // Generation state
  const [generatedDoc, setGeneratedDoc] = useState<BEODocument | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"generator" | "history">("generator");
  const [equipmentConflicts, setEquipmentConflicts] = useState<EquipmentConflict[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  function toggleRecipe(id: string) {
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!eventName.trim()) {
      toast.error("Please enter an event name.");
      return;
    }
    if (guestCount < 1) {
      toast.error("Guest count must be at least 1.");
      return;
    }
    if (selectedRecipeIds.size === 0) {
      toast.error("Select at least one recipe.");
      return;
    }

    setGenerating(true);
    try {
      const input: BEOFormInput = {
        eventName: eventName.trim(),
        eventDate,
        serviceTime,
        venueName: venueName.trim(),
        venueZip: venueZip.trim(),
        serviceStyle,
        guestCount,
        recipeIds: Array.from(selectedRecipeIds),
        specialInstructions: specialInstructions.trim(),
        taxRate: defaultTaxRate > 0 ? defaultTaxRate : 0.08,
        generatedBy: currentUser?.id,
      };

      const doc = generateBEODocument(input, recipes, competitorData, inventory);
      setGeneratedDoc(doc);

      // Check for equipment conflicts
      const conflicts = await checkEquipmentConflict(eventDate, doc.equipmentNeeds);
      setEquipmentConflicts(conflicts);

      // Auto-save to Supabase
      setSaving(true);
      try {
        await saveBEOToSupabase(doc, competitorData);
        toast.success(`BEO ${doc.beoNumber} saved to event history.`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e ?? "");
        toast.warning(`BEO generated locally — cloud save failed: ${msg}`);
      } finally {
        setSaving(false);
      }

      // Scroll to preview
      setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const isReady =
    eventName.trim() && guestCount >= 1 && selectedRecipeIds.size > 0;

  return (
    <div className="min-h-full bg-slate-950 text-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                BEO Generator
              </h1>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Market-Powered
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Select recipes, enter your event details, and generate a
              professional Banquet Event Order with live market-rate cost
              estimates, auto-calculated equipment lists, and a day-of timeline.
            </p>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="w-full"
        >
          <TabsList className="print-hide">
            <TabsTrigger value="generator">
              <FileText className="h-4 w-4 mr-1.5" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1.5" />
              BEO History
            </TabsTrigger>
          </TabsList>

          {/* ── Generator tab ── */}
          <TabsContent value="generator" className="mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
              {/* ── Left: Form ── */}
              <div className="xl:col-span-2 space-y-5 print-hide">
                {/* Event Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Event Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Event Name *
                      </label>
                      <Input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Smith Wedding Reception"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Event Date
                        </label>
                        <Input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Service Start
                        </label>
                        <Input
                          type="time"
                          value={serviceTime}
                          onChange={(e) => setServiceTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Venue Name
                      </label>
                      <Input
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="Grand Ballroom, The Riverside"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Venue ZIP
                        </label>
                        <Input
                          value={venueZip}
                          onChange={(e) => setVenueZip(e.target.value)}
                          placeholder="90210"
                          maxLength={10}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          <Users className="h-3 w-3 inline mr-1" />
                          Guest Count *
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={guestCount}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!isNaN(n) && n > 0) setGuestCount(n);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Service Style
                      </label>
                      <Select
                        value={serviceStyle}
                        onValueChange={(v) =>
                          setServiceStyle(v as BEOFormInput["serviceStyle"])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plated">Plated Dinner</SelectItem>
                          <SelectItem value="buffet">Buffet Service</SelectItem>
                          <SelectItem value="cocktail">
                            Cocktail Reception
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Special Instructions
                      </label>
                      <Textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Nut-free kitchen required. Vegan option for 8 guests…"
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recipe Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-primary" />
                      Select Recipes *
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedRecipeIds.size} selected ·{" "}
                      {recipes.length} in cookbook
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      placeholder="Search recipes…"
                      className="h-8 text-sm"
                    />
                    {recipes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No recipes in your cookbook yet.
                        <br />
                        Add recipes via the Recipes page first.
                      </p>
                    ) : (
                      <ScrollArea className="h-48">
                        <div className="space-y-1 pr-2">
                          {filteredRecipes.map((r) => {
                            const checked = selectedRecipeIds.has(r.id);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => toggleRecipe(r.id)}
                                className={cn(
                                  "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm",
                                  checked
                                    ? "bg-primary/10 border border-primary/30"
                                    : "hover:bg-muted/60 border border-transparent"
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-4 w-4 shrink-0 rounded border flex items-center justify-center",
                                    checked
                                      ? "bg-primary border-primary"
                                      : "border-border"
                                  )}
                                >
                                  {checked && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{r.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {r.category} · {formatQuantity(r.servings)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Rate status */}
                {ratesLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading live market rates from Supabase…
                  </div>
                )}
                {!ratesLoading && competitorData.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800">
                    <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    <strong>{competitorData.length}</strong> live market rates
                    loaded
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!isReady || generating}
                  className="w-full h-12 text-base font-semibold bg-[#fbbf24] text-slate-900 hover:bg-[#fbbf24]/90 shadow-[0_0_15px_rgba(234,179,8,0.5)] border-none"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate BEO
                    </>
                  )}
                </Button>
              </div>

              {/* ── Right: Generated BEO ── */}
              <div className="xl:col-span-3" ref={printRef}>
                {!generatedDoc ? (
                  <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-24 text-center gap-4 print-hide">
                    <FileText className="h-14 w-14 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <p className="font-semibold text-muted-foreground">
                        Your BEO will appear here
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        Fill in the form and click Generate BEO
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Actions bar */}
                    <div className="flex items-center justify-between gap-3 print-hide">
                      <div className="flex items-center gap-2">
                        {saving ? (
                          <Badge variant="secondary" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving…
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-300 text-emerald-700 bg-emerald-50"
                          >
                            <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                            Saved to history
                          </Badge>
                        )}
                        <Badge variant="secondary" className="font-mono text-xs">
                          {generatedDoc.beoNumber}
                        </Badge>
                        {(() => {
                          const marginHealth = getMarginHealth(generatedDoc.total, generatedDoc.totalCOGS);
                          return (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "gap-1",
                                marginHealth.isHealthy 
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50" 
                                  : "border-amber-500 text-amber-700 bg-amber-50"
                              )}
                            >
                              {marginHealth.isHealthy ? `Margin: ${(marginHealth.margin * 100).toFixed(1)}%` : 'Profit Warning'}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrint}
                          className="gap-1.5"
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={async () => {
                            const json = JSON.stringify(generatedDoc, null, 2);
                            const encryptedData = await encryptData(json);
                            const blob = new Blob([encryptedData], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${generatedDoc.beoNumber}_encrypted.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Export Encrypted
                        </Button>
                      </div>
                    </div>

                    {equipmentConflicts.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 print-hide">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <h4 className="text-red-500 font-semibold mb-1">Crash Insurance: Equipment Conflict</h4>
                            <p className="text-sm text-red-400/90 mb-2">The following legacy items are already booked on {generatedDoc.eventDate}:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-red-300">
                              {equipmentConflicts.map((conflict, i) => (
                                <li key={i}>
                                  <strong>{conflict.item}</strong> — Assigned to <span className="font-mono text-xs">{conflict.conflictingBeoNumber}</span> ({conflict.conflictingEventName})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <BEODocumentView doc={generatedDoc} />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── History tab ── */}
          <TabsContent value="history" className="mt-6 print-hide">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default BEOGenerator;
