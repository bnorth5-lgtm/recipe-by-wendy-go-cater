const fs = require('fs');

const mockClientCode = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

// Global Supabase Guard
const isDevelopment = supabaseAnonKey === 'development' || !supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key';

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

export const supabase = isDevelopment 
  ? createMockClient() 
  : createClient(
      supabaseUrl || 'https://placeholder-project.supabase.co', 
      supabaseAnonKey || 'placeholder-anon-key'
    );
`;

fs.writeFileSync('src/logic/supabaseClient.ts', mockClientCode);
