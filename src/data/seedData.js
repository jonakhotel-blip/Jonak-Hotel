// Initial seed data extracted from Jonak Hotel & Restaurant official records & menu.pdf

export const HOTEL_INFO = {
  name: "Jonak Hotel & Restaurant",
  tagline: "Royal Assamese Warmth meets 5-Star Hospitality",
  phone: "+91 96785 82286",
  phoneRaw: "9678582286",
  whatsapp: "919678582286",
  email: "jonakhotel@gmail.com",
  upiId: "paytm.s1i7is2@pty",
  merchantName: "JONAK HOTEL AND RESTAURANT",
  paytmQrImage: "/images/jonak-paytm-qr.png",
  address: "BH Road, near NRL Petrol Pump, Donakuchi / Garemara Pathar, Barpeta, Assam 781314",
  googleRating: 4.2,
  reviewsCount: 128,
  coordinates: {
    lat: 26.3308,
    lng: 91.0064
  }
};

export const INITIAL_SETTINGS = {
  kitchenOpen: true,
  freeDeliveryRadiusKm: 5,
  extraFeePerKm: 15,
  minOrderFreeDelivery: 199,
  announcementActive: true,
  announcementText: "🎉 Grand Weekend Special: 100% FREE Home Delivery across Barpeta (Within 5 KM) on all orders! Try our famous Dum Biryani & Local Chicken Curry.",
  adminPin: "1234",
  gstPercent: 5,
  applyGst: true,
  upiId: "paytm.s1i7is2@pty",
  merchantName: "JONAK HOTEL AND RESTAURANT",
  paytmQrImage: "/images/jonak-paytm-qr.png"
};

export const BARPETA_LOCALITIES = [
  { id: "donakuchi", name: "Donakuchi (Near NRL Petrol Pump)", distanceKm: 0.4 },
  { id: "garemarapathar", name: "Garemara Pathar / BH Road", distanceKm: 0.9 },
  { id: "barpeta_town", name: "Barpeta Town (Bazar / D.C. Office)", distanceKm: 3.2 },
  { id: "barpeta_satra", name: "Barpeta Satra / Kirtan Ghar Area", distanceKm: 3.8 },
  { id: "faamch", name: "FAAMCH (Fakhruddin Ali Ahmed Medical College)", distanceKm: 4.2 },
  { id: "barpeta_station", name: "Barpeta ASTC Bus Station", distanceKm: 3.5 },
  { id: "howly_road", name: "Howly Road / Bypass Junction", distanceKm: 6.5 },
  { id: "bhella", name: "Bhella Chariali", distanceKm: 8.0 },
  { id: "mandia", name: "Mandia Town", distanceKm: 11.5 },
  { id: "barpeta_road", name: "Barpeta Road Railway Station Area", distanceKm: 22.0 }
];

// ----------------------------------------------------------------------------
// OFFICIAL PHYSICAL ROOM INVENTORY (9 PHYSICAL ROOMS ACROSS 3 FLOORS)
// ----------------------------------------------------------------------------
export const OFFICIAL_PHYSICAL_ROOMS = [
  // 1st Floor
  { 
    number: "101", 
    roomNumber: "101",
    floor: "1st Floor",
    floorNumber: 1, 
    categoryId: "suite-ac", 
    categoryName: "Suite Room (A/C)", 
    tariff: 5000, 
    basePrice: 5000,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Luxury Presidential Suite, Air-Conditioned, Premium Amenities, In-Room Dining, Free Wi-Fi & Parking"
  },

  // 2nd Floor
  { 
    number: "201", 
    roomNumber: "201",
    floor: "2nd Floor",
    floorNumber: 2, 
    categoryId: "deluxe-ac", 
    categoryName: "Deluxe Room (A/C)", 
    tariff: 2500, 
    basePrice: 2500,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Executive Deluxe Double Bed, Air-Conditioned, Work Desk, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "202", 
    roomNumber: "202",
    floor: "2nd Floor",
    floorNumber: 2, 
    categoryId: "single-ac", 
    categoryName: "Single Room (A/C)", 
    tariff: 2000, 
    basePrice: 2000,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Comfortable Single/Solo Traveler AC Room, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "203", 
    roomNumber: "203",
    floor: "2nd Floor",
    floorNumber: 2, 
    categoryId: "deluxe-ac", 
    categoryName: "Deluxe Room (A/C)", 
    tariff: 2500, 
    basePrice: 2500,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Executive Deluxe Double Bed, Air-Conditioned, Work Desk, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "204", 
    roomNumber: "204",
    floor: "2nd Floor",
    floorNumber: 2, 
    categoryId: "twin-ac", 
    categoryName: "Twin Room (A/C)", 
    tariff: 3500, 
    basePrice: 3500,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Spacious Twin Beds, Air-Conditioned, Ideal for Family/Friends, In-Room Dining, Free Wi-Fi"
  },

  // 3rd Floor
  { 
    number: "301", 
    roomNumber: "301",
    floor: "3rd Floor",
    floorNumber: 3, 
    categoryId: "deluxe-ac", 
    categoryName: "Deluxe Room (A/C)", 
    tariff: 2500, 
    basePrice: 2500,
    isAc: true, 
    ac: true,
    isAvailable: true, 
    guestName: "",
    highlights: "Executive Deluxe Double Bed, Air-Conditioned, Work Desk, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "302", 
    roomNumber: "302",
    floor: "3rd Floor",
    floorNumber: 3, 
    categoryId: "single-non-ac", 
    categoryName: "Single Room (Non-A/C)", 
    tariff: 1400, 
    basePrice: 1400,
    isAc: false, 
    ac: false,
    isAvailable: true, 
    guestName: "",
    highlights: "Budget-Friendly Non-A/C Single Room, Clean & Comfortable, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "303", 
    roomNumber: "303",
    floor: "3rd Floor",
    floorNumber: 3, 
    categoryId: "twin-non-ac", 
    categoryName: "Twin Room (Non-A/C)", 
    tariff: 3500, 
    basePrice: 3500,
    isAc: false, 
    ac: false,
    isAvailable: true, 
    guestName: "",
    highlights: "Spacious Twin Beds, Non-A/C Well-Ventilated Room, In-Room Dining, Free Wi-Fi"
  },
  { 
    number: "304", 
    roomNumber: "304",
    floor: "3rd Floor",
    floorNumber: 3, 
    categoryId: "single-non-ac", 
    categoryName: "Single Room (Non-A/C)", 
    tariff: 1400, 
    basePrice: 1400,
    isAc: false, 
    ac: false,
    isAvailable: true, 
    guestName: "",
    highlights: "Budget-Friendly Non-A/C Single Room, Clean & Comfortable, In-Room Dining, Free Wi-Fi"
  }
];

// ----------------------------------------------------------------------------
// OFFICIAL ROOM CATEGORIES (6 CATEGORIES, 9 ROOMS TOTAL)
// ----------------------------------------------------------------------------
export const INITIAL_ROOMS = [
  {
    id: "suite-ac",
    title: "Suite Room (A/C)",
    type: "Presidential Suite",
    isAc: true,
    floor: "1st Floor",
    assignedRooms: ["101"],
    tariff: 5000,
    originalTariff: 5800,
    status: "Available",
    capacity: "2-3 Guests / VIPs",
    bed: "King Size Royal Bed",
    size: "420 sq.ft",
    image: "/images/IMG_5217.JPG",
    gallery: ["/images/IMG_5217.JPG", "/images/IMG_5228.JPG", "/images/IMG_5206.JPG"],
    amenities: [
      "Master Climate Control Split A/C",
      "Executive Living Area & Work Desk",
      "50-inch 4K Smart TV",
      "Ultra High-Speed Wi-Fi",
      "Luxury Attached Bath & Geyser",
      "24/7 Express In-Room Dining",
      "Free Reserved VIP Car Parking",
      "100% Generator Power Backup"
    ],
    description: "Jonak Hotel's most prestigious accommodation (Room 101). Features an expansive bedroom, private living lounge, plush furnishings, and personalized hospitality for dignitaries and wedding VIPs."
  },
  {
    id: "twin-ac",
    title: "Twin Room (A/C)",
    type: "Twin Executive (A/C)",
    isAc: true,
    floor: "2nd Floor",
    assignedRooms: ["204"],
    tariff: 3500,
    originalTariff: 4200,
    status: "Available",
    capacity: "2 Adults + 1 Child",
    bed: "2 Spacious Twin Luxury Beds",
    size: "320 sq.ft",
    image: "/images/IMG_5222.JPG",
    gallery: ["/images/IMG_5222.JPG", "/images/IMG_5206.JPG", "/images/IMG_5227.JPG"],
    amenities: [
      "Whisper-Quiet Split AC",
      "Two Separate Ergonomic Twin Beds",
      "High-Speed Wi-Fi",
      "Smart HD LED TV",
      "Modern Bathroom with 24/7 Hot Water",
      "24/7 In-Room Food Delivery",
      "Daily Housekeeping",
      "Full Power Backup"
    ],
    description: "Spacious twin-bedded sanctuary (Room 204) designed for business colleagues, friends, or traveling family members seeking separate premium beds with full air-conditioned comfort."
  },
  {
    id: "twin-non-ac",
    title: "Twin Room (Non-A/C)",
    type: "Twin Standard (Non-A/C)",
    isAc: false,
    floor: "3rd Floor",
    assignedRooms: ["303"],
    tariff: 3500,
    originalTariff: 3900,
    status: "Available",
    capacity: "2 Adults + 1 Child",
    bed: "2 Spacious Twin Beds",
    size: "320 sq.ft",
    image: "/images/IMG_5227.JPG",
    gallery: ["/images/IMG_5227.JPG", "/images/IMG_5222.JPG", "/images/IMG_5206.JPG"],
    amenities: [
      "Naturally Well-Ventilated Room",
      "High-Speed Ceiling Fans",
      "Two Separate Twin Beds",
      "High-Speed Wi-Fi",
      "Smart LED TV",
      "Attached Bathroom with Geyser",
      "24/7 In-Room Dining Service",
      "Free Parking"
    ],
    description: "Bright, airy 3rd-floor room (Room 303) featuring large windows with natural cross-ventilation, comfortable twin beds, and complete hotel services without air conditioning."
  },
  {
    id: "deluxe-ac",
    title: "Deluxe Room (A/C)",
    type: "Executive Deluxe (A/C)",
    isAc: true,
    floor: "2nd & 3rd Floors",
    assignedRooms: ["201", "203", "301"],
    tariff: 2500,
    originalTariff: 3000,
    status: "Available",
    capacity: "2 Adults",
    bed: "Executive Deluxe Double Bed",
    size: "280 sq.ft",
    image: "/images/IMG_5206.JPG",
    gallery: ["/images/IMG_5206.JPG", "/images/IMG_5222.JPG", "/images/IMG_5217.JPG"],
    amenities: [
      "Inverter Split Air Conditioner",
      "Executive Deluxe Double Bed",
      "High-Speed Wi-Fi",
      "HD Smart TV with Cable Channels",
      "Attached Bathroom & Geyser",
      "Dedicated Work Desk & Chair",
      "24/7 In-Room Dining Service",
      "Full Power Backup"
    ],
    description: "Our most sought-after category (Rooms 201, 203, 301). Perfect for couples and business executives needing a polished, peaceful AC room near Barpeta's commercial hub."
  },
  {
    id: "single-ac",
    title: "Single Room (A/C)",
    type: "Single Executive (A/C)",
    isAc: true,
    floor: "2nd Floor",
    assignedRooms: ["202"],
    tariff: 2000,
    originalTariff: 2400,
    status: "Available",
    capacity: "1 Adult (Solo Traveler / Executive)",
    bed: "Plush Single Luxury Bed",
    size: "190 sq.ft",
    image: "/images/IMG_5228.JPG",
    gallery: ["/images/IMG_5228.JPG", "/images/IMG_5206.JPG", "/images/IMG_5222.JPG"],
    amenities: [
      "Whisper-Quiet Split AC",
      "Plush Single Bed",
      "High-Speed Wi-Fi",
      "HD Smart LED TV",
      "Attached Clean Bathroom & Geyser",
      "In-Room Food Delivery",
      "Daily Housekeeping",
      "Generator Backup"
    ],
    description: "Tailored specifically for solo executives, medical representatives, and lone travelers (Room 202). Compact, ultra-clean, and fully air-conditioned for a restful night."
  },
  {
    id: "single-non-ac",
    title: "Single Room (Non-A/C)",
    type: "Single Budget (Non-A/C)",
    isAc: false,
    floor: "3rd Floor",
    assignedRooms: ["302", "304"],
    tariff: 1400,
    originalTariff: 1700,
    status: "Available",
    capacity: "1 Adult",
    bed: "Comfortable Single Bed",
    size: "170 sq.ft",
    image: "/images/IMG_5229.JPG",
    gallery: ["/images/IMG_5229.JPG", "/images/IMG_5206.JPG", "/images/IMG_5228.JPG"],
    amenities: [
      "Naturally Ventilated Room",
      "Comfortable Single Bed",
      "High-Speed Wi-Fi",
      "Attached Private Bathroom",
      "High-Power Ceiling Fan",
      "In-Room Food Delivery Service",
      "24/7 Hot Water on Request",
      "Complimentary Filtered Water"
    ],
    description: "Jonak Hotel's most economical stay (Rooms 302, 304). Spotlessly clean, peaceful non-AC rooms offering unbeatable value with full access to restaurant dining."
  }
];

export const INITIAL_MENU = [
  // --- BIRIYANI ---
  {
    id: "bir-1",
    name: "Jonak Special Dum Biriyani",
    category: "Biryani",
    price: 350,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Slow-cooked fragrant aged Basmati rice layered with juicy marinated meat, boiled egg, saffron & caramelized onions in a sealed handi."
  },
  {
    id: "bir-2",
    name: "Chicken Biriyani",
    category: "Biryani",
    price: 300,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Classic Royal Dum Biryani infused with whole cardamom, cloves, succulent chicken cuts, served with raita and gravy."
  },
  {
    id: "bir-3",
    name: "Mutton Biriyani",
    category: "Biryani",
    price: 350,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Tender goat meat slow-simmered with aromatic saffron rice, rose water, and royal Awadhi spices."
  },
  {
    id: "bir-4",
    name: "Egg Biriyani",
    category: "Biryani",
    price: 250,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Aromatic basmati rice layered with crispy golden-fried spiced eggs and caramelized onions."
  },
  {
    id: "bir-5",
    name: "Veg Dum Biriyani",
    category: "Biryani",
    price: 200,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Fresh garden vegetables, soft paneer cubes, and aromatic whole spices cooked in aged basmati rice."
  },
  {
    id: "bir-6",
    name: "Special Egg Devil (2 Pcs)",
    category: "Biryani",
    price: 200,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Crispy Bengali & Assamese style spiced mashed potato croquettes stuffed with seasoned boiled eggs."
  },

  // --- CHICKEN SPECIAL ---
  {
    id: "chk-1",
    name: "Jonak Chicken Maharaja",
    category: "Chicken Specialties",
    price: 300,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Rich and royal cashew nut, poppy seed, and fresh cream gravy with succulent boneless chicken morsels."
  },
  {
    id: "chk-2",
    name: "Chicken Maharani",
    category: "Chicken Specialties",
    price: 350,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Delicate Mughlai specialty cooked in silky saffron, almond paste, and green cardamom sauce."
  },
  {
    id: "chk-3",
    name: "Local Chicken Curry (Desi Kukkad)",
    category: "Chicken Specialties",
    price: 400,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Authentic Assamese country-style local chicken curry cooked with mustard oil, potatoes, and native ginger-garlic."
  },
  {
    id: "chk-4",
    name: "Chicken Hyderabadi",
    category: "Chicken Specialties",
    price: 400,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Spicy and tangy green masala curry made with fresh mint, coriander, brown onions, and green chillies."
  },
  {
    id: "chk-5",
    name: "Crispy Dragon Chicken",
    category: "Chicken Specialties",
    price: 250,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Crispy fried chicken strips wok-tossed in fiery red dragon sauce with bell peppers and roasted cashews."
  },
  {
    id: "chk-6",
    name: "Chicken Drumsticks (Tangdi Kabab)",
    category: "Chicken Specialties",
    price: 250,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Juicy chicken legs marinated in rich yogurt-spice marinade, grilled to perfection."
  },
  {
    id: "chk-7",
    name: "Crispy KFC Style Chicken Bucket",
    category: "Chicken Specialties",
    price: 300,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Crunchy double-battered golden fried chicken pieces served with spicy dip and mayo."
  },
  {
    id: "chk-8",
    name: "Golden Chicken Fingers",
    category: "Chicken Specialties",
    price: 200,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Panko breadcrumb-crusted chicken tenders fried golden and crisp."
  },
  {
    id: "chk-9",
    name: "Chicken Cutlet",
    category: "Chicken Specialties",
    price: 250,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Minced chicken patty spiced with herbs and pan-fried with a crunchy exterior."
  },
  {
    id: "chk-10",
    name: "Chicken Nuggets (8 Pcs)",
    category: "Chicken Specialties",
    price: 300,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Tender chicken bite-sized nuggets served with tangy tomato garlic dip."
  },

  // --- STARTERS (NON-VEG & VEG) ---
  {
    id: "str-1",
    name: "Chilli Chicken (Dry / Gravy)",
    category: "Starters",
    price: 280,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Iconic Indo-Chinese dish of crispy chicken tossed with green chillies, onions, capsicum, and dark soya sauce."
  },
  {
    id: "str-2",
    name: "Chicken Lollipop (6 Pcs)",
    category: "Starters",
    price: 300,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Frenched chicken winglets tossed in spicy Schezwan sauce or served crispy with spicy garlic dip."
  },
  {
    id: "str-3",
    name: "Crispy Fried Chicken with Honey Sauce",
    category: "Starters",
    price: 350,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Crunchy batter-fried chicken supreme glazed in our chef's signature sweet & spicy honey garlic glaze."
  },
  {
    id: "str-4",
    name: "Chicken Dry Fry",
    category: "Starters",
    price: 300,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Assam highway dhaba style shallow-fried spicy chicken morsels with slit chillies."
  },
  {
    id: "str-5",
    name: "Chicken Pakoda",
    category: "Starters",
    price: 250,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Tender boneless chicken coated in seasoned gram flour batter and deep-fried till crunchy."
  },
  {
    id: "str-6",
    name: "Chicken Salted Pepper",
    category: "Starters",
    price: 300,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Crispy chicken tossed with cracked black peppercorns, roasted garlic, and spring onion greens."
  },
  {
    id: "str-7",
    name: "Paneer Pakoda",
    category: "Starters",
    price: 180,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Thick slices of fresh cottage cheese sandwiching mint chutney, battered and fried golden."
  },
  {
    id: "str-8",
    name: "Crispy Chilli Babycorn",
    category: "Starters",
    price: 190,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Tender baby corn golden fried and tossed in sweet, spicy, and tangy chilli garlic sauce."
  },
  {
    id: "str-9",
    name: "American Corn Salt & Pepper",
    category: "Starters",
    price: 200,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crispy sweet corn kernels wok-tossed with freshly crushed pepper, sea salt, and scallions."
  },
  {
    id: "str-10",
    name: "Assorted Veg Pakoda Platter",
    category: "Starters",
    price: 140,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crisp seasonal vegetable fritters served hot with tangy tamarind and mint chutneys."
  },
  {
    id: "str-11",
    name: "Golden French Fries",
    category: "Starters",
    price: 170,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crispy salted potato fries served with ketchup and spicy mayonnaise."
  },

  // --- ROLLS ---
  {
    id: "rol-1",
    name: "Chicken Spring Roll",
    category: "Rolls",
    price: 250,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Crispy golden rolled pastry filled with minced spiced chicken, shredded cabbage, and carrots."
  },
  {
    id: "rol-2",
    name: "Egg Spring Roll",
    category: "Rolls",
    price: 180,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Crispy spring rolls stuffed with seasoned scrambled eggs and wok-tossed vegetables."
  },
  {
    id: "rol-3",
    name: "Veg Spring Roll",
    category: "Rolls",
    price: 150,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Thin flaky wrapper stuffed with crunchy julienned vegetables and oriental seasoning."
  },
  {
    id: "rol-4",
    name: "Kolkata Double Egg Chicken Kathi Roll",
    category: "Rolls",
    price: 190,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Crispy paratha coated with two eggs, filled with smoky spiced chicken tikka, sliced onions, and lime."
  },

  // --- MOMOS ---
  {
    id: "mom-1",
    name: "Pan Fried Chicken Momo (6 Pcs)",
    category: "Momos",
    price: 220,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Steamed chicken momos pan-seared to a crispy bottom and tossed in spicy Schezwan garlic sauce."
  },
  {
    id: "mom-2",
    name: "Chicken Steamed Momo (6 Pcs)",
    category: "Momos",
    price: 200,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Handcrafted Tibetan dumplings filled with juicy minced chicken, served with spicy red chutney and clear broth."
  },
  {
    id: "mom-3",
    name: "Pan Fried Veg Momo (6 Pcs)",
    category: "Momos",
    price: 190,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Veg dumplings crisped on the pan and tossed in spicy garlic chilli sauce."
  },
  {
    id: "mom-4",
    name: "Veg Steamed Momo (6 Pcs)",
    category: "Momos",
    price: 180,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Delicate steamed dumplings stuffed with finely minced fresh garden vegetables and herbs."
  },

  // --- FRIED RICE & NOODLES ---
  {
    id: "ric-1",
    name: "Chicken Fried Rice",
    category: "Fried Rice & Noodles",
    price: 250,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Wok-tossed basmati rice with diced seasoned chicken, egg ribbons, and spring onions."
  },
  {
    id: "ric-2",
    name: "Egg Fried Rice",
    category: "Fried Rice & Noodles",
    price: 220,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Classic Chinese wok rice tossed with scrambled egg and garden fresh vegetables."
  },
  {
    id: "ric-3",
    name: "Veg Fried Rice",
    category: "Fried Rice & Noodles",
    price: 190,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Steamed rice stir-fried with diced carrots, beans, baby corn, and light soy sauce."
  },
  {
    id: "ric-4",
    name: "Veg Pulao",
    category: "Fried Rice & Noodles",
    price: 180,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Fragrant basmati rice gently spiced with whole cloves, bay leaves, cardamom, and green peas."
  },
  {
    id: "ric-5",
    name: "Jeera Rice",
    category: "Fried Rice & Noodles",
    price: 120,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Fluffy basmati rice tempered with roasted cumin seeds and fresh desi ghee."
  },
  {
    id: "ric-6",
    name: "Plain Steamed Rice",
    category: "Fried Rice & Noodles",
    price: 100,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Premium aromatic long-grain steamed rice."
  },
  {
    id: "nod-1",
    name: "Chicken Chilli Garlic Noodles",
    category: "Fried Rice & Noodles",
    price: 250,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Spicy wok noodles tossed with burnt garlic, red chillies, shredded chicken, and scallions."
  },
  {
    id: "nod-2",
    name: "Chicken Schezwan Noodles",
    category: "Fried Rice & Noodles",
    price: 230,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Noodles tossed with shredded chicken in spicy house Schezwan pepper paste."
  },
  {
    id: "nod-3",
    name: "Chicken Hakka Noodles",
    category: "Fried Rice & Noodles",
    price: 200,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Traditional Kolkata style Hakka noodles tossed with sliced chicken and crisp veggies."
  },
  {
    id: "nod-4",
    name: "Egg Schezwan Noodles",
    category: "Fried Rice & Noodles",
    price: 180,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Spicy Schezwan noodles stir-fried with scrambled eggs and bell peppers."
  },
  {
    id: "nod-5",
    name: "Veg Hakka Noodles",
    category: "Fried Rice & Noodles",
    price: 150,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Mild, fragrant noodles stir-fried with shredded cabbage, carrots, capsicum, and celery."
  },

  // --- MAIN COURSE VEG ---
  {
    id: "veg-1",
    name: "Paneer Butter Masala",
    category: "Paneer & Veg",
    price: 300,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Soft cottage cheese cubes simmered in velvety tomato, cashew, and cream gravy flavored with kasuri methi."
  },
  {
    id: "veg-2",
    name: "Kadhai Paneer",
    category: "Paneer & Veg",
    price: 250,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Paneer cubes, bell peppers, and onions tossed in freshly roasted kadhai coriander & red chilli masala."
  },
  {
    id: "veg-3",
    name: "Matar Paneer",
    category: "Paneer & Veg",
    price: 260,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Classic North Indian homestyle preparation of tender green peas and paneer in rich onion gravy."
  },
  {
    id: "veg-4",
    name: "Chilli Paneer (Dry / Gravy)",
    category: "Paneer & Veg",
    price: 240,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Batter-fried paneer cubes tossed with capsicum and diced onions in tangy chilli soy gravy."
  },
  {
    id: "veg-5",
    name: "Mushroom Masala",
    category: "Paneer & Veg",
    price: 300,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Fresh button mushrooms cooked in thick roasted onion, tomato, and ground garam masala gravy."
  },
  {
    id: "veg-6",
    name: "Chilli Mushroom (Dry / Gravy)",
    category: "Paneer & Veg",
    price: 240,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crispy button mushrooms tossed in spicy Indo-Chinese chilli garlic sauce."
  },
  {
    id: "veg-7",
    name: "Veg Manchurian Gravy",
    category: "Paneer & Veg",
    price: 250,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crispy vegetable dumplings in savoury garlic, ginger, and soy sauce."
  },
  {
    id: "veg-8",
    name: "Dal Tadka (Desi Ghee)",
    category: "Paneer & Veg",
    price: 180,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Yellow toor dal tempered with cumin seeds, garlic, dry red chillies, and pure desi ghee."
  },
  {
    id: "veg-9",
    name: "Dal Fry",
    category: "Paneer & Veg",
    price: 150,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Comforting yellow lentils cooked with sautéed onions, tomatoes, and fresh coriander."
  },

  // --- MAIN COURSE NON-VEG ---
  {
    id: "mcn-1",
    name: "Jonak Chicken Butter Masala",
    category: "Chicken Specialties",
    price: 380,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Tandoori grilled chicken pieces simmered in silky makhani gravy enriched with butter and cream."
  },
  {
    id: "mcn-2",
    name: "Chicken Kosa (Assamese Style)",
    category: "Chicken Specialties",
    price: 360,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Slow-roasted chicken cooked with browned onions, garlic, and rustic Assamese spices till thick and dark."
  },
  {
    id: "mcn-3",
    name: "Chicken Do Pyaza",
    category: "Chicken Specialties",
    price: 330,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Tender chicken cooked with double the onions — sautéed paste plus crunchy caramelized petals."
  },
  {
    id: "mcn-4",
    name: "Mutton Kosa",
    category: "Chicken Specialties",
    price: 450,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Slow-cooked succulent mutton roasted in mustard oil and aromatic spices for hours till tender."
  },
  {
    id: "mcn-5",
    name: "Mutton Curry with Potatoes",
    category: "Chicken Specialties",
    price: 380,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Traditional Bengali & Assamese Sunday style mutton jhol with tender potatoes."
  },
  {
    id: "mcn-6",
    name: "Egg Masala (2 Eggs)",
    category: "Chicken Specialties",
    price: 230,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Golden pan-fried boiled eggs cooked in rich spicy onion tomato gravy."
  },

  // --- FISH & SEAFOOD ---
  {
    id: "fsh-1",
    name: "Fried Fish Curry (Assam Style)",
    category: "Fish & Seafood",
    price: 300,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Fresh river fish steaks fried crisp and simmered in light mustard seed, cumin, and turmeric curry."
  },
  {
    id: "fsh-2",
    name: "Crispy River Fish Fry",
    category: "Fish & Seafood",
    price: 250,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Fresh local fish fillets marinated in spices, pan-fried to a crunchy crust with onions."
  },
  {
    id: "fsh-3",
    name: "Small Fish Fry (Choru Maas Bhaja)",
    category: "Fish & Seafood",
    price: 400,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Assamese delicacy of tender freshwater small fish pan-crisped with slit green chillies and salt."
  },

  // --- TANDOORI & KEBABS ---
  {
    id: "tan-1",
    name: "Tandoori Chicken (Full)",
    category: "Tandoori & Kebabs",
    price: 480,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Whole chicken marinated in hung yogurt, Kashmiri chillies, and tandoori spices, char-roasted in clay oven."
  },
  {
    id: "tan-2",
    name: "Chicken Tikka (6 Pcs)",
    category: "Tandoori & Kebabs",
    price: 350,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Smoky boneless chicken chunks char-grilled over live embers, served with mint dip."
  },
  {
    id: "tan-3",
    name: "Malai Chicken Tikka (6 Pcs)",
    category: "Tandoori & Kebabs",
    price: 480,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Melt-in-mouth chicken cubes marinated in heavy cream, processed cheese, and aromatic green cardamom."
  },
  {
    id: "tan-4",
    name: "Afghani Chicken Tikka",
    category: "Tandoori & Kebabs",
    price: 480,
    isVeg: false,
    bestSeller: false,
    inStock: true,
    description: "Mild creamy charcoal grilled chicken flavored with roasted cashews and white pepper."
  },
  {
    id: "tan-5",
    name: "Mutton Seekh Kebab",
    category: "Tandoori & Kebabs",
    price: 480,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Finely minced seasoned mutton skewered and roasted over burning charcoal."
  },
  {
    id: "tan-6",
    name: "Tandoori Paneer Tikka",
    category: "Tandoori & Kebabs",
    price: 300,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Fresh cottage cheese cubes, capsicum, and onions marinated in ajwain tandoori masala and roasted."
  },

  // --- SIZZLERS ---
  {
    id: "siz-1",
    name: "Jonak Special Mix Garlic Sizzler",
    category: "Sizzlers",
    price: 500,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Sizzling hot cast iron platter loaded with chicken steak, sausages, butter rice, fries, and smoky garlic pepper sauce."
  },
  {
    id: "siz-2",
    name: "Roast Chicken Sizzler",
    category: "Sizzlers",
    price: 450,
    isVeg: false,
    bestSeller: true,
    inStock: true,
    description: "Juicy roasted chicken breast served over sizzling bed of butter noodles with sauteed vegetables."
  },

  // --- BREADS & ROTI ---
  {
    id: "brd-1",
    name: "Butter Naan",
    category: "Breads",
    price: 60,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Soft, pillowy refined flour bread baked in tandoor and brushed generously with desi butter."
  },
  {
    id: "brd-2",
    name: "Butter Tandoori Roti",
    category: "Breads",
    price: 35,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Crispy whole wheat bread baked against the clay walls of our tandoor with fresh butter."
  },
  {
    id: "brd-3",
    name: "Butter Tawa Roti",
    category: "Breads",
    price: 40,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Homestyle soft puffed whole wheat flatbread made on tawa, brushed with pure butter."
  },
  {
    id: "brd-4",
    name: "Plain Tawa Roti",
    category: "Breads",
    price: 30,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Simple healthy whole wheat roti baked fresh to order."
  },

  // --- DESSERTS & BEVERAGES ---
  {
    id: "bev-1",
    name: "Mix Ice Cream Royal Sundae",
    category: "Desserts & Beverages",
    price: 200,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Trio of vanilla, chocolate, and butterscotch ice creams topped with crunchy nuts and chocolate syrup."
  },
  {
    id: "bev-2",
    name: "Belgian Chocolate Ice Cream",
    category: "Desserts & Beverages",
    price: 180,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Rich, dense double chocolate ice cream scoop."
  },
  {
    id: "bev-3",
    name: "Crunchy Butterscotch Ice Cream",
    category: "Desserts & Beverages",
    price: 150,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Smooth cream with crunchy caramel cashew praline."
  },
  {
    id: "bev-4",
    name: "Assam Special Milk Masala Chai",
    category: "Desserts & Beverages",
    price: 40,
    isVeg: true,
    bestSeller: true,
    inStock: true,
    description: "Premium strong Assam CTC tea brewed with crushed ginger, green cardamom, and fresh creamy milk."
  },
  {
    id: "bev-5",
    name: "Jonak Frothy Filter Coffee",
    category: "Desserts & Beverages",
    price: 60,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Steaming hot aromatic frothy milk coffee."
  },
  {
    id: "bev-6",
    name: "Fresh Lime Soda (Sweet / Salt)",
    category: "Desserts & Beverages",
    price: 80,
    isVeg: true,
    bestSeller: false,
    inStock: true,
    description: "Chilled sparkling soda with freshly squeezed Barpeta lemons and roasted cumin."
  }
];

export const INITIAL_EVENTS = [
  {
    id: "bday",
    title: "Birthday & Anniversary Galas",
    tagline: "Celebrate under the stars or in air-conditioned luxury",
    capacity: "25 - 200 Guests",
    image: "/images/IMG_5218.JPG",
    features: ["Custom Thematic Balloon/Floral Decor", "Multi-Course Buffet or Thali Catering", "High-Definition Sound & DJ Setup", "Complimentary Birthday Cake Table"]
  },
  {
    id: "open-stage",
    title: "Jonak 'Open Stage' Cultural & Musical Evenings",
    tagline: "Barpeta's premier dedicated open-air performance arena",
    capacity: "50 - 350 Guests",
    image: "/images/IMG_5228.JPG",
    features: ["Raised Wooden Stage with Professional Lighting", "Acoustic Stage Monitor & Mics", "Spacious Lawn Seating Arrangement", "Evening Barbecue & Live Tandoor Counters"]
  },
  {
    id: "corporate",
    title: "Corporate Conferences & Seminars",
    tagline: "Seamless executive hospitality for meetings & workshops",
    capacity: "20 - 100 Executives",
    image: "/images/IMG_5219.JPG",
    features: ["Projector Screen & Audio Visual Setup", "Executive High-Tea & Working Lunch", "High-Speed Wi-Fi for all Attendees", "Dedicated Reception Coordinator"]
  }
];

export const NEARBY_LANDMARKS = [
  { name: "NRL Petrol Pump, Donakuchi", distance: "0.2 KM", driveTime: "1 min walk", note: "Direct landmark on BH Road" },
  { name: "Barpeta Town Center & Court", distance: "3.2 KM", driveTime: "6 mins", note: "Commercial center & administrative hub" },
  { name: "Barpeta Satra (Historic Kirtan Ghar)", distance: "3.8 KM", driveTime: "8 mins", note: "Assam's cultural & spiritual jewel" },
  { name: "FAAMCH Medical College & Hospital", distance: "4.2 KM", driveTime: "9 mins", note: "Primary tertiary healthcare center" },
  { name: "Barpeta ASTC Central Bus Stand", distance: "3.5 KM", driveTime: "7 mins", note: "Inter-district bus connectivity" },
  { name: "Barpeta Road Railway Station", distance: "22.0 KM", driveTime: "30 mins", note: "Major broad-gauge rail junction" }
];

export const FAQ_DATA = [
  {
    q: "How does the Free 5 KM Delivery work at Jonak Hotel?",
    a: "Any order placed within a 5 KM radius of our BH Road location (including Donakuchi, Garemara Pathar, and central Barpeta Town) is delivered 100% FREE! For delivery beyond 5 KM, our smart system calculates a nominal per-kilometer charge so you receive hot, fresh food transparently."
  },
  {
    q: "How do I place an order or book a room via WhatsApp?",
    a: "Simply browse our digital menu or room catalogue, select your items or dates, and click 'Order via WhatsApp' or 'Confirm Booking'. The website automatically formats your entire bill, delivery address or room number, and GPS map link, and transfers it to our receptionist's official WhatsApp (+91 96785 82286) for instant confirmation!"
  },
  {
    q: "Are the hotel rooms suitable for families and patients visiting FAAMCH Barpeta?",
    a: "Yes! Jonak Hotel is only 4.2 KM (9 minutes drive) from FAAMCH Hospital. We provide peaceful, hygienic air-conditioned rooms with 24/7 hot water, pure generator backup, in-room food delivery, and ample parking."
  },
  {
    q: "Can I host birthday parties or music events on the Open Stage?",
    a: "Absolutely. Jonak Hotel features Barpeta's signature Open Stage and lawn along with an air-conditioned banquet dining hall. We can host 25 to 350+ guests with complete sound systems, lighting, and customized catering menus."
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept Cash on Delivery (COD), Google Pay, PhonePe, Paytm, BHIM UPI (via instant QR code scan), Credit/Debit Cards, and Net Banking."
  }
];

export const SAMPLE_ORDERS = [
  {
    id: "JNK-8421",
    time: "Today, 8:45 PM",
    customerName: "Rituraj Das",
    phone: "9864012345",
    mode: "Home Delivery",
    address: "Near Barpeta Satra, Ward 4, Barpeta Town",
    distanceKm: 3.8,
    deliveryFee: 0,
    items: [
      { name: "Jonak Special Dum Biriyani", qty: 2, price: 350 },
      { name: "Chicken Lollipop (6 Pcs)", qty: 1, price: 300 },
      { name: "Butter Tandoori Roti", qty: 4, price: 35 }
    ],
    total: 1140,
    payment: "UPI",
    status: "Out for Delivery"
  },
  {
    id: "JNK-8422",
    time: "Today, 9:10 PM",
    customerName: "Bikash Sarma",
    phone: "9101234567",
    mode: "In-Room Dining",
    roomNumber: "Room 204 (Deluxe AC)",
    distanceKm: 0,
    deliveryFee: 0,
    items: [
      { name: "Chicken Kosa (Assamese Style)", qty: 1, price: 360 },
      { name: "Butter Naan", qty: 3, price: 60 },
      { name: "Assam Special Milk Masala Chai", qty: 2, price: 40 }
    ],
    total: 620,
    payment: "Cash on Delivery",
    status: "Confirmed"
  },
  {
    id: "JNK-8420",
    time: "Today, 7:30 PM",
    customerName: "Anamika Medhi",
    phone: "7002345678",
    mode: "Home Delivery",
    address: "Doctor Quarters, FAAMCH Campus, Barpeta",
    distanceKm: 4.2,
    deliveryFee: 0,
    items: [
      { name: "Paneer Butter Masala", qty: 1, price: 300 },
      { name: "Jeera Rice", qty: 1, price: 120 },
      { name: "Crispy Chilli Babycorn", qty: 1, price: 190 }
    ],
    total: 610,
    payment: "UPI",
    status: "Delivered"
  }
];

export const SAMPLE_ROOM_BOOKINGS = [
  {
    id: "BKG-1092",
    time: "Today, 6:15 PM",
    guestName: "Dr. Himanta Baishya",
    phone: "9435098765",
    roomType: "Deluxe Room (A/C)",
    roomId: "deluxe-ac",
    roomNumber: "201",
    floor: "2nd Floor",
    checkIn: "2026-10-25",
    checkOut: "2026-10-27",
    nights: 2,
    guests: "2 Adults",
    totalTariff: 5250,
    status: "Confirmed",
    idType: "Aadhaar Card",
    idNumber: "5412 8763 9021",
    maskedId: "XXXX-XXXX-9021",
    kycStatus: "Verified",
    guestCity: "Barpeta Satra, Barpeta",
    aadhaarFront: null,
    aadhaarBack: null
  },
  {
    id: "BKG-1093",
    time: "Today, 8:02 PM",
    guestName: "Pranab Kalita",
    phone: "9854123490",
    roomType: "Suite Room (A/C)",
    roomId: "suite-ac",
    roomNumber: "101",
    floor: "1st Floor",
    checkIn: "2026-10-26",
    checkOut: "2026-10-28",
    nights: 2,
    guests: "2 Adults",
    totalTariff: 10500,
    status: "New",
    idType: "Aadhaar Card",
    idNumber: "7823 4910 3218",
    maskedId: "XXXX-XXXX-3218",
    kycStatus: "Verified",
    guestCity: "Guwahati, Assam",
    aadhaarFront: null,
    aadhaarBack: null
  }
];
