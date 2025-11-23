"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom"; // Import Link for navigation
import {
  DollarSign,
  CalendarCheck,
  LayoutDashboard,
  FileText, // For Build Proposal
  Warehouse, // For Build Inventory
  BookText, // For Build Menu
  Utensils, // For Build Recipes
  CalendarPlus, // For Build Event
} from "lucide-react"; // Added imports for new icons

const Dashboard = () => {
  return (
    <div className="space-y-6 min-h-full">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quote Pipeline
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 New Leads</div>
            <p className="text-xs text-muted-foreground">
              5 Proposals Sent, 2 Confirmed Bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Action Items
            </CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
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

        {/* New "Build" Cards */}
        <Link to="/quoting/proposals" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow">
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
          <Card className="h-full hover:shadow-lg transition-shadow">
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
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Menu
              </CardTitle>
              <BookText className="h-4 w-4 text-muted-foreground" />
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
          <Card className="h-full hover:shadow-lg transition-shadow">
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
          <Card className="h-full hover:shadow-lg transition-shadow">
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