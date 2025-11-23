"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Calendar = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Event Calendar</h1>
        <p className="text-xl text-muted-foreground">
          View and manage all your upcoming events in a calendar format.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Calendar;