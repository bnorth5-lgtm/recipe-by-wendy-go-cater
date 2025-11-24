"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Calendar,
  ClipboardList, // For Action Items
  FileText, // For Build Proposal
  Warehouse, // For Manage Inventory
  MenuSquare, // For Build Menu
  Utensils, // For Build Recipes
  CalendarPlus, // For Build Event
} from "lucide-react"; // Import Lucide React icons
import { useCateringStore } from "@/store/cateringStore"; // Import the store

const Dashboard = () => {
  console.log("Dashboard.tsx is rendering with LucideIcons!");

  const proposals = useCateringStore((state) => state.proposals);

  // Calculate dynamic counts for the Quote Pipeline
  const newLeadsCount = proposals.filter(p => p.status === "Draft").length;
  const proposalsSentCount = proposals.filter(p => p.status === "Sent").length;
  const confirmedBookingsCount = proposals.filter(p => p.status === "Accepted").length;

  return (
    <div
      className="space-y-6 min-h-full p-6 bg-cover bg-center relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-40 rounded-lg"></div> 
      {/* Removed: <h1 className="text-3xl font-bold text-white relative z-10">Dashboard</h1> */}

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {/* Existing Cards - Now clickable */}
        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quote Pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newLeadsCount} New Leads</div>
              <p className="text-xs text-muted-foreground">
                {proposalsSentCount} Proposals Sent, {confirmedBookingsCount} Confirmed Bookings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events/calendar" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Next 3 Events</div>
              <p className="text-xs text-muted-foreground">
                July 20: Sarah & John Wedding (150 Guests)
              </p>
              <p className="text-xs text-muted-foreground">
                Aug 5: Corporate Lunch (50 Guests)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events/bookings" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Action Items
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today's Tasks</div>
              <p className="text-xs text-muted-foreground">
                Prep chicken for Sarah & John Wedding
              </p>
              <p className="text-xs text-muted-foreground">
                Call rental company for Aug 5 event
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* New "Build" Cards */}
        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Proposal
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Create a new client proposal</div>
              <p className="text-xs text-muted-foreground">
                Generate detailed quotes for upcoming events.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/inventory" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manage Inventory
              </CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Add or update stock levels</div>
              <p className="text-xs text-muted-foreground">
                Keep track of all your ingredients and equipment.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/menus" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Menu
              </CardTitle>
              <MenuSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Design new event menus</div>
              <p className="text-xs text-muted-foreground">
                Combine recipes into curated offerings for clients.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/recipes" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Recipes
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Create or modify recipes</div>
              <p className="text-xs text-muted-foreground">
                Manage ingredients and instructions for all your dishes.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events/bookings" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Event
              </CardTitle>
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Schedule a new event booking</div>
              <p className="text-xs text-muted-foreground">
                Add confirmed events to your calendar and manage details.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;