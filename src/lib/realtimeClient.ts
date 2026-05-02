/**
 * realtimeClient.ts
 *
 * Minimal Supabase Realtime v2 client using the Phoenix WebSocket protocol.
 * No external dependencies — works with the existing raw-fetch pattern.
 *
 * Supabase Realtime speaks a Phoenix channel protocol over WebSocket:
 *   • Each message: { topic, event, payload, ref }
 *   • Join a channel with "phx_join" + postgres_changes config
 *   • Server ACKs with "phx_reply" {status: "ok"}
 *   • Row-level events arrive as "postgres_changes" messages
 *   • Keepalive via "heartbeat" every 30 s
 *
 * Usage:
 *   const client = new RealtimeClient(supabaseUrl, anonKey);
 *   const off = client.onInsert(["event_orders", "menu_price_history"], (table, record) => { ... });
 *   // later:
 *   off(); // disconnect & stop
 */

export interface RealtimeInsertPayload {
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown>;
  type: "INSERT" | "UPDATE" | "DELETE";
}

type InsertHandler = (payload: RealtimeInsertPayload) => void;

/** Derives the Realtime WebSocket URL from a Supabase project REST URL. */
function toWsUrl(restUrl: string): string {
  return restUrl
    .replace(/\/+$/, "")
    .replace(/^https?:\/\//, "wss://")
    + "/realtime/v1/websocket";
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private refCount = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Currently active tables + handler (stored for reconnect). */
  private activeTables: string[] = [];
  private activeHandler: InsertHandler | null = null;

  /** How many times we've tried to reconnect without a successful open. */
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_DELAY = 30_000;

  private intentionalClose = false;

  constructor(
    private readonly supabaseUrl: string,
    private readonly anonKey: string
  ) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Subscribe to INSERT events on `tables`.
   * Returns a cleanup function; call it to permanently disconnect.
   */
  onInsert(tables: string[], handler: InsertHandler): () => void {
    this.activeTables = tables;
    this.activeHandler = handler;
    this.intentionalClose = false;
    this.connect();
    return () => this.disconnect();
  }

  // ── Connection lifecycle ────────────────────────────────────────────────────

  private connect() {
    const wsUrl = toWsUrl(this.supabaseUrl);
    const fullUrl = `${wsUrl}?apikey=${encodeURIComponent(this.anonKey)}&vsn=1.0.0`;

    try {
      this.ws = new WebSocket(fullUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.joinChannel();
    };

    this.ws.onmessage = (ev) => {
      try {
        this.handleMessage(JSON.parse(ev.data as string));
      } catch {
        // Malformed frame — ignore
      }
    };

    this.ws.onerror = () => {
      // onclose fires immediately after onerror, handled there
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close(1000, "client disconnect");
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      1_000 * Math.pow(1.5, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalClose) this.connect();
    }, delay);
  }

  // ── Channel join ────────────────────────────────────────────────────────────

  private joinChannel() {
    const ref = String(++this.refCount);
    this.send({
      topic: "realtime:agent-monitor",
      event: "phx_join",
      payload: {
        config: {
          // Subscribe to ALL event types (INSERT, UPDATE, DELETE) so that:
          //   • New BEOs (INSERT on event_orders) → Dash log entry
          //   • New price updates (INSERT on menu_price_history) → Albert log entry
          //   • Client portal signature (UPDATE on event_orders, status='Signed') → gold pulse
          postgres_changes: this.activeTables.map((table) => ({
            event: "*",
            schema: "public",
            table,
          })),
        },
      },
      ref,
      join_ref: ref,
    });
  }

  // ── Message handling ────────────────────────────────────────────────────────

  private handleMessage(msg: Record<string, unknown>) {
    const event = msg["event"] as string;

    if (event === "postgres_changes") {
      const payload = msg["payload"] as Record<string, unknown> | undefined;
      const data = payload?.["data"] as RealtimeInsertPayload | undefined;
      if (data && this.activeHandler) {
        this.activeHandler(data);
      }
    }
    // phx_reply, phx_error, system messages — silently acknowledged
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private send(msg: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        topic: "phoenix",
        event: "heartbeat",
        payload: {},
        ref: String(++this.refCount),
      });
    }, 25_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
