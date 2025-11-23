"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  DollarSign,
  CalendarCheck,
  LayoutDashboard,
} from "lucide-react"; // Added imports for icons

const Dashboard = () => {
  return (
    <div className="space-y-6 min-h-full"> {/* Added min-h-full */}
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;