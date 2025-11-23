"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const BEOs = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Banquet Event Orders (BEOs)</h1>
        <p className="text-xl text-muted-foreground">
          Create and manage detailed Banquet Event Orders for your staff.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default BEOs;