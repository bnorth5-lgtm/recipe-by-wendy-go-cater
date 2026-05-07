const fs = require('fs');
let code = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

// 1. We need to add a resetKey to VenueArchitect and pass it to VenueArchitectContent
// 2. The reset button should clear localStorage and increment the key.
// 3. We need to ensure no null values are causing errors.

// Let's modify the ErrorBoundary and VenueArchitect wrapper
const newWrapper = `
class VenueArchitectErrorBoundary extends React.Component<{ children: React.ReactNode, onReset: () => void }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("VenueArchitect render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-white p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Map Render Error</h2>
          <p className="text-slate-400 mb-6">The Venue Architect encountered an unexpected error loading the map data.</p>
          <Button onClick={() => { 
            this.setState({ hasError: false });
            this.props.onReset();
          }} className="bg-[#fbbf24] text-slate-900 hover:bg-[#f59e0b]">
            Reset Map to Default Grid
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const VenueArchitect = () => {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    localStorage.removeItem("venue_architect_elements");
    setResetKey(prev => prev + 1);
  };

  return (
    <VenueArchitectErrorBoundary onReset={handleReset}>
      <VenueArchitectContent key={resetKey} />
    </VenueArchitectErrorBoundary>
  );
};
`;

// Replace the old wrapper with the new one
const oldWrapperStart = code.indexOf('class VenueArchitectErrorBoundary');
if (oldWrapperStart !== -1) {
  code = code.substring(0, oldWrapperStart) + newWrapper;
}

// 4. In VenueArchitectContent, we need to make sure handleReset is robust if it exists, or just rely on the wrapper's reset.
// Let's check if there's a handleReset in VenueArchitectContent
const handleResetMatch = code.match(/const handleReset = \(\) => \{[\s\S]*?\};/);
if (handleResetMatch) {
  const robustHandleReset = `const handleReset = () => {
    localStorage.removeItem("venue_architect_elements");
    setElements([]);
    setSelectedId(null);
    setGlobalTime(16);
    setIsOutdoorMode(false);
    setShowInfraOverlay(false);
    setIsRaining(false);
  };`;
  code = code.replace(handleResetMatch[0], robustHandleReset);
}

// 5. Let's fix potential nulls in the canvas renderer.
// The error is likely caused by `timelineEvents.map` or similar if timelineEvents is undefined, or `selectedElement` properties.
// We'll add a check for `elements` before mapping.
code = code.replace(/elements\.map\(\(el\) => \{/g, '(elements || []).map((el) => {');

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', code);
