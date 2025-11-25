"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Define the schema for business data input
const businessDataSchema = z.object({
  leads: z.coerce.number().min(0, "Leads cannot be negative"),
  proposalsSent: z.coerce.number().min(0, "Proposals sent cannot be negative"),
  potentialRevenue: z.coerce.number().min(0, "Potential revenue cannot be negative"),
  confirmedBookings: z.coerce.number().min(0, "Confirmed bookings cannot be negative"),
  actualRevenue: z.coerce.number().min(0, "Actual revenue cannot be negative"),
  actualProfit: z.coerce.number().min(0, "Actual profit cannot be negative"),
});

type BusinessFormData = z.infer<typeof businessDataSchema>;

const CateringAverages = () => {
  // Simulated Industry Averages (hardcoded for demonstration)
  const industryAverages = {
    avgRevenuePerEvent: 2500, // Average revenue per event
    avgEventsPerMonth: 8,    // Average number of events per month
    avgProfitMargin: 30,     // Average profit margin in percentage
    leadToProposalRate: 0.6, // 60% of leads convert to proposals
    proposalToBookingRate: 0.4, // 40% of proposals convert to bookings
  };

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessDataSchema),
    defaultValues: {
      leads: 0,
      proposalsSent: 0,
      potentialRevenue: 0,
      confirmedBookings: 0,
      actualRevenue: 0,
      actualProfit: 0,
    },
  });

  const { watch } = form;
  const { leads, proposalsSent, potentialRevenue, confirmedBookings, actualRevenue, actualProfit } = watch();

  // Calculate current business metrics
  const currentRevenuePerEvent = confirmedBookings > 0 ? actualRevenue / confirmedBookings : 0;
  const currentEventsPerMonth = confirmedBookings; // Assuming this is for the current month
  const currentProfitMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0;
  const currentLeadToProposalRate = leads > 0 ? proposalsSent / leads : 0;
  const currentProposalToBookingRate = proposalsSent > 0 ? confirmedBookings / proposalsSent : 0;

  // Determine performance relative to industry averages
  const isRevenuePerEventAboveAvg = currentRevenuePerEvent >= industryAverages.avgRevenuePerEvent;
  const isEventsPerMonthAboveAvg = currentEventsPerMonth >= industryAverages.avgEventsPerMonth;
  const isProfitMarginAboveAvg = currentProfitMargin >= industryAverages.avgProfitMargin;
  const isLeadToProposalRateAboveAvg = currentLeadToProposalRate >= industryAverages.leadToProposalRate;
  const isProposalToBookingRateAboveAvg = currentProposalToBookingRate >= industryAverages.proposalToBookingRate;

  const onSubmit = (data: BusinessFormData) => {
    // In a real application, this data would be sent to a backend or saved.
    // For this simulation, we just update the state via watch() and trigger re-renders.
    console.log("Business Data Submitted:", data);
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2"> {/* Reduced p-4 to p-2 */}
      <div className="text-center mb-4"> {/* Reduced mb-6 to mb-4 */}
        <h1 className="text-4xl font-bold mb-2">Catering Business Averages</h1> {/* Reduced mb-4 to mb-2 */}
        <p className="text-xl text-muted-foreground">
          Compare your business performance against industry averages and get insights.
        </p>
      </div>

      <div className="w-full max-w-5xl space-y-4"> {/* Reduced space-y-6 to space-y-4 */}
        {/* Industry Averages Card */}
        <Card className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Industry Benchmarks (Simulated)</CardTitle>
            <CardDescription className="text-muted-foreground">
              These are general industry averages for a small catering company.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"> {/* Reduced gap-4 to gap-3 */}
            <div>
              <p className="text-sm text-muted-foreground">Avg. Revenue per Event</p>
              <p className="text-lg font-bold">${industryAverages.avgRevenuePerEvent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Events per Month</p>
              <p className="text-lg font-bold">{industryAverages.avgEventsPerMonth}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Profit Margin</p>
              <p className="text-lg font-bold">{industryAverages.avgProfitMargin}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lead to Proposal Rate</p>
              <p className="text-lg font-bold">{(industryAverages.leadToProposalRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proposal to Booking Rate</p>
              <p className="text-lg font-bold">{(industryAverages.proposalToBookingRate * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Your Business Data Input */}
        <Card className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Your Business Data</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your current incoming and completed business metrics for comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3"> {/* Reduced space-y-4 to space-y-3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3"> {/* Reduced gap-4 to gap-3 */}
                  {/* Incoming Business */}
                  <div className="space-y-2"> {/* Reduced space-y-3 to space-y-2 */}
                    <h3 className="text-lg font-medium">Incoming Business (Current Month)</h3>
                    <FormField
                      control={form.control}
                      name="leads"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Leads</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="proposalsSent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposals Sent</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="potentialRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potential Revenue (from proposals)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Completed Business */}
                  <div className="space-y-2"> {/* Reduced space-y-3 to space-y-2 */}
                    <h3 className="text-lg font-medium">Completed Business (Current Month)</h3>
                    <FormField
                      control={form.control}
                      name="confirmedBookings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmed Bookings</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="actualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Revenue</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="actualProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Profit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Update Business Metrics</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Your Performance vs. Industry</CardTitle>
            <CardDescription className="text-muted-foreground">
              How your current metrics stack up against the benchmarks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"> {/* Reduced gap-4 to gap-3 */}
            <div>
              <p className="text-sm text-muted-foreground">Your Revenue per Event</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">${currentRevenuePerEvent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <Badge variant={isRevenuePerEventAboveAvg ? "default" : "destructive"}>
                  {isRevenuePerEventAboveAvg ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isRevenuePerEventAboveAvg ? "Above Avg" : "Below Avg"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Events per Month</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{currentEventsPerMonth}</p>
                <Badge variant={isEventsPerMonthAboveAvg ? "default" : "destructive"}>
                  {isEventsPerMonthAboveAvg ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isEventsPerMonthAboveAvg ? "Above Avg" : "Below Avg"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Profit Margin</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{currentProfitMargin.toFixed(2)}%</p>
                <Badge variant={isProfitMarginAboveAvg ? "default" : "destructive"}>
                  {isProfitMarginAboveAvg ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isProfitMarginAboveAvg ? "Above Avg" : "Below Avg"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Lead to Proposal Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{(currentLeadToProposalRate * 100).toFixed(2)}%</p>
                <Badge variant={isLeadToProposalRateAboveAvg ? "default" : "destructive"}>
                  {isLeadToProposalRateAboveAvg ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isLeadToProposalRateAboveAvg ? "Above Avg" : "Below Avg"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Proposal to Booking Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{(currentProposalToBookingRate * 100).toFixed(2)}%</p>
                <Badge variant={isProposalToBookingRateAboveAvg ? "default" : "destructive"}>
                  {isProposalToBookingRateAboveAvg ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {isProposalToBookingRateAboveAvg ? "Above Avg" : "Below Avg"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adjustment Suggestions */}
        <Card className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Suggested Adjustments & Focus Areas</CardTitle>
            <CardDescription className="text-muted-foreground">
              Based on your current performance, here are some areas to consider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2"> {/* Reduced space-y-3 to space-y-2 */}
            {!isRevenuePerEventAboveAvg && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 mt-1 shrink-0" />
                <p><strong>Revenue per Event:</strong> Your average revenue per event is below the industry benchmark. Consider upselling premium packages, optimizing menu pricing, or focusing on larger events.</p>
              </div>
            )}
            {!isEventsPerMonthAboveAvg && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 mt-1 shrink-0" />
                <p><strong>Events per Month:</strong> You're booking fewer events than the industry average. Enhance your marketing efforts, improve lead generation, or refine your sales process.</p>
              </div>
            )}
            {!isProfitMarginAboveAvg && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 mt-1 shrink-0" />
                <p><strong>Profit Margin:</strong> Your profit margin is lower than average. Review your ingredient costs, labor expenses, and operational efficiencies. Look for ways to reduce waste or negotiate better supplier deals.</p>
              </div>
            )}
            {!isLeadToProposalRateAboveAvg && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 mt-1 shrink-0" />
                <p><strong>Lead to Proposal Rate:</strong> A lower conversion from leads to proposals suggests your initial engagement or qualification process might need refinement. Ensure you're targeting the right clients or improving your initial pitch.</p>
              </div>
            )}
            {!isProposalToBookingRateAboveAvg && (
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 mt-1 shrink-0" />
                <p><strong>Proposal to Booking Rate:</strong> If many proposals aren't converting, review your proposal content, pricing competitiveness, or follow-up strategy. Client testimonials and clear value propositions can help.</p>
              </div>
            )}
            {isRevenuePerEventAboveAvg && isEventsPerMonthAboveAvg && isProfitMarginAboveAvg && isLeadToProposalRateAboveAvg && isProposalToBookingRateAboveAvg && (
              <p className="text-green-600 text-center">
                <span className="font-semibold">Great job!</span> Your business metrics are performing at or above industry averages. Keep up the excellent work!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CateringAverages;