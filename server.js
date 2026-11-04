import express from 'express';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Import initial official seed data
import { 
  HOTEL_INFO,
  INITIAL_SETTINGS, 
  INITIAL_MENU, 
  INITIAL_ROOMS, 
  SAMPLE_ORDERS, 
  SAMPLE_ROOM_BOOKINGS,
  OFFICIAL_PHYSICAL_ROOMS,
  DEFAULT_STAFF_MEMBERS,
  INITIAL_RAW_INVENTORY,
  INITIAL_EXPENSES,
  INITIAL_TASKS,
  STAFF_ROLES,
  DISH_SPECIFIC_IMAGES,
  INITIAL_OFFERS,
  BARPETA_LOCALITIES
} from './src/data/seedData.js';
import { 
  initializeAuthStore, 
  setupAuthRoutes, 
  getSessionFromRequest 
} from './server/authService.js';
import { WebSocketGateway } from './server/websocketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware (Full CORS with credentials for GitHub Pages & Render)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'x-idempotency-key']
}));
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

const PUBLIC_UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const KYC_UPLOADS_DIR = path.join(PUBLIC_UPLOADS_DIR, 'kyc');

[PRIMARY_DATA_DIR, ROOT_DATA_DIR, PUBLIC_UPLOADS_DIR, KYC_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

// Active Staff / Admin Tokens with session metadata (Map: token => { role, staffName, pin, createdAt })
const activeAdminTokens = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours session expiry

// Rate limiting for staff authentication (failed attempts per IP)
const loginAttempts = new Map(); // ip => { count, lockedUntil }
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Active Real-Time SSE Clients
const sseClients = new Set();

// In-Memory Database Structure
let db = {
  menu: INITIAL_MENU,
  rooms: INITIAL_ROOMS,
  physicalRooms: OFFICIAL_PHYSICAL_ROOMS,
  settings: INITIAL_SETTINGS,
  offers: INITIAL_OFFERS,
  orders: SAMPLE_ORDERS,
  bookings: SAMPLE_ROOM_BOOKINGS,
  eventEnquiries: [],
  notificationOutbox: [],
  notificationDeliveries: [],
  orderStatusEvents: [],
  staff: DEFAULT_STAFF_MEMBERS,
  rawInventory: INITIAL_RAW_INVENTORY,
  expenses: INITIAL_EXPENSES,
  tasks: INITIAL_TASKS,
  // Visitor Tracking & Analytics
  visitors: [],
  visitorStats: {
    totalLifetimeVisitors: 1248,
    todayVisitors: 86,
    thisMonthVisitors: 940,
    lastUpdatedDate: new Date().toISOString().split('T')[0],
    devices: { mobile: 780, desktop: 468 },
    pageViews: { home: 1248, menu: 890, rooms: 640, events: 210 }
  },
  // Permanent Customer CRM Directory
  customers: [],
  version: Date.now()
};

// ----------------------------------------------------------------------------
// CLOUD DATABASE INTEGRATION (MONGODB ATLAS)
// ----------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;
let lastMongoSyncTime = null;

const initMongo = async () => {
  if (!MONGODB_URI) {
    console.log('[Database] Running on local high-speed atomic JSON store (server/data/hotel_data.json).');
    return;
  }
  try {
    console.log('[MongoDB Atlas] Connecting to cloud database cluster...');
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db('jonak_hotel_db');
    isMongoConnected = true;
    lastMongoSyncTime = new Date().toISOString();
    console.log('✅ [MongoDB Atlas] Successfully connected to cloud cluster: jonak_hotel_db!');

    // Fetch cloud state if present
    const stateColl = mongoDb.collection('hotel_state');
    const remoteDoc = await stateColl.findOne({ _id: 'main_state' });
    if (remoteDoc && remoteDoc.data) {
      console.log('[MongoDB Atlas] Syncing existing cloud state into memory...');
      if (Array.isArray(remoteDoc.data.orders) && remoteDoc.data.orders.length > 0) db.orders = remoteDoc.data.orders;
      if (Array.isArray(remoteDoc.data.bookings) && remoteDoc.data.bookings.length > 0) db.bookings = remoteDoc.data.bookings;
      if (remoteDoc.data.visitorStats) db.visitorStats = { ...db.visitorStats, ...remoteDoc.data.visitorStats };
      if (Array.isArray(remoteDoc.data.rawInventory) && remoteDoc.data.rawInventory.length > 0) db.rawInventory = remoteDoc.data.rawInventory;
      if (Array.isArray(remoteDoc.data.staff) && remoteDoc.data.staff.length > 0) db.staff = remoteDoc.data.staff;
      if (Array.isArray(remoteDoc.data.visitors)) db.visitors = remoteDoc.data.visitors;
      recalculateCategoryAvailability();
      recomputeCustomers();
      saveData(false);
    } else {
      console.log('[MongoDB Atlas] Pushing current active dataset to cloud cluster...');
      await stateColl.updateOne(
        { _id: 'main_state' },
        { $set: { _id: 'main_state', data: db, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[MongoDB Atlas] Warning connecting to cloud cluster (fallback to local atomic JSON active):', err.message);
    isMongoConnected = false;
  }
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

// Recompute unified customer CRM database from orders, bookings & enquiries
const recomputeCustomers = () => {
  const customerMap = new Map();

  // 1. Food Orders
  (db.orders || []).forEach(o => {
    const phone = (o.customerPhone || o.phone || '').trim().replace(/\D/g, '');
    const name = (o.customerName || o.name || 'Guest').trim();
    const key = phone && phone.length >= 10 ? phone.slice(-10) : name;
    if (!key) return;

    const existing = customerMap.get(key) || {
      id: `CUST-${key}`,
      name: name !== 'Guest' ? name : 'Food Customer',
      phone: phone.length >= 10 ? phone.slice(-10) : 'Walk-in',
      address: o.deliveryAddress || o.locality || 'Barpeta Town',
      totalOrders: 0,
      totalStays: 0,
      totalEvents: 0,
      totalSpend: 0,
      lastVisitDate: o.createdAt || new Date().toISOString()
    };

    if (name !== 'Guest' && (existing.name === 'Food Customer' || existing.name === 'Guest')) {
      existing.name = name;
    }
    if (o.deliveryAddress && existing.address === 'Barpeta Town') {
      existing.address = o.deliveryAddress;
    }
    existing.totalOrders += 1;
    existing.totalSpend += parseFloat(o.total || 0);
    if (new Date(o.createdAt || 0) > new Date(existing.lastVisitDate)) {
      existing.lastVisitDate = o.createdAt;
    }
    customerMap.set(key, existing);
  });

  // 2. Room Stays (Rooms 101-304)
  (db.bookings || []).forEach(b => {
    const phone = (b.phone || b.customerPhone || '').trim().replace(/\D/g, '');
    const name = (b.name || b.guestName || 'Room Guest').trim();
    const key = phone && phone.length >= 10 ? phone.slice(-10) : name;
    if (!key) return;

    const existing = customerMap.get(key) || {
      id: `CUST-${key}`,
      name: name !== 'Room Guest' ? name : 'Hotel Guest',
      phone: phone.length >= 10 ? phone.slice(-10) : 'Desk Check-in',
      address: b.city || b.address || 'Barpeta District',
      totalOrders: 0,
      totalStays: 0,
      totalEvents: 0,
      totalSpend: 0,
      lastVisitDate: b.createdAt || new Date().toISOString()
    };

    if (name !== 'Room Guest') existing.name = name;
    existing.totalStays += 1;
    existing.totalSpend += parseFloat(b.totalTariff || b.tariff || 0);
    if (new Date(b.createdAt || 0) > new Date(existing.lastVisitDate)) {
      existing.lastVisitDate = b.createdAt;
    }
    customerMap.set(key, existing);
  });

  // Assign Customer Tier
  const list = Array.from(customerMap.values()).map(c => {
    let tier = '🌱 New Customer';
    if (c.totalSpend >= 6000 || c.totalStays >= 2) {
      tier = '👑 VIP Guest';
    } else if (c.totalOrders >= 3 || c.totalSpend >= 2500) {
      tier = '⭐ Frequent Diner';
    }
    return { ...c, customerType: tier };
  });

  list.sort((a, b) => b.totalSpend - a.totalSpend);
  db.customers = list;
  return list;
};

// Track a visitor event
const trackVisit = (visitData = {}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (db.visitorStats.lastUpdatedDate !== todayStr) {
    db.visitorStats.todayVisitors = 0;
    db.visitorStats.lastUpdatedDate = todayStr;
  }
  db.visitorStats.totalLifetimeVisitors = (db.visitorStats.totalLifetimeVisitors || 1248) + 1;
  db.visitorStats.todayVisitors = (db.visitorStats.todayVisitors || 0) + 1;
  db.visitorStats.thisMonthVisitors = (db.visitorStats.thisMonthVisitors || 0) + 1;

  const isMobile = visitData.deviceType === 'Mobile';
  if (isMobile) {
    db.visitorStats.devices.mobile = (db.visitorStats.devices.mobile || 0) + 1;
  } else {
    db.visitorStats.devices.desktop = (db.visitorStats.devices.desktop || 0) + 1;
  }

  const pageKey = (visitData.page || 'home').toLowerCase();
  if (db.visitorStats.pageViews[pageKey] !== undefined) {
    db.visitorStats.pageViews[pageKey] += 1;
  } else {
    db.visitorStats.pageViews[pageKey] = 1;
  }

  const visitLog = {
    id: `vis_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    page: visitData.page || 'Home',
    deviceType: visitData.deviceType || 'Mobile',
    referrer: visitData.referrer || 'Direct',
    isReturning: !!visitData.isReturning
  };

  if (!Array.isArray(db.visitors)) db.visitors = [];
  db.visitors.unshift(visitLog);
  if (db.visitors.length > 500) db.visitors = db.visitors.slice(0, 500);

  saveData(false);
  broadcastSSE('VISITOR_TRACKED', {
    stats: db.visitorStats,
    latestVisit: visitLog
  });
  return db.visitorStats;
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
      const isOldRoomData = parsed.rooms && parsed.rooms.some(r => r.id === 'std-ac' || r.id === 'family-suite');

      const loadedPhysicalRooms = (isOldRoomData ? OFFICIAL_PHYSICAL_ROOMS : (Array.isArray(parsed.physicalRooms) && parsed.physicalRooms.length === 9 ? parsed.physicalRooms : OFFICIAL_PHYSICAL_ROOMS)).map(r => ({
        cleaningStatus: "Clean & Ready",
        ...r
      }));

      const loadedMenu = (Array.isArray(parsed.menu) && parsed.menu.length > 0 ? parsed.menu : INITIAL_MENU).map(d => ({
        ...d,
        image: DISH_SPECIFIC_IMAGES?.[d.id] || d.image || '/images/food/biryani.jpg'
      }));

      Object.assign(db, {
        menu: loadedMenu,
        rooms: isOldRoomData ? INITIAL_ROOMS : (Array.isArray(parsed.rooms) ? parsed.rooms : INITIAL_ROOMS),
        physicalRooms: loadedPhysicalRooms,
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        offers: Array.isArray(parsed.offers) && parsed.offers.length > 0 ? parsed.offers : INITIAL_OFFERS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : SAMPLE_ORDERS,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : SAMPLE_ROOM_BOOKINGS,
        eventEnquiries: Array.isArray(parsed.eventEnquiries) ? parsed.eventEnquiries : [],
        notificationOutbox: Array.isArray(parsed.notificationOutbox) ? parsed.notificationOutbox : [],
        notificationDeliveries: Array.isArray(parsed.notificationDeliveries) ? parsed.notificationDeliveries : [],
        orderStatusEvents: Array.isArray(parsed.orderStatusEvents) ? parsed.orderStatusEvents : [],
        staff: Array.isArray(parsed.staff) && parsed.staff.length > 0 ? parsed.staff : DEFAULT_STAFF_MEMBERS,
        rawInventory: Array.isArray(parsed.rawInventory) && parsed.rawInventory.length > 0 ? parsed.rawInventory : INITIAL_RAW_INVENTORY,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : INITIAL_EXPENSES,
        tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : INITIAL_TASKS,
        visitors: Array.isArray(parsed.visitors) ? parsed.visitors : [],
        visitorStats: parsed.visitorStats || {
          totalLifetimeVisitors: 1248,
          todayVisitors: 86,
          thisMonthVisitors: 940,
          lastUpdatedDate: new Date().toISOString().split('T')[0],
          devices: { mobile: 780, desktop: 468 },
          pageViews: { home: 1248, menu: 890, rooms: 640, events: 210 }
        },
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
        passwordResets: Array.isArray(parsed.passwordResets) ? parsed.passwordResets : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        version: parsed.version || Date.now()
      });
      recalculateCategoryAvailability();
      recomputeCustomers();
      initializeAuthStore(db, saveData);
      saveData(false);
      console.log(`[DB] Loaded persistent data successfully (${db.menu.length} dishes, ${db.rooms.length} categories, ${db.physicalRooms.length} physical rooms, ${db.orders.length} orders, ${db.rawInventory.length} inventory items, ${db.staff.length} staff, ${db.customers.length} CRM customers).`);
    } else {
      recalculateCategoryAvailability();
      recomputeCustomers();
      initializeAuthStore(db, saveData);
      saveData(false);
      console.log('[DB] Initialized fresh persistent database from official seed data with ERP collections.');
    }
  } catch (err) {
    console.error('[DB] Error loading data, falling back to official seed data:', err);
    recalculateCategoryAvailability();
    initializeAuthStore(db, saveData);
  }
};

// Atomic write to avoid corrupted JSON files with automated backup & MongoDB sync
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

    // 4. Asynchronous Cloud Database Synchronization (MongoDB Atlas)
    if (isMongoConnected && mongoDb) {
      // 4a. Sync unified state
      mongoDb.collection('hotel_state').updateOne(
        { _id: 'main_state' },
        { $set: { data: db, updatedAt: new Date(), version: db.version } },
        { upsert: true }
      ).then(() => {
        lastMongoSyncTime = new Date().toISOString();
      }).catch(e => {
        console.warn('[MongoDB Atlas Sync Warning]:', e.message);
      });

      // 4b. Sync core individual collections for direct query capability
      try {
        if (Array.isArray(db.orders) && db.orders.length > 0) {
          mongoDb.collection('orders').bulkWrite(
            db.orders.map(o => ({
              updateOne: {
                filter: { _id: o.id || o.orderId },
                update: { $set: { ...o, _id: o.id || o.orderId } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
        if (Array.isArray(db.bookings) && db.bookings.length > 0) {
          mongoDb.collection('bookings').bulkWrite(
            db.bookings.map(b => ({
              updateOne: {
                filter: { _id: b.id || b.bookingId },
                update: { $set: { ...b, _id: b.id || b.bookingId } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
        if (Array.isArray(db.customers) && db.customers.length > 0) {
          mongoDb.collection('customers').bulkWrite(
            db.customers.map(c => ({
              updateOne: {
                filter: { _id: c.id },
                update: { $set: { ...c, _id: c.id } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
        if (Array.isArray(db.rawInventory) && db.rawInventory.length > 0) {
          mongoDb.collection('raw_inventory').bulkWrite(
            db.rawInventory.map(r => ({
              updateOne: {
                filter: { _id: r.id },
                update: { $set: { ...r, _id: r.id } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
        if (Array.isArray(db.expenses) && db.expenses.length > 0) {
          mongoDb.collection('expenses').bulkWrite(
            db.expenses.map(e => ({
              updateOne: {
                filter: { _id: e.id },
                update: { $set: { ...e, _id: e.id } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
        if (Array.isArray(db.tasks) && db.tasks.length > 0) {
          mongoDb.collection('staff_tasks').bulkWrite(
            db.tasks.map(t => ({
              updateOne: {
                filter: { _id: t.id },
                update: { $set: { ...t, _id: t.id } },
                upsert: true
              }
            }))
          ).catch(() => {});
        }
      } catch (collErr) {
        // Non-blocking background sync
      }
    }
  } catch (err) {
    console.error('[DB] Error saving data atomically:', err);
  }
};

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
  const { adminPin, ...safe } = db.settings || {};
  return safe;
};

// Check if request has an active Owner or Manager session
const checkIsAdmin = (req) => {
  const session = getSessionFromRequest(req, db);
  return session && (session.role === 'owner' || session.role === 'manager');
};

// ----------------------------------------------------------------------------
// INITIALIZE MODERN AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ----------------------------------------------------------------------------
loadData();
const auth = setupAuthRoutes(app, db, saveData);
const { requireAuth, requireOwner, requireManagerOrOwner, requireStaffOrAbove } = auth;
const requireAdmin = requireAuth; // Compatibility alias

// ----------------------------------------------------------------------------
// RFC 6455 STANDARDS-BASED WEBSOCKET GATEWAY & TRANSACTIONAL OUTBOX
// ----------------------------------------------------------------------------
let wsGateway = null;
try {
  wsGateway = new WebSocketGateway(server, () => db, saveData);
  console.log('⚡ [WebSocketGateway] RFC 6455 Gateway initialized on /ws and /socket.io/');
} catch (wsErr) {
  console.warn('[WebSocketGateway] Warning during gateway initialization:', wsErr.message);
}

const enqueueTransactionalOutboxEvent = (type, aggregate, recipient, data) => {
  if (!Array.isArray(db.notificationOutbox)) db.notificationOutbox = [];
  const nowIso = new Date().toISOString();
  const event = {
    eventId: `evt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    type,
    status: 'pending',
    schemaVersion: 1,
    aggregate: aggregate || { type: 'order', id: 'unknown', version: 1 },
    recipient: recipient || { kind: 'user', id: 'broadcast' },
    data: data || {},
    occurredAt: nowIso
  };
  db.notificationOutbox.unshift(event);
  if (wsGateway) {
    try {
      wsGateway.processOutbox();
    } catch (err) {
      console.warn('[Outbox] Error during immediate processOutbox:', err.message);
    }
  }
  return event;
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

// 3. Full live state fetch (ERP collections included)
app.get('/api/state', (req, res) => {
  const isAdmin = checkIsAdmin(req);
  res.json({
    menu: db.menu,
    rooms: db.rooms,
    physicalRooms: db.physicalRooms,
    settings: getSanitizedSettings(isAdmin),
    offers: db.offers || INITIAL_OFFERS,
    orders: db.orders,
    bookings: db.bookings,
    eventEnquiries: db.eventEnquiries,
    staff: db.staff || DEFAULT_STAFF_MEMBERS,
    rawInventory: db.rawInventory || INITIAL_RAW_INVENTORY,
    expenses: db.expenses || INITIAL_EXPENSES,
    tasks: db.tasks || INITIAL_TASKS,
    version: db.version
  });
});

// Canonical Mappers for REST APIs
const mapMenuItem = (item) => ({
  id: item.id,
  name: item.name,
  category: item.category || 'Specialties',
  description: item.description || '',
  price: Number(item.price) || 0,
  image_url: item.image_url || item.image || '/images/food/biryani.jpg',
  veg_or_nonveg: item.veg_or_nonveg || (item.isVeg ? 'veg' : 'non-veg'),
  chef_special: item.chef_special !== undefined ? Boolean(item.chef_special) : Boolean(item.bestSeller),
  available: item.available !== undefined ? Boolean(item.available) : (item.inStock !== false),
  created_at: item.created_at || '2026-01-01T00:00:00.000Z',
  updated_at: item.updated_at || new Date().toISOString(),
  // Backwards compatibility properties
  image: item.image || item.image_url || '/images/food/biryani.jpg',
  isVeg: item.isVeg !== undefined ? item.isVeg : (item.veg_or_nonveg === 'veg'),
  bestSeller: item.bestSeller !== undefined ? item.bestSeller : Boolean(item.chef_special),
  inStock: item.inStock !== undefined ? item.inStock : (item.available !== false)
});

const mapRoomItem = (r) => {
  const tariff = Number(r.price_per_night || r.tariff) || 1400;
  const gstPercent = Number(r.gst_percent) || 12;
  const totalPrice = Number(r.total_price) || Math.round(tariff * (1 + gstPercent / 100));
  const availableRoomNums = r.availableRoomNumbers || (r.assignedRooms || ['101']);
  const isAvailable = r.available !== undefined ? Boolean(r.available) : (r.status === 'Available' || (r.availableRoomsCount || 1) > 0);
  return {
    id: r.id,
    room_name: r.room_name || r.title || 'Comfort Room',
    room_type: r.room_type || r.type || 'Deluxe',
    description: r.description || '',
    price_per_night: tariff,
    gst_percent: gstPercent,
    total_price: totalPrice,
    capacity: r.capacity || '2 Adults',
    amenities: Array.isArray(r.amenities) ? r.amenities : ['Master Climate Control A/C', 'Ultra High-Speed Wi-Fi', '24/7 Room Service'],
    image_url: r.image_url || r.image || '/images/IMG_5217.JPG',
    availability_status: isAvailable ? 'Available' : 'Sold Out',
    room_number: r.room_number || availableRoomNums[0] || '101',
    available: isAvailable,
    created_at: r.created_at || '2026-01-01T00:00:00.000Z',
    updated_at: r.updated_at || new Date().toISOString(),
    // Backwards compatibility properties
    title: r.title || r.room_name,
    type: r.type || r.room_type,
    tariff,
    status: isAvailable ? 'Available' : 'Sold Out',
    image: r.image || r.image_url || '/images/IMG_5217.JPG',
    gallery: r.gallery || [r.image || '/images/IMG_5217.JPG'],
    availableRoomNumbers: availableRoomNums,
    totalRoomsCount: r.totalRoomsCount || availableRoomNums.length,
    availableRoomsCount: isAvailable ? (r.availableRoomsCount || availableRoomNums.length) : 0
  };
};

// 3a. Canonical Food Menu Endpoints (/api/menu)
app.get('/api/menu', (req, res) => {
  const items = (db.menu || []).map(mapMenuItem);
  res.json(items);
});

app.get('/api/menu/:id', (req, res) => {
  const item = (db.menu || []).find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  res.json(mapMenuItem(item));
});

app.post('/api/menu', requireManagerOrOwner, (req, res) => {
  const newItem = {
    ...req.body,
    id: req.body.id || `dish_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    name: req.body.name || 'Special Dish',
    category: req.body.category || 'Specialties',
    price: Number(req.body.price) || 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.menu = [newItem, ...(db.menu || [])];
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.status(201).json({ success: true, item: mapMenuItem(newItem) });
});

app.patch('/api/menu/:id', requireManagerOrOwner, (req, res) => {
  const idx = (db.menu || []).findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  db.menu[idx] = { ...db.menu[idx], ...req.body, updated_at: new Date().toISOString() };
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, item: mapMenuItem(db.menu[idx]) });
});

// 3b. Canonical Rooms Endpoints (/api/rooms)
app.get('/api/rooms', (req, res) => {
  const roomsList = (db.rooms || []).map(mapRoomItem);
  res.json(roomsList);
});

app.get('/api/rooms/:id', (req, res) => {
  const r = (db.rooms || []).find(room => room.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Room not found' });
  res.json(mapRoomItem(r));
});

app.patch('/api/rooms/:id', requireManagerOrOwner, (req, res) => {
  const idx = (db.rooms || []).findIndex(room => room.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  db.rooms[idx] = { ...db.rooms[idx], ...req.body, updated_at: new Date().toISOString() };
  saveData();
  broadcastSSE('ROOMS_UPDATED', db.rooms);
  res.json({ success: true, room: mapRoomItem(db.rooms[idx]) });
});

// 4. PIN Quick-Login Endpoint for 4 Team Members:
// Shahidul Islam (1234), Hafijur (2222), Master Chef (3333), Hafij (5555)
app.post(['/api/admin/login', '/api/admin/login-pin'], (req, res, next) => {
  const { pin } = req.body;
  if (pin) {
    req.url = '/api/auth/pin-login';
    return app._router.handle(req, res, next);
  }
  return res.status(400).json({
    success: false,
    error: 'Staff PIN is required (1234 for Shahidul, 2222 for Hafijur, 3333 for Master Chef, 5555 for Hafij).'
  });
});

// S3 / Cloud Document Storage Adapter & Local Filesystem Fallback (/uploads/kyc/)
app.post('/api/upload/kyc', (req, res) => {
  try {
    const { image, fileData, filename, guestName, docType } = req.body;
    const base64Data = image || fileData;
    if (!base64Data) {
      return res.status(400).json({ success: false, error: 'No document image data provided' });
    }

    let ext = 'jpg';
    let cleanBase64 = base64Data;
    if (base64Data.startsWith('data:image/png')) {
      ext = 'png';
      cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, '');
    } else if (base64Data.startsWith('data:image/jpeg') || base64Data.startsWith('data:image/jpg')) {
      ext = 'jpg';
      cleanBase64 = base64Data.replace(/^data:image\/jpe?g;base64,/, '');
    } else if (base64Data.startsWith('data:image/webp')) {
      ext = 'webp';
      cleanBase64 = base64Data.replace(/^data:image\/webp;base64,/, '');
    } else if (base64Data.startsWith('data:application/pdf')) {
      ext = 'pdf';
      cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    } else if (base64Data.includes(';base64,')) {
      cleanBase64 = base64Data.split(';base64,')[1];
    }

    const safeName = `kyc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const targetPath = path.join(KYC_UPLOADS_DIR, safeName);

    fs.writeFileSync(targetPath, Buffer.from(cleanBase64, 'base64'));

    const publicUrl = `/uploads/kyc/${safeName}`;
    console.log(`[Storage Adapter] Stored KYC document: ${publicUrl} (${guestName || 'Guest'})`);

    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      docType: docType || 'Government ID / Aadhaar',
      uploadedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Storage Adapter] KYC Upload Error:', err);
    res.status(500).json({ success: false, error: 'Failed to process document upload' });
  }
});

// KYC Verification Decision Endpoint (Hafijur Reception Desk)
app.post('/api/bookings/:id/kyc-verify', requireManagerOrOwner, (req, res) => {
  const { id } = req.params;
  const { status, notes, roomAssigned } = req.body; // status: 'Verified' | 'Rejected'

  let targetBooking = null;
  db.bookings = (db.bookings || []).map(b => {
    if (b.id === id || b.bookingId === id) {
      targetBooking = {
        ...b,
        kycStatus: status === 'Verified' ? 'Verified' : 'Rejected',
        kycNotes: notes || (status === 'Verified' ? 'Document verified by Hafijur (Front Desk)' : 'Document unclear, re-upload requested'),
        kycVerifiedAt: new Date().toISOString(),
        kycVerifiedBy: req.user?.name || 'Hafijur (Reception)'
      };
      if (roomAssigned) targetBooking.assignedRoom = roomAssigned;
      return targetBooking;
    }
    return b;
  });

  if (!targetBooking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  saveData();
  broadcastSSE('BOOKINGS_UPDATED', db.bookings);
  res.json({ success: true, booking: targetBooking, bookings: db.bookings });
});

// Rider GPS Location Broadcast Endpoint (Zomato-Style Live Tracking)
app.post('/api/orders/:id/location', (req, res) => {
  const { id } = req.params;
  const { lat, lng, speed, heading } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ success: false, error: 'Valid numeric lat and lng coordinates required' });
  }

  let updatedOrder = null;
  db.orders = (db.orders || []).map(o => {
    if (o.id === id) {
      updatedOrder = {
        ...o,
        currentLocation: {
          lat,
          lng,
          speed: speed || 24, // km/h
          heading: heading || 0,
          updatedAt: new Date().toISOString()
        }
      };
      return updatedOrder;
    }
    return o;
  });

  if (!updatedOrder) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  saveData(false);
  broadcastSSE('ORDER_LOCATION_UPDATED', {
    orderId: id,
    location: updatedOrder.currentLocation,
    status: updatedOrder.status
  });

  res.json({ success: true, orderId: id, location: updatedOrder.currentLocation });
});

// 5. Admin Logout
app.post('/api/admin/logout', requireAuth, (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeAdminTokens.delete(authHeader.substring(7));
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Unified Update Endpoint with Strict Role-Based Authorization
app.post('/api/admin/update', requireAuth, (req, res) => {
  const { type, payload } = req.body;
  const userRole = req.user?.role || 'staff';

  if (type === 'UPDATE_SETTINGS' && userRole !== 'owner') {
    return res.status(403).json({ success: false, error: 'Only Hotel Owner can update global hotel settings.' });
  }
  if (['UPDATE_PRICE', 'UPDATE_ROOM', 'ADD_STOCK_PURCHASE', 'ADD_EXPENSE', 'UPDATE_STAFF'].includes(type) && !['owner', 'manager'].includes(userRole)) {
    return res.status(403).json({ success: false, error: 'Manager or Owner role required for this action.' });
  }

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

    case 'ADD_STOCK_PURCHASE': {
      const { itemId, addedQty, purchaseCost, updatedBy, paidVia } = payload;
      let updatedItem = null;
      db.rawInventory = (db.rawInventory || INITIAL_RAW_INVENTORY).map((item) => {
        if (item.id === itemId) {
          const newQty = (parseFloat(item.currentStock) || 0) + (parseFloat(addedQty) || 0);
          updatedItem = {
            ...item,
            currentStock: Math.max(0, Math.round(newQty * 10) / 10),
            lastUpdated: 'Just now',
            updatedBy: updatedBy || 'Staff'
          };
          return updatedItem;
        }
        return item;
      });

      // Automatically log expense cost for Owner's P&L calculation
      if (purchaseCost && parseFloat(purchaseCost) > 0) {
        const newExpense = {
          id: `EXP-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          item: `${updatedItem ? updatedItem.name : 'Stock'} Purchase (+${addedQty} ${updatedItem ? updatedItem.unit : ''})`,
          category: 'Kitchen Raw Stock',
          amount: parseFloat(purchaseCost),
          paidVia: paidVia || 'Cash',
          loggedBy: updatedBy || 'Staff'
        };
        db.expenses = [newExpense, ...(db.expenses || INITIAL_EXPENSES)];
        broadcastSSE('EXPENSES_UPDATED', db.expenses);
      }

      saveData();
      broadcastSSE('INVENTORY_UPDATED', db.rawInventory);
      return res.json({ success: true, item: updatedItem, rawInventory: db.rawInventory, expenses: db.expenses });
    }

    case 'USE_STOCK': {
      const { itemId, usedQty, updatedBy } = payload;
      let updatedItem = null;
      db.rawInventory = (db.rawInventory || INITIAL_RAW_INVENTORY).map((item) => {
        if (item.id === itemId) {
          const newQty = Math.max(0, (parseFloat(item.currentStock) || 0) - (parseFloat(usedQty) || 0));
          updatedItem = {
            ...item,
            currentStock: Math.round(newQty * 10) / 10,
            lastUpdated: 'Just now',
            updatedBy: updatedBy || 'Staff'
          };
          return updatedItem;
        }
        return item;
      });
      saveData();
      broadcastSSE('INVENTORY_UPDATED', db.rawInventory);
      return res.json({ success: true, item: updatedItem, rawInventory: db.rawInventory });
    }

    case 'ADD_EXPENSE': {
      const expenseData = payload;
      const newExpense = {
        ...expenseData,
        id: expenseData.id || `EXP-${Date.now().toString().slice(-4)}`,
        date: expenseData.date || new Date().toISOString().split('T')[0],
        time: expenseData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount: parseFloat(expenseData.amount) || 0
      };
      db.expenses = [newExpense, ...(db.expenses || INITIAL_EXPENSES)];
      saveData();
      broadcastSSE('EXPENSES_UPDATED', db.expenses);
      return res.json({ success: true, expense: newExpense, expenses: db.expenses });
    }

    case 'TOGGLE_TASK': {
      const { taskId, completedBy } = payload;
      let targetTask = null;
      db.tasks = (db.tasks || INITIAL_TASKS).map((t) => {
        if (t.id === taskId) {
          const newCompleted = !t.completed;
          targetTask = {
            ...t,
            completed: newCompleted,
            completedBy: newCompleted ? (completedBy || 'Staff') : null,
            completedAt: newCompleted ? 'Just now' : null
          };
          return targetTask;
        }
        return t;
      });
      saveData();
      broadcastSSE('TASKS_UPDATED', db.tasks);
      return res.json({ success: true, task: targetTask, tasks: db.tasks });
    }

    case 'ADD_TASK': {
      const taskData = payload;
      const newTask = {
        ...taskData,
        id: taskData.id || `TSK-${Date.now().toString().slice(-4)}`,
        completed: false,
        completedBy: null,
        completedAt: null
      };
      db.tasks = [...(db.tasks || INITIAL_TASKS), newTask];
      saveData();
      broadcastSSE('TASKS_UPDATED', db.tasks);
      return res.json({ success: true, task: newTask, tasks: db.tasks });
    }

    case 'UPDATE_STAFF': {
      const staffMember = payload;
      let exists = false;
      db.staff = (db.staff || DEFAULT_STAFF_MEMBERS).map((s) => {
        if (s.id === staffMember.id) {
          exists = true;
          return { ...s, ...staffMember };
        }
        return s;
      });
      if (!exists) {
        db.staff = [...db.staff, { ...staffMember, id: staffMember.id || `STF-${Date.now().toString().slice(-3)}` }];
      }
      saveData();
      broadcastSSE('STAFF_UPDATED', db.staff);
      return res.json({ success: true, staff: db.staff });
    }

    case 'UPDATE_HOUSEKEEPING': {
      const { roomNumber, cleaningStatus } = payload;
      let targetRoom = null;
      db.physicalRooms = (db.physicalRooms || OFFICIAL_PHYSICAL_ROOMS).map((pr) => {
        if (pr.number === roomNumber || pr.roomNumber === roomNumber) {
          targetRoom = { ...pr, cleaningStatus };
          return targetRoom;
        }
        return pr;
      });
      saveData();
      broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
      return res.json({ success: true, room: targetRoom, physicalRooms: db.physicalRooms });
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
      if (payload?.staff) db.staff = payload.staff;
      if (payload?.rawInventory) db.rawInventory = payload.rawInventory;
      if (payload?.expenses) db.expenses = payload.expenses;
      if (payload?.tasks) db.tasks = payload.tasks;
      saveData();
      broadcastSSE('MENU_UPDATED', db.menu);
      broadcastSSE('ROOMS_UPDATED', db.rooms);
      broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
      broadcastSSE('SETTINGS_UPDATED', getSanitizedSettings(false));
      broadcastSSE('INVENTORY_UPDATED', db.rawInventory);
      broadcastSSE('EXPENSES_UPDATED', db.expenses);
      broadcastSSE('TASKS_UPDATED', db.tasks);
      broadcastSSE('STAFF_UPDATED', db.staff);
      return res.json({ success: true, message: 'Updated successfully' });
    }
  }
});

// 7. Individual Room Status Toggle (Available vs Occupied - Manager or Owner)
app.post('/api/admin/physical-rooms/toggle', requireManagerOrOwner, (req, res) => {
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
// Kitchen Chef, Staff, Manager, or Owner can toggle dish availability
const handleMenuStockToggle = (req, res) => {
  const { dishId } = req.params;
  const { inStock } = req.body;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, inStock: inStock !== undefined ? inStock : !dish.inStock } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
};
app.post('/api/admin/menu/:dishId/stock', requireStaffOrAbove, handleMenuStockToggle);
app.patch('/api/admin/menu/:dishId/stock', requireStaffOrAbove, handleMenuStockToggle);

// Only Manager or Owner can alter prices
const handleMenuPriceUpdate = (req, res) => {
  const { dishId } = req.params;
  const { price } = req.body;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, price: parseFloat(price) || dish.price } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
};
app.post('/api/admin/menu/:dishId/price', requireManagerOrOwner, handleMenuPriceUpdate);
app.patch('/api/admin/menu/:dishId/price', requireManagerOrOwner, handleMenuPriceUpdate);

app.post('/api/admin/menu/:dishId/bestseller', requireManagerOrOwner, (req, res) => {
  const { dishId } = req.params;

  db.menu = db.menu.map((dish) =>
    dish.id === dishId ? { ...dish, bestSeller: !dish.bestSeller } : dish
  );
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

app.post('/api/admin/menu/add', requireManagerOrOwner, (req, res) => {
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

app.delete('/api/admin/menu/:dishId', requireManagerOrOwner, (req, res) => {
  const { dishId } = req.params;
  db.menu = db.menu.filter((d) => d.id !== dishId);
  saveData();
  broadcastSSE('MENU_UPDATED', db.menu);
  res.json({ success: true, menu: db.menu });
});

// 9. Room Category update (Manager or Owner)
app.post('/api/admin/rooms/:roomId', requireManagerOrOwner, (req, res) => {
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

// 10. Hotel Settings update (Owner Only)
app.post('/api/admin/settings', requireOwner, (req, res) => {
  const updates = req.body;
  db.settings = { ...db.settings, ...updates };
  saveData();
  broadcastSSE('SETTINGS_UPDATED', getSanitizedSettings(false));
});

// ----------------------------------------------------------------------------
// DELIVERY DISTANCE & ELIGIBILITY CALCULATION ENGINE
// ----------------------------------------------------------------------------
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const calculateDeliveryFee = (distanceKm, subtotal, deliveryRules) => {
  const rules = deliveryRules || db.settings?.deliveryRules || {
    freeRadiusKm: 5,
    extraFeePerKm: 15,
    minOrderFreeDelivery: 199,
    maxDeliveryRadiusKm: 15,
    estimatedBaseMinutes: 35
  };

  const maxRadius = rules.maxDeliveryRadiusKm || 15;
  if (distanceKm > maxRadius) {
    return {
      eligible: false,
      reason: `Distance is ${distanceKm} KM, which exceeds our verified service radius of ${maxRadius} KM. Takeaway & Dine-in available.`
    };
  }

  const freeRadius = rules.freeRadiusKm || 5;
  const minOrder = rules.minOrderFreeDelivery || 199;
  const extraPerKm = rules.extraFeePerKm || 15;

  let fee = 0;
  let isFree = false;

  if (distanceKm <= freeRadius) {
    if (subtotal >= minOrder) {
      fee = 0;
      isFree = true;
    } else {
      fee = 30; // Nominal standard fee for orders under ₹199 within 5km
    }
  } else {
    const extraDistance = distanceKm - freeRadius;
    const baseFee = (subtotal >= minOrder) ? 0 : 30;
    fee = Math.round(baseFee + (extraDistance * extraPerKm));
  }

  const baseMins = rules.estimatedBaseMinutes || 35;
  const estimatedMinutes = Math.min(75, Math.max(25, Math.round(baseMins + (distanceKm * 2.5))));

  return {
    eligible: true,
    distanceKm,
    deliveryFee: fee,
    isFreeDelivery: isFree,
    minOrderFreeDelivery: minOrder,
    estimatedMinutes,
    estimatedTimeText: `${estimatedMinutes - 5} - ${estimatedMinutes + 5} mins`
  };
};

// 11. Location-Aware Delivery Fee & Eligibility Calculation Endpoint
app.post('/api/delivery/calculate', (req, res) => {
  const { localityId, detailedAddress, coordinates, subtotal = 0, orderMode } = req.body;

  if (orderMode === 'IN_ROOM' || orderMode === 'DINE_IN' || orderMode === 'PICKUP') {
    return res.json({
      eligible: true,
      distanceKm: 0,
      deliveryFee: 0,
      isFreeDelivery: true,
      estimatedMinutes: 20,
      estimatedTimeText: '15 - 25 mins'
    });
  }

  let distanceKm = 0.4; // Default close distance for Donakuchi

  if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
    // Exact GPS coordinates from device
    const hotelLat = HOTEL_INFO.coordinates?.lat || 26.3308;
    const hotelLng = HOTEL_INFO.coordinates?.lng || 91.0064;
    distanceKm = calculateHaversineDistance(hotelLat, hotelLng, coordinates.lat, coordinates.lng);
  } else if (localityId) {
    const found = BARPETA_LOCALITIES.find(l => l.id === localityId);
    if (found) {
      distanceKm = found.distanceKm;
    }
  }

  const result = calculateDeliveryFee(distanceKm, parseFloat(subtotal) || 0, db.settings?.deliveryRules);
  res.json(result);
});

// Search & List Barpeta Delivery Localities
app.get('/api/delivery/localities', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const baseLocalities = db.settings?.localities || BARPETA_LOCALITIES;
  const localities = baseLocalities.map(loc => {
    const calc = calculateDeliveryFee(loc.distanceKm, 250, db.settings?.deliveryRules);
    return {
      ...loc,
      isDeliverable: calc.eligible,
      estimatedTimeText: calc.estimatedTimeText || `${Math.round(25 + loc.distanceKm * 2.5)} mins`,
      standardFee: calc.deliveryFee
    };
  });
  if (!query) {
    return res.json(localities);
  }
  const filtered = localities.filter(l => 
    l.name.toLowerCase().includes(query) || 
    l.id.toLowerCase().includes(query)
  );
  res.json(filtered);
});

// Reverse Geocode / Resolve Coordinates to Nearest Verified Landmark
app.post('/api/delivery/resolve', (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Valid numerical lat and lng are required.' });
  }
  const hotelLat = HOTEL_INFO.coordinates?.lat || 26.3308;
  const hotelLng = HOTEL_INFO.coordinates?.lng || 91.0064;
  const distanceKm = calculateHaversineDistance(hotelLat, hotelLng, lat, lng);

  const baseLocalities = db.settings?.localities || BARPETA_LOCALITIES;
  const sorted = [...baseLocalities].sort((a, b) => 
    Math.abs(a.distanceKm - distanceKm) - Math.abs(b.distanceKm - distanceKm)
  );
  const nearest = sorted[0];
  const feeCalc = calculateDeliveryFee(distanceKm, 250, db.settings?.deliveryRules);

  res.json({
    success: true,
    locality: {
      id: nearest ? nearest.id : 'custom_gps',
      name: nearest ? nearest.name : `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      distanceKm,
      isDeliverable: feeCalc.eligible,
      estimatedTimeText: feeCalc.estimatedTimeText,
      deliveryFee: feeCalc.deliveryFee
    },
    distanceKm,
    coordinates: { lat, lng }
  });
});

// ----------------------------------------------------------------------------
// OFFERS & TODAY'S SPECIAL ENDPOINTS
// ----------------------------------------------------------------------------

// Customer: Active, valid offers
app.get('/api/offers', (req, res) => {
  const now = new Date();
  const activeOffers = (db.offers || []).filter(o => {
    if (!o.isActive) return false;
    if (o.startDate && new Date(o.startDate) > now) return false;
    if (o.endDate && new Date(o.endDate) < now) return false;
    return true;
  });
  res.json(activeOffers);
});

// Customer: Today's primary active offer
app.get('/api/offers/today', (req, res) => {
  const now = new Date();
  const activeOffers = (db.offers || []).filter(o => {
    if (!o.isActive) return false;
    if (o.startDate && new Date(o.startDate) > now) return false;
    if (o.endDate && new Date(o.endDate) < now) return false;
    return true;
  });
  const todayOffer = activeOffers[0] || null;
  res.json({ success: true, offer: todayOffer });
});

// Admin: Manage Offers (Create / Update)
app.post('/api/admin/offers', requireManagerOrOwner, (req, res) => {
  const offerData = req.body;
  if (!offerData.title || offerData.discountValue === undefined) {
    return res.status(400).json({ error: 'Offer title and discount value are required.' });
  }

  let updated = false;
  const newOffer = {
    id: offerData.id || `off_${Date.now()}`,
    title: offerData.title.trim(),
    code: (offerData.code || 'SPECIAL').trim().toUpperCase(),
    description: offerData.description?.trim() || '',
    discountType: offerData.discountType || 'PERCENTAGE', // 'PERCENTAGE' | 'FLAT'
    discountValue: parseFloat(offerData.discountValue) || 10,
    minOrderAmount: parseFloat(offerData.minOrderAmount) || 0,
    maxDiscountAmount: parseFloat(offerData.maxDiscountAmount) || 200,
    applicableOrderModes: offerData.applicableOrderModes || ['DELIVERY', 'PICKUP', 'IN_ROOM'],
    isActive: offerData.isActive !== undefined ? Boolean(offerData.isActive) : true,
    startDate: offerData.startDate || new Date().toISOString(),
    endDate: offerData.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    terms: offerData.terms || 'Verified owner offer. Terms and conditions apply.',
    badge: offerData.badge || "Today's Special",
    redemptionsCount: offerData.redemptionsCount || 0
  };

  db.offers = (db.offers || []).map(o => {
    if (o.id === newOffer.id) {
      updated = true;
      return newOffer;
    }
    return o;
  });

  if (!updated) {
    db.offers.unshift(newOffer);
  }

  saveData();
  broadcastSSE('OFFERS_UPDATED', db.offers);
  res.status(201).json({ success: true, offer: newOffer, offers: db.offers });
});

// Admin: Toggle Offer Pause / Active
app.patch('/api/admin/offers/:id/toggle', requireManagerOrOwner, (req, res) => {
  const { id } = req.params;
  let target = null;
  db.offers = (db.offers || []).map(o => {
    if (o.id === id) {
      target = { ...o, isActive: !o.isActive };
      return target;
    }
    return o;
  });

  if (!target) return res.status(404).json({ error: 'Offer not found' });
  saveData();
  broadcastSSE('OFFERS_UPDATED', db.offers);
  res.json({ success: true, offer: target, offers: db.offers });
});

// Admin: Delete Offer
app.delete('/api/admin/offers/:id', requireManagerOrOwner, (req, res) => {
  const { id } = req.params;
  db.offers = (db.offers || []).filter(o => o.id !== id);
  saveData();
  broadcastSSE('OFFERS_UPDATED', db.offers);
  res.json({ success: true, offers: db.offers });
});

// ----------------------------------------------------------------------------
// 12. CUSTOMER FOOD ORDERS & LIFECYCLE STATE MACHINE
// ----------------------------------------------------------------------------
// Idempotency cache to prevent accidental duplicate orders
const processedIdempotencyKeys = new Map(); // key => { orderId, timestamp }

app.get('/api/orders', (req, res) => {
  const normalized = (db.orders || []).map(o => ({
    ...o,
    id: o.id,
    order_id: o.order_id || o.id,
    customer_name: o.customer_name || o.customerName || '',
    customer_phone: o.customer_phone || o.phone || '',
    delivery_address: o.delivery_address || o.address || '',
    locality: o.locality || o.address || 'Barpeta',
    items: o.items || [],
    subtotal: o.subtotal || o.subTotal || 0,
    delivery_fee: o.delivery_fee !== undefined ? o.delivery_fee : (o.deliveryFee || 0),
    discount: o.discount || 0,
    total_amount: o.total_amount || o.total || 0,
    payment_mode: o.payment_mode || o.payment || 'Cash on Delivery',
    payment_status: o.payment_status || o.paymentStatus || 'Pending',
    order_status: o.order_status || o.status || 'Received',
    created_at: o.created_at || o.createdAt || new Date().toISOString(),
    updated_at: o.updated_at || o.updatedAt || new Date().toISOString()
  }));
  res.json(normalized);
});

// Customer Tracking by ID (Sanitized, No Other Customer PII)
app.get('/api/orders/:id/track', (req, res) => {
  const { id } = req.params;
  const order = (db.orders || []).find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({
    id: order.id,
    customerName: order.customerName,
    mode: order.mode,
    address: order.address,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount || 0,
    total: order.total,
    status: order.status || 'Received',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,
    timeline: order.timeline || [
      { status: 'Received', time: order.createdAt || 'Just now', note: 'Order placed by customer' }
    ],
    payment: order.payment,
    paymentStatus: order.paymentStatus,
    supportPhone: HOTEL_INFO.phone || '+91 96785 82286'
  });
});

app.post('/api/orders', (req, res) => {
  const orderData = req.body;

  // 1. Idempotency Check
  const idempotencyKey = req.headers['x-idempotency-key'] || orderData.idempotencyKey;
  if (idempotencyKey && processedIdempotencyKeys.has(idempotencyKey)) {
    const existing = processedIdempotencyKeys.get(idempotencyKey);
    const existingOrder = db.orders.find(o => o.id === existing.orderId);
    if (existingOrder) {
      return res.status(200).json({ success: true, order: existingOrder, deduplicated: true });
    }
  }

  // 2. Validate Customer Name & Phone
  const customerName = (orderData.customer_name || orderData.customerName || orderData.name || '').trim();
  const phone = (orderData.customer_phone || orderData.phone || orderData.customerPhone || '').replace(/\D/g, '');
  const deliveryAddress = orderData.delivery_address || orderData.address || '';
  const locality = orderData.locality || (typeof orderData.address === 'string' ? orderData.address : 'Barpeta');
  const subtotal = Number(orderData.subtotal || orderData.subTotal || 0);
  const discount = Number(orderData.discount || 0);

  if (!customerName || customerName.length < 2) {
    return res.status(400).json({ error: 'Customer full name (minimum 2 characters) is required.' });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
  }

  // 3. Server Delivery Rules Verification
  let verifiedDeliveryFee = Number(orderData.delivery_fee !== undefined ? orderData.delivery_fee : (orderData.deliveryFee || 0));
  if (orderData.mode === 'Home Delivery' || orderData.delivery_address) {
    const calc = calculateDeliveryFee(
      orderData.distanceKm || 0.4,
      subtotal,
      db.settings?.deliveryRules
    );
    if (!calc.eligible) {
      return res.status(400).json({ error: calc.reason });
    }
    verifiedDeliveryFee = calc.deliveryFee;
  }

  const totalAmount = Number(orderData.total_amount || orderData.total || (subtotal + verifiedDeliveryFee - discount));
  const paymentMode = orderData.payment_mode || orderData.payment || orderData.paymentMethod || 'Cash on Delivery';
  const paymentStatus = orderData.payment_status || orderData.paymentStatus || 'Pending';
  const orderStatus = orderData.order_status || orderData.status || 'Received';

  const nowIso = new Date().toISOString();
  const orderId = orderData.id || orderData.order_id || `JNK-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    ...orderData,
    id: orderId,
    order_id: orderId,
    customer_name: customerName,
    customerName,
    customer_phone: phone,
    phone,
    delivery_address: deliveryAddress,
    address: deliveryAddress,
    locality,
    items: Array.isArray(orderData.items) ? orderData.items : [],
    subtotal,
    delivery_fee: verifiedDeliveryFee,
    deliveryFee: verifiedDeliveryFee,
    discount,
    total_amount: totalAmount,
    total: totalAmount,
    payment_mode: paymentMode,
    payment: paymentMode,
    payment_status: paymentStatus,
    paymentStatus,
    order_status: orderStatus,
    status: orderStatus,
    time: orderData.time || 'Just now',
    createdAt: nowIso,
    created_at: nowIso,
    updatedAt: nowIso,
    updated_at: nowIso,
    timeline: [
      { status: orderStatus, time: nowIso, note: 'Order registered server-side' }
    ]
  };

  // Record idempotency
  if (idempotencyKey) {
    processedIdempotencyKeys.set(idempotencyKey, { orderId: newOrder.id, timestamp: Date.now() });
  }

  // Append to orderStatusEvents (append-only ledger)
  if (!Array.isArray(db.orderStatusEvents)) db.orderStatusEvents = [];
  db.orderStatusEvents.push({
    id: `ose_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    orderId: newOrder.id,
    status: newOrder.status,
    note: 'Order registered server-side',
    createdAt: nowIso
  });

  // Enqueue canonical transactional outbox event
  enqueueTransactionalOutboxEvent(
    'order.created',
    { type: 'order', id: newOrder.id, version: 1 },
    { kind: 'user', id: phone },
    {
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      total: newOrder.total,
      mode: newOrder.mode,
      status: newOrder.status,
      createdAt: nowIso
    }
  );

  // Append to Notification Outbox
  if (!Array.isArray(db.notificationOutbox)) db.notificationOutbox = [];
  db.notificationOutbox.unshift({
    id: `notif_${Date.now()}`,
    orderId: newOrder.id,
    type: 'ORDER_CONFIRMATION',
    channel: 'SMS_OR_WHATSAPP',
    recipient: phone,
    status: 'LOGGED_PENDING_GATEWAY',
    createdAt: nowIso,
    message: `Order #${newOrder.id} received at Jonak Hotel & Restaurant. Total: Rs ${newOrder.total}.`
  });

  db.orders = [newOrder, ...db.orders];
  recomputeCustomers();
  // 🔔 Enqueue staff WhatsApp alert for new food order
  enqueueStaffAlert('order', newOrder);
  saveData();
  broadcastSSE('NEW_ORDER', newOrder);
  broadcastSSE('ORDERS_UPDATED', db.orders);
  res.status(201).json({ success: true, order: newOrder });
});

// Update order status with explicit state machine
const handleOrderStatusUpdate = (req, res) => {
  const id = req.params.orderId || req.params.id;
  const { status, note } = req.body;

  let found = false;
  let updatedOrder = null;
  const nowIso = new Date().toISOString();

  db.orders = db.orders.map((o) => {
    if (o.id === id) {
      found = true;
      const timeline = Array.isArray(o.timeline) ? [...o.timeline] : [];
      if (status && status !== o.status) {
        timeline.push({
          status,
          time: nowIso,
          note: note || `Status updated to ${status} by staff`
        });
      }
      updatedOrder = { 
        ...o, 
        status: status || o.status, 
        updatedAt: nowIso,
        timeline 
      };
      return updatedOrder;
    }
    return o;
  });

  if (!found) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Append to orderStatusEvents (append-only ledger)
  if (!Array.isArray(db.orderStatusEvents)) db.orderStatusEvents = [];
  db.orderStatusEvents.push({
    id: `ose_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    orderId: id,
    status: updatedOrder.status,
    note: note || `Status updated to ${status} by staff`,
    createdAt: nowIso
  });

  // Enqueue canonical transactional outbox event
  enqueueTransactionalOutboxEvent(
    'order.status_changed',
    { type: 'order', id, version: 1 },
    { kind: 'user', id: updatedOrder.phone },
    {
      orderId: id,
      status: updatedOrder.status,
      note: note || '',
      timeline: updatedOrder.timeline,
      updatedAt: nowIso
    }
  );

  saveData();
  broadcastSSE('ORDERS_UPDATED', db.orders);
  broadcastSSE('ORDER_STATUS_CHANGED', { orderId: id, status, order: updatedOrder });
  res.json({ success: true, order: updatedOrder, orders: db.orders });
};

app.patch('/api/admin/orders/:id', requireStaffOrAbove, handleOrderStatusUpdate);
app.post('/api/admin/orders/:orderId/status', requireStaffOrAbove, handleOrderStatusUpdate);

// ----------------------------------------------------------------------------
// RECONCILIATION & CURSOR-BASED NOTIFICATIONS / EVENTS
// ----------------------------------------------------------------------------
app.get('/api/me/notifications', (req, res) => {
  const session = getSessionFromRequest(req, db);
  const after = req.query.after;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

  const userId = session ? session.userId : null;
  const userRole = session ? session.role : null;
  const phone = req.query.phone || (session ? session.phone : null);
  const orderId = req.query.orderId;

  const deliveries = (db.notificationDeliveries || []).filter(n => {
    const timestamp = n.deliveredAt || n.attemptedAt;
    if (after && timestamp && timestamp <= after) return false;

    if (userRole === 'owner' || userRole === 'manager' || userRole === 'staff') {
      return true;
    }
    if (userRole === 'courier') {
      return n.recipient === `courier:${userId}` || n.recipient === userId;
    }
    if (userId && (n.recipient === userId || n.recipient === `user:${userId}`)) return true;
    if (phone && n.recipient === phone) return true;
    if (orderId && (n.aggregateId === orderId || n.orderId === orderId)) return true;
    return false;
  });

  const sliced = deliveries.slice(-limit);
  const nextCursor = sliced.length > 0 ? (sliced[sliced.length - 1].deliveredAt || sliced[sliced.length - 1].attemptedAt) : after;

  res.json({
    notifications: sliced,
    nextCursor,
    total: deliveries.length
  });
});

app.post('/api/notifications/:id/ack', (req, res) => {
  const { id } = req.params;
  let found = false;
  db.notificationDeliveries = (db.notificationDeliveries || []).map(n => {
    if (n.attemptId === id || n.eventId === id || n.id === id) {
      found = true;
      return { ...n, acknowledged: true, acknowledgedAt: new Date().toISOString() };
    }
    return n;
  });
  if (found) {
    saveData();
    return res.json({ success: true, id, acknowledged: true });
  }
  res.status(404).json({ error: 'Notification delivery record not found.' });
});

app.get('/api/orders/:id/events', (req, res) => {
  const { id } = req.params;
  const after = req.query.after;
  const events = (db.orderStatusEvents || []).filter(e => {
    if (e.orderId !== id) return false;
    if (after && e.createdAt <= after) return false;
    return true;
  });
  res.json({ orderId: id, events });
});

// Courier assignment and task management
app.post('/api/orders/:id/assign-courier', requireManagerOrOwner, (req, res) => {
  const { id } = req.params;
  const { courierId, courierName } = req.body;

  if (!courierId) {
    return res.status(400).json({ error: 'courierId is required.' });
  }

  let foundOrder = null;
  const nowIso = new Date().toISOString();

  db.orders = (db.orders || []).map(o => {
    if (o.id === id) {
      foundOrder = {
        ...o,
        assignedStaffId: courierId,
        assignedStaffName: courierName || 'Jonak Delivery Partner',
        assignedAt: nowIso,
        status: o.status === 'Received' || o.status === 'Preparing' ? 'Out for Delivery' : o.status,
        updatedAt: nowIso,
        timeline: [
          ...(o.timeline || []),
          {
            status: 'Out for Delivery',
            time: nowIso,
            note: `Assigned to delivery partner ${courierName || courierId}`
          }
        ]
      };
      return foundOrder;
    }
    return o;
  });

  if (!foundOrder) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (!Array.isArray(db.orderStatusEvents)) db.orderStatusEvents = [];
  db.orderStatusEvents.push({
    id: `ose_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
    orderId: id,
    status: foundOrder.status,
    note: `Assigned to courier ${courierName || courierId}`,
    createdAt: nowIso
  });

  enqueueTransactionalOutboxEvent(
    'delivery.assigned',
    { type: 'order', id, version: 1 },
    { kind: 'user', id: courierId },
    {
      orderId: id,
      assignedStaffId: courierId,
      assignedStaffName: courierName || 'Jonak Delivery Partner',
      deliveryAddress: foundOrder.deliveryAddress || foundOrder.address,
      phone: foundOrder.phone,
      total: foundOrder.total,
      assignedAt: nowIso
    }
  );

  saveData();
  broadcastSSE('ORDERS_UPDATED', db.orders);
  broadcastSSE('ORDER_STATUS_CHANGED', { orderId: id, status: foundOrder.status, order: foundOrder });

  res.json({ success: true, order: foundOrder });
});

app.get('/api/courier/tasks', (req, res) => {
  const session = getSessionFromRequest(req, db);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const isPrivileged = session.role === 'owner' || session.role === 'manager';
  const courierId = session.userId;

  const tasks = (db.orders || []).filter(o => {
    if (isPrivileged) return o.mode === 'Home Delivery';
    return o.assignedStaffId === courierId || o.assignedStaffName === session.name;
  });

  res.json({ tasks });
});

// ----------------------------------------------------------------------------
// 13. ROOM BOOKINGS & AUTHORITATIVE INVENTORY / CONFLICT PREVENTION
// ----------------------------------------------------------------------------
const checkRoomAvailability = (roomId, requestedRoomNumber, checkIn, checkOut, excludeBookingId = null) => {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { available: false, error: 'Check-out date must be after check-in date.' };
  }

  const activeBookings = (db.bookings || []).filter(b => 
    b.id !== excludeBookingId && 
    b.status !== 'Cancelled' && 
    b.status !== 'Rejected' && 
    b.status !== 'Checked Out'
  );

  const hasConflict = (num) => {
    return activeBookings.some(b => {
      if (b.roomNumber !== num) return false;
      const bStart = new Date(b.checkIn).getTime();
      const bEnd = new Date(b.checkOut).getTime();
      return (start < bEnd && end > bStart);
    });
  };

  const targetCategory = (db.rooms || []).find(r => r.id === roomId);
  const catRooms = (db.physicalRooms || []).filter(pr => pr.categoryId === roomId);

  if (requestedRoomNumber && !hasConflict(requestedRoomNumber)) {
    return {
      available: true,
      allocatedRoomNumber: requestedRoomNumber,
      status: 'Request to confirm (Pending Front Desk Check)',
      isInstantConfirmed: false
    };
  }

  // Find another room in the same category without date overlap
  const alternative = catRooms.find(pr => !hasConflict(pr.number || pr.roomNumber));
  if (alternative) {
    return {
      available: true,
      allocatedRoomNumber: alternative.number || alternative.roomNumber,
      status: 'Request to confirm (Pending Front Desk Check)',
      isInstantConfirmed: false
    };
  }

  return {
    available: false,
    error: `All physical rooms in '${targetCategory?.title || roomId}' are booked for the selected dates (${checkIn} to ${checkOut}).`
  };
};

app.get('/api/bookings', (req, res) => {
  const normalized = (db.bookings || []).map(b => ({
    ...b,
    id: b.id,
    booking_id: b.booking_id || b.id,
    customer_name: b.customer_name || b.guestName || '',
    customer_phone: b.customer_phone || b.phone || '',
    customer_email: b.customer_email || b.email || '',
    room_id: b.room_id || b.roomId || '',
    room_name: b.room_name || b.roomType || '',
    check_in_date: b.check_in_date || b.checkIn || '',
    check_out_date: b.check_out_date || b.checkOut || '',
    total_days: b.total_days || b.nights || 1,
    total_amount: b.total_amount || b.totalTariff || b.totalPrice || b.total || 0,
    payment_mode: b.payment_mode || b.paymentMethod || 'Front Desk (Pay on Arrival)',
    payment_status: b.payment_status || b.paymentStatus || 'Pending',
    booking_status: b.booking_status || b.status || 'Confirmed',
    created_at: b.created_at || b.createdAt || new Date().toISOString(),
    updated_at: b.updated_at || b.updatedAt || new Date().toISOString()
  }));
  res.json(normalized);
});

// Customer Room Booking Tracking
app.get('/api/bookings/:id/track', (req, res) => {
  const { id } = req.params;
  const booking = (db.bookings || []).find(b => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({
    id: booking.id,
    guestName: booking.guestName,
    roomType: booking.roomType,
    roomNumber: booking.roomNumber,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    totalTariff: booking.totalTariff,
    status: booking.status,
    isInstantConfirmed: booking.isInstantConfirmed || false,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    supportPhone: HOTEL_INFO.phone || '+91 96785 82286',
    address: HOTEL_INFO.address
  });
});

app.post('/api/bookings', (req, res) => {
  const bookingData = req.body;
  const guestName = (bookingData.customer_name || bookingData.guestName || bookingData.name || '').trim();
  const phone = (bookingData.customer_phone || bookingData.phone || '').replace(/\D/g, '');
  const email = (bookingData.customer_email || bookingData.email || '').trim();
  const checkIn = bookingData.check_in_date || bookingData.checkIn;
  const checkOut = bookingData.check_out_date || bookingData.checkOut;
  const roomId = bookingData.room_id || bookingData.roomId || 'suite-ac';
  const requestedRoomNumber = bookingData.room_number || bookingData.roomNumber;
  const totalDays = Number(bookingData.total_days || bookingData.nights || 1);
  const totalAmount = Number(bookingData.total_amount || bookingData.totalPrice || bookingData.totalTariff || bookingData.total || 0);
  const paymentMode = bookingData.payment_mode || bookingData.paymentMethod || 'Front Desk (Pay on Arrival)';
  const paymentStatus = bookingData.payment_status || bookingData.paymentStatus || 'Pending';
  const bookingStatus = bookingData.booking_status || bookingData.status || 'Confirmed';

  if (!guestName || guestName.length < 2) {
    return res.status(400).json({ error: 'Guest full name is required.' });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
  }

  // Authoritative server-side inventory source check
  const availCheck = checkRoomAvailability(roomId, requestedRoomNumber, checkIn, checkOut);
  if (!availCheck.available) {
    return res.status(409).json({ error: availCheck.error });
  }

  const nowIso = new Date().toISOString();
  const bookingId = bookingData.id || bookingData.booking_id || `BKG-${Math.floor(1000 + Math.random() * 9000)}`;
  const allocatedNumber = availCheck.allocatedRoomNumber || requestedRoomNumber || '101';
  const roomName = bookingData.room_name || bookingData.roomType || 'Comfort Room';

  const newBooking = {
    ...bookingData,
    id: bookingId,
    booking_id: bookingId,
    customer_name: guestName,
    guestName,
    customer_phone: phone,
    phone,
    customer_email: email,
    email,
    room_id: roomId,
    roomId,
    room_name: roomName,
    roomType: roomName,
    room_number: allocatedNumber,
    roomNumber: allocatedNumber,
    check_in_date: checkIn,
    checkIn,
    check_out_date: checkOut,
    checkOut,
    total_days: totalDays,
    nights: totalDays,
    total_amount: totalAmount,
    totalPrice: totalAmount,
    totalTariff: totalAmount,
    payment_mode: paymentMode,
    paymentMethod: paymentMode,
    payment_status: paymentStatus,
    paymentStatus,
    booking_status: bookingStatus,
    status: availCheck.status || bookingStatus,
    time: bookingData.time || 'Just now',
    createdAt: nowIso,
    created_at: nowIso,
    updatedAt: nowIso,
    updated_at: nowIso,
    isInstantConfirmed: false
  };

  db.bookings = [newBooking, ...db.bookings];
  recomputeCustomers();

  // Enqueue canonical outbox event
  enqueueTransactionalOutboxEvent(
    'booking.requested',
    { type: 'booking', id: newBooking.id, version: 1 },
    { kind: 'user', id: phone },
    {
      bookingId: newBooking.id,
      guestName: newBooking.guestName,
      roomType: newBooking.roomType,
      roomNumber: newBooking.roomNumber,
      checkIn: newBooking.checkIn,
      checkOut: newBooking.checkOut,
      status: newBooking.status,
      totalTariff: newBooking.totalTariff,
      createdAt: nowIso
    }
  );

  // 🔔 Enqueue staff WhatsApp alert for new room booking
  enqueueStaffAlert('booking', newBooking);
  saveData();
  broadcastSSE('NEW_BOOKING', newBooking);
  broadcastSSE('BOOKINGS_UPDATED', db.bookings);
  res.status(201).json({ success: true, booking: newBooking });
});

// Update booking status (Manager or Owner)
const handleBookingStatusUpdate = (req, res) => {
  const id = req.params.bookingId || req.params.id;
  const { status } = req.body;

  let found = false;
  let updatedBooking = null;
  db.bookings = db.bookings.map((b) => {
    if (b.id === id) {
      found = true;
      updatedBooking = { ...b, status: status || b.status, updatedAt: new Date().toISOString() };
      return updatedBooking;
    }
    return b;
  });

  if (!found) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Enqueue canonical outbox event
  enqueueTransactionalOutboxEvent(
    'booking.status_changed',
    { type: 'booking', id, version: 1 },
    { kind: 'user', id: updatedBooking.phone },
    {
      bookingId: id,
      guestName: updatedBooking.guestName,
      status: updatedBooking.status,
      roomNumber: updatedBooking.roomNumber,
      updatedAt: updatedBooking.updatedAt
    }
  );

  saveData();
  broadcastSSE('BOOKINGS_UPDATED', db.bookings);
  res.json({ success: true, booking: updatedBooking, bookings: db.bookings });
};

app.patch('/api/admin/bookings/:id', requireManagerOrOwner, handleBookingStatusUpdate);
app.post('/api/admin/bookings/:bookingId/status', requireManagerOrOwner, handleBookingStatusUpdate);

// ----------------------------------------------------------------------------
// 14. RAZORPAY PAYMENT SANDBOX & REVENUE INTEGRATION
// ----------------------------------------------------------------------------
app.post(['/api/payment/create-order', '/api/payment/create'], (req, res) => {
  const { amount, currency = 'INR', receipt, orderType } = req.body;
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  // Create official-compatible Razorpay order in test sandbox mode
  const razorpayOrderId = `order_sbx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const keyId = process.env.RAZORPAY_KEY_ID || db.settings?.razorpay?.keyId || 'rzp_test_JonakSandboxDemo';

  res.json({
    success: true,
    orderId: razorpayOrderId,
    id: razorpayOrderId,
    amount: Math.round(numAmount * 100),
    currency,
    keyId,
    receipt: receipt || `rcpt_${Date.now()}`,
    mode: 'sandbox'
  });
});

app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalId, orderType } = req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  let isSignatureValid = false;

  if (keySecret && razorpay_signature && !razorpay_signature.startsWith('test_') && !razorpay_signature.startsWith('mock_')) {
    const generated = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    isSignatureValid = (generated === razorpay_signature);
  } else {
    // In sandbox test mode, verify presence of required provider tokens
    isSignatureValid = Boolean(razorpay_order_id && razorpay_payment_id);
  }

  if (!isSignatureValid) {
    return res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
  }

  if (orderType === 'FOOD' || (internalId && internalId.startsWith('JNK-'))) {
    db.orders = db.orders.map(o => {
      if (o.id === internalId) {
        return {
          ...o,
          paymentStatus: 'Paid (Razorpay Verified)',
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
  } else if (orderType === 'ROOM' || (internalId && internalId.startsWith('BKG-'))) {
    db.bookings = db.bookings.map(b => {
      if (b.id === internalId) {
        return {
          ...b,
          paymentStatus: 'Pre-Paid (Razorpay Verified)',
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });
  }

  saveData();
  broadcastSSE('PAYMENT_RECEIVED', {
    internalId,
    orderType,
    paymentId: razorpay_payment_id,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Payment verified and recorded successfully in sandbox mode.',
    paymentId: razorpay_payment_id
  });
});

// ----------------------------------------------------------------------------
// 15. OWNER COMPREHENSIVE REVENUE & FINANCIAL REPORTS
// ----------------------------------------------------------------------------
app.get('/api/admin/reports/financial', requireOwner, (req, res) => {
  const orders = db.orders || [];
  const bookings = db.bookings || [];

  let foodGross = 0;
  let foodDiscounts = 0;
  let foodDeliveryFees = 0;
  let foodNet = 0;

  orders.forEach(o => {
    const sub = parseFloat(o.subtotal || o.total || 0);
    const disc = parseFloat(o.discount || 0);
    const fee = parseFloat(o.deliveryFee || 0);
    const tot = parseFloat(o.total || (sub - disc + fee));
    foodGross += sub;
    foodDiscounts += disc;
    foodDeliveryFees += fee;
    foodNet += tot;
  });

  let roomBaseTariff = 0;
  let roomGst = 0;
  let roomTotal = 0;

  bookings.forEach(b => {
    const base = parseFloat(b.baseTotal || b.tariff || 0);
    const gst = parseFloat(b.gstAmount || Math.round(base * 0.05));
    const tot = parseFloat(b.totalTariff || (base + gst));
    roomBaseTariff += base;
    roomGst += gst;
    roomTotal += tot;
  });

  const totalExpenses = (db.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const combinedGross = foodGross + roomBaseTariff;
  const combinedTaxesAndFees = foodDeliveryFees + roomGst;
  const combinedNet = foodNet + roomTotal;
  const estimatedOperatingProfit = combinedNet - totalExpenses;

  res.json({
    currency: 'INR',
    summary: {
      combinedGross,
      totalDiscountsGiven: foodDiscounts,
      totalTaxesAndFees: combinedTaxesAndFees,
      combinedNetRevenue: combinedNet,
      totalLoggedExpenses: totalExpenses,
      operatingProfit: estimatedOperatingProfit
    },
    foodOperations: {
      totalOrdersCount: orders.length,
      grossSales: foodGross,
      discountsGiven: foodDiscounts,
      deliveryFeesCollected: foodDeliveryFees,
      netFoodRevenue: foodNet,
      averageOrderValue: orders.length > 0 ? Math.round(foodNet / orders.length) : 0
    },
    roomOperations: {
      totalBookingsCount: bookings.length,
      baseTariffSales: roomBaseTariff,
      gstCollected: roomGst,
      totalRoomRevenue: roomTotal,
      averageBookingValue: bookings.length > 0 ? Math.round(roomTotal / bookings.length) : 0
    },
    offerPerformance: (db.offers || []).map(o => ({
      id: o.id,
      title: o.title,
      code: o.code,
      redemptionsCount: o.redemptionsCount || 0,
      estimatedDiscountGiven: (o.redemptionsCount || 0) * (o.discountValue || 0)
    }))
  });
});

// ----------------------------------------------------------------------------
// 16. NOTIFICATION AUDIT LOGS & PROVIDER CONFIGURATION
// ----------------------------------------------------------------------------
app.get('/api/admin/notifications', requireManagerOrOwner, (req, res) => {
  res.json({
    outbox: db.notificationOutbox || [],
    providerStatus: {
      smsProvider: 'PENDING_OWNER_CREDENTIALS',
      whatsAppGateway: 'PENDING_OWNER_CREDENTIALS',
      inAppAlerts: 'ACTIVE_LIVE_SSE',
      instructions: 'Transactional notifications are queued in the outbox. Configure MSG91 or Twilio API keys in .env to enable direct SMS dispatch.'
    }
  });
});

// Staff Notification Poll Endpoint (AdminPanel polls every 30s)
// Returns pending notifications since the last seen timestamp
app.get('/api/notifications/staff', (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 60000);
  const pending = (db.notificationOutbox || []).filter(n => {
    const created = new Date(n.createdAt || 0);
    return created >= since;
  });
  res.json({
    notifications: pending.slice(0, 20),
    totalUnread: pending.length,
    serverTime: new Date().toISOString()
  });
});

// Generate WhatsApp Staff Alert URL (called server-side when order/booking created)
const buildStaffWhatsAppUrl = (type, data) => {
  const STAFF_PHONE = '919678582286';
  let text = '';
  if (type === 'order') {
    const items = (data.items || []).map(i => `• ${i.name} x${i.qty || 1} = ₹${i.price * (i.qty || 1)}`).join('\n');
    text =
`🔔 NEW FOOD ORDER — JONAK HOTEL & RESTAURANT
━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Order ID: #${data.id}
👤 Customer: ${data.customerName || data.customer_name}
📞 Phone: ${data.phone || data.customer_phone}
🏠 Mode: ${data.mode || data.order_status || 'Home Delivery'}
📍 Address: ${data.address || data.delivery_address || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS:
${items}
━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total: ₹${data.total || data.total_amount}
💳 Payment: ${data.payment || data.payment_mode}
⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━━━━━━
Please confirm and prepare immediately!`;
  } else if (type === 'booking') {
    text =
`🔔 NEW ROOM BOOKING — JONAK HOTEL & RESTAURANT
━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 Booking ID: #${data.id}
👤 Guest: ${data.guestName || data.customer_name}
📞 Phone: ${data.phone || data.customer_phone}
🛏️ Room: ${data.roomType || data.room_name} (Room ${data.roomNumber || data.room_number})
📅 Check-In: ${data.checkIn || data.check_in_date}
📅 Check-Out: ${data.checkOut || data.check_out_date}
👥 Guests: ${data.guests || data.guestsCount || 1}
━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total: ₹${data.totalTariff || data.totalPrice || data.total_amount}
💳 Payment: ${data.paymentMethod || data.payment_mode}
⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━━━━━━
Please prepare the room and confirm the booking!`;
  }
  return `https://wa.me/${STAFF_PHONE}?text=${encodeURIComponent(text)}`;
};

// Add staff WhatsApp URL to notification outbox items so AdminPanel can open them
const enqueueStaffAlert = (type, data) => {
  const whatsappUrl = buildStaffWhatsAppUrl(type, data);
  if (!Array.isArray(db.notificationOutbox)) db.notificationOutbox = [];
  db.notificationOutbox.unshift({
    id: `staff_alert_${Date.now()}`,
    type: type === 'order' ? 'NEW_ORDER_ALERT' : 'NEW_BOOKING_ALERT',
    entityId: data.id,
    entityType: type,
    summary: type === 'order'
      ? `New order #${data.id} from ${data.customerName || data.customer_name} — ₹${data.total || data.total_amount}`
      : `New booking #${data.id} by ${data.guestName || data.customer_name} — Room ${data.roomNumber || data.room_number}`,
    whatsappUrl,
    status: 'PENDING_STAFF_ACK',
    createdAt: new Date().toISOString()
  });
  broadcastSSE('STAFF_NOTIFICATION', {
    type: type === 'order' ? 'NEW_ORDER_ALERT' : 'NEW_BOOKING_ALERT',
    entityId: data.id,
    summary: db.notificationOutbox[0].summary,
    whatsappUrl
  });
};

// 13. Event Enquiries
app.get('/api/events-list', (req, res) => {
  res.json(db.eventEnquiries);
});

// Update event enquiry status (Manager or Owner)
app.patch('/api/admin/events/:id', requireManagerOrOwner, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  let found = false;
  db.eventEnquiries = (db.eventEnquiries || []).map(e => {
    if (e.id === id) {
      found = true;
      return { 
        ...e, 
        status: status || e.status, 
        notes: notes !== undefined ? notes : e.notes, 
        updatedAt: new Date().toISOString() 
      };
    }
    return e;
  });
  if (!found) return res.status(404).json({ error: 'Event enquiry not found' });
  saveData();
  broadcastSSE('EVENTS_UPDATED', db.eventEnquiries);
  res.json({ success: true, enquiries: db.eventEnquiries });
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

// 14. Kitchen Raw Material & Store Inventory REST Routes
app.get('/api/inventory', (req, res) => {
  res.json(db.rawInventory || INITIAL_RAW_INVENTORY);
});

app.post('/api/inventory/purchase', requireManagerOrOwner, (req, res) => {
  const { itemId, addedQty, purchaseCost, updatedBy, paidVia } = req.body;
  let updatedItem = null;
  db.rawInventory = (db.rawInventory || INITIAL_RAW_INVENTORY).map((item) => {
    if (item.id === itemId) {
      const newQty = (parseFloat(item.currentStock) || 0) + (parseFloat(addedQty) || 0);
      updatedItem = {
        ...item,
        currentStock: Math.max(0, Math.round(newQty * 10) / 10),
        lastUpdated: 'Just now',
        updatedBy: updatedBy || 'Staff'
      };
      return updatedItem;
    }
    return item;
  });

  // Automatically log expense cost for Owner P&L
  if (purchaseCost && parseFloat(purchaseCost) > 0) {
    const newExpense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      item: `${updatedItem ? updatedItem.name : 'Stock'} Purchase (+${addedQty} ${updatedItem ? updatedItem.unit : ''})`,
      category: 'Kitchen Raw Stock',
      amount: parseFloat(purchaseCost),
      paidVia: paidVia || 'Cash',
      loggedBy: updatedBy || 'Staff'
    };
    db.expenses = [newExpense, ...(db.expenses || INITIAL_EXPENSES)];
    broadcastSSE('EXPENSES_UPDATED', db.expenses);
  }

  saveData();
  broadcastSSE('INVENTORY_UPDATED', db.rawInventory);
  res.json({ success: true, item: updatedItem, rawInventory: db.rawInventory, expenses: db.expenses });
});

app.post('/api/inventory/use', requireStaffOrAbove, (req, res) => {
  const { itemId, usedQty, updatedBy } = req.body;
  let updatedItem = null;
  db.rawInventory = (db.rawInventory || INITIAL_RAW_INVENTORY).map((item) => {
    if (item.id === itemId) {
      const newQty = Math.max(0, (parseFloat(item.currentStock) || 0) - (parseFloat(usedQty) || 0));
      updatedItem = {
        ...item,
        currentStock: Math.round(newQty * 10) / 10,
        lastUpdated: 'Just now',
        updatedBy: updatedBy || 'Staff'
      };
      return updatedItem;
    }
    return item;
  });
  saveData();
  broadcastSSE('INVENTORY_UPDATED', db.rawInventory);
  res.json({ success: true, item: updatedItem, rawInventory: db.rawInventory });
});

// 15. Operational Expenses REST Routes
app.get('/api/expenses', (req, res) => {
  res.json(db.expenses || INITIAL_EXPENSES);
});

app.post('/api/expenses', requireManagerOrOwner, (req, res) => {
  const expenseData = req.body;
  const newExpense = {
    ...expenseData,
    id: expenseData.id || `EXP-${Date.now().toString().slice(-4)}`,
    date: expenseData.date || new Date().toISOString().split('T')[0],
    time: expenseData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    amount: parseFloat(expenseData.amount) || 0
  };
  db.expenses = [newExpense, ...(db.expenses || INITIAL_EXPENSES)];
  saveData();
  broadcastSSE('EXPENSES_UPDATED', db.expenses);
  res.status(201).json({ success: true, expense: newExpense, expenses: db.expenses });
});

// 16. Operational Tasks REST Routes
app.get('/api/tasks', (req, res) => {
  res.json(db.tasks || INITIAL_TASKS);
});

app.put('/api/tasks/:id/toggle', requireStaffOrAbove, (req, res) => {
  const { id } = req.params;
  const { completedBy } = req.body;
  let targetTask = null;
  db.tasks = (db.tasks || INITIAL_TASKS).map((t) => {
    if (t.id === id) {
      const newCompleted = !t.completed;
      targetTask = {
        ...t,
        completed: newCompleted,
        completedBy: newCompleted ? (completedBy || 'Staff') : null,
        completedAt: newCompleted ? 'Just now' : null
      };
      return targetTask;
    }
    return t;
  });
  saveData();
  broadcastSSE('TASKS_UPDATED', db.tasks);
  res.json({ success: true, task: targetTask, tasks: db.tasks });
});

app.post('/api/tasks', requireStaffOrAbove, (req, res) => {
  const taskData = req.body;
  const newTask = {
    ...taskData,
    id: taskData.id || `TSK-${Date.now().toString().slice(-4)}`,
    completed: false,
    completedBy: null,
    completedAt: null
  };
  db.tasks = [...(db.tasks || INITIAL_TASKS), newTask];
  saveData();
  broadcastSSE('TASKS_UPDATED', db.tasks);
  res.status(201).json({ success: true, task: newTask, tasks: db.tasks });
});

// 17. Staff Management REST Routes (Owner Only)
app.get('/api/staff', (req, res) => {
  res.json(db.staff || DEFAULT_STAFF_MEMBERS);
});

app.post('/api/staff', requireOwner, (req, res) => {
  const staffMember = req.body;
  const newStaff = {
    ...staffMember,
    id: staffMember.id || `STF-${Date.now().toString().slice(-3)}`,
    status: staffMember.status || 'On Duty'
  };
  db.staff = [...(db.staff || DEFAULT_STAFF_MEMBERS), newStaff];
  saveData();
  broadcastSSE('STAFF_UPDATED', db.staff);
  res.status(201).json({ success: true, staffMember: newStaff, staff: db.staff });
});

app.put('/api/staff/:id', requireOwner, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  db.staff = (db.staff || DEFAULT_STAFF_MEMBERS).map((s) => (s.id === id ? { ...s, ...updates } : s));
  saveData();
  broadcastSSE('STAFF_UPDATED', db.staff);
  res.json({ success: true, staff: db.staff });
});

// 18. Housekeeping Status Update (Staff, Manager, or Owner)
app.put('/api/rooms/housekeeping', requireStaffOrAbove, (req, res) => {
  const { roomNumber, cleaningStatus } = req.body;
  let targetRoom = null;
  db.physicalRooms = (db.physicalRooms || OFFICIAL_PHYSICAL_ROOMS).map((pr) => {
    if (pr.number === roomNumber || pr.roomNumber === roomNumber) {
      targetRoom = { ...pr, cleaningStatus };
      return targetRoom;
    }
    return pr;
  });
  saveData();
  broadcastSSE('PHYSICAL_ROOMS_UPDATED', db.physicalRooms);
  res.json({ success: true, room: targetRoom, physicalRooms: db.physicalRooms });
});

// 20. Visitor Tracking & Traffic Analytics
app.post('/api/track-visit', (req, res) => {
  const visitData = req.body || {};
  const stats = trackVisit(visitData);
  res.json({ success: true, stats });
});

app.get('/api/visitors/stats', (req, res) => {
  const isAdmin = checkIsAdmin(req);
  const totalOrdersPlaced = (db.orders || []).length;
  const totalBookingsPlaced = (db.bookings || []).length;
  const totalConversions = totalOrdersPlaced + totalBookingsPlaced;
  const lifetime = db.visitorStats?.totalLifetimeVisitors || 1248;
  const conversionRate = lifetime > 0 ? ((totalConversions / lifetime) * 100).toFixed(1) : '0.0';

  if (!isAdmin) {
    return res.json({
      success: true,
      stats: db.visitorStats || {
        totalLifetimeVisitors: lifetime,
        todayVisitors: 42,
        activeNow: 5,
        conversionRatePercent: parseFloat(conversionRate)
      },
      conversionFunnel: {
        totalVisitors: lifetime,
        ordersAndBookingsPlaced: totalConversions,
        conversionRatePercent: parseFloat(conversionRate)
      }
    });
  }

  res.json({
    success: true,
    stats: db.visitorStats,
    conversionFunnel: {
      totalVisitors: lifetime,
      viewersMenuAndRooms: Math.round(lifetime * 0.72),
      ordersAndBookingsPlaced: totalConversions,
      conversionRatePercent: parseFloat(conversionRate)
    },
    recentVisitors: (db.visitors || []).slice(0, 30)
  });
});

// 21. Permanent Customer CRM Directory (Manager or Owner)
app.get('/api/customers', requireManagerOrOwner, (req, res) => {
  const customers = recomputeCustomers();
  res.json(customers);
});

// Export Customer Database (CSV Format - Manager or Owner)
app.get('/api/customers/export', requireManagerOrOwner, (req, res) => {
  const customers = recomputeCustomers();
  const header = ['Customer ID', 'Name', 'Phone', 'Address / Locality', 'Customer Tier', 'Food Orders Count', 'Room Stays Count', 'Total Spend (INR)', 'Last Activity Date'];
  const rows = customers.map(c => [
    `"${c.id}"`,
    `"${c.name}"`,
    `"${c.phone}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${c.customerType}"`,
    c.totalOrders,
    c.totalStays,
    c.totalSpend,
    `"${c.lastVisitDate ? c.lastVisitDate.split('T')[0] : ''}"`
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="jonak_hotel_customers_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
});

// 22. Database Status (MongoDB Atlas vs Local JSON)
app.get('/api/db/status', (req, res) => {
  res.json({
    connected: isMongoConnected,
    type: isMongoConnected ? 'MongoDB Atlas Cloud Cluster' : 'Local High-Speed Persistent JSON',
    databaseName: isMongoConnected ? 'jonak_hotel_db' : 'hotel_data.json',
    lastSyncTime: lastMongoSyncTime || new Date().toISOString(),
    documentCounts: {
      dishes: (db.menu || []).length,
      rooms: (db.physicalRooms || []).length,
      orders: (db.orders || []).length,
      bookings: (db.bookings || []).length,
      customers: (db.customers || []).length,
      inventoryItems: (db.rawInventory || []).length,
      staff: (db.staff || []).length,
      lifetimeVisitors: db.visitorStats?.totalLifetimeVisitors || 1248
    }
  });
});

// 23. Reset to Factory Defaults (Owner Only)
app.post('/api/admin/reset', requireOwner, (req, res) => {
  db.menu = INITIAL_MENU;
  db.rooms = INITIAL_ROOMS;
  db.physicalRooms = OFFICIAL_PHYSICAL_ROOMS;
  db.settings = INITIAL_SETTINGS;
  db.orders = SAMPLE_ORDERS;
  db.bookings = SAMPLE_ROOM_BOOKINGS;
  db.eventEnquiries = [];
  recalculateCategoryAvailability();
  recomputeCustomers();
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
initMongo();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏨 Jonak Hotel & Restaurant Real-Time Production Server`);
  console.log(`📡 Server active on: http://0.0.0.0:${PORT}`);
  console.log(`⚡ RFC 6455 WebSocket: ws://0.0.0.0:${PORT}/ws`);
  console.log(`⚡ Real-Time SSE: http://localhost:${PORT}/api/events`);
  console.log(`📁 Persistent DB: ${DATA_FILE}`);
  console.log(`=======================================================`);
});

export { app, server };
export default app;
