const fs = require('fs');
let code = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

// The issue is that the code already has VenueArchitectContent and VenueArchitectErrorBoundary defined at the bottom, 
// because I pushed those changes in the previous step.
// Let's just fix the syntax error (missing closing tags) and ensure the layout is correct.

// 1. Remove the old Right Sidebar chunk that is causing the syntax error
const rightSidebarStart = code.indexOf('{/* Right Sidebar (Details) */}');
const rightSidebarEnd = code.indexOf('          </TabsContent>\n        </Tabs>\n      </div>');
const rightSidebarEndWin = code.indexOf('          </TabsContent>\r\n        </Tabs>\r\n      </div>');

const endIdx = rightSidebarEnd !== -1 ? rightSidebarEnd : rightSidebarEndWin;
const endStr = rightSidebarEnd !== -1 ? '          </TabsContent>\n        </Tabs>\n      </div>' : '          </TabsContent>\r\n        </Tabs>\r\n      </div>';

if (rightSidebarStart !== -1 && endIdx !== -1) {
  const rightSidebarCode = code.substring(rightSidebarStart, endIdx + endStr.length);
  code = code.replace(rightSidebarCode, '');
}

// 2. The Left Sidebar was inserted, but it might be missing closing tags or have a syntax error.
// Let's find the Left Sidebar and replace it with a clean version.
const leftSidebarStart = code.indexOf('{/* Left Sidebar (Details) */}');

const cleanLeftSidebar = `        {/* Left Sidebar (Details) */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-2xl h-full">
          <Tabs value={rightSidebarTab} onValueChange={(v: any) => setRightSidebarTab(v)} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-slate-950 border border-slate-800 p-1 rounded-lg mb-4">
              <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Run of Show</TabsTrigger>
              <TabsTrigger value="logistics" className="text-xs">Logistics</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="flex-1 overflow-y-auto pr-2">
              {selectedElement ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-xl text-white font-bold">Properties</h3>
                    <Button variant="ghost" size="icon" onClick={() => updateElement(selectedElement.id, { rotation: selectedElement.rotation + 45 })}>
                      <span className="text-xs">Rotate</span>
                    </Button>
                  </div>
                  
                  {selectedElement.type.startsWith("table") && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Guests at Table</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={12} 
                          value={selectedElement.guests}
                          onChange={(e) => updateElement(selectedElement.id, { guests: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      
                      <Separator className="bg-slate-800" />
                      <h4 className="font-serif text-[#fbbf24] text-lg">Inventory Selection</h4>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-300">Linens</Label>
                        <Select value={selectedElement.linen} onValueChange={(v) => updateElement(selectedElement.id, { linen: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Linen" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="white_cotton">White Cotton</SelectItem>
                            <SelectItem value="ivory_damask">Ivory Damask</SelectItem>
                            <SelectItem value="black_polyester">Black Polyester</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-300">Napkins</Label>
                        <Select value={selectedElement.napkin} onValueChange={(v) => updateElement(selectedElement.id, { napkin: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Napkin" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="gold">Gold Accent</SelectItem>
                            <SelectItem value="navy">Navy Blue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Glassware</Label>
                        <Select value={selectedElement.glassware} onValueChange={(v) => updateElement(selectedElement.id, { glassware: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Glassware" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="standard">Standard Water/Wine</SelectItem>
                            <SelectItem value="crystal">Crystal Stemware</SelectItem>
                            <SelectItem value="gold_rim">Gold-Rimmed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-slate-800" />
                      <h4 className="font-serif text-[#fbbf24] text-lg">Atmosphere</h4>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Centerpiece Style</Label>
                        <Select value={selectedElement.centerpieceStyle} onValueChange={(v) => updateElement(selectedElement.id, { centerpieceStyle: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Style" /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="low_lush">Low & Lush</SelectItem>
                            <SelectItem value="tall_elegant">Tall & Elegant</SelectItem>
                            <SelectItem value="candles_only">Candles Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Floral Type</Label>
                        <Input 
                          placeholder="e.g., White Roses & Eucalyptus"
                          value={selectedElement.floralType || ""}
                          onChange={(e) => updateElement(selectedElement.id, { floralType: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2 pt-4">
                        <Label className="text-slate-300">Self-Perform (In-House Override)</Label>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={selectedElement.selfPerform} 
                            onCheckedChange={(checked) => updateElement(selectedElement.id, { selfPerform: checked })}
                          />
                          <span className="text-xs text-slate-400">If ON, cost is $0 (increases profit margin)</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === "tent_40x60" && (
                    <div className="space-y-2 pt-4">
                      <Label className="text-slate-300">Tent Sidewalls (+$300)</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={selectedElement.hasSidewalls || false} 
                          onCheckedChange={(checked) => updateElement(selectedElement.id, { hasSidewalls: checked })}
                        />
                        <span className="text-xs text-slate-400">Enclose tent with solid walls</span>
                      </div>
                    </div>
                  )}

                  {selectedElement.type === "staging_kitchen" && (
                    <div className="space-y-2 pt-4">
                      <Label className="text-slate-300">Safety Radius (10ft)</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={selectedElement.showSafetyRadius || false} 
                          onCheckedChange={(checked) => updateElement(selectedElement.id, { showSafetyRadius: checked })}
                        />
                        <span className="text-xs text-slate-400">Show 10ft fire safety clearance</span>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-slate-800" />
                  <h4 className="font-serif text-[#fbbf24] text-lg">Timeline Event</h4>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Event Name</Label>
                    <Input 
                      placeholder="e.g., Band Start" 
                      value={selectedElement.timeEventName || ""} 
                      onChange={(e) => updateElement(selectedElement.id, { timeEventName: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Time (Decimal 16-22)</Label>
                    <Input 
                      type="number"
                      min={16}
                      max={22}
                      step={0.25}
                      value={selectedElement.timeEventTime || ""} 
                      onChange={(e) => updateElement(selectedElement.id, { timeEventTime: parseFloat(e.target.value) })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Event Type</Label>
                    <Select value={selectedElement.timeEventType || "general"} onValueChange={(v: any) => updateElement(selectedElement.id, { timeEventType: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="food_service">Food Service</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 mt-10">
                  <p>Select an element on the map to edit its properties.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-white font-bold">Run of Show</h3>
                <div className="space-y-2">
                  {timelineEvents.map(e => (
                    <div key={e.id} className={cn(
                      "p-3 rounded-lg border flex items-center justify-between",
                      e.timeEventTime! <= globalTime ? "bg-emerald-950/30 border-emerald-900/50" : "bg-slate-900 border-slate-800",
                      e.timeEventType === "food_service" && e.timeEventTime! <= globalTime && "border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    )}>
                      <div>
                        <div className="text-xs text-slate-400 font-mono">{formatTime(e.timeEventTime!)}</div>
                        <div className={cn(
                          "font-bold",
                          e.timeEventTime! <= globalTime ? "text-emerald-400" : "text-white",
                          e.timeEventType === "food_service" && e.timeEventTime! <= globalTime && "text-[#fbbf24]"
                        )}>{e.timeEventName}</div>
                      </div>
                      {e.timeEventType === "food_service" && e.timeEventTime! <= globalTime && (
                        <span className="text-[10px] bg-[#fbbf24] text-slate-950 px-2 py-1 rounded font-bold animate-pulse">NOW PLATING</span>
                      )}
                    </div>
                  ))}
                  {timelineEvents.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No timeline events assigned to map elements.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logistics" className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-6">
                <h3 className="font-serif text-xl text-white font-bold flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-[#fbbf24]" />
                  Logistics & Setup
                </h3>
                
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Clock className="w-16 h-16" />
                  </div>
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Wendy Efficiency Score</h4>
                  <div className="flex items-end gap-3">
                    <div className={cn("text-4xl font-black", scoreColor)}>{efficiencyScore}</div>
                    <div className="text-xs text-slate-400 mb-1">/ 100</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {safetyHazardsCount > 0 ? "Safety hazards detected. " : ""}
                    {muddyPathTableIds.size > 0 ? "Muddy paths slowing service. " : ""}
                    {avgDistanceFt > 50 ? "Long travel distances. " : "Optimal layout."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Est. Setup Time</div>
                    <div className="text-lg font-bold text-white">{Math.floor(setupMins / 60)}h {setupMins % 60}m</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Est. Load-Out</div>
                    <div className="text-lg font-bold text-white">{Math.floor(loadOutMins / 60)}h {loadOutMins % 60}m</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Travel Distance Math</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Avg Table Distance</span> <span className="font-bold text-white">{Math.round(avgDistanceFt)} ft</span></div>
                    <div className="flex justify-between"><span>Worker Loops</span> <span className="font-bold text-white">{totalLoops}</span></div>
                    <div className="flex justify-between"><span>Total Service Mileage</span> <span className="font-bold text-white">{serviceMileage.toFixed(2)} mi</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Asset Count</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Dining Tables</span> <span className="font-bold text-white">{tablesCount}</span></div>
                    <div className="flex justify-between"><span>Chairs Needed</span> <span className="font-bold text-white">{chairsCount}</span></div>
                    <div className="flex justify-between"><span>Tents (40x60)</span> <span className="font-bold text-white">{tentsCount}</span></div>
                    <div className="flex justify-between"><span>Power Drops</span> <span className="font-bold text-white">{powerDropsCount}</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Cost Analysis (MarketWatch)</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Tables ($16.50/ea)</span> <span className="font-bold text-white">\${tablesCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Chairs ($2.50/ea)</span> <span className="font-bold text-white">\${chairsCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tents ($1500/ea)</span> <span className="font-bold text-white">\${tentsCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Power Drops ($150/ea)</span> <span className="font-bold text-white">\${powerDropsCost.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2">Labor Estimator</h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Servers (1 per 10 tables)</span> <span className="font-bold text-white">{estimatedLaborServers}</span></div>
                    <div className="flex justify-between"><span>Rate ($25/hr x 6 hrs)</span> <span className="font-bold text-white">\${laborCost.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-slate-300 font-bold mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-[#fbbf24]" /> Menu Planner
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Signature Dish</Label>
                      <Select value={selectedSignatureDish} onValueChange={setSelectedSignatureDish}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs h-8">
                          <SelectValue placeholder="Select Dish" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="Blueberry Cranberry Bread">Blueberry Cranberry Bread</SelectItem>
                          <SelectItem value="Wendy's Signature Quiche">Wendy's Signature Quiche</SelectItem>
                          <SelectItem value="Herb-Crusted Salmon">Herb-Crusted Salmon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="bg-slate-900 p-3 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Dynamic Prep List</div>
                      <div className="text-sm text-white">
                        {chairsCount === 0 ? (
                          <span className="text-slate-500 italic">Add guests to map to calculate prep.</span>
                        ) : (
                          <span>
                            If <strong className="text-[#fbbf24]">{chairsCount} guests</strong>, you need <strong className="text-[#fbbf24]">{
                              selectedSignatureDish === "Blueberry Cranberry Bread" ? Math.ceil(chairsCount / 8) + " loaves" : 
                              selectedSignatureDish === "Wendy's Signature Quiche" ? Math.ceil(chairsCount / 6) + " quiches" : 
                              chairsCount + " portions"
                            }</strong> of {selectedSignatureDish}.
                          </span>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleKitchenSync}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      size="sm"
                    >
                      <Send className="w-3 h-3 mr-2 text-[#fbbf24]" /> Kitchen Sync
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg">
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Total Estimated Value</span>
                  <span className="text-2xl font-serif font-bold text-white">\${totalEstimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>`;

if (leftSidebarStart !== -1) {
  // We need to replace the broken left sidebar with the clean one.
  // The broken one starts at leftSidebarStart and ends at the first `{/* Canvas Area */}`
  const canvasStart = code.indexOf('{/* Canvas Area */}');
  if (canvasStart !== -1) {
    const brokenSidebar = code.substring(leftSidebarStart, canvasStart);
    code = code.replace(brokenSidebar, cleanLeftSidebar + '\n\n        ');
  }
}

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', code);
