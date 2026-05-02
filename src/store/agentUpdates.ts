/**
 * agentUpdates.ts
 *
 * Global Zustand store for the NBS agent activity feed.
 *
 * Populated by useAgentRealtime (mounted in Layout, always active).
 * Read by:
 *   - BottomNav  → hasNewUpdate flag drives the amber ping overlay
 *   - ExecutiveFeed → entries, loading, error, isConnected
 */

import { create } from "zustand";
import type { AgentLogEntry } from "@/lib/agentLogs";

export interface AgentUpdatesState {
  entries: AgentLogEntry[];
  loading: boolean;
  error: string | null;

  /**
   * True whenever a new INSERT has arrived via Realtime and the user
   * has NOT yet visited the Executive tab in this session.
   */
  hasNewUpdate: boolean;

  /**
   * "connected" | "connecting" | "disconnected"
   * Reflects the WebSocket state for the status indicator in ExecutiveFeed.
   */
  connectionStatus: "connected" | "connecting" | "disconnected";

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Replace the full entry list (used on initial load). */
  setEntries: (entries: AgentLogEntry[]) => void;

  /** Prepend a single new entry (called on Realtime INSERT). */
  prependEntry: (entry: AgentLogEntry) => void;

  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setConnectionStatus: (v: AgentUpdatesState["connectionStatus"]) => void;

  /** Mark a new update as seen — clears the ping overlay. */
  clearNewUpdate: () => void;

  /**
   * Directly fire the gold pulse without prepending a log entry.
   * Used for Realtime UPDATE events (e.g. BEO status set to 'Signed')
   * where the underlying record already exists in the feed.
   */
  triggerNewUpdate: () => void;
}

export const useAgentUpdatesStore = create<AgentUpdatesState>((set) => ({
  entries: [],
  loading: true,
  error: null,
  hasNewUpdate: false,
  connectionStatus: "connecting",

  setEntries: (entries) => set({ entries }),
  prependEntry: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries],
      hasNewUpdate: true,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  clearNewUpdate: () => set({ hasNewUpdate: false }),
  triggerNewUpdate: () => set({ hasNewUpdate: true }),
}));
