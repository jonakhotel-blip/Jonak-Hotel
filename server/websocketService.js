import crypto from 'crypto';
import { parseCookies } from './security.js';
import { getSessionFromRequest } from './authService.js';

// RFC 6455 WebSocket Magic GUID
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// Supported RFC 6455 Opcodes
const OPCODES = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xA
};

/**
 * Creates an RFC 6455 unmasked frame to send to a client.
 */
export const createWebSocketFrame = (payload, opcode = OPCODES.TEXT) => {
  const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
  const length = data.length;
  let header;

  if (length <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | (opcode & 0x0F); // FIN bit set
    header[1] = length; // Unmasked (server to client)
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | (opcode & 0x0F);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | (opcode & 0x0F);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, data]);
};

/**
 * Parses masked RFC 6455 frames from client socket stream.
 */
export class WebSocketFrameParser {
  constructor(onMessage, onClose, onPing, onPong) {
    this.buffer = Buffer.alloc(0);
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onPing = onPing;
    this.onPong = onPong;
  }

  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.process();
  }

  process() {
    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];

      const isFin = (firstByte & 0x80) !== 0;
      const opcode = firstByte & 0x0F;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7F;
      let headerLength = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < 4) return;
        payloadLength = this.buffer.readUInt16BE(2);
        headerLength = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) return;
        payloadLength = Number(this.buffer.readBigUInt64BE(2));
        headerLength = 10;
      }

      const maskLength = isMasked ? 4 : 0;
      const totalFrameLength = headerLength + maskLength + payloadLength;

      if (this.buffer.length < totalFrameLength) {
        // Wait for more data
        return;
      }

      let payload = this.buffer.subarray(
        headerLength + maskLength,
        headerLength + maskLength + payloadLength
      );

      if (isMasked) {
        const maskKey = this.buffer.subarray(headerLength, headerLength + 4);
        const unmasked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) {
          unmasked[i] = payload[i] ^ maskKey[i % 4];
        }
        payload = unmasked;
      }

      // Advance buffer past this complete frame
      this.buffer = this.buffer.subarray(totalFrameLength);

      // Handle Opcodes
      if (opcode === OPCODES.TEXT) {
        const text = payload.toString('utf8');
        if (this.onMessage) this.onMessage(text);
      } else if (opcode === OPCODES.CLOSE) {
        if (this.onClose) this.onClose();
      } else if (opcode === OPCODES.PING) {
        if (this.onPing) this.onPing(payload);
      } else if (opcode === OPCODES.PONG) {
        if (this.onPong) this.onPong(payload);
      }
    }
  }
}

/**
 * Standards-Based Real-time Gateway with Role-based Room Subscriptions
 */
export class WebSocketGateway {
  constructor(server, getDb, saveDb) {
    this.server = server;
    this.getDb = getDb;
    this.saveDb = saveDb;
    this.clients = new Map(); // socket => clientContext
    this.rooms = new Map(); // roomName => Set<clientContext>

    // Allowed CORS Origins for WebSocket Handshake
    this.allowedOrigins = [
      'https://jonakhotelgroup.in',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173'
    ];

    this.init();
  }

  init() {
    this.server.on('upgrade', (req, socket, head) => {
      this.handleUpgrade(req, socket, head);
    });

    // Start background Heartbeat (ping every 30s)
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000);

    // Start Transactional Outbox Worker (every 2.5s)
    this.outboxWorkerInterval = setInterval(() => {
      this.processOutbox();
    }, 2500);
  }

  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.outboxWorkerInterval) clearInterval(this.outboxWorkerInterval);
    for (const [socket] of this.clients) {
      try {
        socket.end();
      } catch {}
    }
    this.clients.clear();
    this.rooms.clear();
  }

  /**
   * Validate WebSocket Upgrade Handshake
   */
  handleUpgrade(req, socket, head) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws' && url.pathname !== '/socket.io/') {
      // Not a real-time gateway endpoint
      return;
    }

    // 1. Verify Upgrade Header
    if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // 2. Validate Origin against Allowlist
    const origin = req.headers.origin;
    if (origin && !this.isAllowedOrigin(origin)) {
      console.warn(`[WebSocket] Rejected unauthorized Origin handshake: ${origin}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // 3. Authenticate Session from Cookie
    const db = this.getDb();
    const session = getSessionFromRequest(req, db);

    // For customers tracking guest orders without account login, check ?token= query parameter
    let guestUser = null;
    if (!session) {
      const trackingToken = url.searchParams.get('orderToken') || url.searchParams.get('guestId');
      if (trackingToken) {
        guestUser = {
          id: `guest_${trackingToken.slice(0, 16)}`,
          role: 'customer',
          email: 'guest@customer.local',
          isGuest: true
        };
      }
    }

    const authenticatedUser = session ? {
      id: session.userId,
      role: session.role,
      email: session.email,
      name: session.name,
      sessionId: session.id,
      isGuest: false
    } : (guestUser || {
      id: `anon_${crypto.randomUUID().slice(0, 8)}`,
      role: 'anonymous',
      isGuest: true
    });

    // 4. Compute Sec-WebSocket-Accept
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const accept = crypto
      .createHash('sha1')
      .update(key + WS_GUID)
      .digest('base64');

    // 5. Send HTTP 101 Switching Protocols Response
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    // 6. Establish Real-time Client Context
    const clientId = `ws_${crypto.randomUUID()}`;
    const clientContext = {
      id: clientId,
      socket,
      user: authenticatedUser,
      rooms: new Set(),
      isAlive: true,
      connectedAt: new Date().toISOString(),
      ip: req.socket.remoteAddress
    };

    // Auto-subscribe to personal user room
    this.joinRoom(clientContext, `user:${authenticatedUser.id}`);

    // Privileged operational subscriptions
    if (['owner', 'manager', 'staff'].includes(authenticatedUser.role)) {
      this.joinRoom(clientContext, 'branch:barpeta:ops');
    }
    if (authenticatedUser.role === 'staff') {
      this.joinRoom(clientContext, `courier:${authenticatedUser.id}:tasks`);
    }

    this.clients.set(socket, clientContext);

    // 7. Setup Frame Parser
    const parser = new WebSocketFrameParser(
      (message) => this.handleClientMessage(clientContext, message),
      () => this.handleClientDisconnect(clientContext),
      (payload) => {
        // Ping received from client -> reply with Pong
        try {
          socket.write(createWebSocketFrame(payload, OPCODES.PONG));
        } catch {}
      },
      () => {
        clientContext.isAlive = true;
      }
    );

    socket.on('data', (chunk) => parser.push(chunk));
    socket.on('error', () => this.handleClientDisconnect(clientContext));
    socket.on('close', () => this.handleClientDisconnect(clientContext));

    if (head && head.length > 0) {
      parser.push(head);
    }

    // Send Initial Welcome & Subscription Confirmation
    this.sendToClient(clientContext, {
      type: 'server.connected',
      eventId: `evt_${crypto.randomUUID()}`,
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      data: {
        clientId,
        user: { id: authenticatedUser.id, role: authenticatedUser.role },
        subscriptions: Array.from(clientContext.rooms)
      }
    });
  }

  isAllowedOrigin(origin) {
    if (!origin) return true;
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
      return this.allowedOrigins.includes(origin);
    } catch {
      return false;
    }
  }

  /**
   * Handle Ingress Control & Subscription Commands from Client
   */
  handleClientMessage(client, rawText) {
    let msg;
    try {
      msg = JSON.parse(rawText);
    } catch {
      return;
    }

    const { type, data = {} } = msg;

    if (type === 'client.heartbeat') {
      client.isAlive = true;
      this.sendToClient(client, {
        type: 'server.heartbeat',
        occurredAt: new Date().toISOString()
      });
      return;
    }

    if (type === 'subscribe.order') {
      const { orderId } = data;
      if (!orderId) return;

      const db = this.getDb();
      const order = (db.orders || []).find(o => o.id === orderId);
      if (!order) {
        this.sendToClient(client, { type: 'error', data: { message: 'Order not found' } });
        return;
      }

      // Check authorization: must be the customer, owner/manager, or assigned courier
      const isOwnerOrManager = ['owner', 'manager', 'staff'].includes(client.user.role);
      const isCustomer = order.customerUserId === client.user.id || client.user.isGuest;
      const isAssignedCourier = order.assignedStaffId === client.user.id;

      if (isOwnerOrManager || isCustomer || isAssignedCourier) {
        this.joinRoom(client, `order:${orderId}`);
        this.sendToClient(client, {
          type: 'subscription.confirmed',
          data: { room: `order:${orderId}` }
        });
      } else {
        this.sendToClient(client, {
          type: 'subscription.denied',
          data: { room: `order:${orderId}`, reason: 'Unauthorized' }
        });
      }
      return;
    }

    if (type === 'unsubscribe.order') {
      const { orderId } = data;
      if (orderId) {
        this.leaveRoom(client, `order:${orderId}`);
      }
      return;
    }

    if (type === 'notification.ack') {
      const { notificationId } = data;
      if (notificationId) {
        this.acknowledgeNotification(client, notificationId);
      }
      return;
    }
  }

  joinRoom(client, roomName) {
    client.rooms.add(roomName);
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(client);
  }

  leaveRoom(client, roomName) {
    client.rooms.delete(roomName);
    if (this.rooms.has(roomName)) {
      const set = this.rooms.get(roomName);
      set.delete(client);
      if (set.size === 0) this.rooms.delete(roomName);
    }
  }

  handleClientDisconnect(client) {
    for (const roomName of client.rooms) {
      this.leaveRoom(client, roomName);
    }
    this.clients.delete(client.socket);
    try {
      client.socket.destroy();
    } catch {}
  }

  checkHeartbeats() {
    for (const [socket, client] of this.clients) {
      if (!client.isAlive) {
        this.handleClientDisconnect(client);
        continue;
      }
      client.isAlive = false;
      try {
        socket.write(createWebSocketFrame(Buffer.alloc(0), OPCODES.PING));
      } catch {
        this.handleClientDisconnect(client);
      }
    }
  }

  /**
   * Send JSON message to a single client
   */
  sendToClient(client, messageObj) {
    try {
      const text = JSON.stringify(messageObj);
      client.socket.write(createWebSocketFrame(text, OPCODES.TEXT));
    } catch (err) {
      this.handleClientDisconnect(client);
    }
  }

  /**
   * Broadcast message to a specific room
   */
  broadcastToRoom(roomName, messageObj) {
    const clientsInRoom = this.rooms.get(roomName);
    if (!clientsInRoom || clientsInRoom.size === 0) return 0;

    const frame = createWebSocketFrame(JSON.stringify(messageObj), OPCODES.TEXT);
    let count = 0;

    for (const client of clientsInRoom) {
      try {
        client.socket.write(frame);
        count++;
      } catch {
        this.handleClientDisconnect(client);
      }
    }
    return count;
  }

  /**
   * Acknowledge in-app notification
   */
  acknowledgeNotification(client, notificationId) {
    const db = this.getDb();
    if (!Array.isArray(db.notificationOutbox)) return;

    let updated = false;
    for (const item of db.notificationOutbox) {
      if (item.eventId === notificationId || item.id === notificationId) {
        item.acknowledged = true;
        item.acknowledgedAt = new Date().toISOString();
        item.acknowledgedBy = client.user.id;
        updated = true;
      }
    }

    if (updated && typeof this.saveDb === 'function') {
      this.saveDb();
    }
  }

  /**
   * Transactional Outbox Worker
   * Consumes pending database outbox events, fans out to appropriate rooms,
   * records delivery attempts, and updates status.
   */
  processOutbox() {
    const db = this.getDb();
    if (!Array.isArray(db.notificationOutbox) || db.notificationOutbox.length === 0) return;
    if (!Array.isArray(db.notificationDeliveries)) db.notificationDeliveries = [];

    const pendingEvents = db.notificationOutbox.filter(evt => evt.status === 'pending');
    if (pendingEvents.length === 0) return;

    let dbModified = false;

    for (const event of pendingEvents) {
      const { type, aggregate, recipient, data, eventId } = event;

      // Construct canonical RFC-compliant envelope
      const envelope = {
        eventId,
        schemaVersion: 1,
        type,
        aggregate: aggregate || { type: 'order', id: 'unknown', version: 1 },
        occurredAt: event.occurredAt || new Date().toISOString(),
        recipient: recipient || { kind: 'user', id: 'all' },
        data: data || {}
      };

      let deliveredCount = 0;

      // 1. Deliver to order-specific room
      if (aggregate?.type === 'order') {
        deliveredCount += this.broadcastToRoom(`order:${aggregate.id}`, envelope);
      }

      // 2. Deliver to direct user room
      if (recipient?.id && recipient.id !== 'all') {
        deliveredCount += this.broadcastToRoom(`user:${recipient.id}`, envelope);
      }

      // 3. Deliver to operational staff room for branch events
      if (type.startsWith('order.') || type.startsWith('booking.') || type.startsWith('delivery.')) {
        deliveredCount += this.broadcastToRoom('branch:barpeta:ops', envelope);
      }

      // 4. Deliver to assigned courier room if courier task event
      if (data?.assignedStaffId) {
        deliveredCount += this.broadcastToRoom(`courier:${data.assignedStaffId}:tasks`, envelope);
      }

      // Record delivery attempt
      db.notificationDeliveries.push({
        attemptId: `att_${crypto.randomUUID()}`,
        eventId,
        type,
        recipient: recipient?.id || 'broadcast',
        channel: 'WEBSOCKET',
        status: deliveredCount > 0 ? 'delivered' : 'in_app_visible',
        connectedSocketsReached: deliveredCount,
        attemptedAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString()
      });

      // Update event status
      event.status = 'published';
      event.publishedAt = new Date().toISOString();
      event.deliveryCount = deliveredCount;
      dbModified = true;
    }

    if (dbModified && typeof this.saveDb === 'function') {
      this.saveDb();
    }
  }
}
