const fs = require('fs');

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
