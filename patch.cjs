const fs = require('fs');

let code = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

// 1. Add ChevronLeft import
if (!code.includes('ChevronLeft')) {
  code = code.replace(
    'Wind } from "lucide-react";',
    'Wind, ChevronLeft } from "lucide-react";'
  );
}

// 2. Add state hooks inside VenueArchitectContent
const stateInsertPos = code.indexOf('const formatTime = (decimalTime: number) => {');
if (stateInsertPos !== -1) {
  const newStates = `
  const [isZenMode, setIsZenMode] = useState(false);
  const [isElementsPanelOpen, setIsElementsPanelOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setIsZenMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  `;
  if (!code.includes('const [isZenMode')) {
    code = code.substring(0, stateInsertPos) + newStates + code.substring(stateInsertPos);
  }
}

// 3. Wrap left sidebars
const leftSidebarStart = code.indexOf('{/* Left Toolbar - Now the Live BEO Sidebar */}');
const leftSidebarEnd = code.indexOf('{/* Canvas Area */}');
if (leftSidebarStart !== -1 && leftSidebarEnd !== -1) {
  const leftSidebarsCode = code.substring(leftSidebarStart, leftSidebarEnd);
  if (!leftSidebarsCode.includes('{!isZenMode && (')) {
    const wrapped = `{!isZenMode && (\n          <>\n            ${leftSidebarsCode.trim().split('\\n').join('\\n            ')}\n          </>\n        )}\n        `;
    code = code.substring(0, leftSidebarStart) + wrapped + code.substring(leftSidebarEnd);
  }
}

// 4. Transform floating palette to slide-out panel
const paletteStart = code.indexOf('{/* Elements Palette (Floating & Draggable) */}');
const dotsStart = code.indexOf('{/* Staffing Dots (Service Entry) */}');
if (paletteStart !== -1 && dotsStart !== -1) {
  // Extract the contents of the grid grid-cols-1 gap-2 down to the end of motion.div
  // It starts right after <GripHorizontal className="w-5 h-5 text-slate-500" />
  
  const originalPalette = code.substring(paletteStart, dotsStart);
  
  // We'll manually reconstruct the right panel to ensure it looks good and fits requirements.
  const newRightPanel = `{/* Right Elements Panel */}
        <div 
          className={cn(
            "absolute top-0 right-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 flex flex-col z-40 shadow-2xl transition-transform duration-300",
            (isElementsPanelOpen && !isZenMode) ? "translate-x-0 w-64" : "translate-x-full w-64"
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 -left-10 z-50 rounded-l-md rounded-r-none border-y border-l border-slate-700 bg-slate-900 text-slate-400 hover:text-[#fbbf24] shadow-md"
            onClick={(e) => { e.stopPropagation(); setIsElementsPanelOpen(!isElementsPanelOpen); }}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", !isElementsPanelOpen && "rotate-180")} />
          </Button>

          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="font-serif text-xl text-[#fbbf24] font-bold sticky top-0 bg-slate-900/95 z-10 pb-2 border-b border-slate-800">Elements</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((type) => {
                const config = ELEMENT_CONFIG[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2 bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddElement(type);
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] text-center leading-tight whitespace-normal">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            
            <Separator className="bg-slate-700 my-1" />
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                <Label className="text-xs text-slate-300 cursor-pointer" htmlFor="outdoor-mode">Outdoor Mode</Label>
                <Switch id="outdoor-mode" checked={isOutdoorMode} onCheckedChange={setIsOutdoorMode} />
              </div>

              <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                <Label className="text-xs text-slate-300 cursor-pointer" htmlFor="infra-mode">Safety Overlay</Label>
                <Switch id="infra-mode" checked={showInfraOverlay} onCheckedChange={setShowInfraOverlay} />
              </div>
            </div>

            <Separator className="bg-slate-700 my-1" />

            <div className="flex flex-col gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300 cursor-pointer flex items-center gap-1" htmlFor="rain-mode">
                  <CloudRain className="w-3 h-3 text-blue-400" /> Rain Sim
                </Label>
                <Switch id="rain-mode" checked={isRaining} onCheckedChange={setIsRaining} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs text-slate-300 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" /> Wind Dir
                </Label>
                <Select value={windDirection} onValueChange={setWindDirection}>
                  <SelectTrigger className="w-[80px] h-7 text-xs bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white min-w-[80px]">
                    {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map(d => (
                      <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-slate-700 my-1" />
            
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 cursor-default mb-6">
              <h4 className="font-serif text-[#fbbf24] mb-2 text-sm">Staffing</h4>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Guests:</span>
                <span className="font-bold text-white">{totalGuests}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Staff (1:15):</span>
                <span className="font-bold text-amber-400">{requiredStaff}</span>
              </div>
            </div>
          </div>
        </div>

        `;
        
  code = code.replace(originalPalette, newRightPanel);
}

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', code);
