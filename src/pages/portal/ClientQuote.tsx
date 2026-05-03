import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignaturePad } from "@/components/events/SignaturePad";
import { CheckCircle2, Sparkles, Map as MapIcon, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ClientQuote = () => {
  const { eventId } = useParams();
  const [isSigned, setIsSigned] = useState(false);

  // Simulated BEO Data (No COGS, No Margins)
  const quoteData = {
    eventName: "Smith Wedding Reception",
    date: "May 15, 2026",
    venue: "Grand Ballroom, The Riverside",
    totalInvestment: 12450.00,
    guestCount: 120,
    serviceStyle: "Plated Dinner",
    atmosphere: [
      "Ivory Damask Linens",
      "Gold Accent Napkins",
      "Crystal Stemware",
      "Tall & Elegant Floral Centerpieces"
    ]
  };

  const handleSign = (signatureData: string) => {
    setIsSigned(true);
    // In a real app, send this to the backend to lock the BEO
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* High-End Header */}
      <div className="bg-slate-950 text-slate-50 py-12 px-6 text-center border-b-4 border-[#fbbf24]">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {NBS_COMPANY_CONFIG.legalName}
        </h1>
        <p className="text-amber-200/80 font-serif italic text-lg">Curated Event Proposal</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Event Overview */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{quoteData.eventName}</h2>
          <p className="text-slate-500 uppercase tracking-widest text-sm font-semibold">{quoteData.date} • {quoteData.venue}</p>
          <p className="text-slate-600">{quoteData.guestCount} Guests • {quoteData.serviceStyle}</p>
        </div>

        <Separator className="bg-slate-200" />

        {/* Visual Board & Map (Simulated) */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="bg-slate-100 p-4 border-b flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-slate-400" />
              <h3 className="font-serif font-bold text-lg">Venue Architecture</h3>
            </div>
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-50 relative flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <p className="text-slate-400 text-sm font-medium z-10">Interactive Map Preview</p>
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
                {quoteData.atmosphere.map((item, i) => (
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

        {/* Investment Summary */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-[#fbbf24] to-amber-600" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold font-serif mb-1">Total Investment</h3>
              <p className="text-slate-400 text-sm">Includes all culinary, staffing, rentals, and logistics.</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-[#fbbf24] tracking-tight">${quoteData.totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
          <h3 className="text-2xl font-bold font-serif mb-6 text-center">Authorization & Lock</h3>
          
          {isSigned ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">Event Locked & Confirmed</h4>
              <p className="text-slate-500 max-w-md">Thank you. Your signature has been securely recorded. Our team will now begin formal preparations.</p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <p className="text-sm text-slate-500 mb-6 text-center">By signing below, you authorize {NBS_COMPANY_CONFIG.legalName} to execute the event as outlined above for the stated total investment.</p>
              <SignaturePad onSave={handleSign} />
            </div>
          )}
        </div>

        <div className="text-center pb-12">
          <p className="text-[#fbbf24] italic font-serif text-sm tracking-wide">
            Legacy Preserved
          </p>
        </div>
      </div>
    </div>
  );
};
