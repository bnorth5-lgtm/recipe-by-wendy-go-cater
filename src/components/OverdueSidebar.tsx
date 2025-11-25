"use client";

import React from "react";
import { useCateringStore, Estimate, Proposal } from "@/store/cateringStore";
import { format, isPast, differenceInDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AlertCircle, DollarSign, FileText } from "lucide-react";

export const OverdueSidebar: React.FC = () => {
  const estimates = useCateringStore((state) => state.estimates);
  const proposals = useCateringStore((state) => state.proposals);

  const overdueThresholdDays = 7; // Define what 'overdue' means (e.g., 7 days old)

  const overdueEstimates = estimates.filter(e => {
    const createdAtDate = parseISO(e.createdAt);
    return isPast(createdAtDate) && differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const overdueProposals = proposals.filter(p => {
    const createdAtDate = parseISO(p.createdAt);
    return (p.status === "Draft" || p.status === "Sent") &&
           isPast(createdAtDate) &&
           differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const hasOverdueItems = overdueEstimates.length > 0 || overdueProposals.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" /> Overdue Items
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Older than {overdueThresholdDays} days
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {hasOverdueItems ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2">
              {overdueEstimates.map((estimate) => (
                <Link to={`/quoting/estimates/${estimate.id}`} key={estimate.id} className="block">
                  <div className="flex items-start space-x-3 p-2 border rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer">
                    <DollarSign className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-destructive">Estimate: {estimate.eventName}</h4>
                      <p className="text-xs text-muted-foreground">Created: {format(parseISO(estimate.createdAt), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">Total: ${estimate.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {overdueProposals.map((proposal) => (
                <Link to={`/quoting/proposals/${proposal.id}`} key={proposal.id} className="block">
                  <div className="flex items-start space-x-3 p-2 border rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer">
                    <FileText className="h-4 w-4 text-destructive mt-1 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-destructive">Proposal: {proposal.eventName}</h4>
                      <p className="text-xs text-muted-foreground">Status: {proposal.status}</p>
                      <p className="text-xs text-muted-foreground">Created: {format(parseISO(proposal.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">No overdue items!</p>
        )}
      </CardContent>
    </Card>
  );
};