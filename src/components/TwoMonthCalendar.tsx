"use client";

import React, { useState } from "react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, parseISO, isPast, differenceInDays } from "date-fns";
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
import { FileText, DollarSign, CalendarCheck, Printer } from "lucide-react";

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
    .filter(e => isFuture(parseISO(e.createdAt)))
    .map(e => parseISO(e.createdAt));

  const pendingProposalDates = proposals
    .filter(p => (p.status === "Draft" || p.status === "Sent") && isFuture(parseISO(p.eventDate)))
    .map(p => parseISO(p.eventDate));
  
  const completedEventDates = bookings
    .filter(b => b.status === "completed" && isFuture(parseISO(b.eventDate)))
    .map(b => parseISO(b.eventDate));

  const pendingEventDates = bookings
    .filter(b => b.status === "pending" && isFuture(parseISO(b.eventDate)))
    .map(b => parseISO(b.eventDate));
  

  const modifiers = {
    quotes: quoteDates,
    proposals: pendingProposalDates,
    pendingEvents: pendingEventDates,
    completedEvents: completedEventDates,
  };

  const modifiersClassNames = {
    quotes: "bg-calendar-quote text-primary-foreground rounded-full",
    proposals: "bg-calendar-proposal text-primary-foreground rounded-full",
    pendingEvents: "bg-calendar-event text-primary-foreground rounded-full",
    completedEvents: "bg-calendar-completed-event text-primary-foreground rounded-full",
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsDetailsDialogOpen(true);
    }
  };

  const getItemsForSelectedDate = () => {
    if (!selectedDate) return [];

    const items: { type: "quote" | "proposal" | "pendingEvent" | "completedEvent" | "beo"; item: Estimate | Proposal | EventBooking }[] = [];

    estimates.forEach(e => {
      if (isSameDay(parseISO(e.createdAt), selectedDate)) {
        items.push({ type: "quote", item: e });
      }
    });

    proposals.forEach(p => {
      if ((p.status === "Draft" || p.status === "Sent") && isSameDay(parseISO(p.eventDate), selectedDate)) {
        items.push({ type: "proposal", item: p });
      }
    });

    bookings.forEach(b => {
      if (isSameDay(parseISO(b.eventDate), selectedDate)) {
        if (b.status === "pending") {
          items.push({ type: "pendingEvent", item: b });
        } else if (b.status === "completed") {
          items.push({ type: "completedEvent", item: b });
        }
        if (b.status !== "cancelled") {
          items.push({ type: "beo", item: b });
        }
      }
    });

    return items.sort((a, b) => {
      const order = { quote: 1, proposal: 2, pendingEvent: 3, completedEvent: 4, beo: 5 };
      return order[a.type] - order[b.type];
    });
  };

  const itemsOnSelectedDate = getItemsForSelectedDate();

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Upcoming Timeline</CardTitle>
        <CardDescription className="text-muted-foreground">
          View quotes, proposals, and events. Click a date for details.
        </CardDescription>
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
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Details for {selectedDate ? format(selectedDate, "PPP") : ""}</DialogTitle>
            <DialogDescription>
              Click on an item to navigate to its full details.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {itemsOnSelectedDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">No items for this date.</p>
              ) : (
                itemsOnSelectedDate.map((itemWrapper, index) => {
                  const { type, item } = itemWrapper;
                  let title = "";
                  let description = "";
                  let link = "";
                  let Icon = FileText;
                  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                  let badgeText = "";

                  if (type === "quote") {
                    const quoteItem = item as Estimate;
                    title = `Estimate: ${quoteItem.eventName}`;
                    description = `Guests: ${quoteItem.numberOfGuests}, Total: $${quoteItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/estimates/${quoteItem.id}`;
                    Icon = DollarSign;
                    badgeVariant = "outline";
                    badgeText = "Quote";
                  } else if (type === "proposal") {
                    const proposalItem = item as Proposal;
                    title = `Proposal: ${proposalItem.eventName}`;
                    description = `Client: ${proposalItem.clientId}, Status: ${proposalItem.status}, Total: $${proposalItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/proposals/${proposalItem.id}`;
                    Icon = FileText;
                    badgeVariant = proposalItem.status === "Accepted" ? "default" : proposalItem.status === "Sent" ? "secondary" : "outline";
                    badgeText = "Proposal";
                  } else if (type === "pendingEvent") {
                    const eventItem = item as EventBooking;
                    title = `Event: ${eventItem.eventName}`;
                    description = `Client: ${eventItem.clientName}, Guests: ${eventItem.numberOfGuests}, Status: ${eventItem.status}`;
                    link = `/events/calendar/${eventItem.id}`;
                    Icon = CalendarCheck;
                    badgeVariant = "destructive";
                    badgeText = "Pending Event";
                  } else if (type === "completedEvent") {
                    const eventItem = item as EventBooking;
                    title = `Event: ${eventItem.eventName}`;
                    description = `Client: ${eventItem.clientName}, Guests: ${eventItem.numberOfGuests}, Status: ${eventItem.status}`;
                    link = `/events/calendar/${eventItem.id}`;
                    Icon = CalendarCheck;
                    badgeVariant = "default";
                    badgeText = "Completed Event";
                  } else if (type === "beo") {
                    const beoItem = item as EventBooking;
                    title = `BEO for: ${beoItem.eventName}`;
                    description = `Client: ${beoItem.clientName}, Status: ${beoItem.status}`;
                    link = `/events/beos/${beoItem.id}`;
                    Icon = Printer;
                    badgeVariant = "default";
                    badgeText = "BEO";
                  }

                  return (
                    <Link to={link} key={index} onClick={() => setIsDetailsDialogOpen(false)}>
                      <div className="flex items-start space-x-3 p-2 border rounded-md hover:bg-secondary/20 transition-colors cursor-pointer">
                        <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{title}</h4>
                          <p className="text-sm text-muted-foreground">{description}</p>
                          <Badge variant={badgeVariant} className="mt-1 capitalize">{badgeText}</Badge>
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