"use client";

import React from "react";
import { Proposal, Client } from "@/store/cateringStore";
import { format } from "date-fns";

interface ProposalDocumentProps {
  proposal: Proposal;
  client: Client;
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ proposal, client }) => {
  if (!proposal || !client) {
    return <div className="p-3 text-center text-muted-foreground">No proposal or client data available.</div>; {/* Reduced p-4 to p-3 */}
  }

  const formattedEventDate = format(new Date(proposal.eventDate), "PPP");

  return (
    <div className="p-4 bg-white text-gray-900 max-w-4xl mx-auto shadow-lg rounded-lg print:shadow-none print:p-0"> {/* Reduced p-6 to p-4 */}
      <div className="flex justify-between items-center border-b pb-2 mb-3"> {/* Reduced pb-3 to pb-2, mb-4 to mb-3 */}
        <h1 className="text-3xl font-bold text-primary">Catering Proposal</h1>
        <div className="text-right">
          <p className="text-sm">Proposal ID: <span className="font-semibold">{proposal.id.substring(0, 8)}</span></p>
          <p className="text-sm">Date: <span className="font-semibold">{format(new Date(proposal.createdAt), "PPP")}</span></p>
          <p className="text-sm">Status: <span className="font-semibold">{proposal.status}</span></p>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Client Information</h2> {/* Reduced mb-2 to mb-1 */}
        <p><span className="font-medium">Company/Client:</span> {client.name}</p>
        <p><span className="font-medium">Contact Person:</span> {client.contactPerson}</p>
        <p><span className="font-medium">Email:</span> {client.email}</p>
        <p><span className="font-medium">Phone:</span> {client.phone}</p>
        {client.address && <p><span className="font-medium">Address:</span> {client.address}</p>}
      </div>

      {/* Event Details */}
      <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Event Details</h2> {/* Reduced mb-2 to mb-1 */}
        <p><span className="font-medium">Event Name:</span> {proposal.eventName}</p>
        <p><span className="font-medium">Event Date:</span> {formattedEventDate}</p>
        <p><span className="font-medium">Number of Guests:</span> {proposal.numberOfGuests}</p>
      </div>

      {/* Itemized Services */}
      <div className="mb-3"> {/* Reduced mb-4 to mb-3 */}
        <h2 className="text-xl font-semibold mb-1 text-primary">Itemized Services</h2> {/* Reduced mb-2 to mb-1 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-1">Item</th> {/* Reduced px-4 py-2 to px-3 py-1 */}
                <th scope="col" className="px-3 py-1">Type</th> {/* Reduced px-4 py-2 to px-3 py-1 */}
                <th scope="col" className="px-3 py-1 text-right">Quantity</th> {/* Reduced px-4 py-2 to px-3 py-1 */}
                <th scope="col" className="px-3 py-1 text-right">Unit Cost</th> {/* Reduced px-4 py-2 to px-3 py-1 */}
                <th scope="col" className="px-3 py-1 text-right">Total</th> {/* Reduced px-4 py-2 to px-3 py-1 */}
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item) => (
                <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-3 py-1 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.name}</td> {/* Reduced px-4 py-2 to px-3 py-1 */}
                  <td className="px-3 py-1 capitalize">{item.type}</td> {/* Reduced px-4 py-2 to px-3 py-1 */}
                  <td className="px-3 py-1 text-right">{item.quantity}</td> {/* Reduced px-4 py-2 to px-3 py-1 */}
                  <td className="px-3 py-1 text-right">${item.unitCost.toFixed(2)}</td> {/* Reduced px-4 py-2 to px-3 py-1 */}
                  <td className="px-3 py-1 text-right">${item.totalCost.toFixed(2)}</td> {/* Reduced px-4 py-2 to px-3 py-1 */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="mb-3 flex justify-end"> {/* Reduced mb-4 to mb-3 */}
        <div className="w-full md:w-1/2 space-y-1 text-right">
          <p className="flex justify-between"><span>Labor Cost:</span> <span className="font-semibold">${proposal.laborCost.toFixed(2)}</span></p>
          <p className="flex justify-between"><span>Equipment Cost:</span> <span className="font-semibold">${proposal.equipmentCost.toFixed(2)}</span></p>
          <p className="flex justify-between"><span>Other Costs:</span> <span className="font-semibold">${proposal.otherCosts.toFixed(2)}</span></p>
          <div className="border-t pt-1 mt-1"> {/* Reduced pt-2 mt-2 to pt-1 mt-1 */}
            <p className="flex justify-between text-lg font-bold"><span>Subtotal:</span> <span>${proposal.subtotal.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Tax ({ (proposal.taxRate * 100).toFixed(1) }%):</span> <span>${(proposal.subtotal * proposal.taxRate).toFixed(2)}</span></p>
            <p className="flex justify-between text-xl font-extrabold text-primary mt-1"><span>TOTAL:</span> <span>${proposal.totalAmount.toFixed(2)}</span></p> {/* Reduced mt-2 to mt-1 */}
          </div>
        </div>
      </div>

      {/* Terms and Notes */}
      {(proposal.termsAndConditions || proposal.notes) && (
        <div className="border-t pt-2 mt-3"> {/* Reduced pt-3 mt-4 to pt-2 mt-3 */}
          {proposal.termsAndConditions && (
            <div className="mb-2"> {/* Reduced mb-3 to mb-2 */}
              <h3 className="text-lg font-semibold mb-1 text-primary">Terms & Conditions</h3> {/* Reduced mb-2 to mb-1 */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.termsAndConditions}</p>
            </div>
          )}
          {proposal.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-1 text-primary">Notes</h3> {/* Reduced mb-2 to mb-1 */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4 pt-2 border-t"> {/* Reduced mt-6 pt-3 to mt-4 pt-2 */}
        Thank you for your business!
      </div>
    </div>
  );
};