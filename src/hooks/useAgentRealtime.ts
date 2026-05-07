/**
 * useAgentRealtime.ts
 *
 * Mounts once (in Layout) to:
 *   1. Perform the initial REST fetch via fetchAgentLogs()
 *   2. Open a Supabase Realtime subscription for INSERT + UPDATE events on
 *      event_orders and menu_price_history
 *   3. Push all state changes into agentUpdatesStore
 *
 * Event handling:
 *   INSERT  event_orders          → Dash log entry prepended to feed
 *   INSERT  menu_price_history    → Albert log entry prepended to feed
 *   UPDATE  event_orders (Signed) → triggerNewUpdate() only (gold pulse, no new entry)
 *
 * Components never fetch directly — they just read from the store.
 */

import { useEffect, useRef } from "react";
import { fetchAgentLogs, type AgentLogEntry, type AgentName } from "@/lib/agentLogs";
import { RealtimeClient } from "@/lib/realtimeClient";
import { useAgentUpdatesStore } from "@/store/agentUpdates";

// ── Map table name → AgentName ────────────────────────────────────────────────

const TABLE_AGENT: Record<string, AgentName> = {
  event_orders: "Dash",
  menu_price_history: "Albert",
};

// ── Normalise a raw Supabase INSERT record into an AgentLogEntry ──────────────

function recordToEntry(
  table: string,
  record: Record<string, unknown>
): AgentLogEntry | null {
  const agent = TABLE_AGENT[table];
  if (!agent) return null;

  const ts =
    (record["created_at"] as string | undefined) ??
    (record["applied_at"] as string | undefined) ??
    new Date().toISOString();

  if (table === "event_orders") {
    const beoNum = (record["beo_number"] as string | undefined) ?? "—";
    const eventName = (record["event_name"] as string | undefined) ?? "Unnamed Event";
    const guestCount = Number(record["guest_count"] ?? 0);
    const total = Number(record["total"] ?? 0);
    return {
      id: `dash-rt-${record["id"] ?? ts}`,
      agent: "Dash",
      category: "beo_generated",
      title: `BEO ${beoNum} — ${eventName}`,
      detail: guestCount ? `${guestCount} guests` : null,
      timestamp: ts,
      metric: {
        label: "Total",
        value: `$${total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        positive: true,
      },
    };
  }

  // menu_price_history — the BEFORE INSERT trigger runs first, so by the time
  // the Realtime payload arrives the record already contains price_delta and albert_flag.
  const itemName = (record["item_name"] as string | undefined) ?? "Item";
  const newPrice = Number(record["new_price"] ?? 0);
  const oldPrice = Number(record["old_price"] ?? 0);
  const dbDelta = record["price_delta"] != null ? Number(record["price_delta"]) : null;
  const delta = dbDelta ?? (oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0);
  const positive = newPrice >= oldPrice;
  const albertFlag = (record["albert_flag"] as string | undefined) ?? null;

  return {
    id: `albert-rt-${record["id"] ?? ts}`,
    agent: "Albert",
    category: "price_updated",
    title: `Price updated — ${itemName}`,
    detail: (record["adjustment_reason"] as string | undefined) ?? null,
    timestamp: ts,
    albertFlag: albertFlag as AgentLogEntry["albertFlag"],
    metric: {
      label:
        delta !== 0
          ? `${positive ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}%`
          : "No change",
      value: `$${newPrice.toFixed(2)}`,
      positive,
    },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgentRealtime() {
  const {
    setEntries,
    setLoading,
    setError,
    setConnectionStatus,
    prependEntry,
    triggerNewUpdate,
  } = useAgentUpdatesStore();

  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Demo mode: skip all fetching and realtime connection
    setConnectionStatus("disconnected");
    setLoading(false);
    return;

    // ── Initial REST fetch ─────────────────────────────────────────────────
    setLoading(true);
    setConnectionStatus("connecting");

    fetchAgentLogs()
      .then((result) => {
        if (!cancelled) {
          setEntries(result.entries);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // ── Realtime subscription ──────────────────────────────────────────────
    const rawUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
    const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim().replace(/^["']|["']$/g, "");

    if (!rawUrl || !anonKey) {
      setConnectionStatus("disconnected");
      return;
    }

    const client = new RealtimeClient(rawUrl, anonKey);
    clientRef.current = client;

    const stop = client.onInsert(
      ["event_orders", "menu_price_history"],
      (payload) => {
        if (cancelled) return;

        setConnectionStatus("connected");

        if (payload.type === "UPDATE") {
          // Client portal signing — fire gold pulse AND prepend a Dash feed card
          // so Bill sees a "BEO Signed" entry at the top of the Executive Feed.
          if (
            payload.table === "event_orders" &&
            (payload.record["status"] as string | undefined)?.toLowerCase() === "signed"
          ) {
            const r = payload.record;
            const beoNum = (r["beo_number"] as string | undefined) ?? "—";
            const eventName = (r["event_name"] as string | undefined) ?? "Unnamed Event";
            const total = Number(r["total"] ?? 0);
            const signerName = (r["signer_name"] as string | undefined) ?? null;
            const signedAt =
              (r["signed_at"] as string | undefined) ?? new Date().toISOString();

            const signedEntry: AgentLogEntry = {
              id: `dash-signed-${r["id"] ?? signedAt}`,
              agent: "Dash",
              category: "beo_signed",
              title: `BEO Signed — ${eventName}`,
              detail: [
                signerName ? `Signed by ${signerName}` : "Client signature received",
                beoNum !== "—" ? beoNum : null,
              ]
                .filter(Boolean)
                .join(" · "),
              timestamp: signedAt,
              metric: {
                label: "Order total",
                value: `$${total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                positive: true,
              },
            };

            prependEntry(signedEntry);
            triggerNewUpdate();
          }
          return; // Ignore all other UPDATEs
        }

        // INSERT path — create a new log card and prepend it
        if (payload.type === "INSERT") {
          const entry = recordToEntry(payload.table, payload.record);
          if (entry) prependEntry(entry);
        }
      }
    );

    // Treat first successful WebSocket open as "connected".
    const connectTimer = setTimeout(() => {
      if (!cancelled) setConnectionStatus("connected");
    }, 5_000);

    return () => {
      cancelled = true;
      clearTimeout(connectTimer);
      stop();
      clientRef.current = null;
    };
  }, [setEntries, setLoading, setError, setConnectionStatus, prependEntry, triggerNewUpdate]);
}
