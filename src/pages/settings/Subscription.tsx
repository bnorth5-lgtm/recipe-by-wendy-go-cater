"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  TrendingUp,
  Bot,
  Check,
  X,
  Layers,
  Activity,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useCateringStore } from "@/store/cateringStore";
import {
  type SubscriptionTier,
  type TierFeature,
  TIER_DEFINITIONS,
  ALL_FEATURES,
  FEATURE_LABELS,
  hasFeature,
  tierLabel,
} from "@/lib/subscriptionTiers";
import { getUsageLogs, type UsageLog } from "@/lib/recipeDb";
import { cn } from "@/lib/utils";

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  basic: <BookOpen className="h-5 w-5" />,
  professional: <TrendingUp className="h-5 w-5" />,
  enterprise: <Bot className="h-5 w-5" />,
};

const TIER_BORDER: Record<SubscriptionTier, string> = {
  basic: "border-slate-300",
  professional: "border-blue-400",
  enterprise: "border-amber-400",
};

const TIER_RING: Record<SubscriptionTier, string> = {
  basic: "ring-slate-200",
  professional: "ring-blue-200",
  enterprise: "ring-amber-200",
};

const TIER_BADGE: Record<SubscriptionTier, string> = {
  basic: "bg-slate-100 text-slate-700 border-slate-300",
  professional: "bg-blue-100 text-blue-700 border-blue-300",
  enterprise: "bg-amber-100 text-amber-700 border-amber-300",
};

const SubscriptionSettings = () => {
  const currentUser = useCateringStore((state) => state.currentUser);
  const updateUser = useCateringStore((state) => state.updateUser);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const tier: SubscriptionTier = currentUser?.tier ?? "basic";

  useEffect(() => {
    if (!currentUser) return;
    setLoadingLogs(true);
    getUsageLogs(currentUser.id)
      .then(setUsageLogs)
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [currentUser?.id]);

  const handleChangeTier = (newTier: SubscriptionTier) => {
    if (!currentUser) return;
    updateUser({ ...currentUser, tier: newTier, subscribedAt: new Date().toISOString() });
    toast.success(`Switched to ${tierLabel(newTier)} plan.`);
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3 gap-6">
      <div className="text-center mb-2">
        <h1 className="text-4xl font-bold mb-2">Subscription</h1>
        <p className="text-xl text-muted-foreground">
          Manage your Catering By Wendy plan and track feature usage.
        </p>
      </div>

      {/* Current plan banner */}
      <div className="w-full max-w-4xl">
        <Card
          className={cn(
            "border-2 bg-gradient-to-br from-background to-muted/30",
            TIER_BORDER[tier]
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {TIER_ICONS[tier]}
                <CardTitle className="text-2xl">{tierLabel(tier)} Plan</CardTitle>
                <Badge className={cn("ml-1 border text-xs font-semibold", TIER_BADGE[tier])}>
                  Active
                </Badge>
              </div>
              {currentUser && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>{currentUser.name}</span>
                </div>
              )}
            </div>
            <CardDescription>
              {TIER_DEFINITIONS.find((t) => t.id === tier)?.description}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Plan selection cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIER_DEFINITIONS.map((def) => {
          const isActive = tier === def.id;
          return (
            <Card
              key={def.id}
              className={cn(
                "transition-all",
                isActive
                  ? cn("border-2 ring-2", TIER_BORDER[def.id], TIER_RING[def.id])
                  : "border"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {TIER_ICONS[def.id]}
                  <CardTitle>{def.label}</CardTitle>
                  {isActive && (
                    <Badge
                      variant="outline"
                      className={cn("ml-auto text-xs font-semibold border", TIER_BADGE[def.id])}
                    >
                      Current
                    </Badge>
                  )}
                </div>
                <CardDescription>{def.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {ALL_FEATURES.map((f) => {
                    const included = hasFeature(def.id, f);
                    return (
                      <li
                        key={f}
                        className={cn(
                          "flex items-start gap-2",
                          included ? "" : "text-muted-foreground/40"
                        )}
                      >
                        {included ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                        ) : (
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                        )}
                        <span className={included ? "" : "line-through"}>
                          {FEATURE_LABELS[f]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  className="w-full"
                  variant={isActive ? "secondary" : "default"}
                  disabled={isActive}
                  onClick={() => handleChangeTier(def.id)}
                >
                  {isActive ? "Current Plan" : `Switch to ${def.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature matrix */}
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Feature Matrix
            </CardTitle>
            <CardDescription>
              Which features are unlocked at each plan level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-center">Basic</TableHead>
                  <TableHead className="text-center">Professional</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_FEATURES.map((f) => (
                  <TableRow key={f}>
                    <TableCell className="font-medium">{FEATURE_LABELS[f]}</TableCell>
                    {(["basic", "professional", "enterprise"] as SubscriptionTier[]).map((t) => (
                      <TableCell key={t} className="text-center">
                        {hasFeature(t, f) ? (
                          <Check className="mx-auto h-4 w-4 text-green-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Usage log */}
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Log
            </CardTitle>
            <CardDescription>
              Recent feature access events recorded for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : usageLogs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No usage events recorded yet. Events are logged when you access
                gated features.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Plan at Time</TableHead>
                    <TableHead>Accessed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageLogs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {FEATURE_LABELS[log.feature as TierFeature] ?? log.feature}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold border",
                            TIER_BADGE[log.tierAtTime as SubscriptionTier] ??
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          {tierLabel(log.tierAtTime as SubscriptionTier)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.accessedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default SubscriptionSettings;
