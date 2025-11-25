"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const GeneralSettings = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">General Settings</h1>
        <p className="text-xl text-muted-foreground">
          Configure general application settings.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default GeneralSettings;