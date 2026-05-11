import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "@/context/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, Building2, Phone, Image as ImageIcon, ChevronRight, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Onboarding = () => {
  const { brand, updateBrand } = useBrand();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    logoUrl: brand.logoUrl || "",
    primaryColor: brand.primaryColor || "#fbbf24",
    companyName: brand.companyName || "",
    stateOfIncorporation: brand.stateOfIncorporation || "New Hampshire",
    contactPhone: brand.contactPhone || "",
    contactEmail: brand.contactEmail || "",
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    updateBrand({
      logoUrl: formData.logoUrl || null,
      primaryColor: formData.primaryColor,
      companyName: formData.companyName,
      stateOfIncorporation: formData.stateOfIncorporation,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left Pane: Wizard */}
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center border-r border-slate-800 bg-slate-900/50">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome to Delicious Catering & Events</h1>
            <p className="text-slate-400">Let's set up your white-label SaaS environment.</p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-[#fbbf24] transition-all duration-500"
                  style={{ width: step >= i ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Step 1: Visuals */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#fbbf24]" />
                Brand Visuals
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Logo URL</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <Input 
                      className="pl-9 bg-slate-950 border-slate-800" 
                      placeholder="https://yourdomain.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Primary Brand Color (Hex)</Label>
                  <div className="flex gap-3">
                    <Input 
                      type="color" 
                      className="w-16 h-10 p-1 bg-slate-950 border-slate-800 cursor-pointer"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    />
                    <Input 
                      className="flex-1 bg-slate-950 border-slate-800 font-mono" 
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Legal */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#fbbf24]" />
                Legal Identity
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Legal Business Name</Label>
                  <Input 
                    className="bg-slate-950 border-slate-800" 
                    placeholder="e.g., Delicious Catering LLC"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">State of Incorporation</Label>
                  <Input 
                    className="bg-slate-950 border-slate-800" 
                    placeholder="e.g., New Hampshire"
                    value={formData.stateOfIncorporation}
                    onChange={(e) => setFormData({...formData, stateOfIncorporation: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#fbbf24]" />
                Sales Contact
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Contact Phone</Label>
                  <Input 
                    className="bg-slate-950 border-slate-800" 
                    placeholder="(555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Contact Email</Label>
                  <Input 
                    type="email"
                    className="bg-slate-950 border-slate-800" 
                    placeholder="events@yourdomain.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1 bg-[#fbbf24] text-slate-900 hover:bg-[#fbbf24]/90 font-bold">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)]">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: Live Preview */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ backgroundColor: formData.primaryColor }} />
        
        <div className="w-full max-w-lg relative z-10">
          <div className="mb-6 text-center">
            <h3 className="text-slate-400 font-medium tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              "Lock & Load" Preview
            </h3>
            <p className="text-slate-500 text-xs">This is how your Event Profit Blueprints will look.</p>
          </div>

          {/* PDF Header Preview Card */}
          <Card className="bg-white text-slate-900 shadow-2xl border-0 overflow-hidden rounded-xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="h-12 object-contain mb-2" />
                  ) : (
                    <h2 
                      className="text-3xl font-bold tracking-tight mb-1" 
                      style={{ fontFamily: "'Playfair Display', serif", color: formData.primaryColor }}
                    >
                      {formData.companyName || "Your Company Name"}
                    </h2>
                  )}
                  <p className="text-slate-500 italic text-sm">
                    {formData.contactPhone || "(555) 123-4567"} | {formData.contactEmail || "email@domain.com"}
                  </p>
                  <p className="text-slate-500 italic text-sm mt-0.5">
                    {formData.stateOfIncorporation || "New Hampshire"} LLC · DCE ~ MainVision Production Blueprint
                  </p>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-xl font-bold text-slate-900">Smith Wedding Reception</h3>
                <p className="text-slate-600 text-sm">Guests: 120 | Staff: 8</p>
              </div>

              <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center mb-8">
                <span className="text-slate-400 font-medium">[ Venue Architecture Map ]</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-bold text-slate-900 border-b pb-2" style={{ borderColor: formData.primaryColor }}>Investment Breakdown</h4>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold" style={{ color: formData.primaryColor }}>Culinary</span>
                  <span className="font-bold text-slate-900">$12,450.00</span>
                </div>
                <div className="pl-2 space-y-1 text-sm text-slate-600">
                  <p>• Food & Beverage: $10,000.00</p>
                  <p>• Service Labor: $2,450.00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
