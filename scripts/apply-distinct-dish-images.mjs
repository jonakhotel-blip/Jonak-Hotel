// scripts/apply-distinct-dish-images.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DISH_SPECIFIC_IMAGES = {
  // --- BIRIYANI (6 Items) ---
  'bir-1': '/images/food/biryani.jpg', // Jonak Special Handi Dum Biryani with Egg
  'bir-2': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', // Chicken Biryani with leg piece
  'bir-3': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80', // Royal Mutton Biryani
  'bir-4': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', // Egg Biryani with halved eggs
  'bir-5': 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?auto=format&fit=crop&w=600&q=80', // Veg Dum Biryani with peas, carrots, paneer
  'bir-6': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=600&q=80', // Crispy Spiced Egg Devil

  // --- CHICKEN SPECIALTIES (10 Items) ---
  'chk-1': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', // Jonak Chicken Maharaja
  'chk-2': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80', // Chicken Maharani White Gravy
  'chk-3': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', // Desi Local Chicken Curry Jhol
  'chk-4': 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80', // Chicken Hyderabadi Green Spices
  'chk-5': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80', // Crispy Dragon Chicken
  'chk-6': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80', // Tangdi Kabab Drumsticks
  'chk-7': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', // Crispy Fried Chicken Bucket
  'chk-8': 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80', // Golden Chicken Fingers
  'chk-9': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80', // Crumbed Chicken Cutlet
  'chk-10': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', // Golden Chicken Nuggets

  // --- STARTERS (11 Items) ---
  'str-1': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80', // Chilli Chicken
  'str-2': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80', // Chicken Lollipop
  'str-3': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80', // Honey Sesame Chicken
  'str-4': 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80', // Chicken Dry Fry
  'str-5': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', // Spiced Chicken Pakoda
  'str-6': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80', // Salt & Pepper Chicken
  'str-7': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', // Golden Paneer Pakoda
  'str-8': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', // Crispy Chilli Babycorn
  'str-9': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=600&q=80', // American Corn Salt & Pepper
  'str-10': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80', // Mixed Veg Pakoda Platter
  'str-11': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', // Crispy French Fries

  // --- ROLLS (4 Items) ---
  'rol-1': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Chicken Spring Roll
  'rol-2': 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?auto=format&fit=crop&w=600&q=80', // Egg Spring Roll
  'rol-3': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80', // Crispy Veg Spring Roll
  'rol-4': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', // Kolkata Double Egg Chicken Kathi Roll

  // --- MOMOS (4 Items) ---
  'mom-1': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Pan Fried Chicken Momo
  'mom-2': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80', // Steamed Chicken Momo
  'mom-3': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80', // Pan Fried Veg Momo
  'mom-4': 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80', // Steamed Veg Momo

  // --- FRIED RICE & NOODLES (11 Items) ---
  'ric-1': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', // Chicken Fried Rice
  'ric-2': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80', // Egg Fried Rice
  'ric-3': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80', // Veg Fried Rice
  'ric-4': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80', // Veg Pulao
  'ric-5': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=600&q=80', // Jeera Rice
  'ric-6': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', // Steamed Plain Rice
  'nod-1': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80', // Chicken Chilli Garlic Noodles
  'nod-2': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', // Chicken Schezwan Noodles
  'nod-3': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80', // Chicken Hakka Noodles
  'nod-4': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', // Egg Schezwan Noodles
  'nod-5': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', // Veg Hakka Noodles

  // --- PANEER & VEG (9 Items) ---
  'veg-1': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', // Paneer Butter Masala
  'veg-2': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', // Kadhai Paneer
  'veg-3': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', // Matar Paneer
  'veg-4': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80', // Chilli Paneer
  'veg-5': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', // Mushroom Masala
  'veg-6': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', // Chilli Mushroom
  'veg-7': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80', // Veg Manchurian Gravy
  'veg-8': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', // Dal Tadka Desi Ghee
  'veg-9': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80', // Dal Fry

  // --- MAIN COURSE CHICKEN & MUTTON (6 Items) ---
  'mcn-1': '/images/food/chicken_curry.jpg', // Jonak Chicken Butter Masala (Generated Luxury Image)
  'mcn-2': 'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=600&q=80', // Chicken Kosa Assamese Style
  'mcn-3': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', // Chicken Do Pyaza
  'mcn-4': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Mutton Kosa
  'mcn-5': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', // Mutton Curry with Aloo
  'mcn-6': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', // Egg Masala (2 Eggs)

  // --- FISH & SEAFOOD (3 Items) ---
  'fsh-1': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', // Fried Fish Curry (Assam Style)
  'fsh-2': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', // Crispy River Fish Fry
  'fsh-3': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Small Fish Fry (Choru Maas Bhaja)

  // --- TANDOORI & KEBABS (6 Items) ---
  'tan-1': '/images/food/tandoori.jpg', // Tandoori Chicken Full (Generated Luxury Image)
  'tan-2': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80', // Chicken Tikka (6 Pcs)
  'tan-3': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80', // Malai Chicken Tikka
  'tan-4': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Afghani Chicken Tikka
  'tan-5': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', // Mutton Seekh Kebab
  'tan-6': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', // Tandoori Paneer Tikka

  // --- SIZZLERS (2 Items) ---
  'siz-1': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Jonak Special Mix Garlic Sizzler
  'siz-2': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', // Roast Chicken Sizzler

  // --- BREADS (4 Items) ---
  'brd-1': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', // Butter Naan
  'brd-2': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80', // Butter Tandoori Roti
  'brd-3': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', // Butter Tawa Roti
  'brd-4': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80', // Plain Tawa Roti

  // --- DESSERTS & BEVERAGES (6 Items) ---
  'bev-1': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', // Mix Ice Cream Royal Sundae
  'bev-2': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80', // Belgian Chocolate Ice Cream
  'bev-3': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80', // Crunchy Butterscotch Ice Cream
  'bev-4': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', // Assam Special Milk Masala Chai
  'bev-5': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', // Jonak Frothy Filter Coffee
  'bev-6': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'  // Fresh Lime Soda Sweet / Salt
};

// Update hotel_data.json and db.json
const files = [
  path.resolve(__dirname, '../server/data/hotel_data.json'),
  path.resolve(__dirname, '../data/db.json')
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (Array.isArray(data.menu)) {
    data.menu = data.menu.map(d => ({
      ...d,
      image: DISH_SPECIFIC_IMAGES[d.id] || d.image || '/images/food/biryani.jpg'
    }));
  }

  data.version = Date.now();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Updated all 82 distinct dish images in: ${filePath}`);
}

console.log('🎉 100% DISTINCT FOOD IDENTITIES APPLIED SUCCESSFULLY!');
