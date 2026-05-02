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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const estimateDates = estimates
    .filter(e => isFuture(parseISO(e.createdAt))) // Only future estimates for highlighting
    .map(e => parseISO(e.createdAt));

  const pendingProposalDates = proposals
    .filter(p => (p.status === "Draft" || p.status === "Sent") && isFuture(parseISO(p.eventDate))) // Only Draft/Sent future proposals
    .map(p => parseISO(p.eventDate));

  const pendingEventDates = bookings
    .filter(b => b.status === "pending" && isFuture(parseISO(b.eventDate))) // Only pending future events
    .map(b => parseISO(b.eventDate));
  
  const completedEventDates = bookings
    .filter(b => b.status === "completed" && isFuture(parseISO(b.eventDate))) // Only completed future events
    .map(b => parseISO(b.eventDate));

  const modifiers = {
    estimates: estimateDates,
    proposals: pendingProposalDates, // Renamed for clarity
    pendingEvents: pendingEventDates, // NEW
    completedEvents: completedEventDates, // NEW
  };

  const modifiersClassNames = {
    estimates: "bg-calendar-quote text-primary-foreground rounded-full",
    proposals: "bg-calendar-proposal text-primary-foreground rounded-full",
    pendingEvents: "bg-calendar-event text-primary-foreground rounded-full", // NEW
    completedEvents: "bg-calendar-completed-event text-primary-foreground rounded-full", // NEW
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsDetailsDialogOpen(true);
    }
  };

  const getItemsForSelectedDate = () => {
    if (!selectedDate) return [];

    const items: { type: "estimate" | "proposal" | "pendingEvent" | "completedEvent" | "beo"; item: Estimate | Proposal | EventBooking }[] = [];

    estimates.forEach(e => {
      if (isSameDay(parseISO(e.createdAt), selectedDate)) {
        items.push({ type: "estimate", item: e });
      }
    });

    proposals.forEach(p => {
      // Only show proposals if they are Draft or Sent, and for their eventDate
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
        // Add a separate entry for BEO if the event is not cancelled
        if (b.status !== "cancelled") {
          items.push({ type: "beo", item: b });
        }
      }
    });

    // Sort items by type for consistent display
    return items.sort((a, b) => {
      const order = { estimate: 1, proposal: 2, pendingEvent: 3, completedEvent: 4, beo: 5 };
      return order[a.type] - order[b.type];
    });
  };

  const itemsOnSelectedDate = getItemsForSelectedDate();

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[400px] flex flex-col p-3 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">Upcoming Timeline</CardTitle>
        <CardDescription className="text-muted-foreground">
          View estimates, proposals, and events. Click a date for details.
        </CardDescription>
        {/* Removed the Badge elements as requested */}
      </CardHeader>
      <CardContent className="flex-1 p-3 overflow-hidden">
        <div className="flex flex-col lg:flex-row flex-wrap lg:flex-nowrap gap-4 lg:gap-8">
          <ShadcnCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={3}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border flex-1 min-w-0 overflow-hidden w-full lg:w-auto"
          />
          {/* Desktop Calendar Key */}
          <div className="hidden lg:block flex-shrink-0 w-full lg:w-1/4 xl:w-1/5 p-4 border rounded-md bg-background lg:border-l-2 lg:border-l-muted lg:pl-6 lg:ml-2">
            <h3 className="text-lg font-semibold mb-3 text-primary">Calendar Key</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-calendar-quote mr-2"></span>
                <span className="text-sm text-muted-foreground">Estimates</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-calendar-proposal mr-2"></span>
                <span className="text-sm text-muted-foreground">Proposals</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-calendar-event mr-2"></span>
                <span className="text-sm text-muted-foreground">Pending Events</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-calendar-completed-event mr-2"></span>
                <span className="text-sm text-muted-foreground">Completed Events</span>
              </div>
            </div>
          </div>
          {/* Mobile Calendar Key Accordion */}
          <div className="block lg:hidden w-full">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="calendar-key" className="border rounded-md px-4 bg-background">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">Calendar Key</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-calendar-quote mr-2"></span>
                      <span className="text-sm text-muted-foreground">Estimates</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-calendar-proposal mr-2"></span>
                      <span className="text-sm text-muted-foreground">Proposals</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-calendar-event mr-2"></span>
                      <span className="text-sm text-muted-foreground">Pending Events</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-calendar-completed-event mr-2"></span>
                      <span className="text-sm text-muted-foreground">Completed Events</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </CardContent>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="p-3 pb-1">
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

                  if (type === "estimate") {
                    const estimateItem = item as Estimate;
                    title = `Estimate: ${estimateItem.eventName}`;
                    description = `Guests: ${estimateItem.numberOfGuests}, Total: $${estimateItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/estimates/${estimateItem.id}`; // Direct link to edit form
                    Icon = DollarSign;
                    badgeVariant = "outline";
                    badgeText = "Estimate";
                  } else if (type === "proposal") {
                    const proposalItem = item as Proposal;
                    title = `Proposal: ${proposalItem.eventName}`;
                    description = `Client: ${proposalItem.clientId}, Status: ${proposalItem.status}, Total: $${proposalItem.totalAmount.toFixed(2)}`;
                    link = `/quoting/proposals/${proposalItem.id}`; // Direct link to view dialog
                    Icon = FileText;
                    badgeVariant = proposalItem.status === "Accepted" ? "default" : proposalItem.status === "Sent" ? "secondary" : "outline";
                    badgeText = "Proposal";
                  } else if (type === "pendingEvent") {
                    const eventItem = item as EventBooking;
                    title = `Event: ${eventItem.eventName}`;
                    description = `Client: ${eventItem.clientName}, Guests: ${eventItem.numberOfGuests}, Status: ${eventItem.status}`;
                    link = `/events/calendar/${eventItem.id}`; // Direct link to edit dialog
                    Icon = CalendarCheck;
                    badgeVariant = "destructive"; // Pending events are destructive (red)
                    badgeText = "Pending Event";
                  } else if (type === "completedEvent") { // NEW
                    const eventItem = item as EventBooking;
                    title = `Event: ${eventItem.eventName}`;
                    description = `Client: ${eventItem.clientName}, Guests: ${eventItem.numberOfGuests}, Status: ${eventItem.status}`;
                    link = `/events/calendar/${eventItem.id}`; // Direct link to edit dialog
                    Icon = CalendarCheck;
                    badgeVariant = "default"; // Completed events are default (green)
                    badgeText = "Completed Event";
                  } else if (type === "beo") { // BEO type
                    const beoItem = item as EventBooking;
                    title = `BEO for: ${beoItem.eventName}`;
                    description = `Client: ${beoItem.clientName}, Status: ${beoItem.status}`;
                    link = `/events/beos/${beoItem.id}`; // Direct link to BEO view dialog
                    Icon = Printer; // Use Printer icon for BEO
                    badgeVariant = "default"; // Use default for BEOs, or a specific BEO color
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

export default TwoMonthCalendar;