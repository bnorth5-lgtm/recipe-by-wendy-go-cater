"use client";

import React, { useState } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, parseISO } from "date-fns";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Estimate, Proposal, EventBooking } from "@/store/cateringStore";
import { FileText, DollarSign, CalendarCheck } from "lucide-react";

interface TwoMonthCalendarProps {
  proposals: Proposal[];
  estimates: Estimate[];
  bookings: EventBooking[];
}

export const TwoMonthCalendar: React.FC<TwoMonthCalendarProps> = ({ proposals, estimates, bookings }) => {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const nextMonth = addMonths(month, 1);

  // Prepare modifiers for dates with different types of items
  const quoteDates = estimates
    .filter(e => isFuture(parseISO(e.createdAt))) // Only future estimates for highlighting
    .map(e => parseISO(e.createdAt));

  const proposalDates = proposals
    .filter(p => p.status !== "Draft" && p.status !== "Archived" && isFuture(parseISO(p.eventDate))) // Only active future proposals
    .map(p => parseISO(p.eventDate));

  const eventDates = bookings
    .filter(b => b.status === "pending" && isFuture(parseISO(b.eventDate))) // Only pending future events
    .map(b => parseISO(b.eventDate));

  const modifiers = {
    quotes: quoteDates,
    proposals: proposalDates,
    events: eventDates,
  };

  const modifiersClassNames = {
    quotes: "bg-calendar-quote text-primary-foreground rounded-full",
    proposals: "bg-calendar-proposal text-primary-foreground rounded-full",
    events: "bg-calendar-event text-primary-foreground rounded-full",
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsDetailsDialogOpen(true);
    }
  };

  const getItemsForSelectedDate = () => {
    if (!selectedDate) return [];

    const items: { type: "quote" | "proposal" | "event"; item: Estimate | Proposal | EventBooking }[] = [];

    estimates.forEach(e => {
      if (isSameDay(parseISO(e.createdAt), selectedDate)) {
        items.push({ type: "quote", item: e });
      }
    });

    proposals.forEach(p => {
      if (isSameDay(parseISO(p.eventDate), selectedDate)) {
        items.push({ type: "proposal", item: p });
      }
    });

    bookings.forEach(b => {
      if (isSameDay(parseISO(b.eventDate), selectedDate)) {
        items.push({ type: "event", item: b });
      }
    });

    // Sort items by type for consistent display
    return items.sort((a, b) => {
      const order = { quote: 1, proposal: 2, event: 3 };
      return order[a.type] - order[b.type];
    });
  };

  const itemsOnSelectedDate = getItemsForSelectedDate();

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Upcoming Timeline</CardTitle>
        <CardDescription className="text-muted-foreground">
          View quotes, proposals, and events. Click a date for details.
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-2 text-sm">
          <Badge className="bg-calendar-quote text-primary-foreground">Quotes</Badge>
          <Badge className="bg-calendar-proposal text-primary-foreground">Proposals</Badge>
          <Badge className="bg-calendar-event text-primary-foreground">Events</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex justify-center items-center p-0">
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border w-full"
        />
      </CardContent>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Details for {selectedDate ? format(selectedDate, "PPP") : ""}</DialogTitle>
            <DialogDescription>
              Click on an item to navigate to its full details.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {itemsOnSelectedDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No items for this date.</p>
              ) : (
                itemsOnSelectedDate.map((itemWrapper, index) => {
                  const { type, item } = itemWrapper;
                  let title = "";
                  let description = "";
                  let link = "";
                  let Icon = FileText;
                  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

                  if (type === "quote") {
                    const quoteItem = item as Estimate;
                    title = `Estimate: ${quoteItem.eventName}`;
                    description = `Guests: ${quoteItem.numberOfGuests}, Total: $${quoteItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/estimates`; // Estimates page, user can find it there
                    Icon = DollarSign;
                    badgeVariant = "outline";
                  } else if (type === "proposal") {
                    const proposalItem = item as Proposal;
                    title = `Proposal: ${proposalItem.eventName}`;
                    description = `Client: ${proposalItem.clientId}, Status: ${proposalItem.status}, Total: $${proposalItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/proposals`; // Proposals page
                    Icon = FileText;
                    badgeVariant = proposalItem.status === "Accepted" ? "default" : proposalItem.status === "Sent" ? "secondary" : "outline";
                  } else if (type === "event") {
                    const eventItem = item as EventBooking;
                    title = `Event: ${eventItem.eventName}`;
                    description = `Client: ${eventItem.clientName}, Guests: ${eventItem.numberOfGuests}, Status: ${eventItem.status}`;
                    link = `/events/bookings`; // Bookings page
                    Icon = CalendarCheck;
                    badgeVariant = eventItem.status === "pending" ? "destructive" : eventItem.status === "completed" ? "default" : "secondary";
                  }

                  return (
                    <Link to={link} key={index} onClick={() => setIsDetailsDialogOpen(false)}>
                      <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-secondary/20 transition-colors cursor-pointer">
                        <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{title}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                          <Badge variant={badgeVariant} className="mt-1 capitalize">{type}</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};