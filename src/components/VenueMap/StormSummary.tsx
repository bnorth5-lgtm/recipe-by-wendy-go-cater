import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

export interface StormSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  windDirection: string;
  windGustPct: number;
  muddyPathCount: number;
  smokedTableCount: number;
  stormModeActive: boolean;
}

/**
 * Legal-style contingency brief when Rain Sim crosses operational thresholds — sales story (safety + readiness).
 */
export function StormSummary({
  open,
  onOpenChange,
  windDirection,
  windGustPct,
  muddyPathCount,
  smokedTableCount,
  stormModeActive,
}: StormSummaryProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto rounded-t-xl border-[#fbbf24]/35 bg-[#fdfaf3] text-slate-900 shadow-[0_-20px_90px_rgba(15,23,42,0.35)] md:left-6 md:right-6 md:w-auto md:rounded-xl md:border">
        <div className="mx-auto max-w-3xl">
          <SheetHeader className="text-left border-b border-amber-200/80 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-700/85">
              Contingency Addendum • Wet-Weather Narrative (Auto)
            </p>
            <SheetTitle className="font-serif text-2xl text-slate-900">
              Operational Storm Summary
            </SheetTitle>
            <SheetDescription className="text-slate-700 text-base leading-relaxed">
              Presented as an executive attachment for Delicious Catering procurement teams. Validates wind / rain overlays,
              egress integrity, staging kitchen airflow, and service routing under elevated gust regimes.
            </SheetDescription>
          </SheetHeader>

          <article className="prose prose-sm prose-slate max-w-none px-4 py-6 prose-headings:font-serif prose-headings:text-slate-900">
            <h3>Instrumentation capture</h3>
            <ul>
              <li>
                Cardinal shear vector:{" "}
                <strong>{windDirection}</strong> sustained with modeled gust saturation at approximately{" "}
                <strong>{windGustPct.toFixed(0)}%</strong> composite load.
              </li>
              <li>
                {stormModeActive
                  ? "Storm lockdown choreography is ACTIVE — staffing paths bias to tent envelopes and egress markers."
                  : "Rain rehearsal mode — probabilistic muddy paths enumerated for plating delays."}{" "}
              </li>
              <li>
                Muddy-route intersections tied to tents:{" "}
                <strong>{muddyPathCount}</strong> tabletop runs flagged for skid matting deployment.
              </li>
              <li>
                Staging smoke plume overlap (guest-visible):{" "}
                <strong>{smokedTableCount}</strong> banquet positions inside exhaust cone — reposition or deploy diffusers prior
                to white-glove service.
              </li>
            </ul>

            <h3>Talking points — safety & profitability</h3>
            <p>
              Narrate that our Visionary blueprint pre-computes <em>wet-weather deltas</em> so margin guardrails persist even
              when rental surcharges tighten. Tie each muddy vector to Wendy&apos;s logistic cadence (“We already planned the
              second tent wall so your guest loop stays sub-120 feet.”).
            </p>
          </article>

          <SheetFooter className="border-t border-amber-200/70 bg-amber-50/60 py-4 sm:justify-between">
            <p className="text-xs font-medium text-slate-600 italic max-w-xl">
              This overlay auto-triggers whenever Rain Sim gusts crest the presentation threshold (~72%) or Storm mode locks.
              Dismiss anytime — it will regenerate on the next threshold crossing once closed.
            </p>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
