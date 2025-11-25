"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import {
  DollarSign,
  ClipboardList,
  FileText,
  Warehouse,
  MenuSquare,
  Utensils,
  CalendarPlus,
  UserPlus,
  AlertCircle, // Added for overdue items
  CalendarCheck, // Added for upcoming events
} from "lucide-react"; // Explicitly importing icons
import { useCateringStore, Client } from "@/store/cateringStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientForm, ClientFormData } from "@/components/ClientForm";
import { useState } from "react";
import { toast } from "sonner";
import { NotesCard } from "@/components/NotesCard";
import { DateDisplay } from "@/components/DateDisplay"; // Import the new DateDisplay
import { TimeDisplay } from "@/components/TimeDisplay"; // Import the new TimeDisplay
import { TwoMonthCalendar } from "@/components/TwoMonthCalendar"; // Import the new calendar component
import { OverdueSidebar } from "@/components/OverdueSidebar"; // NEW: Import OverdueSidebar
import { format, isPast, differenceInDays, parseISO, isFuture } from "date-fns"; // Import date-fns for logic

const Dashboard = () => {
  console.log("Dashboard.tsx is rendering with LucideIcons!");

  const proposals = useCateringStore((state) => state.proposals);
  const bookings = useCateringStore((state) => state.bookings);
  const estimates = useCateringStore((state) => state.estimates); // Get estimates from store
  const addClient = useCateringStore((state) => state.addClient);

  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);

  const newLeadsCount = proposals.filter(p => p.status === "Draft").length;
  const proposalsSentCount = proposals.filter(p => p.status === "Sent").length;
  const confirmedBookingsCount = proposals.filter(p => p.status === "Accepted").length;

  const handleAddClientSubmit = (data: ClientFormData) => {
    addClient(data as Omit<Client, 'id'>);
    toast.success("New client added successfully!");
    setIsClientFormDialogOpen(false);
  };

  // --- Dynamic "Today's Tasks" Logic ---
  const overdueThresholdDays = 7; // Define what 'overdue' means (e.g., 7 days old)
  const upcomingEventsThresholdDays = 7; // Define 'upcoming' (e.g., next 7 days)

  const overdueProposals = proposals.filter(p => {
    const createdAtDate = parseISO(p.createdAt);
    return (p.status === "Draft" || p.status === "Sent") &&
           isPast(createdAtDate) &&
           differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const overdueEstimates = estimates.filter(e => {
    const createdAtDate = parseISO(e.createdAt);
    return isPast(createdAtDate) && differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const upcomingEvents = bookings.filter(b => {
    const eventDate = parseISO(b.eventDate);
    const today = new Date();
    return b.status === "pending" && isFuture(eventDate) && differenceInDays(eventDate, today) <= upcomingEventsThresholdDays;
  }).sort((a, b) => parseISO(a.eventDate).getTime() - parseISO(b.eventDate).getTime()); // Sort by date

  const criticalPathTasks = [
    "Review new leads and assign follow-ups.",
    "Check inventory levels for upcoming events.",
    "Update recipe costs based on recent supplier invoices.",
    "Engage with clients who received proposals last week.",
    "Plan social media content for the next 3 days.",
    "Review staff schedule for next week's events.",
  ];
  // --- End Dynamic "Today's Tasks" Logic ---

  return (
    <div
      className="space-y-6 p-6 relative min-h-screen flex flex-col"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="relative z-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4 flex-1">
        {/* Row 1: Today's Action Items and Take Notes */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Action Items
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full">
            <div className="space-y-3">
              {/* Overdue Proposals */}
              {overdueProposals.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Overdue Proposals:
                  </h3>
                  <ul className="list-disc list-inside text-xs text-destructive ml-4">
                    {overdueProposals.map(p => (
                      <li key={p.id}>
                        <Link to={`/quoting/proposals/${p.id}`} className="hover:underline">
                          {p.eventName} ({format(parseISO(p.createdAt), "MMM d")})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overdue Estimates */}
              {overdueEstimates.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Overdue Estimates:
                  </h3>
                  <ul className="list-disc list-inside text-xs text-destructive ml-4">
                    {overdueEstimates.map(e => (
                      <li key={e.id}>
                        <Link to={`/quoting/estimates/${e.id}`} className="hover:underline">
                          {e.eventName} ({format(parseISO(e.createdAt), "MMM d")})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-1">
                    <CalendarCheck className="h-4 w-4" /> Upcoming Events (Next {upcomingEventsThresholdDays} Days):
                  </h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground ml-4">
                    {upcomingEvents.map(b => (
                      <li key={b.id}>
                        <Link to={`/events/calendar/${b.id}`} className="hover:underline">
                          {b.eventName} on {format(parseISO(b.eventDate), "MMM d")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Path Tasks */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Daily Critical Path:
                </h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground ml-4">
                  {criticalPathTasks.map((task, index) => (
                    <li key={index}>{task}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <NotesCard />
        </div>

        {/* Row 2: Calendar and Overdue Sidebar */}
        <div className="lg:col-span-3">
          <TwoMonthCalendar proposals={proposals} estimates={estimates} bookings={bookings} />
        </div>
        <div>
          <OverdueSidebar />
        </div>

        {/* Remaining hotlinks */}
        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quote Pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-2xl font-bold">{newLeadsCount} New Leads</div>
              <p className="text-xs text-muted-foreground">
                {proposalsSentCount} Proposals Sent, {confirmedBookingsCount} Confirmed Bookings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Proposal
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Create a new client proposal</div>
              <p className="text-xs text-muted-foreground">
                Generate detailed quotes for upcoming events.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/inventory" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manage Inventory
              </CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Add or update stock levels</div>
              <p className="text-xs text-muted-foreground">
                Keep track of all your ingredients and equipment.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/menus" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Menu
              </CardTitle>
              <MenuSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Design new event menus</div>
              <p className="text-xs text-muted-foreground">
                Combine recipes into curated offerings for clients.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/recipes" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Recipes
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Create or modify recipes</div>
              <p className="text-xs text-muted-foreground">
                Manage ingredients and instructions for all your dishes.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events/bookings" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Event
              </CardTitle>
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Schedule a new event booking</div>
              <p className="text-xs text-muted-foreground">
                Add confirmed events to your calendar and manage details.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Create New Client
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="text-lg font-bold mb-2">Add a new client to your database</div>
            <p className="text-xs text-muted-foreground mb-4">
              Quickly add contact and company information for a new client.
            </p>
            <Dialog open={isClientFormDialogOpen} onOpenChange={setIsClientFormDialogOpen}>
              <DialogTrigger>
                <Button
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new client to your database.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  onSubmit={handleAddClientSubmit}
                  onCancel={() => setIsClientFormDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      {/* Footer for Date, MadeWithDyad, and Time */}
      <div className="relative z-10 flex justify-between items-center mt-8 p-4 bg-card/90 rounded-lg shadow-md">
        <DateDisplay />
        <MadeWithDyad />
        <TimeDisplay />
      </div>
    </div>
  );
};

export default Dashboard;