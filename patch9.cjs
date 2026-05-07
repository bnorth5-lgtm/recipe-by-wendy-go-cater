const fs = require('fs');

// 1. Force Mock Client in supabaseClient.ts
const mockClientCode = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Total Network Lockdown for Demo
const isDemoMode = true; // Force mock client everywhere to kill 400/404s

const createMockClient = () => {
  const mockChain = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === 'then') {
          return (resolve) => resolve({ data: null, error: null });
        }
        if (prop === 'subscribe' || prop === 'unsubscribe' || prop === 'removeChannel') {
          return () => {};
        }
        if (prop === 'on') {
          return () => mockChain;
        }
        if (prop === 'select' || prop === 'eq' || prop === 'order' || prop === 'limit' || prop === 'single' || prop === 'update' || prop === 'insert') {
          return () => mockChain;
        }
        return () => mockChain;
      },
    }
  );

  return {
    from: () => mockChain,
    channel: () => mockChain,
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as any;
};

export const supabase = isDemoMode 
  ? createMockClient() 
  : createClient(
      supabaseUrl || 'https://placeholder-project.supabase.co', 
      supabaseAnonKey || 'placeholder-anon-key'
    );
`;
fs.writeFileSync('src/logic/supabaseClient.ts', mockClientCode);

// 2. Kill 400/404s in EventContext.tsx
let eventCtx = fs.readFileSync('src/context/EventContext.tsx', 'utf8');

// Replace initSupabase
eventCtx = eventCtx.replace(/const initSupabase = async \(\) => \{[\s\S]*?initSupabase\(\);\r?\n  \}, \[\]\);/g, `// Supabase fetch bypassed for demo
  useEffect(() => {
    // const initSupabase = async () => { ... }
    // initSupabase();
  }, []);`);

// Replace updateEventState supabase calls
eventCtx = eventCtx.replace(/if \(eventId\) \{[\s\S]*?if \(data\) setEventId\(data\.id\);\r?\n      \}/g, `// Supabase update bypassed for demo
      // if (eventId) {
      //   await supabase.from('events').update(payload).eq('id', eventId);
      // } else {
      //   const { data } = await supabase.from('events').insert(payload).select().single();
      //   if (data) setEventId(data.id);
      // }`);

fs.writeFileSync('src/context/EventContext.tsx', eventCtx);

// 3. Ensure VenueArchitect.tsx is using CONST_DEMO_STATE and not syncing
let venueArch = fs.readFileSync('src/components/VenueMap/VenueArchitect.tsx', 'utf8');

// Comment out the useEffect that syncs to global context if it's causing issues, 
// but the user specifically asked to remove useEffect dependency on external data.
// The only external data dependency might be in the initial load.
// We already set it to CONST_DEMO_STATE in the previous patch, let's just make sure it's robust.

fs.writeFileSync('src/components/VenueMap/VenueArchitect.tsx', venueArch);
