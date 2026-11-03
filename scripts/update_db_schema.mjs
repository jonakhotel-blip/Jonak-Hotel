import fs from 'fs';

const files = ['server/data/hotel_data.json', 'server/data/hotel_data.backup.json', 'data/db.json'];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (data.settings) {
    delete data.settings.adminPin;
    data.settings.operatingHours = data.settings.operatingHours || {
      openTime: '10:30',
      closeTime: '22:30',
      autoSchedule: true
    };
    data.settings.codEnabled = data.settings.codEnabled !== undefined ? data.settings.codEnabled : true;
    data.settings.razorpay = data.settings.razorpay || {
      enabled: false,
      mode: 'sandbox',
      keyId: 'rzp_test_JonakSandboxDemo'
    };
    data.settings.deliveryRules = data.settings.deliveryRules || {
      freeRadiusKm: 5,
      extraFeePerKm: 15,
      minOrderFreeDelivery: 199,
      maxDeliveryRadiusKm: 15,
      estimatedBaseMinutes: 35
    };
  }

  if (Array.isArray(data.staff)) {
    data.staff.forEach(s => delete s.pin);
  }

  if (!Array.isArray(data.offers) || data.offers.length === 0) {
    data.offers = [
      {
        id: 'off_weekend_dum_biryani',
        title: 'Barpeta Special: 15% OFF Royal Biryani',
        code: 'ROYAL15',
        description: 'Enjoy 15% discount on authentic Dum Biryani & Assam Local Chicken on orders above ₹399.',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderAmount: 399,
        maxDiscountAmount: 150,
        applicableOrderModes: ['DELIVERY', 'PICKUP', 'IN_ROOM'],
        isActive: true,
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        terms: 'Owner-configured verified offer. Minimum order ₹399. Maximum discount ₹150. Valid for Delivery, Pickup and In-Room dining.',
        badge: "Today's Verified Special",
        redemptionsCount: 18
      }
    ];
  }

  if (!Array.isArray(data.notificationOutbox)) {
    data.notificationOutbox = [];
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Updated ${filePath}`);
}

