import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PenLine } from "lucide-react";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";

export const ProvenanceBio = () => {
  const bio = NBS_COMPANY_CONFIG.provenanceBio || "Legal Pad to Logic...";

  return (
    <Sheet>
      <div className="fixed top-6 right-8 z-[9999]">
        <SheetTrigger asChild>
          <button 
            className="p-2 rounded-md cursor-help transition-all duration-300 ease-in-out"
            title="The Cronkhite Legacy: From Legal Pad to Logic"
            style={{ color: '#94a3b8' }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = '#fbbf24'; 
              e.currentTarget.style.filter = 'drop-shadow(0 0 8px #fbbf24)'; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = '#94a3b8'; 
              e.currentTarget.style.filter = 'none'; 
            }}
          >
            <PenLine size={20} />
          </button>
        </SheetTrigger>
      </div>
      <SheetContent side="right" className="sm:max-w-md w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl mb-4">Provenance & Legacy</SheetTitle>
        </SheetHeader>
        <div className="font-serif text-base leading-loose whitespace-pre-line text-foreground/80 mt-4">
          {bio}
        </div>
      </SheetContent>
    </Sheet>
  );
};
