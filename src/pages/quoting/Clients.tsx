"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Clients = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Client Management</h1>
        <p className="text-xl text-muted-foreground">
          Keep track of all your client details and contact information.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Clients;