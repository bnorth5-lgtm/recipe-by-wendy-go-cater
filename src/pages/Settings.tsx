"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Settings = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Settings & Data</h1>
        <p className="text-xl text-muted-foreground">
          Configure default labor rates, profit margins, tax rates, and business branding.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Settings;