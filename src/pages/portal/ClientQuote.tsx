import React, { useState } from "react";
import { useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignaturePad } from "@/components/events/SignaturePad";
import { CheckCircle2, Sparkles, Map as MapIcon, Image as ImageIcon, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { useEventContext } from "@/context/EventContext";
import { useBrand } from "@/context/BrandContext";
import { generateProposalPDF } from "@/logic/PDFGenerator";

export const ClientQuote = () => {
  const { eventId } = useParams();
  const { eventState, updateEventState } = useEventContext();
  const { brand } = useBrand();

  const [wetSigned, setWetSigned] = useState(false);
  const [sealBusy, setSealBusy] = useState(false);

  const handleSign = (_signatureDataUrl?: string) => {
    setWetSigned(true);
  };

  const totalInvestment = eventState.totalGuests * 125;

  const atmosphere = [
    "Ivory Damask Linens",
    "Gold Accent Napkins",
    "Crystal Stemware",
    "Tall & Elegant Floral Centerpieces",
  ];

  const handleSealMasterpiece = async () => {
    if (sealBusy) return;
    setSealBusy(true);
    const toastId = toast.loading("Sealing DCE Masterpiece PDF…");
    try {
      const sealAt = new Date().toISOString();
      await generateProposalPDF(eventState, "venue-map-canvas", brand, {
        sealIssuedAtISO: sealAt,
      });
      toast.dismiss(toastId);
      toast.success("DCE Masterpiece sealed", {
        description: "Signature module captured in your download.",
      });

      void confetti({
        particleCount: 220,
        spread: 78,
        startVelocity: 38,
        origin: { x: 0.5, y: 0.55 },
        ticks: 420,
        gravity: 1.05,
        colors: ["#fbbf24", "#fde047", "#0a1628", "#34d399"],
      });

      await updateEventState({
        masterpieceContractSealed: true,
        masterpieceContractSealedAt: sealAt,
      });
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Could not seal PDF", {
        description: e instanceof Error ? e.message : "Try again or check the console.",
      });
    } finally {
      setSealBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="bg-[#0a1628] text-slate-50 py-12 px-6 text-center border-b-4 border-[#fbbf24]">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {NBS_COMPANY_CONFIG.legalName}
        </h1>
        <p className="text-amber-200/80 font-serif italic text-lg">
          Curated Event Proposal · Event ID: {eventId ?? eventState.eventId ?? "—"}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {eventState.eventName}
          </h2>
          <p className="text-slate-500 uppercase tracking-widest text-sm font-semibold">
            Harrison Corridor · Maine Infrastructure-Zero Demo
          </p>
          <p className="text-slate-600">
            {eventState.totalGuests} Guests · Plated &amp; Buffet Hybrid
          </p>
        </div>

        <Separator className="bg-slate-200" />

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="bg-slate-100 p-4 border-b flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-slate-400" />
              <h3 className="font-serif font-bold text-lg">Venue Architecture</h3>
            </div>
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-50 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <p className="text-slate-400 text-sm font-medium z-10">
                  Interactive Map Preview
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="bg-slate-100 p-4 border-b flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <h3 className="font-serif font-bold text-lg">Atmosphere & Design</h3>
            </div>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {atmosphere.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-slate-200" />

        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-[#fbbf24] to-amber-600" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold font-serif mb-1">Total Investment</h3>
              <p className="text-slate-400 text-sm">
                Includes culinary, staffing, rentals, and logistics (DCE estimate baseline).
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-[#fbbf24] tracking-tight">
                ${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 space-y-6">
          <h3 className="text-2xl font-bold font-serif text-center">
            Final seal — DCE Masterpiece
          </h3>

          <div className="max-w-xl mx-auto flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              disabled={sealBusy || eventState.masterpieceContractSealed}
              onClick={handleSealMasterpiece}
              className="w-full h-14 text-base font-bold uppercase tracking-wide bg-[#fbbf24] hover:bg-amber-500 text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.55)] border-2 border-amber-300/80"
            >
              <FileCheck2 className="w-5 h-5 mr-2" />
              {sealBusy ? "Sealing…" : "Seal & Sign DCE Masterpiece"}
            </Button>
            {eventState.masterpieceContractSealed && (
              <p className="text-center text-sm text-emerald-600 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                CONTRACT SIGNED — SECURED
              </p>
            )}
            {eventState.masterpieceContractSealed && eventState.masterpieceContractSealedAt && (
              <p className="text-center text-xs text-slate-500">
                PDF seal issued {new Date(eventState.masterpieceContractSealedAt).toLocaleString()}
              </p>
            )}
          </div>

          <h3 className="text-xl font-bold font-serif pt-4 text-center border-t border-slate-100">
            Client wet signature (optional)
          </h3>

          {wetSigned ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">Signature captured</h4>
              <p className="text-slate-500 max-w-md">
                Your wet signature is on file for this review. Use &ldquo;Seal &amp; Sign DCE
                Masterpiece&rdquo; above to issue the binding PDF with the Harrison legal footer.
              </p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <p className="text-sm text-slate-500 mb-6 text-center">
                By sealing the DCE Masterpiece you accept the investment and infrastructure
                narrative for {eventState.eventName}.
              </p>
              <SignaturePad onSave={handleSign} />
            </div>
          )}
        </div>

        <div className="text-center pb-12">
          <p className="text-[#fbbf24] italic font-serif text-sm tracking-wide">Legacy Preserved</p>
        </div>
      </div>
    </div>
  );
};
