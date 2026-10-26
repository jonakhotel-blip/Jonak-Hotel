// src/services/pocketbase.js
import PocketBase from 'pocketbase';

// Determine PocketBase URL: environment variable or default local port 8090
const POCKETBASE_URL = import.meta.env?.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

// Helper function to fetch all dishes from PocketBase
export async function getPocketBaseDishes() {
  try {
    return await pb.collection('dishes').getFullList({
      sort: 'category'
    });
  } catch (err) {
    console.warn('[PocketBase] Fetch dishes fallback:', err);
    return null;
  }
}

// Helper function to fetch all rooms from PocketBase
export async function getPocketBaseRooms() {
  try {
    return await pb.collection('rooms').getFullList({
      sort: 'roomNumber'
    });
  } catch (err) {
    console.warn('[PocketBase] Fetch rooms fallback:', err);
    return null;
  }
}

// Helper function to submit an order directly to PocketBase
export async function createPocketBaseOrder(orderData) {
  try {
    return await pb.collection('orders').create(orderData);
  } catch (err) {
    console.warn('[PocketBase] Create order fallback:', err);
    return null;
  }
}

// Helper function to submit a booking directly to PocketBase
export async function createPocketBaseBooking(bookingData) {
  try {
    return await pb.collection('bookings').create(bookingData);
  } catch (err) {
    console.warn('[PocketBase] Create booking fallback:', err);
    return null;
  }
}

export default pb;
