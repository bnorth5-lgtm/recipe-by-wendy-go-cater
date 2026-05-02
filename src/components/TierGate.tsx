"use client";

import React from "react";
import { Lock } from "lucide-react";
import {
  type TierFeature,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
  requiredTierFor,
  TIER_DEFINITIONS,
} from "@/lib/subscriptionTiers";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TierGateProps {
  /** Feature key that controls access. */
  feature: TierFeature;
  /** Content to render when the user has access. */
  children: React.ReactNode;
  /** Optional custom fallback instead of the default lock card. */
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Wraps any content with a subscription tier check.
 * Renders children for permitted users; shows a lock card otherwise.
 */
export function TierGate({ feature, children, fallback, className }: TierGateProps) {
  const { can } = useSubscription();

  if (can(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredTier = requiredTierFor(feature);
  const tierDef = TIER_DEFINITIONS.find((t) => t.id === requiredTier);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold">{FEATURE_LABELS[feature]}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {FEATURE_DESCRIPTIONS[feature]}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Requires</span>
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold", tierDef?.badge)}
        >
          {tierDef?.label ?? requiredTier} Plan
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground/60">
        Contact your administrator to upgrade your subscription.
      </p>
    </div>
  );
}
