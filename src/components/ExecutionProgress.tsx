import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ExecutionProgressProps {
  percentage: number;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({ percentage }) => {
  return (
    <div className="w-full bg-slate-900/80 border-b border-amber-900/30 p-4 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-serif font-bold text-amber-400 tracking-wide uppercase">
            Percentage to Perfect Delivery
          </span>
          <span className="text-xs text-slate-400">
            {percentage === 100 ? "All elements configured and staffed." : "Assign inventory, atmosphere, and staff to all elements."}
          </span>
        </div>
        <div className="flex-1 max-w-md flex items-center gap-3">
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
            "font-bold text-lg min-w-[3rem] text-right transition-colors",
            percentage === 100 ? "text-[#fbbf24] drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" : "text-slate-300"
          )}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};
