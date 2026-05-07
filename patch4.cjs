const fs = require('fs');
let code = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

// 1. Rename VenueArchitect to VenueArchitectContent
code = code.replace('export const VenueArchitect = () => {', 'const VenueArchitectContent = () => {');

// 2. Remove the try/catch logic
code = code.replace(/  try \{\r?\n/, '');
code = code.replace(/  \} catch \(error\) \{\r?\n    console\.error\("VenueArchitect render error:", error\);\r?\n    if \(!hasRenderError\) \{\r?\n      setHasRenderError\(true\);\r?\n    \}\r?\n    return null; \/\/ Will trigger the fallback UI on next render\r?\n  \}\r?\n/g, '');

// 3. Remove the hasRenderError state and fallback from VenueArchitectContent
const fallbackRegex = /  const \[hasRenderError, setHasRenderError\] = useState\(false\);\r?\n[\s\S]*?Reset Map to Default Grid\r?\n        <\/Button>\r?\n      <\/div>\r?\n    \);\r?\n  }\r?\n\r?\n/g;
code = code.replace(fallbackRegex, '');

// 4. Add the ErrorBoundary and export VenueArchitect at the bottom
const errorBoundaryCode = `
class VenueArchitectErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
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
  return (
    <VenueArchitectErrorBoundary>
      <VenueArchitectContent />
    </VenueArchitectErrorBoundary>
  );
};
`;

code += errorBoundaryCode;

// 5. Move the Right Sidebar to the Left Sidebar
const rightSidebarStart = code.indexOf('{/* Right Sidebar (Details) */}');
const rightSidebarEnd = code.indexOf('          </TabsContent>\r\n        </Tabs>\r\n      </div>');
const rightSidebarEndUnix = code.indexOf('          </TabsContent>\n        </Tabs>\n      </div>');

const endIdx = rightSidebarEnd !== -1 ? rightSidebarEnd : rightSidebarEndUnix;
const endStr = rightSidebarEnd !== -1 ? '          </TabsContent>\r\n        </Tabs>\r\n      </div>' : '          </TabsContent>\n        </Tabs>\n      </div>';

if (rightSidebarStart !== -1 && endIdx !== -1) {
  const rightSidebarCode = code.substring(rightSidebarStart, endIdx + endStr.length);
  
  // Remove it from original position
  code = code.replace(rightSidebarCode, '');
  
  // Insert it after BEOSidebar
  const beoSidebarStr = '{/* Left Toolbar - Now the Live BEO Sidebar */}\n        <BEOSidebar />';
  const beoSidebarStrWin = '{/* Left Toolbar - Now the Live BEO Sidebar */}\r\n        <BEOSidebar />';
  
  const newSidebarCode = rightSidebarCode.replace('border-l', 'border-r').replace('{/* Right Sidebar (Details) */}', '{/* Left Sidebar (Details) */}');
  
  if (code.includes(beoSidebarStrWin)) {
    code = code.replace(beoSidebarStrWin, beoSidebarStrWin + '\r\n        ' + newSidebarCode + '\r\n');
  } else {
    code = code.replace(beoSidebarStr, beoSidebarStr + '\n        ' + newSidebarCode + '\n');
  }
}

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', code);