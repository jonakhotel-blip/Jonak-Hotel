// scripts/setup-pocketbase.mjs
import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  console.log('🔄 Connecting to PocketBase at http://127.0.0.1:8090...');

  // 1. Authenticate as Superuser / Admin
  try {
    // In PB v0.23+, superuser auth uses pb.collection('_superusers').authWithPassword()
    try {
      await pb.collection('_superusers').authWithPassword('jonakhotel@gmail.com', 'jonak786@134');
      console.log('✅ Authenticated via _superusers collection');
    } catch {
      await pb.admins.authWithPassword('jonakhotel@gmail.com', 'jonak786@134');
      console.log('✅ Authenticated via legacy admins API');
    }
  } catch (err) {
    console.error('❌ Superuser authentication failed:', err.message);
    process.exit(1);
  }

  // Load local hotel data
  const dataPath = path.resolve(__dirname, '../server/data/hotel_data.json');
  const hotelData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Helper to ensure collection exists
  const existingCollections = await pb.collections.getFullList();
  const existingMap = new Map(existingCollections.map(c => [c.name, c]));

  async function ensureCollection(name, schemaFields) {
    if (existingMap.has(name)) {
      console.log(`ℹ️ Collection "${name}" already exists.`);
      return existingMap.get(name);
    }
    console.log(`📦 Creating collection "${name}"...`);
    const collection = await pb.collections.create({
      name,
      type: 'base',
      listRule: '', // Public read
      viewRule: '', // Public read
      createRule: '', // Public create for customer orders/bookings
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: schemaFields
    });
    console.log(`✅ Collection "${name}" created successfully.`);
    return collection;
  }

  // Define schemas
  await ensureCollection('dishes', [
    { name: 'name', type: 'text', required: true },
    { name: 'category', type: 'text' },
    { name: 'price', type: 'number' },
    { name: 'isVeg', type: 'bool' },
    { name: 'isAvailable', type: 'bool' },
    { name: 'isChefSpecial', type: 'bool' },
    { name: 'description', type: 'text' }
  ]);

  await ensureCollection('rooms', [
    { name: 'roomNumber', type: 'text', required: true },
    { name: 'category', type: 'text' },
    { name: 'price', type: 'number' },
    { name: 'cleaningStatus', type: 'text' },
    { name: 'isAvailable', type: 'bool' },
    { name: 'floor', type: 'text' }
  ]);

  await ensureCollection('inventory', [
    { name: 'name', type: 'text', required: true },
    { name: 'category', type: 'text' },
    { name: 'currentStock', type: 'number' },
    { name: 'unit', type: 'text' },
    { name: 'minThreshold', type: 'number' },
    { name: 'costPerUnit', type: 'number' }
  ]);

  await ensureCollection('staff', [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text' },
    { name: 'pin', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'shift', type: 'text' },
    { name: 'active', type: 'bool' }
  ]);

  await ensureCollection('orders', [
    { name: 'orderId', type: 'text' },
    { name: 'customerName', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'orderType', type: 'text' },
    { name: 'items', type: 'json' },
    { name: 'total', type: 'number' },
    { name: 'status', type: 'text' },
    { name: 'paymentMode', type: 'text' },
    { name: 'address', type: 'text' }
  ]);

  await ensureCollection('bookings', [
    { name: 'bookingId', type: 'text' },
    { name: 'guestName', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'roomNumber', type: 'text' },
    { name: 'roomCategory', type: 'text' },
    { name: 'checkIn', type: 'text' },
    { name: 'checkOut', type: 'text' },
    { name: 'total', type: 'number' },
    { name: 'status', type: 'text' }
  ]);

  await ensureCollection('tasks', [
    { name: 'title', type: 'text', required: true },
    { name: 'assignedTo', type: 'text' },
    { name: 'shift', type: 'text' },
    { name: 'priority', type: 'text' },
    { name: 'completed', type: 'bool' }
  ]);

  await ensureCollection('customers', [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    { name: 'totalOrders', type: 'number' },
    { name: 'totalSpend', type: 'number' },
    { name: 'vipTier', type: 'text' },
    { name: 'lastOrderDate', type: 'text' }
  ]);

  // Migrate Dishes
  console.log('🚀 Migrating 82 dishes to PocketBase...');
  const existingDishes = await pb.collection('dishes').getFullList();
  if (existingDishes.length === 0) {
    for (const dish of hotelData.menu || []) {
      await pb.collection('dishes').create({
        name: dish.name,
        category: dish.category,
        price: Number(dish.price),
        isVeg: Boolean(dish.isVeg),
        isAvailable: dish.isAvailable !== false,
        isChefSpecial: Boolean(dish.isChefSpecial),
        description: dish.description || ''
      });
    }
    console.log(`✅ Migrated ${hotelData.menu.length} dishes.`);
  } else {
    console.log(`ℹ️ Dishes already contain ${existingDishes.length} items.`);
  }

  // Migrate Rooms
  console.log('🚀 Migrating 9 rooms to PocketBase...');
  const existingRooms = await pb.collection('rooms').getFullList();
  if (existingRooms.length === 0) {
    for (const room of hotelData.physicalRooms || []) {
      await pb.collection('rooms').create({
        roomNumber: String(room.number),
        category: room.category,
        price: Number(room.price),
        cleaningStatus: room.cleaningStatus || 'clean',
        isAvailable: room.isAvailable !== false,
        floor: room.floor || '1st Floor'
      });
    }
    console.log(`✅ Migrated ${hotelData.physicalRooms.length} rooms.`);
  } else {
    console.log(`ℹ️ Rooms already contain ${existingRooms.length} items.`);
  }

  // Migrate Inventory
  console.log('🚀 Migrating raw inventory to PocketBase...');
  const existingInv = await pb.collection('inventory').getFullList();
  if (existingInv.length === 0) {
    for (const item of hotelData.rawInventory || []) {
      await pb.collection('inventory').create({
        name: item.name,
        category: item.category,
        currentStock: Number(item.currentStock),
        unit: item.unit,
        minThreshold: Number(item.minThreshold),
        costPerUnit: Number(item.costPerUnit)
      });
    }
    console.log(`✅ Migrated ${hotelData.rawInventory.length} inventory items.`);
  } else {
    console.log(`ℹ️ Inventory already contains ${existingInv.length} items.`);
  }

  // Migrate Staff
  console.log('🚀 Migrating staff to PocketBase...');
  const existingStaff = await pb.collection('staff').getFullList();
  if (existingStaff.length === 0) {
    for (const s of hotelData.staff || []) {
      await pb.collection('staff').create({
        name: s.name,
        role: s.role,
        pin: s.pin,
        phone: s.phone,
        shift: s.shift,
        active: s.active !== false
      });
    }
    console.log(`✅ Migrated ${hotelData.staff.length} staff records.`);
  } else {
    console.log(`ℹ️ Staff already contains ${existingStaff.length} items.`);
  }

  // Migrate Customers
  console.log('🚀 Migrating customer CRM to PocketBase...');
  const existingCust = await pb.collection('customers').getFullList();
  if (existingCust.length === 0) {
    for (const c of hotelData.customers || []) {
      await pb.collection('customers').create({
        name: c.name,
        phone: c.phone,
        totalOrders: Number(c.totalOrders || 1),
        totalSpend: Number(c.totalSpend || 0),
        vipTier: c.vipTier || 'New Customer',
        lastOrderDate: c.lastOrderDate || new Date().toISOString()
      });
    }
    console.log(`✅ Migrated ${hotelData.customers.length} customer profiles.`);
  } else {
    console.log(`ℹ️ Customers already contains ${existingCust.length} items.`);
  }

  console.log('\n=========================================');
  console.log('🎉 POCKETBASE FULL SETUP COMPLETE!');
  console.log('📍 PocketBase URL:  http://127.0.0.1:8090');
  console.log('🛡️ Admin Dashboard: http://127.0.0.1:8090/_/');
  console.log('📧 Admin Email:     jonakhotel@gmail.com');
  console.log('🔑 Admin Password:  jonak786@134');
  console.log('=========================================\n');
}

main().catch(err => {
  console.error('Fatal error during PocketBase setup:', err);
  process.exit(1);
});
