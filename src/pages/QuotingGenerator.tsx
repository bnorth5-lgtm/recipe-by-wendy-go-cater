"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const QuotingGenerator = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Quoting & Proposal Generator</h1>
        <p className="text-xl text-muted-foreground">
          Manage client details, select menus, estimate labor and equipment, and generate proposals here.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default QuotingGenerator;