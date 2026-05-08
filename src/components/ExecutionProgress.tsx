import React from "react";
import { cn } from "@/lib/utils";
import { Layers, Boxes, UsersRound } from "lucide-react";

interface ExecutionProgressProps {
  percentage: number;
  onOpenBEO?: () => void;
  is3DView?: boolean;
  onToggle3D?: () => void;
  guestSimulation?: boolean;
  onToggleGuestSimulation?: () => void;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({
  percentage,
  onOpenBEO,
  is3DView = false,
  onToggle3D,
  guestSimulation = false,
  onToggleGuestSimulation,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border-b border-amber-900/30 px-4 py-3 sticky top-0 z-50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-1 min-w-[240px] max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col min-w-[180px]">
          <span className="text-sm font-serif font-bold text-amber-400 tracking-wide uppercase">
            Percentage to Perfect Delivery
          </span>
          <span className="text-xs text-slate-400">
            {percentage === 100 ? "All elements configured and staffed." : "Assign inventory, atmosphere, and staff to all elements."}
          </span>
        </div>
        <div className="flex-1 min-w-[160px] max-w-md flex items-center gap-3">
          <div className="relative flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full transition-all ease-out rounded-full",
                percentage === 100 ? "bg-[#fbbf24] shadow-[0_0_10px_rgba(234,179,8,0.8)] duration-[1500ms]" : "bg-amber-600/80 duration-1000"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={cn(
            "font-bold text-lg min-w-[3ch] tabular-nums text-right shrink-0 transition-colors",
            percentage === 100 ? "text-[#fbbf24] drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" : "text-slate-300"
          )}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
        {onToggle3D && (
          <button
            type="button"
            onClick={onToggle3D}
            className={cn(
              "inline-flex items-center gap-2 font-semibold rounded-md px-3 py-2 text-sm shadow-sm transition-colors border",
              is3DView
                ? "bg-indigo-600 text-white border-indigo-400/60 hover:bg-indigo-500"
                : "bg-slate-800 text-slate-100 border-slate-600 hover:border-[#fbbf24]/50 hover:text-[#fbbf24]"
            )}
          >
            {is3DView ? <Boxes className="h-4 w-4 shrink-0" aria-hidden /> : <Layers className="h-4 w-4 shrink-0" aria-hidden />}
            {is3DView ? "2D Blueprint" : "3D View"}
          </button>
        )}
        {onToggleGuestSimulation && (
          <button
            type="button"
            disabled={!is3DView}
            onClick={onToggleGuestSimulation}
            title={is3DView ? undefined : "Enable 3D View first"}
            className={cn(
              "inline-flex items-center gap-2 font-semibold rounded-md px-3 py-2 text-sm shadow-sm transition-colors border",
              !is3DView && "opacity-40 cursor-not-allowed",
              guestSimulation && is3DView
                ? "bg-emerald-700 text-white border-emerald-500/70 hover:bg-emerald-600"
                : "bg-slate-800 text-slate-100 border-slate-600 hover:border-emerald-500/60"
            )}
          >
            <UsersRound className="h-4 w-4 shrink-0" aria-hidden />
            Guests
          </button>
        )}
        {onOpenBEO && (
          <button
            type="button"
            onClick={onOpenBEO}
            className="bg-[#fbbf24] text-slate-950 hover:bg-amber-500 font-bold rounded-md px-4 py-2 text-sm shadow-[0_0_15px_rgba(234,179,8,0.35)] transition-colors"
          >
            BEO
          </button>
        )}
      </div>
    </div>
  );
};
