class SseManager {
    /** Map of connectionId → SseClient. Supports multiple tabs per user. */
    clients = new Map();
    pingInterval = null;
    constructor() {
        // Send keep-alive pings every 30 seconds to all connected clients
        this.pingInterval = setInterval(() => this.sendPingToAll(), 30_000);
    }
    /**
     * Register a new SSE client connection.
     * Sets up the streaming headers and schedules cleanup on disconnect.
     */
    addClient(connectionId, userId, crmCustomerId, res) {
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
    broadcastToCrmCustomer(crmCustomerId, eventName, payload) {
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
    broadcastToAll(eventName, payload) {
        for (const connId of this.clients.keys()) {
            this.sendToConnection(connId, eventName, payload);
        }
    }
    /**
     * Send an event to a specific SSE connection by connection ID.
     */
    sendToConnection(connectionId, eventName, payload) {
        const client = this.clients.get(connectionId);
        if (!client)
            return;
        try {
            client.res.write(`event: ${eventName}\n`);
            client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
        catch (err) {
            console.error(`[SSE] Error writing to connection ${connectionId}:`, err);
            this.clients.delete(connectionId);
        }
    }
    /**
     * Send a keep-alive ping to all connected clients to prevent proxy timeout.
     */
    sendPingToAll() {
        if (this.clients.size === 0)
            return;
        const ping = `: ping ${new Date().toISOString()}\n\n`;
        for (const [connId, client] of this.clients) {
            try {
                client.res.write(ping);
            }
            catch {
                this.clients.delete(connId);
            }
        }
    }
    /**
     * Returns the count of currently connected clients.
     */
    get connectionCount() {
        return this.clients.size;
    }
    /**
     * Gracefully shut down — sends a shutdown event to all clients.
     */
    shutdown() {
        if (this.pingInterval)
            clearInterval(this.pingInterval);
        this.broadcastToAll("shutdown", { message: "Server is shutting down" });
        this.clients.clear();
    }
}
// Singleton instance shared across the application
export const sseManager = new SseManager();
