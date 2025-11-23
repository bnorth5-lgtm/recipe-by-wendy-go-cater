"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { useCateringStore } from "@/store/cateringStore";
import { format, isSameDay, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const Calendar = () => {
  const bookings = useCateringStore((state) => state.bookings);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Prepare modifiers for dates with events
  const bookedDates = bookings.map(booking => parseISO(booking.eventDate));
  const modifiers = {
    hasEvent: bookedDates,
  };
  const modifiersClassNames = {
    hasEvent: "bg-primary text-primary-foreground rounded-full",
  };

  // Filter events for the selected date
  const eventsOnSelectedDate = selectedDate
    ? bookings.filter(booking => isSameDay(parseISO(booking.eventDate), selectedDate))
    : [];

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Event Calendar</h1>
        <p className="text-xl text-muted-foreground">
          View and manage all your upcoming events in a calendar format.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar View */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Event Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Select a date to see scheduled events. Dates with events are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ShadcnCalendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Events List for Selected Date */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              Events on {selectedDate ? format(selectedDate, "PPP") : "No Date Selected"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Details for events scheduled on the chosen date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsOnSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center">
                {selectedDate ? "No events scheduled for this date." : "Select a date on the calendar to view events."}
              </p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {eventsOnSelectedDate.map((booking) => (
                    <div key={booking.id} className="border p-3 rounded-md bg-secondary/20">
                      <h3 className="font-semibold text-lg">{booking.eventName}</h3>
                      <p className="text-sm text-muted-foreground">Client: {booking.clientName}</p>
                      <p className="text-sm text-muted-foreground">Guests: {booking.numberOfGuests}</p>
                      <Badge
                        className="mt-2"
                        variant={booking.status === "completed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Calendar;