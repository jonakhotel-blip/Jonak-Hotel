-- =====================================================================
-- JONAK HOTEL & RESTAURANT • COMPLETE RELATIONAL SQL DATABASE SCHEMA & SEED
-- Barpeta District's #1 Rated Luxury Hotel & Smart Restaurant ERP
-- Compatible with: MySQL 8.x+, MariaDB, PostgreSQL, SQLite, phpMyAdmin
-- Generated on: 2026-10-26T13:09:21.051Z
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
('Jonak Special Dum Biriyani', 'Biryani', 350, 0, 1, 0, 'Slow-cooked fragrant aged Basmati rice layered with juicy marinated meat, boiled egg, saffron & caramelized onions in a sealed handi.'),
('Chicken Biriyani', 'Biryani', 300, 0, 1, 0, 'Classic Royal Dum Biryani infused with whole cardamom, cloves, succulent chicken cuts, served with raita and gravy.'),
('Mutton Biriyani', 'Biryani', 350, 0, 1, 0, 'Tender goat meat slow-simmered with aromatic saffron rice, rose water, and royal Awadhi spices.'),
('Egg Biriyani', 'Biryani', 250, 0, 1, 0, 'Aromatic basmati rice layered with crispy golden-fried spiced eggs and caramelized onions.'),
('Veg Dum Biriyani', 'Biryani', 200, 1, 1, 0, 'Fresh garden vegetables, soft paneer cubes, and aromatic whole spices cooked in aged basmati rice.'),
('Special Egg Devil (2 Pcs)', 'Biryani', 200, 0, 1, 0, 'Crispy Bengali & Assamese style spiced mashed potato croquettes stuffed with seasoned boiled eggs.'),
('Jonak Chicken Maharaja', 'Chicken Specialties', 300, 0, 1, 0, 'Rich and royal cashew nut, poppy seed, and fresh cream gravy with succulent boneless chicken morsels.'),
('Chicken Maharani', 'Chicken Specialties', 350, 0, 1, 0, 'Delicate Mughlai specialty cooked in silky saffron, almond paste, and green cardamom sauce.'),
('Local Chicken Curry (Desi Kukkad)', 'Chicken Specialties', 400, 0, 1, 0, 'Authentic Assamese country-style local chicken curry cooked with mustard oil, potatoes, and native ginger-garlic.'),
('Chicken Hyderabadi', 'Chicken Specialties', 400, 0, 1, 0, 'Spicy and tangy green masala curry made with fresh mint, coriander, brown onions, and green chillies.'),
('Crispy Dragon Chicken', 'Chicken Specialties', 250, 0, 1, 0, 'Crispy fried chicken strips wok-tossed in fiery red dragon sauce with bell peppers and roasted cashews.'),
('Chicken Drumsticks (Tangdi Kabab)', 'Chicken Specialties', 250, 0, 1, 0, 'Juicy chicken legs marinated in rich yogurt-spice marinade, grilled to perfection.'),
('Crispy KFC Style Chicken Bucket', 'Chicken Specialties', 300, 0, 1, 0, 'Crunchy double-battered golden fried chicken pieces served with spicy dip and mayo.'),
('Golden Chicken Fingers', 'Chicken Specialties', 200, 0, 1, 0, 'Panko breadcrumb-crusted chicken tenders fried golden and crisp.'),
('Chicken Cutlet', 'Chicken Specialties', 250, 0, 1, 0, 'Minced chicken patty spiced with herbs and pan-fried with a crunchy exterior.'),
('Chicken Nuggets (8 Pcs)', 'Chicken Specialties', 300, 0, 1, 0, 'Tender chicken bite-sized nuggets served with tangy tomato garlic dip.'),
('Chilli Chicken (Dry / Gravy)', 'Starters', 280, 0, 1, 0, 'Iconic Indo-Chinese dish of crispy chicken tossed with green chillies, onions, capsicum, and dark soya sauce.'),
('Chicken Lollipop (6 Pcs)', 'Starters', 300, 0, 1, 0, 'Frenched chicken winglets tossed in spicy Schezwan sauce or served crispy with spicy garlic dip.'),
('Crispy Fried Chicken with Honey Sauce', 'Starters', 350, 0, 1, 0, 'Crunchy batter-fried chicken supreme glazed in our chef''s signature sweet & spicy honey garlic glaze.'),
('Chicken Dry Fry', 'Starters', 300, 0, 1, 0, 'Assam highway dhaba style shallow-fried spicy chicken morsels with slit chillies.'),
('Chicken Pakoda', 'Starters', 250, 0, 1, 0, 'Tender boneless chicken coated in seasoned gram flour batter and deep-fried till crunchy.'),
('Chicken Salted Pepper', 'Starters', 300, 0, 1, 0, 'Crispy chicken tossed with cracked black peppercorns, roasted garlic, and spring onion greens.'),
('Paneer Pakoda', 'Starters', 180, 1, 1, 0, 'Thick slices of fresh cottage cheese sandwiching mint chutney, battered and fried golden.'),
('Crispy Chilli Babycorn', 'Starters', 190, 1, 1, 0, 'Tender baby corn golden fried and tossed in sweet, spicy, and tangy chilli garlic sauce.'),
('American Corn Salt & Pepper', 'Starters', 200, 1, 1, 0, 'Crispy sweet corn kernels wok-tossed with freshly crushed pepper, sea salt, and scallions.'),
('Assorted Veg Pakoda Platter', 'Starters', 140, 1, 1, 0, 'Crisp seasonal vegetable fritters served hot with tangy tamarind and mint chutneys.'),
('Golden French Fries', 'Starters', 170, 1, 1, 0, 'Crispy salted potato fries served with ketchup and spicy mayonnaise.'),
('Chicken Spring Roll', 'Rolls', 250, 0, 1, 0, 'Crispy golden rolled pastry filled with minced spiced chicken, shredded cabbage, and carrots.'),
('Egg Spring Roll', 'Rolls', 180, 0, 1, 0, 'Crispy spring rolls stuffed with seasoned scrambled eggs and wok-tossed vegetables.'),
('Veg Spring Roll', 'Rolls', 150, 1, 1, 0, 'Thin flaky wrapper stuffed with crunchy julienned vegetables and oriental seasoning.'),
('Kolkata Double Egg Chicken Kathi Roll', 'Rolls', 190, 0, 1, 0, 'Crispy paratha coated with two eggs, filled with smoky spiced chicken tikka, sliced onions, and lime.'),
('Pan Fried Chicken Momo (6 Pcs)', 'Momos', 220, 0, 1, 0, 'Steamed chicken momos pan-seared to a crispy bottom and tossed in spicy Schezwan garlic sauce.'),
('Chicken Steamed Momo (6 Pcs)', 'Momos', 200, 0, 1, 0, 'Handcrafted Tibetan dumplings filled with juicy minced chicken, served with spicy red chutney and clear broth.'),
('Pan Fried Veg Momo (6 Pcs)', 'Momos', 190, 1, 1, 0, 'Veg dumplings crisped on the pan and tossed in spicy garlic chilli sauce.'),
('Veg Steamed Momo (6 Pcs)', 'Momos', 180, 1, 1, 0, 'Delicate steamed dumplings stuffed with finely minced fresh garden vegetables and herbs.'),
('Chicken Fried Rice', 'Fried Rice & Noodles', 250, 0, 1, 0, 'Wok-tossed basmati rice with diced seasoned chicken, egg ribbons, and spring onions.'),
('Egg Fried Rice', 'Fried Rice & Noodles', 220, 0, 1, 0, 'Classic Chinese wok rice tossed with scrambled egg and garden fresh vegetables.'),
('Veg Fried Rice', 'Fried Rice & Noodles', 190, 1, 1, 0, 'Steamed rice stir-fried with diced carrots, beans, baby corn, and light soy sauce.'),
('Veg Pulao', 'Fried Rice & Noodles', 180, 1, 1, 0, 'Fragrant basmati rice gently spiced with whole cloves, bay leaves, cardamom, and green peas.'),
('Jeera Rice', 'Fried Rice & Noodles', 120, 1, 1, 0, 'Fluffy basmati rice tempered with roasted cumin seeds and fresh desi ghee.'),
('Plain Steamed Rice', 'Fried Rice & Noodles', 100, 1, 1, 0, 'Premium aromatic long-grain steamed rice.'),
('Chicken Chilli Garlic Noodles', 'Fried Rice & Noodles', 250, 0, 1, 0, 'Spicy wok noodles tossed with burnt garlic, red chillies, shredded chicken, and scallions.'),
('Chicken Schezwan Noodles', 'Fried Rice & Noodles', 230, 0, 1, 0, 'Noodles tossed with shredded chicken in spicy house Schezwan pepper paste.'),
('Chicken Hakka Noodles', 'Fried Rice & Noodles', 200, 0, 1, 0, 'Traditional Kolkata style Hakka noodles tossed with sliced chicken and crisp veggies.'),
('Egg Schezwan Noodles', 'Fried Rice & Noodles', 180, 0, 1, 0, 'Spicy Schezwan noodles stir-fried with scrambled eggs and bell peppers.'),
('Veg Hakka Noodles', 'Fried Rice & Noodles', 150, 1, 1, 0, 'Mild, fragrant noodles stir-fried with shredded cabbage, carrots, capsicum, and celery.'),
('Paneer Butter Masala', 'Paneer & Veg', 300, 1, 1, 0, 'Soft cottage cheese cubes simmered in velvety tomato, cashew, and cream gravy flavored with kasuri methi.'),
('Kadhai Paneer', 'Paneer & Veg', 250, 1, 1, 0, 'Paneer cubes, bell peppers, and onions tossed in freshly roasted kadhai coriander & red chilli masala.'),
('Matar Paneer', 'Paneer & Veg', 260, 1, 1, 0, 'Classic North Indian homestyle preparation of tender green peas and paneer in rich onion gravy.'),
('Chilli Paneer (Dry / Gravy)', 'Paneer & Veg', 240, 1, 1, 0, 'Batter-fried paneer cubes tossed with capsicum and diced onions in tangy chilli soy gravy.'),
('Mushroom Masala', 'Paneer & Veg', 300, 1, 1, 0, 'Fresh button mushrooms cooked in thick roasted onion, tomato, and ground garam masala gravy.'),
('Chilli Mushroom (Dry / Gravy)', 'Paneer & Veg', 240, 1, 1, 0, 'Crispy button mushrooms tossed in spicy Indo-Chinese chilli garlic sauce.'),
('Veg Manchurian Gravy', 'Paneer & Veg', 250, 1, 1, 0, 'Crispy vegetable dumplings in savoury garlic, ginger, and soy sauce.'),
('Dal Tadka (Desi Ghee)', 'Paneer & Veg', 180, 1, 1, 0, 'Yellow toor dal tempered with cumin seeds, garlic, dry red chillies, and pure desi ghee.'),
('Dal Fry', 'Paneer & Veg', 150, 1, 1, 0, 'Comforting yellow lentils cooked with sautéed onions, tomatoes, and fresh coriander.'),
('Jonak Chicken Butter Masala', 'Chicken Specialties', 380, 0, 1, 0, 'Tandoori grilled chicken pieces simmered in silky makhani gravy enriched with butter and cream.'),
('Chicken Kosa (Assamese Style)', 'Chicken Specialties', 360, 0, 1, 0, 'Slow-roasted chicken cooked with browned onions, garlic, and rustic Assamese spices till thick and dark.'),
('Chicken Do Pyaza', 'Chicken Specialties', 330, 0, 1, 0, 'Tender chicken cooked with double the onions — sautéed paste plus crunchy caramelized petals.'),
('Mutton Kosa', 'Chicken Specialties', 450, 0, 1, 0, 'Slow-cooked succulent mutton roasted in mustard oil and aromatic spices for hours till tender.'),
('Mutton Curry with Potatoes', 'Chicken Specialties', 380, 0, 1, 0, 'Traditional Bengali & Assamese Sunday style mutton jhol with tender potatoes.'),
('Egg Masala (2 Eggs)', 'Chicken Specialties', 230, 0, 1, 0, 'Golden pan-fried boiled eggs cooked in rich spicy onion tomato gravy.'),
('Fried Fish Curry (Assam Style)', 'Fish & Seafood', 300, 0, 1, 0, 'Fresh river fish steaks fried crisp and simmered in light mustard seed, cumin, and turmeric curry.'),
('Crispy River Fish Fry', 'Fish & Seafood', 250, 0, 1, 0, 'Fresh local fish fillets marinated in spices, pan-fried to a crunchy crust with onions.'),
('Small Fish Fry (Choru Maas Bhaja)', 'Fish & Seafood', 400, 0, 1, 0, 'Assamese delicacy of tender freshwater small fish pan-crisped with slit green chillies and salt.'),
('Tandoori Chicken (Full)', 'Tandoori & Kebabs', 480, 0, 1, 0, 'Whole chicken marinated in hung yogurt, Kashmiri chillies, and tandoori spices, char-roasted in clay oven.'),
('Chicken Tikka (6 Pcs)', 'Tandoori & Kebabs', 350, 0, 1, 0, 'Smoky boneless chicken chunks char-grilled over live embers, served with mint dip.'),
('Malai Chicken Tikka (6 Pcs)', 'Tandoori & Kebabs', 480, 0, 1, 0, 'Melt-in-mouth chicken cubes marinated in heavy cream, processed cheese, and aromatic green cardamom.'),
('Afghani Chicken Tikka', 'Tandoori & Kebabs', 480, 0, 1, 0, 'Mild creamy charcoal grilled chicken flavored with roasted cashews and white pepper.'),
('Mutton Seekh Kebab', 'Tandoori & Kebabs', 480, 0, 1, 0, 'Finely minced seasoned mutton skewered and roasted over burning charcoal.'),
('Tandoori Paneer Tikka', 'Tandoori & Kebabs', 300, 1, 1, 0, 'Fresh cottage cheese cubes, capsicum, and onions marinated in ajwain tandoori masala and roasted.'),
('Jonak Special Mix Garlic Sizzler', 'Sizzlers', 500, 0, 1, 0, 'Sizzling hot cast iron platter loaded with chicken steak, sausages, butter rice, fries, and smoky garlic pepper sauce.'),
('Roast Chicken Sizzler', 'Sizzlers', 450, 0, 1, 0, 'Juicy roasted chicken breast served over sizzling bed of butter noodles with sauteed vegetables.'),
('Butter Naan', 'Breads', 60, 1, 1, 0, 'Soft, pillowy refined flour bread baked in tandoor and brushed generously with desi butter.'),
('Butter Tandoori Roti', 'Breads', 35, 1, 1, 0, 'Crispy whole wheat bread baked against the clay walls of our tandoor with fresh butter.'),
('Butter Tawa Roti', 'Breads', 40, 1, 1, 0, 'Homestyle soft puffed whole wheat flatbread made on tawa, brushed with pure butter.'),
('Plain Tawa Roti', 'Breads', 30, 1, 1, 0, 'Simple healthy whole wheat roti baked fresh to order.'),
('Mix Ice Cream Royal Sundae', 'Desserts & Beverages', 200, 1, 1, 0, 'Trio of vanilla, chocolate, and butterscotch ice creams topped with crunchy nuts and chocolate syrup.'),
('Belgian Chocolate Ice Cream', 'Desserts & Beverages', 180, 1, 1, 0, 'Rich, dense double chocolate ice cream scoop.'),
('Crunchy Butterscotch Ice Cream', 'Desserts & Beverages', 150, 1, 1, 0, 'Smooth cream with crunchy caramel cashew praline.'),
('Assam Special Milk Masala Chai', 'Desserts & Beverages', 40, 1, 1, 0, 'Premium strong Assam CTC tea brewed with crushed ginger, green cardamom, and fresh creamy milk.'),
('Jonak Frothy Filter Coffee', 'Desserts & Beverages', 60, 1, 1, 0, 'Steaming hot aromatic frothy milk coffee.'),
('Fresh Lime Soda (Sweet / Salt)', 'Desserts & Beverages', 80, 1, 1, 0, 'Chilled sparkling soda with freshly squeezed Barpeta lemons and roasted cumin.');

-- 2. Insert 9 Rooms
INSERT INTO rooms (room_number, category, price, cleaning_status, is_available, floor) VALUES
('101', 'Suite Room (A/C)', 5000, 'Dirty / Needs Cleaning', 1, '1st Floor'),
('201', 'Deluxe Room (A/C)', 2500, 'Clean & Ready', 0, '2nd Floor'),
('202', 'Single Room (A/C)', 2000, 'Clean & Ready', 0, '2nd Floor'),
('203', 'Deluxe Room (A/C)', 2500, 'Clean & Ready', 1, '2nd Floor'),
('204', 'Twin Room (A/C)', 3500, 'Clean & Ready', 0, '2nd Floor'),
('301', 'Deluxe Room (A/C)', 2500, 'Clean & Ready', 1, '3rd Floor'),
('302', 'Single Room (Non-A/C)', 1400, 'Clean & Ready', 1, '3rd Floor'),
('303', 'Twin Room (Non-A/C)', 3500, 'Clean & Ready', 1, '3rd Floor'),
('304', 'Single Room (Non-A/C)', 1400, 'Clean & Ready', 1, '3rd Floor');

-- 3. Insert Raw Inventory Items
INSERT INTO inventory (name, category, current_stock, unit, min_threshold, cost_per_unit) VALUES
('Fresh Broiler & Local Chicken', 'Meat & Poultry', 18.5, 'kg', 5, 220),
('Tender Fresh Mutton (Goat)', 'Meat & Poultry', 8, 'kg', 3, 750),
('Fresh Local Fish (Rohu/Bhakua)', 'Meat & Poultry', 12, 'kg', 4, 280),
('Fresh Malai Paneer', 'Dairy & Cheese', 9.5, 'kg', 3, 360),
('Aged Basmati Biryani Rice', 'Grains & Staples', 45, 'kg', 15, 95),
('Refined & Mustard Cooking Oil', 'Oils & Spices', 32, 'Liters', 10, 140),
('Commercial LPG Gas 19kg Cylinders', 'Fuel & Energy', 3, 'Cylinders', 2, 1850),
('Momo & Roll Flour (Maida)', 'Grains & Staples', 28, 'kg', 8, 42),
('Soft Drinks & Packaged Mineral Water', 'Beverages', 8, 'Crates', 3, 480),
('Hotel Toiletries & Fresh Linen Sets', 'Housekeeping', 26, 'Sets', 10, 120);

-- 4. Insert Multi-Role Staff
INSERT INTO staff (name, role, pin, phone, shift, is_active) VALUES
('Bishnu Choudhury', 'owner', '1234', '+91 96785 82286', 'All Day', 1),
('Biki Sharma', 'reception', '2222', '+91 98540 11223', 'Morning (8 AM - 4 PM)', 1),
('Chef Ratan Das', 'kitchen', '3333', '+91 94350 33445', 'Full Shift (10 AM - 10 PM)', 1),
('Monojit Roy', 'delivery', '4444', '+91 88760 55667', 'Day & Evening (11 AM - 9 PM)', 1),
('Rahul Barman', 'housekeeping', '5555', '+91 91010 77889', 'Morning (7 AM - 3 PM)', 1);

-- 5. Insert Customers CRM
INSERT INTO customers (name, phone, total_orders, total_spend, vip_tier) VALUES
('Pranab Kalita', '9854123490', 1, 5998, 'New Customer'),
('Dr. Himanta Baishya', '9435098765', 1, 3998, 'New Customer'),
('Rituraj Das', '9864012345', 1, 1140, 'New Customer'),
('Bikash Sarma', '9101234567', 1, 620, 'New Customer'),
('Anamika Medhi', '7002345678', 1, 610, 'New Customer');

-- 6. Insert Default Tasks
INSERT INTO tasks (title, assigned_to, shift, priority, is_completed) VALUES
('Morning Kitchen Prep & Stock Check', 'Kitchen', 'Morning', 'High', 1),
('Room 101-103 Linen Change & Sanitization', 'Housekeeping', 'Morning', 'High', 0),
('Front Desk Guest Log & Register Verification', 'Reception', 'Morning', 'Medium', 1),
('Evening Delivery Bike Fuel & Bag Sanitization', 'Delivery', 'Evening', 'High', 0),
('Daily Z-Report & Night Audit Balance', 'Owner', 'Night', 'Critical', 0);
