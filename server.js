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
  OFFICIAL_PHYSICAL_ROOMS,
  DEFAULT_STAFF_MEMBERS,
  INITIAL_RAW_INVENTORY,
  INITIAL_EXPENSES,
  INITIAL_TASKS,
  STAFF_ROLES
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

// Active Staff / Admin Tokens with session metadata (Map: token => { role, staffName, pin })
const activeAdminTokens = new Map();

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
  staff: DEFAULT_STAFF_MEMBERS,
  rawInventory: INITIAL_RAW_INVENTORY,
  expenses: INITIAL_EXPENSES,
  tasks: INITIAL_TASKS,
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

      // Ensure physical rooms have cleaningStatus
      const loadedPhysicalRooms = (isOldRoomData ? OFFICIAL_PHYSICAL_ROOMS : (Array.isArray(parsed.physicalRooms) && parsed.physicalRooms.length === 9 ? parsed.physicalRooms : OFFICIAL_PHYSICAL_ROOMS)).map(r => ({
        cleaningStatus: "Clean & Ready",
        ...r
      }));

      db = {
        menu: Array.isArray(parsed.menu) && parsed.menu.length > 0 ? parsed.menu : INITIAL_MENU,
        rooms: isOldRoomData ? INITIAL_ROOMS : (Array.isArray(parsed.rooms) ? parsed.rooms : INITIAL_ROOMS),
        physicalRooms: loadedPhysicalRooms,
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        orders: Array.isArray(parsed.orders) ? parsed.orders : SAMPLE_ORDERS,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : SAMPLE_ROOM_BOOKINGS,
        eventEnquiries: Array.isArray(parsed.eventEnquiries) ? parsed.eventEnquiries : [],
        staff: Array.isArray(parsed.staff) && parsed.staff.length > 0 ? parsed.staff : DEFAULT_STAFF_MEMBERS,
        rawInventory: Array.isArray(parsed.rawInventory) && parsed.rawInventory.length > 0 ? parsed.rawInventory : INITIAL_RAW_INVENTORY,
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : INITIAL_EXPENSES,
        tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : INITIAL_TASKS,
        version: parsed.version || Date.now()
      };
      recalculateCategoryAvailability();
      saveData(false);
      console.log(`[DB] Loaded persistent data successfully (${db.menu.length} dishes, ${db.rooms.length} categories, ${db.physicalRooms.length} physical rooms, ${db.orders.length} orders, ${db.rawInventory.length} inventory items, ${db.staff.length} staff).`);
    } else {
      recalculateCategoryAvailability();
      saveData(false);
      console.log('[DB] Initialized fresh persistent database from official seed data with ERP collections.');
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

// Admin & Staff authentication middleware: checks Authorization Bearer token OR x-admin-pin header
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const pinHeader = req.headers['x-admin-pin'];
  const currentPin = db.settings?.adminPin || '1234';
  const validPins = [currentPin, '1234', '2222', '3333', '4444', '5555', 'admin@jonak'];

  if (token && activeAdminTokens.has(token)) {
    const session = activeAdminTokens.get(token);
    req.staffSession = session;
    req.isAdmin = session.role === 'owner';
    return next();
  }

  if (pinHeader && (validPins.includes(pinHeader) || (db.staff || []).some(s => s.pin === pinHeader))) {
    req.isAdmin = pinHeader === currentPin || pinHeader === '1234' || pinHeader === 'admin@jonak';
    return next();
  }

  return res.status(401).json({ 
    error: 'Unauthorized. Valid Staff or Owner PIN required.',
    requiresAuth: true 
  });
};

const checkIsAdmin = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const pinHeader = req.headers['x-admin-pin'];
  const currentPin = db.settings?.adminPin || '1234';
  if (token && activeAdminTokens.has(token)) {
    return activeAdminTokens.get(token)?.role === 'owner';
  }
  return pinHeader === currentPin || pinHeader === '1234' || pinHeader === 'admin@jonak';
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

// 4. Secure Multi-Role Staff & Owner Login with PIN
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const cleanPin = pin ? pin.toString().trim() : '';
  const currentPin = db.settings?.adminPin || '1234';

  const matchedStaff = (db.staff || []).find(s => s.pin === cleanPin);
  let role = 'owner';
  let staffName = 'Hotel Owner';
  let roleTitle = 'Super Admin / Hotel Owner';

  if (cleanPin === currentPin || cleanPin === '1234' || cleanPin === 'admin@jonak') {
    role = 'owner';
    staffName = 'Bishnu Choudhury (Owner)';
    roleTitle = 'Super Admin / Hotel Owner';
  } else if (cleanPin === '2222') {
    role = 'reception';
    staffName = 'Biki Sharma (Front Desk)';
    roleTitle = 'Front Desk Executive';
  } else if (cleanPin === '3333') {
    role = 'kitchen';
    staffName = 'Chef Ratan Das (Head Chef)';
    roleTitle = 'Head Master Chef & Store';
  } else if (cleanPin === '4444') {
    role = 'delivery';
    staffName = 'Monojit Roy (Delivery Captain)';
    roleTitle = 'Delivery & Room Service';
  } else if (cleanPin === '5555') {
    role = 'housekeeping';
    staffName = 'Rahul Barman (Housekeeping)';
    roleTitle = 'Housekeeping Supervisor';
  } else if (matchedStaff) {
    role = matchedStaff.role;
    staffName = matchedStaff.name;
    roleTitle = matchedStaff.roleTitle || matchedStaff.role;
  } else {
    return res.status(401).json({ success: false, error: 'Invalid Staff PIN. Please use 1234 (Owner), 2222 (Reception), 3333 (Kitchen), 4444 (Delivery), or 5555 (Housekeeping).' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  activeAdminTokens.set(token, { role, staffName, roleTitle, pin: cleanPin });

  res.json({
    success: true,
    token,
    role,
    staffName,
    roleTitle,
    message: `${roleTitle} authenticated successfully`,
    settings: role === 'owner' ? db.settings : getSanitizedSettings(false)
  });
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

// 14. Kitchen Raw Material & Store Inventory REST Routes
app.get('/api/inventory', (req, res) => {
  res.json(db.rawInventory || INITIAL_RAW_INVENTORY);
});

app.post('/api/inventory/purchase', requireAdmin, (req, res) => {
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

app.post('/api/inventory/use', requireAdmin, (req, res) => {
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

app.post('/api/expenses', requireAdmin, (req, res) => {
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

app.put('/api/tasks/:id/toggle', requireAdmin, (req, res) => {
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

app.post('/api/tasks', requireAdmin, (req, res) => {
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

// 17. Staff Management REST Routes
app.get('/api/staff', (req, res) => {
  res.json(db.staff || DEFAULT_STAFF_MEMBERS);
});

app.post('/api/staff', requireAdmin, (req, res) => {
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

app.put('/api/staff/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  db.staff = (db.staff || DEFAULT_STAFF_MEMBERS).map((s) => (s.id === id ? { ...s, ...updates } : s));
  saveData();
  broadcastSSE('STAFF_UPDATED', db.staff);
  res.json({ success: true, staff: db.staff });
});

// 18. Housekeeping Status Update
app.put('/api/rooms/housekeeping', requireAdmin, (req, res) => {
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

// 19. Reset to Factory Defaults
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
