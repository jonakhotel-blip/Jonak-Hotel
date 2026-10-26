// scripts/generate-sql.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.resolve(__dirname, '../server/data/hotel_data.json');
const hotelData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

let sql = `-- =====================================================================
-- JONAK HOTEL & RESTAURANT • COMPLETE RELATIONAL SQL DATABASE SCHEMA & SEED
-- Barpeta District's #1 Rated Luxury Hotel & Smart Restaurant ERP
-- Compatible with: MySQL 8.x+, MariaDB, PostgreSQL, SQLite, phpMyAdmin
-- Generated on: ${new Date().toISOString()}
-- =====================================================================

CREATE DATABASE IF NOT EXISTS jonak_hotel;
USE jonak_hotel;

-- ---------------------------------------------------------------------
-- TABLE: dishes (Full Digital Menu with 82 Items)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS dishes;
CREATE TABLE dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_veg BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    is_chef_special BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: rooms (9 Physical Guest Rooms 101 to 304)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cleaning_status VARCHAR(50) DEFAULT 'clean',
    is_available BOOLEAN DEFAULT TRUE,
    floor VARCHAR(50) DEFAULT '1st Floor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: inventory (Raw Kitchen & Store Materials Tracker)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_threshold DECIMAL(10, 2) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: staff (Multi-Role Staff Roster with Role-Based PINs)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS staff;
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    phone VARCHAR(30),
    shift VARCHAR(50) DEFAULT 'Morning',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: customers (Permanent Customer CRM Directory)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    total_orders INT DEFAULT 1,
    total_spend DECIMAL(10, 2) DEFAULT 0.00,
    vip_tier VARCHAR(50) DEFAULT 'New Customer',
    last_order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: orders (Incoming Restaurant, In-Room & Home Delivery Orders)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    order_type VARCHAR(50) NOT NULL, -- 'delivery', 'room', 'dinein'
    room_or_table VARCHAR(50),
    delivery_address TEXT,
    items_json JSON,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'COD',
    payment_status VARCHAR(50) DEFAULT 'Pending',
    order_status VARCHAR(50) DEFAULT 'New', -- 'New', 'Preparing', 'Ready', 'Delivered'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: bookings (Hotel Room Reservations)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    room_category VARCHAR(100) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guest_count INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: tasks (Daily Operational Hotel & Kitchen Tasks)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(100) NOT NULL,
    shift VARCHAR(50) DEFAULT 'Morning',
    priority VARCHAR(50) DEFAULT 'Medium',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- TABLE: visitors (Lifetime Website & Footfall Analytics)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS visitors;
CREATE TABLE visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_type VARCHAR(50) DEFAULT 'Mobile',
    page_viewed VARCHAR(100) DEFAULT 'Home',
    referrer VARCHAR(255) DEFAULT 'Direct',
    visit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- SEED DATA INSERTIONS
-- =====================================================================

-- 1. Insert 82 Dishes
INSERT INTO dishes (name, category, price, is_veg, is_available, is_chef_special, description) VALUES
`;

const dishValues = (hotelData.menu || []).map(d => {
  return `(${escapeSql(d.name)}, ${escapeSql(d.category)}, ${Number(d.price)}, ${d.isVeg ? 1 : 0}, ${d.isAvailable !== false ? 1 : 0}, ${d.isChefSpecial ? 1 : 0}, ${escapeSql(d.description || '')})`;
});
sql += dishValues.join(',\n') + ';\n\n';

// 2. Insert 9 Rooms
sql += `-- 2. Insert 9 Rooms\nINSERT INTO rooms (room_number, category, price, cleaning_status, is_available, floor) VALUES\n`;
const roomValues = (hotelData.physicalRooms || []).map(r => {
  const category = r.categoryName || r.category || (r.number === '101' ? 'Suite Room (A/C)' : (r.number.startsWith('2') ? 'Deluxe Room (A/C)' : 'Standard Executive Room'));
  const price = Number(r.tariff || r.basePrice || r.price || (r.number === '101' ? 5000 : 2500));
  return `(${escapeSql(r.number)}, ${escapeSql(category)}, ${price}, ${escapeSql(r.cleaningStatus || 'Clean & Ready')}, ${r.isAvailable !== false ? 1 : 0}, ${escapeSql(r.floor || '1st Floor')})`;
});
sql += roomValues.join(',\n') + ';\n\n';

// 3. Insert Inventory
sql += `-- 3. Insert Raw Inventory Items\nINSERT INTO inventory (name, category, current_stock, unit, min_threshold, cost_per_unit) VALUES\n`;
const invValues = (hotelData.rawInventory || []).map(i => {
  return `(${escapeSql(i.name)}, ${escapeSql(i.category)}, ${Number(i.currentStock)}, ${escapeSql(i.unit)}, ${Number(i.minThreshold)}, ${Number(i.costPerUnit)})`;
});
sql += invValues.join(',\n') + ';\n\n';

// 4. Insert Staff
sql += `-- 4. Insert Multi-Role Staff\nINSERT INTO staff (name, role, pin, phone, shift, is_active) VALUES\n`;
const staffValues = (hotelData.staff || []).map(s => {
  return `(${escapeSql(s.name)}, ${escapeSql(s.role)}, ${escapeSql(s.pin)}, ${escapeSql(s.phone)}, ${escapeSql(s.shift || 'Morning')}, ${s.active !== false ? 1 : 0})`;
});
sql += staffValues.join(',\n') + ';\n\n';

// 5. Insert Customers
sql += `-- 5. Insert Customers CRM\nINSERT INTO customers (name, phone, total_orders, total_spend, vip_tier) VALUES\n`;
const custValues = (hotelData.customers || []).map(c => {
  return `(${escapeSql(c.name)}, ${escapeSql(c.phone)}, ${Number(c.totalOrders || 1)}, ${Number(c.totalSpend || 0)}, ${escapeSql(c.vipTier || 'New Customer')})`;
});
sql += custValues.join(',\n') + ';\n\n';

// 6. Insert Tasks
sql += `-- 6. Insert Default Tasks\nINSERT INTO tasks (title, assigned_to, shift, priority, is_completed) VALUES
('Morning Kitchen Prep & Stock Check', 'Kitchen', 'Morning', 'High', 1),
('Room 101-103 Linen Change & Sanitization', 'Housekeeping', 'Morning', 'High', 0),
('Front Desk Guest Log & Register Verification', 'Reception', 'Morning', 'Medium', 1),
('Evening Delivery Bike Fuel & Bag Sanitization', 'Delivery', 'Evening', 'High', 0),
('Daily Z-Report & Night Audit Balance', 'Owner', 'Night', 'Critical', 0);
`;

const outputDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, 'jonak_hotel.sql');
fs.writeFileSync(outputPath, sql, 'utf8');

console.log(`✅ Complete SQL Database Schema & Seed generated successfully at:\n${outputPath}`);
