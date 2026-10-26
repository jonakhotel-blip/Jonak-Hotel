# Jonak Hotel & Restaurant • Barpeta, Assam
> **Royal Assamese Warmth meets 5-Star Luxury**
> Address: BH Road, near NRL Petrol Pump, Donakuchi / Garemara Pathar, Barpeta, Assam 781314
> Official Phone / Reception: **+91 96785 82286** | WhatsApp: **+91 96785 82286**
> Live Website Domain: `https://jonakhotelgroup.in/`

---

## 🌟 Executive Summary & Features Rebuilt

This project is an ultra-premium, high-speed, local SEO-dominant web platform and owner command center for **Jonak Hotel & Restaurant**, Barpeta's #1 rated hospitality and dining establishment (4.2★ Google Rating based on 128+ verified reviews).

### 1. Luxury Customer Website & Ordering Engine
- **Visual Aesthetics:** Royal Midnight/Charcoal (`#0B1120`), Royal Gold (`#D4AF37`), Warm Assamese Muga Silk (`#E5C158`), and Crisp Ivory (`#FAF8F5`). Glassmorphism cards with gold ambient lighting and responsive mobile floating dock.
- **Authentic Hotel Media:** Downloaded and embedded genuine photographs of Jonak Hotel's luxury suites, executive rooms, dining hall, open stage, and authentic branding (`jonak.png`, `IMG_5203.JPG` - `IMG_5229.JPG`).
- **Full Digital Menu (Extracted directly from official `menu.pdf`):**
  - Categorized into 13 visual filters: *Biryani, Chicken Specialties, Starters (Veg & Non-Veg), Rolls, Momos, Fried Rice & Noodles, Paneer & Veg, Fish & Seafood, Tandoori & Kebabs, Sizzlers, Breads, Desserts & Beverages*.
  - Veg / Non-Veg indicators (standard green square / red square symbols).
  - "Best Seller" and "Chef Special" badges.
  - Direct link to download the original PDF Menu (`/menu.pdf`).
- **Smart 5 KM Delivery Fee Engine:**
  - **Three Order Modes:**
    1. **Home Delivery**
    2. **In-Room Dining (Enter Room No.)**
    3. **Dine-In / Takeaway**
  - **Distance Calculator:**
    - Live Browser GPS Geolocation (calculates distance from Jonak Hotel coordinates: `26.3308° N, 91.0064° E` using the Haversine formula).
    - Barpeta Landmarks / Localities Dropdown (Donakuchi, Garemara Pathar, Barpeta Town, Barpeta Satra, FAAMCH Hospital, Howly Road, Bhella, Mandia, Barpeta Road) for 1-tap selection if GPS is disabled.
    - **Within 5 KM:** Automatically unlocks **100% FREE DELIVERY (₹0)** with a celebratory badge and confetti animation: *"🎉 You unlocked FREE Delivery (Within 5 KM)!"*
    - **Above 5 KM:** Automatically adds ₹15/KM (owner-configurable) for transparent billing.
  - **One-Tap WhatsApp & Reception Checkout:**
    - Instantly logs order in the Hotel Command Center with a unique Order ID (e.g., `#JNK-8421`).
    - Dispatches a formatted invoice directly to WhatsApp reception (`+91 96785 82286`) with customer name, phone, itemized bill, address/room number, and live Google Maps location link.
    - Supports Cash on Delivery (COD) and Online UPI (with instant QR code information and UPI ID: `9678582286@upi`).
- **Smart Room Showcase & Instant Booking Flow:**
  - Categories: *Standard AC Executive Room (₹1,499/night)*, *Deluxe Royal AC Room (₹1,999/night)*, *Jonak Presidential Family Suite (₹2,999/night)*.
  - Live availability badges (*"Available Today" / "Filling Fast" / "Sold Out"*) synced in real-time with the Admin Panel.
  - High-res photo galleries, capacity, bed size, and amenity checklists.
  - Interactive booking modal with automatic night calculations and direct WhatsApp confirmation.
- **Events & "Open Stage" Celebration Booking:**
  - Birthday parties, anniversaries, corporate seminars, and open stage musical evenings.
  - Interactive "Get Instant Event Quote" calculator estimating budget based on guest count and catering choice.
- **Local SEO Dominance for Barpeta:**
  - Optimized H1/H2/H3 tags for *Best Hotel in Barpeta*, *Best Restaurant in Barpeta Assam*, *Online Food Delivery in Barpeta*, *AC Rooms near BH Road & FAAMCH Barpeta*.
  - Full JSON-LD structured data for `Hotel`, `Restaurant`, `LocalBusiness`, and `FAQPage`.
  - Nearby Landmarks Distance Guide (Barpeta Satra ~3.8 km, FAAMCH ~4.2 km, Donakuchi NRL ~0.2 km, Barpeta Road Station ~22 km).
  - Search engine `sitemap.xml` and `robots.txt` in `public/`.

---

### 2. Ultra-Simple "Owner Command Center" (Admin Panel)
Accessible via the discrete **"Owner Command Center"** link in the footer or `/admin` / `#admin`:
- **Default Owner PIN:** `1234` (or password `admin@jonak`). Also includes a **1-Tap Instant Demo Login** button for frictionless testing.
- **Zero-Learning-Curve Dashboard:**
  - Big summary stat cards: Today's Orders, Room Booking Enquiries, Menu Items in Stock, and Kitchen Status.
  - Built-in **Audio Notification Chime** (Web Audio API) when incoming orders arrive, complete with a "Test Sound" button.
- **One-Tap Menu & Price Manager (Like Swiggy / Zomato Partner App):**
  - **1-Tap Stock Switch (IN STOCK / OUT OF STOCK):** When a dish finishes for the night, the owner taps one button on their phone, and it immediately shows as "Sold Out / Unavailable" on the customer website.
  - **Inline Price Editor:** Tap any dish price and type the new amount.
  - **1-Tap Best Seller Toggle:** Mark items as Chef's Special with one click.
  - **Add New Dish in 10 Seconds:** Modal to add new items with price, category, veg/non-veg, and description.
- **Room Tariff & Availability Controller:**
  - 1-Tap status toggle for each room category: *"Available"*, *"Filling Fast"*, or *"Sold Out / Housefull"*.
  - Instant nightly tariff editor.
- **Delivery Rules & Hotel Settings:**
  - Edit Free Delivery Radius (default: 5 KM).
  - Edit per-KM extra charge (default: ₹15/KM).
  - Kitchen Status switch: Open (Accepting Orders) vs Closed.
  - Edit and toggle the top announcement marquee banner.
  - Change Owner PIN and Reset to defaults option.
- **Smart Room & Table QR Generator:**
  - Generate instant scannable QR stands & tent cards for hotel rooms (`?room=101`) and restaurant tables (`?table=4`).
  - Pre-fills room/table number automatically in the customer's cart with 100% Free In-Room Delivery.
  - Instant 1-tap print feature (`window.print()`) with print-optimized CSS layout.
  - Download PNG and Copy Link controls.
- **Security Cleanup:**
  - Demo login bypass removed completely.
  - All admin update APIs authenticated with Owner PIN/token.
  - Public `/api/state` endpoint sanitizes internal security PIN.
- **Order & Booking Log:**
  - Live status updater (`New` -> `Confirmed` -> `Preparing` -> `Out for Delivery` -> `Delivered`).
  - Direct **"Call Customer"** (`tel:...`) and **"Reply on WhatsApp"** (`wa.me/...`) buttons next to each record.
  - Multi-device real-time sync via Server-Sent Events (SSE) and persistent JSON storage.

---

## 🛠️ Local Development & Running

```bash
# 1. Install dependencies
npm install

# 2. Run Real-Time Backend API Server (Port 5000)
npm run server

# 3. Run Frontend Development Server (Port 3000 with auto-proxy to port 5000)
npm run dev

# 4. Production Build & Full Unified Server
npm run build
npm start
# (Runs both the real-time API and serves dist/ on http://localhost:5000)
```
