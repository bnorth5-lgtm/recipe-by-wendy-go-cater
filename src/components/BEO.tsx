"use client";

import React from "react";
import { EventBooking, Recipe, InventoryItem, BEO as BEOType } from "@/store/cateringStore"; // Import BEOType
import { format, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox for the checklist

interface BEOProps {
  booking: EventBooking;
  recipes: Recipe[];
  inventory: InventoryItem[];
  beo: BEOType; // NEW: Pass the BEO object directly
}

export const BEO: React.FC<BEOProps> = ({ booking, recipes, inventory, beo }) => {
  if (!booking || !beo) {
    return <div className="p-2 text-center text-muted-foreground">No booking or BEO data available.</div>;
  }

  const formattedEventDate = format(parseISO(booking.eventDate), "PPP");

  const getRecipeDetails = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe || null;
  };

  // Simulated staff checklist items (can be moved to BEO object if dynamic)
  const staffChecklistItems = [
    "Confirm final guest count with client",
    "Verify all dietary restrictions are noted and planned for",
    "Assign kitchen staff roles for prep and cooking",
    "Assign service staff roles (servers, bartenders, setup crew)",
    "Confirm equipment rentals and delivery schedule",
    "Prepare all mise en place for recipes",
    "Conduct pre-event briefing with all staff",
    "Perform final quality check on all dishes before serving",
    "Ensure venue setup matches client's diagram",
    "Coordinate with venue contact for event flow",
    "Post-event cleanup and inventory reconciliation",
  ];

  return (
    <div className="p-4 bg-white text-gray-900 max-w-4xl mx-auto shadow-lg rounded-lg print:shadow-none print:p-0">
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <h1 className="text-3xl font-bold text-primary">Banquet Event Order (BEO)</h1>
        <div className="text-right">
          <p className="text-sm">BEO ID: <span className="font-semibold">{beo.id.substring(0, 8)}</span></p>
          <p className="text-sm">Date Generated: <span className="font-semibold">{format(parseISO(beo.createdAt), "PPP")}</span></p>
          <p className="text-sm">Status: <span className="font-semibold capitalize">{beo.status}</span></p>
        </div>
      </div>

      {/* Event Details */}
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-1 text-primary">Event Details</h2>
        <p><span className="font-medium">Event Name:</span> {booking.eventName}</p>
        <p><span className="font-medium">Client Name:</span> {booking.clientName}</p>
        <p><span className="font-medium">Event Date:</span> {formattedEventDate}</p>
        <p><span className="font-medium">Event Time:</span> {beo.eventTime}</p> {/* From BEO object */}
        <p><span className="font-medium">Venue:</span> {beo.venue}</p> {/* From BEO object */}
        <p><span className="font-medium">Number of Guests:</span> {booking.numberOfGuests}</p>
      </div>

      {/* Menu Items */}
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-1 text-primary">Menu Items</h2>
        {booking.selectedRecipeIds.length === 0 ? (
          <p className="text-muted-foreground">No recipes selected for this event.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
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
      <div className="mb-3 border-t pt-2">
        <h2 className="text-xl font-semibold mb-1 text-primary">Staffing & Equipment</h2>
        <p className="text-muted-foreground">
          <span className="font-medium">Staff Required:</span> Head Chef, 2 Line Cooks, 3 Servers, 1 Bartender
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium">Equipment:</span> Chafing Dishes, Serving Utensils, Table Linens, Glassware, etc.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          *Detailed staff assignments, setup diagrams, and equipment lists would be included here.*
        </p>
      </div>

      {/* Staff Checklist */}
      <div className="mb-3 border-t pt-2">
        <h2 className="text-xl font-semibold mb-1 text-primary">Staff Operational Checklist</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Ensure all critical tasks are completed for a successful event.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {staffChecklistItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox id={`checklist-item-${index}`} />
              <label
                htmlFor={`checklist-item-${index}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {item}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Special Notes */}
      {beo.specialInstructions && (
        <div className="border-t pt-2 mt-3">
          <h2 className="text-xl font-semibold mb-1 text-primary">Special Notes / Requirements</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {beo.specialInstructions}
          </p>
        </div>
      )}

      {/* Custom Sections */}
      {beo.customSections && beo.customSections.length > 0 && (
        <div className="border-t pt-2 mt-3">
          <h2 className="text-xl font-semibold mb-1 text-primary">Additional Details</h2>
          {beo.customSections.map((section) => (
            <div key={section.id} className="mb-2">
              <h3 className="text-lg font-semibold text-secondary-foreground">{section.title}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4 pt-2 border-t">
        This BEO is for internal use by catering staff.
      </div>
    </div>
  );
};