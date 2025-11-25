"use client";

import React from "react";
import { EventBooking, Recipe, InventoryItem } from "@/store/cateringStore";
import { format, parseISO } from "date-fns";

interface BEOProps {
  booking: EventBooking;
  recipes: Recipe[];
  inventory: InventoryItem[];
}

export const BEO: React.FC<BEOProps> = ({ booking, recipes, inventory }) => {
  if (!booking) {
    return <div className="p-2 text-center text-muted-foreground">No booking data available.</div>; {/* Reduced p-3 to p-2 */}
  }

  const formattedEventDate = format(parseISO(booking.eventDate), "PPP");

  const getRecipeDetails = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe || null;
  };

  return (
    <div className="p-4 bg-white text-gray-900 max-w-4xl mx-auto shadow-lg rounded-lg print:shadow-none print:p-0"> {/* Reduced p-6 to p-4 */}
      <div className="flex justify-between items-center border-b pb-2 mb-3"> {/* Reduced pb-3 to pb-2, mb-4 to mb-3 */}
        <h1 className="text-3xl font-bold text-primary">Banquet Event Order (BEO)</h1>
        <div className="text-right">
          <p className="text-sm">BEO ID: <span className="font-semibold">{booking.id.substring(0, 8)}</span></p>
          <p className="text-sm">Date Generated: <span className="font-semibold">{format(new Date(), "PPP")}</span></p>
          <p className="text-sm">Status: <span className="font-semibold capitalize">{booking.status}</span></p>
        </div>
      </div>

      {/* Event Details */}
      <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Event Details</h2> {/* Reduced mb-2 to mb-1 */}
        <p><span className="font-medium">Event Name:</span> {booking.eventName}</p>
        <p><span className="font-medium">Client Name:</span> {booking.clientName}</p>
        <p><span className="font-medium">Event Date:</span> {formattedEventDate}</p>
        <p><span className="font-medium">Number of Guests:</span> {booking.numberOfGuests}</p>
        {/* Placeholder for Event Time, Venue, etc. */}
        <p className="text-sm text-muted-foreground mt-1"> {/* Reduced mt-2 to mt-1 */}
          *Additional details like event time, venue, and setup instructions would go here.*
        </p>
      </div>

      {/* Menu Items */}
      <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Menu Items</h2> {/* Reduced mb-2 to mb-1 */}
        {booking.selectedRecipeIds.length === 0 ? (
          <p className="text-muted-foreground">No recipes selected for this event.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1"> {/* Reduced space-y-2 to space-y-1 */}
            {booking.selectedRecipeIds.map((recipeId) => {
              const recipe = getRecipeDetails(recipeId);
              return recipe ? (
                <li key={recipe.id} className="font-medium text-gray-800">
                  {recipe.name} ({recipe.category})
                  <p className="text-sm text-muted-foreground ml-4">{recipe.description}</p>
                  <div className="ml-4 mt-1 text-xs text-gray-600">
                    <strong>Ingredients:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {recipe.ingredients.map((ing, idx) => (
                        <li key={idx}>{ing.quantity} {ing.name}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={recipeId} className="text-destructive">Unknown Recipe (ID: {recipeId})</li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Staffing & Equipment (Placeholders) */}
      <div className="mb-3 border-t pt-2"> {/* Reduced mb-4 to mb-3, pt-3 to pt-2 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Staffing & Equipment</h2> {/* Reduced mb-2 to mb-1 */}
        <p className="text-muted-foreground">
          <span className="font-medium">Staff Required:</span> Head Chef, 2 Line Cooks, 3 Servers, 1 Bartender
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium">Equipment:</span> Chafing Dishes, Serving Utensils, Table Linens, Glassware, etc.
        </p>
        <p className="text-sm text-muted-foreground mt-1"> {/* Reduced mt-2 to mt-1 */}
          *Detailed staff assignments, setup diagrams, and equipment lists would be included here.*
        </p>
      </div>

      {/* Special Notes */}
      <div className="border-t pt-2 mt-3"> {/* Reduced pt-3 mt-4 to pt-2 mt-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Special Notes / Requirements</h2> {/* Reduced mb-2 to mb-1 */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          Client has requested gluten-free options for 10 guests. Ensure all dietary restrictions are clearly marked.
          Setup to begin at 3:00 PM. Event starts at 6:00 PM.
        </p>
        <p className="text-sm text-muted-foreground mt-1"> {/* Reduced mt-2 to mt-1 */}
          *Any specific client requests, dietary restrictions, or logistical notes for the team.*
        </p>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4 pt-2 border-t"> {/* Reduced mt-6 pt-3 to mt-4 pt-2 */}
        This BEO is for internal use by catering staff.
      </div>
    </div>
  );
};