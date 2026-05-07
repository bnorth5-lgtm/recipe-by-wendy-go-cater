const fs = require('fs');

// 1. Update EventContext.tsx to comment out the Supabase fetch
let eventCtx = fs.readFileSync('src/context/EventContext.tsx', 'utf8');
eventCtx = eventCtx.replace(/const initSupabase = async \(\) => \{[\s\S]*?\};\r?\n\r?\n    initSupabase\(\);/g, `// Supabase fetch bypassed for demo\n    // const initSupabase = async () => {\n    // ...\n    // };\n    // initSupabase();`);
fs.writeFileSync('src/context/EventContext.tsx', eventCtx);

// 2. Update VenueArchitect.tsx to use CONST_DEMO_STATE
let venueArch = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

const demoStateCode = `
const CONST_DEMO_STATE: MapElementData[] = [
  {
    id: "demo-tent-1",
    type: "tent_40x60",
    x: 200,
    y: 100,
    rotation: 0,
    guests: 0,
    vendorAssigned: false,
    selfPerform: false,
  },
  {
    id: "demo-power-1",
    type: "power_drop",
    x: 200 + 600 - 20,
    y: 100 + 400 - 20,
    rotation: 0,
    guests: 0,
    vendorAssigned: false,
    selfPerform: false,
  }
];

const VenueArchitectContent = () => {
  const [elements, setElements] = useState<MapElementData[]>(() => {
    const saved = localStorage.getItem("venue_architect_elements");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return CONST_DEMO_STATE;
      }
    }
    return CONST_DEMO_STATE;
  });`;

venueArch = venueArch.replace('const VenueArchitectContent = () => {\n  const [elements, setElements] = useState<MapElementData[]>([]);', demoStateCode);
venueArch = venueArch.replace('const VenueArchitectContent = () => {\r\n  const [elements, setElements] = useState<MapElementData[]>([]);', demoStateCode);

// Update handleReset to use CONST_DEMO_STATE
const handleResetRegex = /const handleReset = \(\) => \{[\s\S]*?localStorage\.removeItem\("venue_architect_elements"\);\r?\n\s*setElements\(\[\]\);/g;
venueArch = venueArch.replace(handleResetRegex, `const handleReset = () => {
    localStorage.removeItem("venue_architect_elements");
    setElements(CONST_DEMO_STATE);`);

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', venueArch);
