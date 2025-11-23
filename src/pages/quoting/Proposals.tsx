"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Proposals = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Proposal Generation</h1>
        <p className="text-xl text-muted-foreground">
          Generate professional proposals for your clients.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Proposals;