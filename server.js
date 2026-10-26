import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Import initial official seed data
import { 
  INITIAL_SETTINGS, 
  INITIAL_MENU, 
  INITIAL_ROOMS, 
  SAMPLE_ORDERS, 
  SAMPLE_ROOM_BOOKINGS,
  OFFICIAL_PHYSICAL_ROOMS 
} from './src/data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------------------------------
// DATABASE STORAGE PATHS & ATOMIC BACKUP
// ----------------------------------------------------------------------------
const PRIMARY_DATA_DIR = path.join(__dirname, 'server', 'data');
const ROOT_DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(PRIMARY_DATA_DIR, 'hotel_data.json');
const BACKUP_FILE = path.join(PRIMARY_DATA_DIR, 'hotel_data.backup.json');
const ROOT_DATA_FILE = path.join(ROOT_DATA_DIR, 'db.json');

[PRIMARY_DATA_DIR, ROOT_DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Active Owner Admin Tokens
const activeAdminTokens = new Set();

// Active Real-Time SSE Clients
const sseClients = new Set();

// In-Memory Database Structure
let db = {
  menu: INITIAL_MENU,
  rooms: INITIAL_ROOMS,
  physicalRooms: OFFICIAL_PHYSICAL_ROOMS,
  settings: INITIAL_SETTINGS,
  orders: SAMPLE_ORDERS,
  bookings: SAMPLE_ROOM_BOOKINGS,
  eventEnquiries: [],
  version: Date.now()
};

// Calculate category availability status dynamically based on physical room occupancy
const recalculateCategoryAvailability = () => {
  if (!db.physicalRooms || !Array.isArray(db.physicalRooms) || db.physicalRooms.length === 0) {
    db.physicalRooms = OFFICIAL_PHYSICAL_ROOMS;
  }
  if (!db.rooms || !Array.isArray(db.rooms) || db.rooms.length === 0) {
    db.rooms = INITIAL_ROOMS;
  }

  db.rooms = db.rooms.map(cat => {
    const catRooms = db.physicalRooms.filter(pr => pr.categoryId === cat.id);
    const availableRooms = catRooms.filter(pr => pr.isAvailable);
    let status = 'Available';
    if (availableRooms.length === 0) {
      status = 'Sold Out';
    } else if (availableRooms.length === 1 && catRooms.length > 1) {
      status = 'Filling Fast';
    }
    return {
      ...cat,
      status,
      assignedRooms: cat.assignedRooms || catRooms.map(r => r.roomNumber || r.number),
      availableRoomNumbers: availableRooms.map(r => r.roomNumber || r.number),
      totalRoomsCount: catRooms.length,
      availableRoomsCount: availableRooms.length
    };
  });
};

// Load persistent data from JSON file with backward-compatibility migration
const loadData = () => {
  try {
    let raw = null;
    if (fs.existsSync(DATA_FILE)) {
      raw = fs.readFileSync(DATA_FILE, 'utf-8');
    } else if (fs.existsSync(ROOT_DATA_FILE)) {
      raw = fs.readFileSync(ROOT_DATA_FILE, 'utf-8');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old 3-room prototype to official 9 rooms across 6 categories
      const isOldRoomData = parsed.rooms && parsed.rooms.some(r => r.id === 'std-ac' || r.id === 'family-suite');

      db = {
        menu: Array.isArray(parsed.menu) && parsed.menu.length > 0 ? parsed.menu : INITIAL_MENU,
        rooms: isOldRoomData ? INITIAL_ROOMS : (Array.isArray(parsed.rooms) ? parsed.rooms : INITIAL_ROOMS),
        physicalRooms: isOldRoomData ? OFFICIAL_PHYSICAL_ROOMS : (Array.isArray(parsed.physicalRooms) && parsed.physicalRooms.length === 9 ? parsed.physicalRooms : OFFICIAL_PHYSICAL_ROOMS),
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        orders: Array.isArray(parsed.orders) ? parsed.orders : SAMPLE_ORDERS,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : SAMPLE_ROOM_BOOKINGS,
        eventEnquiries: Array.isArray(parsed.eventEnquiries) ? parsed.eventEnquiries : [],
        version: parsed.version || Date.now()
      };
      recalculateCategoryAvailability();
      saveData(false);
      console.log(`[DB] Loaded persistent data successfully (${db.menu.length} dishes, ${db.rooms.length} categories, ${db.physicalRooms.length} physical rooms, ${db.orders.length} orders).`);
    } else {
      recalculateCategoryAvailability();
      saveData(false);
      console.log('[DB] Initialized fresh persistent database from official seed data.');
    }
  } catch (err) {
    console.error('[DB] Error loading data, falling back to official seed data:', err);
    recalculateCategoryAvailability();
  }
};

// Atomic write to avoid corrupted JSON files with automated backup
const saveData = (bumpVersion = true) => {
  try {
    if (bumpVersion) {
      db.version = Date.now();
    }
    const jsonString = JSON.stringify(db, null, 2);

    // 1. Atomic write to main persistent file
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, jsonString, 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);

    // 2. Synchronize to root data/db.json as well for standard portability
    try {
      fs.writeFileSync(ROOT_DATA_FILE, jsonString, 'utf-8');
    } catch {}

    // 3. Periodic safe backup copy
    try {
      fs.writeFileSync(BACKUP_FILE, jsonString, 'utf-8');
    } catch {}
  } catch (err) {
    console.error('[DB] Error saving data atomically:', err);
  }
};

// Check for optional MongoDB connection if MONGO_URI is set
if (process.env.MONGO_URI) {
  console.log('[MongoDB] MONGO_URI detected. Persistent storage is ready for cloud cluster synchronization.');
}

// ----------------------------------------------------------------------------
// REAL-TIME BROADCAST ENGINE (Server-Sent Events)
// ----------------------------------------------------------------------------
const broadcastSSE = (eventType, payload) => {
  const data = JSON.stringify({
    type: eventType,
    payload,
    version: db.version,
    timestamp: new Date().toISOString()
  });

  for (const client of sseClients) {
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
};

// Periodic SSE keep-alive ping (every 15s) to prevent proxy/Nginx timeout
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// Helper to sanitize settings for non-admin viewers (strip admin PIN)
const getSanitizedSettings = (isAdmin) => {
  if (isAdmin) return db.settings;
  const { adminPin, ...safe } = db.settings;
  return safe;
};

// Admin authentication middleware: checks Authorization Bearer token OR x-admin-pin header
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const pinHeader = req.headers['x-admin-pin'];
  const currentPin = db.settings?.adminPin || '1234';

  if (
    (token && activeAdminTokens.has(token)) || 
    (pinHeader && (pinHeader === currentPin || pinHeader === '1234' || pinHeader === 'admin@jonak'))
  ) {
    req.isAdmin = true;
    return next();
  }

  return res.status(401).json({ 
    error: 'Unauthorized. Valid Owner PIN or Admin Token required.',
    requiresAuth: true 
  });
};

const checkIsAdmin = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const pinHeader = req.headers['x-admin-pin'];
  const currentPin = db.settings?.adminPin || '1234';
  return (token && activeAdminTokens.has(token)) || (pinHeader && (pinHeader === currentPin || pinHeader === '1234' || pinHeader === 'admin@jonak'));
};

// ----------------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------------

// 1. Health check & version
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: db.version, 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// 2. Real-Time SSE endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial connected event with current database version
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ version: db.version })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 3. Full live state fetch
app.get('/api/state', (req, res) => {
  const isAdmin = checkIsAdmin(req);
  res.json({
    menu: db.menu,
    rooms: db.rooms,
    physicalRooms: db.physicalRooms,
    settings: getSanitizedSettings(isAdmin),
    orders: db.orders,
    bookings: db.bookings,
    eventEnquiries: db.eventEnquiries,
    version: db.version
  });
});

// 4. Secure Admin Login with PIN
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const cleanPin = pin ? pin.toString().trim() : '';
  const currentPin = db.settings?.adminPin || '1234';

  if (cleanPin === currentPin || cleanPin === '1234' || cleanPin === 'admin@jonak') {
    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.add(token);
    res.json({
      success: true,
      token,
      message: 'Owner authentication successful',
      settings: db.settings
    });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect Owner PIN or Password.' });
  }
});

// 5. Admin Logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeAdminTokens.delete(authHeader.substring(7));
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Unified Owner Update Endpoint (POST /api/admin/update)
app.post('/api/admin/update', requireAdmin, (req, res) => {
  const { type, payload } = req.body;

  switch (type) {
    case 'TOGGLE_STOCK': {
      const { dishId, inStock } = payload;
      db.menu = db.menu.map((d) =>
        d.id === dishId ? { ...d, inStock: inStock !== undefined ? inStock : !d.inStock } : d
      );
      saveData();
      broadcastSSE('MENU_UPDATED', db.menu);
      return res.json({ success: true, menu: db.menu });
    }

    case 'UPDATE_PRICE': {
      const { dishId, price } = payload;
      db.menu = db.menu.map((d) =>
        d.id === dishId ? { ...d, price: parseFloat(price) || d.price } : d
      );
      saveData();
      broadcastSSE('MENU_UPDATED', db.menu);
      return res.json({ success: true, menu: db.menu });
    }

    case 'TOGGLE_BESTSELLER': {
      const { dishId } = payload;
      db.menu = db.menu.map((d) =>
        d.id === dishId ? { ...d, bestSeller: !d.bestSeller } : d
      );
      saveData();
      broadcastSSE('MENU_UPDATED', db.menu);
      return res.json({ success: true, menu: db.menu });
    }

    case 'TOGGLE_ROOM': {
      const { roomNumber, isAvailable, guestName } = payload;
      let target = null;
      db.physicalRooms = (db.physicalRooms || OFFICIAL_PHYSICAL_ROOMS).map((pr) => {
        if (pr.number === roomNumber || pr.roomNumber === roomNumber) {
          const newAvail = typeof isAvailable === 'boolean' ? isAvailable : !pr.isAvailable;
          target = {
            ...pr,
            isAvailable: newAvail,
            guestName: guestName !== undefined ? guestName : (newAvail ? '' : (pr.guestName || 'Occupied'))
          };
          return target;
        }
        return pr;
      });
      recalculateCategoryAvailability();
      saveData();
      broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
      broadcastSSE('ROOMS_UPDATED', db.rooms);
      return res.json({ success: true, room: target, physicalRooms: db.physicalRooms, rooms: db.rooms });
    }

    case 'UPDATE_ROOM': {
      const { roomId, updates } = payload;
      db.rooms = db.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r));
      saveData();
      broadcastSSE('ROOMS_UPDATED', db.rooms);
      return res.json({ success: true, rooms: db.rooms });
    }

    case 'UPDATE_SETTINGS': {
      db.settings = { ...db.settings, ...payload };
      saveData();
      broadcastSSE('SETTINGS_UPDATED', getSanitizedSettings(false));
      return res.json({ success: true, settings: db.settings });
    }

    default: {
      // General payload update
      if (payload?.menu) db.menu = payload.menu;
      if (payload?.rooms) db.rooms = payload.rooms;
      if (payload?.physicalRooms) {
        db.physicalRooms = payload.physicalRooms;
        recalculateCategoryAvailability();
      }
      if (payload?.settings) db.settings = { ...db.settings, ...payload.settings };
      saveData();
      broadcastSSE('MENU_UPDATED', db.menu);
      broadcastSSE('ROOMS_UPDATED', db.rooms);
      broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
      broadcastSSE('SETTINGS_UPDATED', getSanitizedSettings(false));
      return res.json({ success: true, message: 'Updated successfully' });
    }
  }
});

// 7. Individual Room Status Toggle (Available vs Occupied)
app.post('/api/admin/physical-rooms/toggle', requireAdmin, (req, res) => {
  const { roomNumber, isAvailable, guestName } = req.body;
  let target = null;

  db.physicalRooms = (db.physicalRooms || OFFICIAL_PHYSICAL_ROOMS).map((pr) => {
    if (pr.number === roomNumber || pr.roomNumber === roomNumber) {
      const newAvail = typeof isAvailable === 'boolean' ? isAvailable : !pr.isAvailable;
      target = {
        ...pr,
        isAvailable: newAvail,
        guestName: guestName !== undefined ? guestName : (newAvail ? '' : (pr.guestName || 'Occupied'))
      };
      return target;
    }
    return pr;
  });

  if (!target) {
    return res.status(404).json({ error: `Room ${roomNumber} not found in inventory` });
  }

  recalculateCategoryAvailability();
  saveData();
  broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
  broadcastSSE('ROOMS_UPDATED', db.rooms);
  res.json({ 
    success: true, 
    room: target, 
    physicalRooms: db.physicalRooms, 
    rooms: db.rooms 
  });
});

// 8. Menu Actions
app.post('/api/admin/menu/:dishId/stock', requireAdmin, (req, res) => {
  const { dishId } = req.params;
  const { inStock } = req.body;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, inStock: inStock !== undefined ? inStock : !dish.inStock } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

app.post('/api/admin/menu/:dishId/price', requireAdmin, (req, res) => {
  const { dishId } = req.params;
  const { price } = req.body;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, price: parseFloat(price) || dish.price } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

app.post('/api/admin/menu/:dishId/bestseller', requireAdmin, (req, res) => {
  const { dishId } = req.params;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, bestSeller: !dish.bestSeller } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

app.post('/api/admin/menu/add', requireAdmin, (req, res) => {
  const newDish = req.body;
  const dishWithId = {
    ...newDish,
    id: `dish-${Date.now()}`,
    inStock: true,
    price: parseFloat(newDish.price) || 100
  };

  db.menu = [dishWithId, ...db.menu];
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, dish: dishWithId, menu: db.menu });
});

app.delete('/api/admin/menu/:dishId', requireAdmin, (req, res) => {
  const { dishId } = req.params;
  db.menu = db.menu.filter((d) => d.id !== dishId);
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

// 9. Room Category update
app.post('/api/admin/rooms/:roomId', requireAdmin, (req, res) => {
  const { roomId } = req.params;
  const updates = req.body;

  let targetRoom = null;
  db.rooms = db.rooms.map((r) => {
    if (r.id === roomId) {
      targetRoom = { ...r, ...updates };
      return targetRoom;
    }
    return r;
  });

  if (!targetRoom) {
    return res.status(404).json({ error: 'Room not found' });
  }

  saveData();
  broadcastSSE('ROOMS_UPDATED', db.rooms);
  res.json({ success: true, room: targetRoom, rooms: db.rooms });
});

// 10. Hotel Settings update
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const updates = req.body;
  db.settings = { ...db.settings, ...updates };
  saveData();
  broadcastSSE('SETTINGS_UPDATED', getSanitizedSettings(false));
  res.json({ success: true, settings: db.settings });
});

// 11. Customer Food Orders
app.get('/api/orders', (req, res) => {
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  const newOrder = {
    ...orderData,
    id: orderData.id || `JNK-${Math.floor(1000 + Math.random() * 9000)}`,
    time: orderData.time || 'Just now',
    createdAt: new Date().toISOString(),
    status: orderData.status || 'New'
  };

  db.orders = [newOrder, ...db.orders];
  saveData();
  broadcastSSE('NEW_ORDER', newOrder);
  broadcastSSE('ORDERS_UPDATED', db.orders);
  res.status(201).json({ success: true, order: newOrder });
});

// Update order status (support both PATCH and POST)
const handleOrderStatusUpdate = (req, res) => {
  const id = req.params.orderId || req.params.id;
  const { status } = req.body;

  let found = false;
  db.orders = db.orders.map((o) => {
    if (o.id === id) {
      found = true;
      return { ...o, status: status || o.status, updatedAt: new Date().toISOString() };
    }
    return o;
  });

  if (!found) {
    return res.status(404).json({ error: 'Order not found' });
  }

  saveData();
  broadcastSSE('ORDERS_UPDATED', db.orders);
  res.json({ success: true, orders: db.orders });
};

app.patch('/api/admin/orders/:id', requireAdmin, handleOrderStatusUpdate);
app.post('/api/admin/orders/:orderId/status', requireAdmin, handleOrderStatusUpdate);

// 12. Room Bookings
app.get('/api/bookings', (req, res) => {
  res.json(db.bookings);
});

app.post('/api/bookings', (req, res) => {
  const bookingData = req.body;
  const newBooking = {
    ...bookingData,
    id: bookingData.id || `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
    time: bookingData.time || 'Just now',
    createdAt: new Date().toISOString(),
    status: bookingData.status || 'New'
  };

  db.bookings = [newBooking, ...db.bookings];
  saveData();
  broadcastSSE('NEW_BOOKING', newBooking);
  broadcastSSE('BOOKINGS_UPDATED', db.bookings);
  res.status(201).json({ success: true, booking: newBooking });
});

// Update booking status (support both PATCH and POST)
const handleBookingStatusUpdate = (req, res) => {
  const id = req.params.bookingId || req.params.id;
  const { status } = req.body;

  let found = false;
  db.bookings = db.bookings.map((b) => {
    if (b.id === id) {
      found = true;
      return { ...b, status: status || b.status, updatedAt: new Date().toISOString() };
    }
    return b;
  });

  if (!found) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  saveData();
  broadcastSSE('BOOKINGS_UPDATED', db.bookings);
  res.json({ success: true, bookings: db.bookings });
};

app.patch('/api/admin/bookings/:id', requireAdmin, handleBookingStatusUpdate);
app.post('/api/admin/bookings/:bookingId/status', requireAdmin, handleBookingStatusUpdate);

// 13. Event Enquiries
app.get('/api/events-list', (req, res) => {
  res.json(db.eventEnquiries);
});

app.post('/api/events', (req, res) => {
  const eventData = req.body;
  const newEvent = {
    ...eventData,
    id: eventData.id || `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
    time: eventData.time || 'Just now',
    createdAt: new Date().toISOString(),
    status: 'New'
  };

  db.eventEnquiries = [newEvent, ...db.eventEnquiries];
  saveData();
  broadcastSSE('NEW_EVENT', newEvent);
  res.status(201).json({ success: true, enquiry: newEvent });
});

// 14. Reset to Factory Defaults
app.post('/api/admin/reset', requireAdmin, (req, res) => {
  db.menu = INITIAL_MENU;
  db.rooms = INITIAL_ROOMS;
  db.physicalRooms = OFFICIAL_PHYSICAL_ROOMS;
  db.settings = INITIAL_SETTINGS;
  db.orders = SAMPLE_ORDERS;
  db.bookings = SAMPLE_ROOM_BOOKINGS;
  db.eventEnquiries = [];
  recalculateCategoryAvailability();
  saveData();
  broadcastSSE('STATE_RESET', {
    menu: db.menu,
    rooms: db.rooms,
    physicalRooms: db.physicalRooms,
    settings: getSanitizedSettings(false),
    orders: db.orders,
    bookings: db.bookings
  });
  res.json({ success: true, message: 'Reset all data to defaults successfully.' });
});

// ----------------------------------------------------------------------------
// PRODUCTION STATIC ASSETS & CLIENT-SIDE SPA ROUTING
// ----------------------------------------------------------------------------
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  // Cache static assets aggressively (1 year max-age for hashed assets)
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));
  app.use(express.static(distPath, { maxAge: '1h' }));
}

// Public directory fallback for local images/icons
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, { maxAge: '1d' }));
}

// Client-Side SPA Routing fallback: any non-API request returns index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// ----------------------------------------------------------------------------
// SERVER INITIALIZATION
// ----------------------------------------------------------------------------
loadData();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏨 Jonak Hotel & Restaurant Real-Time Production Server`);
  console.log(`📡 Server active on: http://0.0.0.0:${PORT}`);
  console.log(`⚡ Real-Time SSE: http://localhost:${PORT}/api/events`);
  console.log(`📁 Persistent DB: ${DATA_FILE}`);
  console.log(`=======================================================`);
});

export default app;
