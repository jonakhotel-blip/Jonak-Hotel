/**
 * Real-Time WebSocket Client with Cursor Reconciliation & Event Deduplication
 */

import { getWsUrl } from '../config/apiConfig.js';

class RealtimeClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // eventType => Set<callback>
    this.reconnectAttempts = 0;
    this.maxReconnectDelayMs = 15000;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.seenEventIds = new Set();
    this.lastReconciliationCursor = null;
    this.subscribedOrders = new Set();
    this.isConnected = false;
    this.onConnectionChange = null;
  }

  getWebSocketUrl() {
    return getWsUrl();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.onConnectionChange) this.onConnectionChange(true);

        // Start heartbeat ping
        this.startHeartbeat();

        // Resubscribe to active orders
        for (const orderId of this.subscribedOrders) {
          this.send({ type: 'subscribe.order', data: { orderId } });
        }

        // Reconcile missed notifications since last cursor
        this.reconcileMissedNotifications();
      };

      this.ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data);
          this.handleIncomingEnvelope(envelope);
        } catch (err) {
          console.warn('[Realtime] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.cleanupConnection();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime] WebSocket error:', err);
        try {
          this.ws.close();
        } catch {}
      };
    } catch (err) {
      console.warn('[Realtime] Connection initiation error:', err);
      this.scheduleReconnect();
    }
  }

  cleanupConnection() {
    this.isConnected = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.onConnectionChange) this.onConnectionChange(false);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff with jitter
    const delay = Math.min(
      this.maxReconnectDelayMs,
      1000 * Math.pow(1.5, this.reconnectAttempts) + Math.random() * 500
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'client.heartbeat' });
      }
    }, 25000);
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  handleIncomingEnvelope(envelope) {
    const { eventId, type } = envelope;

    // Deduplicate by eventId
    if (eventId) {
      if (this.seenEventIds.has(eventId)) {
        return; // Already processed
      }
      this.seenEventIds.add(eventId);
      if (this.seenEventIds.size > 200) {
        // Prune oldest entries
        const iterator = this.seenEventIds.values();
        for (let i = 0; i < 50; i++) {
          this.seenEventIds.delete(iterator.next().value);
        }
      }
    }

    if (envelope.occurredAt) {
      this.lastReconciliationCursor = envelope.occurredAt;
    }

    // Trigger exact type listeners
    if (type && this.listeners.has(type)) {
      for (const cb of this.listeners.get(type)) {
        try {
          cb(envelope);
        } catch (e) {
          console.error('[Realtime] Listener callback error:', e);
        }
      }
    }

    // Trigger wildcard listeners
    if (this.listeners.has('*')) {
      for (const cb of this.listeners.get('*')) {
        try {
          cb(envelope);
        } catch (e) {
          console.error('[Realtime] Wildcard listener error:', e);
        }
      }
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => this.off(eventType, callback);
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  subscribeToOrder(orderId) {
    if (!orderId) return;
    this.subscribedOrders.add(orderId);
    this.send({ type: 'subscribe.order', data: { orderId } });
  }

  unsubscribeFromOrder(orderId) {
    if (!orderId) return;
    this.subscribedOrders.delete(orderId);
    this.send({ type: 'unsubscribe.order', data: { orderId } });
  }

  ackNotification(notificationId) {
    this.send({ type: 'notification.ack', data: { notificationId } });
  }

  async reconcileMissedNotifications() {
    try {
      const cursor = this.lastReconciliationCursor;
      const url = cursor
        ? `/api/me/notifications?after=${encodeURIComponent(cursor)}`
        : '/api/me/notifications';

      const res = await fetch(url);
      if (res.ok) {
        const { notifications, cursor: newCursor } = await res.json();
        if (Array.isArray(notifications)) {
          for (const item of notifications) {
            this.handleIncomingEnvelope({
              eventId: item.eventId || item.id,
              type: item.type || 'notification.created',
              occurredAt: item.occurredAt || item.createdAt,
              recipient: item.recipient,
              data: item.data || item
            });
          }
        }
        if (newCursor) this.lastReconciliationCursor = newCursor;
      }
    } catch (err) {
      console.warn('[Realtime] Notification reconciliation failed:', err);
    }
  }
}

export const realtimeClient = new RealtimeClient();

