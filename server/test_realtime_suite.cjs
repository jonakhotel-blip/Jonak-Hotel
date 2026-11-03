/**
 * Comprehensive Real-Time WebSocket, Outbox & Geocoding Test Suite
 * Jonak Hotel & Restaurant
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws';

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      path: url.pathname + url.search
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(data));
      req.write(data);
    }
    req.end();
  });
};

const loginAs = async (email, password) => {
  const step1 = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  const tempToken = step1.json?.tempToken || step1.json?.mfaToken;
  if (!tempToken) {
    throw new Error('Step 1 failed: ' + JSON.stringify(step1.json));
  }
  const secret = step1.json.secret;
  const security = require('./security.js');
  const code = security.generateTOTP(secret);

  const step2 = await request('/api/auth/mfa/verify', {
    method: 'POST',
    body: { tempToken, code, isRecoveryCode: false }
  });
  const setCookie = step2.headers['set-cookie'] || [];
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  return { 
    user: step2.json.user, 
    token: step2.json.token, 
    csrfToken: step2.json.csrfToken, 
    cookie: cookieStr 
  };
};

const runRealtimeTests = async () => {
  console.log('🧪 Starting Real-Time Architecture & Outbox Test Suite...\n');

  // --------------------------------------------------------------------------
  // TEST 1: Locality Search & Geocoding Resolution
  // --------------------------------------------------------------------------
  console.log('Test 1: Delivery Localities Search & GPS Resolution');
  const locRes = await request('/api/delivery/localities?q=satra');
  assert.strictEqual(locRes.status, 200, 'Localities search returns 200');
  assert.ok(Array.isArray(locRes.json), 'Returns array of localities');
  assert.ok(locRes.json.some(l => l.name.includes('Satra')), 'Contains Barpeta Satra');
  console.log('  ✅ [PASS] Locality search returns verified landmark matches');

  const resolveRes = await request('/api/delivery/resolve', {
    method: 'POST',
    body: { lat: 26.3310, lng: 91.0068 } // Right next to Jonak Hotel
  });
  assert.strictEqual(resolveRes.status, 200, 'Reverse geocode returns 200');
  assert.ok(resolveRes.json.locality, 'Returns resolved locality');
  assert.ok(resolveRes.json.distanceKm <= 1.0, 'Calculates precise distance (< 1km)');
  assert.strictEqual(resolveRes.json.locality.isDeliverable, true, 'Marks local address as deliverable');
  console.log('  ✅ [PASS] Coordinates resolved accurately using Haversine calculation');

  // --------------------------------------------------------------------------
  // TEST 2: RFC 6455 Native WebSocket Handshake & Origin Enforcement
  // --------------------------------------------------------------------------
  console.log('\nTest 2: RFC 6455 WebSocket Handshake & Strict Origin Control');

  // 2a. Rejection of forbidden Origin
  const originBlocked = await new Promise((resolve) => {
    const ws = new global.WebSocket(WS_URL, {
      headers: { Origin: 'https://malicious-phishing-site.com' }
    });
    ws.onopen = () => {
      ws.close();
      resolve(false);
    };
    ws.onerror = () => {
      resolve(true); // Handshake rejected with 403 Forbidden
    };
  });
  assert.ok(originBlocked, 'Disallowed external origin handshake is blocked');
  console.log('  ✅ [PASS] Handshake with unauthorized Origin header is rejected');

  // 2b. Permitted handshake from valid client
  const wsClient = await new Promise((resolve, reject) => {
    const ws = new global.WebSocket(WS_URL);
    ws.onopen = () => resolve(ws);
    ws.onerror = (err) => reject(err);
  });
  console.log('  ✅ [PASS] Standards-based RFC 6455 handshake successful on /ws');

  // Collect initial welcome event
  const welcomeMsg = await new Promise((resolve) => {
    wsClient.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed.type === 'server.connected') resolve(parsed);
      } catch (_) {}
    };
  });
  assert.strictEqual(welcomeMsg.type, 'server.connected', 'Server emits server.connected');
  assert.strictEqual(welcomeMsg.schemaVersion, 1, 'Versioned event schema envelope');
  console.log('  ✅ [PASS] Versioned canonical event envelope received (server.connected)');

  // --------------------------------------------------------------------------
  // TEST 3: Heartbeat Protocol (Ping / Pong)
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Real-Time Heartbeat Protocol');
  const heartbeatReply = await new Promise((resolve) => {
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'server.heartbeat') {
          wsClient.removeEventListener('message', handler);
          resolve(msg);
        }
      } catch (_) {}
    };
    wsClient.addEventListener('message', handler);
    wsClient.send(JSON.stringify({ type: 'client.heartbeat' }));
  });
  assert.ok(heartbeatReply.occurredAt, 'Heartbeat replies with ISO timestamp');
  console.log('  ✅ [PASS] Client heartbeat received and acknowledged by server');

  // --------------------------------------------------------------------------
  // TEST 4: Room Subscription Authorization & Transactional Outbox Fanout
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Room Subscriptions & Transactional Outbox Fanout');

  // Create an order to track
  const orderRes = await request('/api/orders', {
    method: 'POST',
    body: {
      customerName: 'Realtime Test Customer',
      phone: '9876543210',
      mode: 'Home Delivery',
      deliveryAddress: 'Near Barpeta Satra, Barpeta',
      distanceKm: 3.8,
      items: [{ id: 'menu_3', name: 'Butter Chicken Grand Handi', price: 340, qty: 1 }],
      subtotal: 340,
      total: 340
    }
  });
  assert.strictEqual(orderRes.status, 201, 'Order created');
  const createdOrder = orderRes.json.order;
  const orderId = createdOrder.id;

  // Subscribe to order channel
  const subReply = await new Promise((resolve) => {
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'subscription.confirmed' && msg.data?.room === `order:${orderId}`) {
          wsClient.removeEventListener('message', handler);
          resolve(msg);
        }
      } catch (_) {}
    };
    wsClient.addEventListener('message', handler);
    wsClient.send(JSON.stringify({
      type: 'subscribe.order',
      data: { orderId }
    }));
  });
  assert.strictEqual(subReply.data.room, `order:${orderId}`, 'Room subscription confirmed');
  console.log(`  ✅ [PASS] Subscribed to real-time room order:${orderId}`);

  // Wait for status change fanout via outbox
  const statusEventPromise = new Promise((resolve) => {
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'order.status_changed' && msg.aggregate?.id === orderId) {
          wsClient.removeEventListener('message', handler);
          resolve(msg);
        }
      } catch (_) {}
    };
    wsClient.addEventListener('message', handler);
  });

  // Owner/Staff updates order status
  const managerSession = await loginAs('manager@jonakhotelgroup.in', 'JonakManager#2026');
  const updateRes = await request(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${managerSession.token}`,
      'Cookie': managerSession.cookie,
      'x-csrf-token': managerSession.csrfToken
    },
    body: { status: 'Preparing', note: 'Kitchen started cooking' }
  });
  assert.strictEqual(updateRes.status, 200, 'Status updated');

  const receivedFanout = await Promise.race([
    statusEventPromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Outbox fanout timeout')), 6000))
  ]);
  assert.strictEqual(receivedFanout.type, 'order.status_changed', 'Received canonical status event');
  assert.strictEqual(receivedFanout.data.status, 'Preparing', 'Payload contains updated status');
  console.log('  ✅ [PASS] Outbox worker processed event and fanned out to subscribed WebSocket');

  // --------------------------------------------------------------------------
  // TEST 5: Courier Task Assignment & Segregated View
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Courier Task Assignment & Role-Segregated Visibility');
  const staffSession = await loginAs('staff@jonakhotelgroup.in', 'JonakStaff#2026');

  const assignRes = await request(`/api/orders/${orderId}/assign-courier`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${managerSession.token}`,
      'Cookie': managerSession.cookie,
      'x-csrf-token': managerSession.csrfToken
    },
    body: {
      courierId: staffSession.user.id,
      courierName: staffSession.user.name
    }
  });
  assert.strictEqual(assignRes.status, 200, 'Courier assigned');
  assert.strictEqual(assignRes.json.order.assignedStaffId, staffSession.user.id);
  console.log('  ✅ [PASS] Manager assigned order to delivery partner');

  // Staff/Courier views assigned tasks
  const courierTasksRes = await request('/api/courier/tasks', {
    headers: { 'Cookie': staffSession.cookie }
  });
  assert.strictEqual(courierTasksRes.status, 200, 'Courier tasks retrieved');
  assert.ok(courierTasksRes.json.tasks.some(t => t.id === orderId), 'Assigned order visible to courier');
  console.log('  ✅ [PASS] Assigned courier sees dedicated delivery tasks');

  // --------------------------------------------------------------------------
  // TEST 6: Cursor-Based Reconciliation & Notification Acknowledgment
  // --------------------------------------------------------------------------
  console.log('\nTest 6: Cursor Reconciliation & Notification Acknowledgment');
  const notifRes = await request('/api/me/notifications', {
    headers: { 'Cookie': managerSession.cookie }
  });
  assert.strictEqual(notifRes.status, 200, 'Notifications endpoint returns 200');
  assert.ok(Array.isArray(notifRes.json.notifications), 'Notifications array returned');
  assert.ok(notifRes.json.notifications.length > 0, 'Notification delivery logs found');

  const firstNotif = notifRes.json.notifications[0];
  const ackRes = await request(`/api/notifications/${firstNotif.attemptId || firstNotif.eventId}/ack`, {
    method: 'POST',
    headers: { 'Cookie': managerSession.cookie }
  });
  assert.strictEqual(ackRes.status, 200, 'Notification acknowledged');
  assert.strictEqual(ackRes.json.acknowledged, true, 'Acknowledged flag set');
  console.log('  ✅ [PASS] Notification acknowledged and durable state updated');

  // Cursor query
  const cursor = notifRes.json.nextCursor;
  const cursorRes = await request(`/api/me/notifications?after=${encodeURIComponent(cursor)}`, {
    headers: { 'Cookie': managerSession.cookie }
  });
  assert.strictEqual(cursorRes.status, 200, 'Cursor query returns 200');
  assert.strictEqual(cursorRes.json.notifications.length, 0, 'Cursor filters already received events');
  console.log('  ✅ [PASS] Cursor-based reconciliation filters seen notifications cleanly');

  // Append-only order status events endpoint
  const eventLogRes = await request(`/api/orders/${orderId}/events`);
  assert.strictEqual(eventLogRes.status, 200, 'Order event log returns 200');
  assert.ok(eventLogRes.json.events.length >= 2, 'Contains multiple state transition events');
  console.log('  ✅ [PASS] Append-only orderStatusEvents ledger verifiable via REST endpoint');

  // Clean up WebSocket client
  wsClient.close();

  console.log('\n🎉 ALL REAL-TIME ARCHITECTURE, WEBSOCKET, OUTBOX & RECONCILIATION TESTS PASSED!\n');
};

runRealtimeTests().catch(err => {
  console.error('\n❌ REAL-TIME TEST FAILURE:', err);
  process.exit(1);
});
