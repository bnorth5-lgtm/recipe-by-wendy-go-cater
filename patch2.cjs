const fs = require('fs');
let code = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

const oldPanelStart = code.indexOf('{/* Right Elements Panel */}');
const oldPanelCode = code.substring(oldPanelStart, code.indexOf('          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">', oldPanelStart) + '          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">'.length);

const newPanelCode = `{/* Right Elements Panel */}
        <div 
          className={cn(
            "bg-slate-900/95 backdrop-blur-xl border-slate-700 flex flex-col z-40 shadow-2xl transition-all duration-300 relative",
            (isElementsPanelOpen && !isZenMode) ? "w-64 border-l" : "w-0 border-l-0"
          )}
        >
          <div className={cn("absolute top-4 -left-10 z-50 transition-opacity duration-300", !isZenMode ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-l-md rounded-r-none border-y border-l border-slate-700 bg-slate-900 text-slate-400 hover:text-[#fbbf24] shadow-md"
              onClick={(e) => { e.stopPropagation(); setIsElementsPanelOpen(!isElementsPanelOpen); }}
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", !isElementsPanelOpen && "rotate-180")} />
            </Button>
          </div>

          <div className={cn("flex flex-col gap-4 h-full transition-opacity duration-300", (isElementsPanelOpen && !isZenMode) ? "opacity-100 p-4 overflow-y-auto" : "opacity-0 p-0 overflow-hidden")}>`;

if (oldPanelStart !== -1) {
  code = code.replace(oldPanelCode, newPanelCode);
}

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', code);
