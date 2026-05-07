// Total Network Lockdown for Demo
export const isDemo = true;

// Hard-Kill Network Requests
export const supabase = { 
  from: () => ({ 
    select: () => ({ data: [], error: null }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => {},
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
} as any;
