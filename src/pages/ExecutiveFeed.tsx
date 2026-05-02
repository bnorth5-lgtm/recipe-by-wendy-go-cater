"use client";

import React, { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  BarChart2,
  Crown,
  Loader2,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgentUpdatesStore } from "@/store/agentUpdates";
import { fetchAgentLogs, relativeTime, type AgentLogEntry, type AgentName } from "@/lib/agentLogs";
import { cn } from "@/lib/utils";

// ── Agent brand config ────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<
  AgentName,
  { label: string; color: string; dotColor: string; icon: React.ReactNode }
> = {
  Dash: {
    label: "DASH",
    color:
      "bg-sky-950/80 text-sky-300 border-sky-700/50 dark:bg-sky-900/40 dark:border-sky-600/40",
    dotColor: "bg-sky-400",
    icon: <Zap className="h-3 w-3" />,
  },
  Albert: {
    label: "ALBERT",
    color:
      "bg-violet-950/80 text-violet-300 border-violet-700/50 dark:bg-violet-900/40 dark:border-violet-600/40",
    dotColor: "bg-violet-400",
    icon: <BarChart2 className="h-3 w-3" />,
  },
};

// ── Access guard ──────────────────────────────────────────────────────────────

function ExecutiveAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
        <Shield className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-base font-semibold tracking-tight">Executive Access Only</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This feed displays live NBS agent activity. Access is restricted to
          the System Administrator.
        </p>
      </div>
    </div>
  );
}

// ── Log entry card ────────────────────────────────────────────────────────────

function LogCard({ entry }: { entry: AgentLogEntry }) {
  const config = AGENT_CONFIG[entry.agent];
  const isPriceUp =
    entry.metric?.positive === true && entry.category === "price_updated";
  const isPriceDown =
    entry.metric?.positive === false && entry.category === "price_updated";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-2.5",
        "transition-all duration-200 hover:bg-card hover:shadow-sm",
        entry.agent === "Albert" && "border-violet-500/10",
        entry.agent === "Dash" && "border-sky-500/10"
      )}
    >
      {/* Agent + time row */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-mono gap-1 px-2 h-5", config.color)}
        >
          {config.icon}
          {config.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {relativeTime(entry.timestamp)}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-snug tracking-tight">
        {entry.title}
      </p>

      {/* Detail line */}
      {entry.detail && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {entry.detail}
        </p>
      )}

      {/* Metric pill */}
      {entry.metric && (
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isPriceUp && "bg-emerald-950/60 text-emerald-300 dark:bg-emerald-900/30",
              isPriceDown && "bg-red-950/60 text-red-300 dark:bg-red-900/30",
              !isPriceUp &&
                !isPriceDown &&
                "bg-muted/60 text-muted-foreground"
            )}
          >
            {isPriceUp && <TrendingUp className="h-3 w-3" />}
            {isPriceDown && <TrendingDown className="h-3 w-3" />}
            <span>{entry.metric.value}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {entry.metric.label}
          </span>

          {/* Albert flag badge — set by the Postgres trigger */}
          {entry.albertFlag && entry.albertFlag !== "Initial Price" && (
            <span
              className={cn(
                "ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                entry.albertFlag === "Opportunity" &&
                  "border-emerald-500/40 bg-emerald-950/50 text-emerald-300 dark:bg-emerald-900/30",
                entry.albertFlag === "Cost Alert" &&
                  "border-rose-500/40 bg-rose-950/50 text-rose-300 dark:bg-rose-900/30",
                entry.albertFlag === "No Change" &&
                  "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              {entry.albertFlag === "Opportunity" && "↓ Opportunity"}
              {entry.albertFlag === "Cost Alert" && "↑ Cost Alert"}
              {entry.albertFlag === "No Change" && "— No Change"}
            </span>
          )}
        </div>
      )}

      {/* Accent left border */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          config.dotColor,
          "opacity-60"
        )}
      />
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({
  result,
  syncing,
  onRefresh,
}: {
  result: { dashCount: number; albertCount: number; lastSynced: string };
  syncing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-sky-500 dark:text-sky-400">
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full bg-sky-400",
            !syncing && "animate-pulse"
          )}
        />
        <span className="font-mono font-semibold">DASH</span>
        <span className="text-muted-foreground">{result.dashCount}</span>
      </div>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-1.5 text-xs text-violet-500 dark:text-violet-400">
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full bg-violet-400",
            !syncing && "animate-pulse"
          )}
        />
        <span className="font-mono font-semibold">ALBERT</span>
        <span className="text-muted-foreground">{result.albertCount}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
          {relativeTime(result.lastSynced)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRefresh}
          disabled={syncing}
          aria-label="Refresh agent logs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}

// ── Agent filter pill ─────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  color,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-semibold transition-all",
        active ? color : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0 text-[10px] tabular-nums",
          active ? "bg-white/10" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExecutiveFeed() {
  const { isExec } = useSubscription();
  const {
    entries,
    loading,
    error,
    connectionStatus,
    clearNewUpdate,
    setEntries,
    setLoading,
    setError,
  } = useAgentUpdatesStore();

  // Local filter state
  const [filter, setFilter] = React.useState<AgentName | "All">("All");
  const [syncing, setSyncing] = React.useState(false);

  // Clear the notification badge the moment the user enters this view
  useEffect(() => {
    clearNewUpdate();
  }, [clearNewUpdate]);

  // Manual refresh — re-fetches from REST and replaces the store
  const handleRefresh = React.useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const data = await fetchAgentLogs();
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSyncing(false);
    }
  }, [setEntries, setError]);

  if (!isExec) return <ExecutiveAccessDenied />;

  const isLive = connectionStatus === "connected";

  const dashCount = entries.filter((e) => e.agent === "Dash").length;
  const albertCount = entries.filter((e) => e.agent === "Albert").length;

  const filtered =
    filter === "All" ? entries : entries.filter((e) => e.agent === filter);

  // Build a pseudo-result for the SummaryBar
  const summaryResult = {
    entries,
    dashCount,
    albertCount,
    lastSynced: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold tracking-tight leading-none">
              Executive Feed
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              NBS Agent Activity · Dash &amp; Albert
            </p>
          </div>
          {/* Live / offline indicator */}
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Wifi className="h-4 w-4 text-emerald-500/70" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground/40" />
            )}
            <span
              className={cn(
                "text-[10px] font-mono font-semibold uppercase tracking-wider",
                isLive ? "text-emerald-500/80" : "text-muted-foreground/50"
              )}
            >
              {connectionStatus === "connecting" ? "connecting" : isLive ? "live" : "offline"}
            </span>
          </div>
        </div>

        {/* Filter row */}
        {entries.length > 0 && (
          <div className="flex items-center gap-2 px-4 pb-3 sm:px-6 overflow-x-auto scrollbar-none">
            <FilterPill
              label="ALL"
              active={filter === "All"}
              color="border-amber-500/50 text-amber-500 bg-amber-500/10"
              count={entries.length}
              onClick={() => setFilter("All")}
            />
            <FilterPill
              label="DASH"
              active={filter === "Dash"}
              color={cn(AGENT_CONFIG.Dash.color, "border-sky-500/50")}
              count={dashCount}
              onClick={() => setFilter("Dash")}
            />
            <FilterPill
              label="ALBERT"
              active={filter === "Albert"}
              color={cn(AGENT_CONFIG.Albert.color, "border-violet-500/50")}
              count={albertCount}
              onClick={() => setFilter("Albert")}
            />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4 pb-24 sm:px-6 space-y-4 max-w-2xl mx-auto">
        {/* Summary bar */}
        {entries.length > 0 && !loading && (
          <SummaryBar result={summaryResult} syncing={syncing} onRefresh={handleRefresh} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Connecting to agent streams…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm space-y-2">
            <p className="font-semibold text-destructive">
              Agent feed unavailable
            </p>
            <p className="text-muted-foreground text-xs">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No agent activity yet
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Generate a BEO or run the Pricing Engine to see Dash and Albert
              log entries here.
            </p>
          </div>
        )}

        {/* Feed */}
        {!loading &&
          !error &&
          filtered.map((entry) => <LogCard key={entry.id} entry={entry} />)}
      </div>
    </div>
  );
}
