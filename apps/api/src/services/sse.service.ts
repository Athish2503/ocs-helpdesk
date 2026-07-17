import type { Response } from "express";

/**
 * Server-Sent Events (SSE) Manager
 *
 * Manages persistent SSE connections from authenticated browser clients.
 * When a CRM sync event is processed, the relevant connected client(s)
 * are immediately notified, triggering a targeted data refresh in the UI.
 *
 * Design decisions:
 * - Keyed by userId (not crmCustomerId) to allow multi-session support
 * - A single user can have multiple open SSE connections (different tabs)
 * - Events are also broadcast by crmCustomerId for admin monitoring use cases
 * - Keep-alive pings are sent every 30s to prevent proxy/load-balancer timeout
 */

interface SseClient {
  userId: string;
  crmCustomerId: string | null;
  res: Response;
  connectedAt: Date;
}

class SseManager {
  /** Map of connectionId → SseClient. Supports multiple tabs per user. */
  private clients = new Map<string, SseClient>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Send keep-alive pings every 30 seconds to all connected clients
    this.pingInterval = setInterval(() => this.sendPingToAll(), 30_000);
  }

  /**
   * Register a new SSE client connection.
   * Sets up the streaming headers and schedules cleanup on disconnect.
   */
  addClient(connectionId: string, userId: string, crmCustomerId: string | null, res: Response): void {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
    res.flushHeaders();

    // Register the client
    this.clients.set(connectionId, { userId, crmCustomerId, res, connectedAt: new Date() });
    console.log(`[SSE] Client connected: userId=${userId}, connId=${connectionId}. Total clients: ${this.clients.size}`);

    // Send initial connection confirmation event
    this.sendToConnection(connectionId, "connected", { message: "SSE stream established", timestamp: new Date().toISOString() });

    // Clean up on client disconnect
    res.on("close", () => {
      this.clients.delete(connectionId);
      console.log(`[SSE] Client disconnected: userId=${userId}, connId=${connectionId}. Total clients: ${this.clients.size}`);
    });
  }

  /**
   * Send a CRM sync event to all connections belonging to a specific CRM customer.
   * Used by the event queue after a successful entity sync to DB.
   */
  broadcastToCrmCustomer(crmCustomerId: string, eventName: string, payload: Record<string, unknown>): void {
    let notified = 0;
    for (const [connId, client] of this.clients) {
      if (client.crmCustomerId === crmCustomerId) {
        this.sendToConnection(connId, eventName, payload);
        notified++;
      }
    }
    if (notified > 0) {
      console.log(`[SSE] Pushed '${eventName}' to ${notified} connection(s) for crmCustomer=${crmCustomerId}`);
    }
  }

  /**
   * Send an event to all connected SSE clients (e.g., admin-level notifications).
   */
  broadcastToAll(eventName: string, payload: Record<string, unknown>): void {
    for (const connId of this.clients.keys()) {
      this.sendToConnection(connId, eventName, payload);
    }
  }

  /**
   * Send an event to a specific SSE connection by connection ID.
   */
  private sendToConnection(connectionId: string, eventName: string, payload: Record<string, unknown>): void {
    const client = this.clients.get(connectionId);
    if (!client) return;
    try {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      console.error(`[SSE] Error writing to connection ${connectionId}:`, err);
      this.clients.delete(connectionId);
    }
  }

  /**
   * Send a keep-alive ping to all connected clients to prevent proxy timeout.
   */
  private sendPingToAll(): void {
    if (this.clients.size === 0) return;
    const ping = `: ping ${new Date().toISOString()}\n\n`;
    for (const [connId, client] of this.clients) {
      try {
        client.res.write(ping);
      } catch {
        this.clients.delete(connId);
      }
    }
  }

  /**
   * Returns the count of currently connected clients.
   */
  get connectionCount(): number {
    return this.clients.size;
  }

  /**
   * Gracefully shut down — sends a shutdown event to all clients.
   */
  shutdown(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.broadcastToAll("shutdown", { message: "Server is shutting down" });
    this.clients.clear();
  }
}

// Singleton instance shared across the application
export const sseManager = new SseManager();
