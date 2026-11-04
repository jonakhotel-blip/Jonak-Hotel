import fs from 'fs';
import path from 'path';

const mappings = [
  {
    destName: 'jonak-food-delivery-hero',
    src: 'public/images/jonak-food-delivery-hero.jpg'
  },
  {
    destName: 'jonak-special-dum-biryani',
    src: 'public/images/food/food_dum_biryani.jpg'
  },
  {
    destName: 'chicken-biryani',
    src: 'public/images/food/food_chicken_biryani.jpg'
  },
  {
    destName: 'jonak-ac-room',
    src: 'public/images/ui/ac_room_photo.jpg'
  },
  {
    destName: 'jonak-deluxe-ac-room',
    src: 'public/images/rooms/room_201.jpg'
  },
  {
    destName: 'jonak-twin-room',
    src: 'public/images/rooms/room_204.jpg'
  },
  {
    destName: 'jonak-presidential-suite',
    src: 'public/images/rooms/room_101.jpg'
  },
  {
    destName: 'jonak-single-room',
    src: 'public/images/rooms/room_202.jpg'
  }
];

const publicImages = path.resolve('public/images');

for (const m of mappings) {
  const srcPath = path.resolve(m.src);
  if (!fs.existsSync(srcPath)) {
    console.error(`Source not found: ${srcPath}`);
    continue;
  }
  const data = fs.readFileSync(srcPath);

  // Write .webp
  const webpPath = path.join(publicImages, `${m.destName}.webp`);
  fs.writeFileSync(webpPath, data);
  console.log(`Saved: ${webpPath} (${Math.round(data.length / 1024)} KB)`);

  // Write .jpg
  const jpgPath = path.join(publicImages, `${m.destName}.jpg`);
  fs.writeFileSync(jpgPath, data);
  console.log(`Saved: ${jpgPath} (${Math.round(data.length / 1024)} KB)`);
}

console.log('All required image assets successfully created in public/images/');
