"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const EventsPlanning = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Events & Function Planning</h1>
        <p className="text-xl text-muted-foreground">
          View your event calendar, manage booking details, and create catering setup sheets (BEOs).
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default EventsPlanning;