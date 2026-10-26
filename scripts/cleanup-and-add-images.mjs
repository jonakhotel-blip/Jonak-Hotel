// scripts/cleanup-and-add-images.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDishImage(category = '', name = '') {
  const cat = String(category || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (cat.includes('biryani') || n.includes('biryani')) return '/images/food/biryani.jpg';
  if (cat.includes('tandoori') || cat.includes('kebab') || n.includes('tikka') || n.includes('kebab') || n.includes('tandoori')) return '/images/food/tandoori.jpg';
  if (cat.includes('chicken') || n.includes('chicken') || n.includes('curry') || n.includes('makhani') || n.includes('masala')) return '/images/food/chicken_curry.jpg';
  if (cat.includes('momo') || n.includes('momo')) return '/images/food/momos.jpg';
  if (cat.includes('roll') || n.includes('roll')) return '/images/food/rolls.jpg';
  if (cat.includes('fish') || cat.includes('seafood') || n.includes('fish') || n.includes('prawn') || n.includes('rohu') || n.includes('bhakua')) return '/images/food/fish.jpg';
  if (cat.includes('paneer') || cat.includes('veg') || n.includes('paneer') || n.includes('dal') || n.includes('mushroom') || n.includes('aloo')) return '/images/food/paneer.jpg';
  if (cat.includes('rice') || cat.includes('noodle') || cat.includes('chowmein') || cat.includes('fried rice') || n.includes('rice') || n.includes('noodle')) return '/images/food/chinese.jpg';
  if (cat.includes('bread') || cat.includes('roti') || cat.includes('naan') || n.includes('naan') || n.includes('paratha') || n.includes('kulcha')) return '/images/food/breads.jpg';
  if (cat.includes('dessert') || cat.includes('beverage') || n.includes('jamun') || n.includes('shake') || n.includes('chai') || n.includes('tea') || n.includes('coffee')) return '/images/food/desserts.jpg';
  return '/images/food/chicken_curry.jpg';
}

const files = [
  path.resolve(__dirname, '../server/data/hotel_data.json'),
  path.resolve(__dirname, '../data/db.json')
];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 1. Assign image to every dish
  if (Array.isArray(data.menu)) {
    data.menu = data.menu.map(d => ({
      ...d,
      image: getDishImage(d.category, d.name)
    }));
  }

  // 2. Clear demo test orders and bookings
  data.orders = [];
  data.roomBookings = [];
  data.customers = [];

  // Update version
  data.version = Date.now();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Cleaned and added food images to: ${filePath}`);
}

console.log('🎉 Clean-up and food imagery update finished successfully!');
