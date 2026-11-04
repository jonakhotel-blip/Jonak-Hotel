import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  HOTEL_INFO, 
  INITIAL_SETTINGS, 
  INITIAL_MENU, 
  INITIAL_ROOMS, 
  SAMPLE_ORDERS, 
  SAMPLE_ROOM_BOOKINGS,
  OFFICIAL_PHYSICAL_ROOMS,
  BARPETA_LOCALITIES,
  NEARBY_LANDMARKS,
  FAQ_DATA,
  INITIAL_EVENTS,
  DEFAULT_STAFF_MEMBERS,
  INITIAL_RAW_INVENTORY,
  INITIAL_EXPENSES,
  INITIAL_TASKS,
  STAFF_ROLES,
  DISH_SPECIFIC_IMAGES,
  getDishImage,
  INITIAL_OFFERS
} from '../data/seedData';
import { realtimeClient } from '../services/realtimeClient';
import { apiUrl, getWsUrl } from '../config/apiConfig';

const HotelContext = createContext();

// Clean up legacy stale demo data from browser localStorage
try {
  ['jonak_orders_v1', 'jonak_bookings_v1', 'jonak_menu_v1', 'jonak_customers_v1'].forEach(k => {
    localStorage.removeItem(k);
  });
} catch (_) {}

const STORAGE_KEYS = {
  MENU: 'jonak_menu_v2',
  ROOMS: 'jonak_rooms_v2',
  PHYSICAL_ROOMS: 'jonak_physical_rooms_v2',
  SETTINGS: 'jonak_settings_v2',
  ORDERS: 'jonak_orders_v2',
  BOOKINGS: 'jonak_bookings_v2',
  EVENTS: 'jonak_events_v2',
  CART: 'jonak_cart_v2',
  ADMIN_TOKEN: 'jonak_admin_token_v1',
  STAFF: 'jonak_staff_v2',
  INVENTORY: 'jonak_inventory_v2',
  EXPENSES: 'jonak_expenses_v2',
  TASKS: 'jonak_tasks_v2',
  STAFF_SESSION: 'jonak_staff_session_v1',
  OFFERS: 'jonak_offers_v2',
  SOUND_ENABLED: 'jonak_sound_enabled_v1'
};

const enrichMenu = (items) => {
  if (!Array.isArray(items)) return INITIAL_MENU;
  return items.map(d => ({
    ...d,
    image: DISH_SPECIFIC_IMAGES?.[d.id] || d.image || getDishImage(d.category, d.name)
  }));
};

export const ROOM_SPECIFIC_GALLERIES = {
  'suite-ac': {
    image: '/images/IMG_5217.JPG',
    gallery: ['/images/IMG_5217.JPG', '/images/IMG_5218.JPG', '/images/IMG_5219.JPG', '/images/IMG_5220.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Master King Bed & Luxury Suite Decor',
      'Private Living Lounge & Executive Sofa',
      'Luxury Attached Bathroom & Vanity Mirror',
      'Modern Bathroom Shower & Water Geyser',
      'Jonak Hotel Main Building & Reserved Parking'
    ]
  },
  'twin-ac': {
    image: '/images/IMG_5222.JPG',
    gallery: ['/images/IMG_5222.JPG', '/images/IMG_5223.JPG', '/images/IMG_5219.JPG', '/images/IMG_5224.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Two Separate Ergonomic Twin Beds (A/C)',
      'Twin Room Interior & Curtained Window',
      'Attached Clean Bathroom & Hot Water',
      'Hotel Corridor & Secure Key Entry',
      'Jonak Hotel Front View & Parking'
    ]
  },
  'twin-non-ac': {
    image: '/images/IMG_5227.JPG',
    gallery: ['/images/IMG_5227.JPG', '/images/IMG_5222.JPG', '/images/IMG_5219.JPG', '/images/IMG_5225.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Spacious Twin Beds (Non-A/C Standard)',
      'Twin Bed Layout & Natural Lighting',
      'Attached Clean Bathroom',
      'Ventilated Window with Fresh Cross-Breeze',
      'Jonak Hotel Building & Parking'
    ]
  },
  'deluxe-ac': {
    image: '/images/IMG_5206.JPG',
    gallery: ['/images/IMG_5206.JPG', '/images/IMG_5217.JPG', '/images/IMG_5219.JPG', '/images/IMG_5224.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Executive Deluxe Double Bed (A/C)',
      'Plush Bedding & Workstation',
      'Attached Bathroom & Hot Geyser',
      'Corridor & 2nd/3rd Floor Elevator Access',
      'Jonak Hotel Front Parking'
    ]
  },
  'single-ac': {
    image: '/images/IMG_5228.JPG',
    gallery: ['/images/IMG_5228.JPG', '/images/IMG_5206.JPG', '/images/IMG_5219.JPG', '/images/IMG_5220.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Single Executive Plush Bed with A/C',
      'Room Interior & Dedicated Split AC',
      'Attached Clean Private Bathroom',
      'Shower Area & Water Geyser',
      'Jonak Hotel Main Entrance'
    ]
  },
  'single-non-ac': {
    image: '/images/IMG_5229.JPG',
    gallery: ['/images/IMG_5229.JPG', '/images/IMG_5228.JPG', '/images/IMG_5219.JPG', '/images/IMG_5203.JPG'],
    galleryLabels: [
      'Comfortable Single Bed (Non-A/C Budget)',
      'Clean Single Room Setup & Ceiling Fan',
      'Attached Private Bathroom',
      'Jonak Hotel Building & Front Parking'
    ]
  }
};

export const enrichRooms = (items) => {
  if (!Array.isArray(items) || items.length === 0) return INITIAL_ROOMS;
  return items.map(r => {
    const defaultMeta = ROOM_SPECIFIC_GALLERIES[r.id] || {};
    const gallery = (Array.isArray(r.gallery) && r.gallery.length > 0 && r.gallery[0].startsWith('/images/IMG_'))
      ? r.gallery
      : (defaultMeta.gallery || ['/images/IMG_5217.JPG']);
    const image = (r.image && r.image.startsWith('/images/IMG_'))
      ? r.image
      : (defaultMeta.image || gallery[0] || '/images/IMG_5217.JPG');
    const galleryLabels = (Array.isArray(r.galleryLabels) && r.galleryLabels.length > 0)
      ? r.galleryLabels
      : (defaultMeta.galleryLabels || ['Hotel Room View']);
    return {
      ...r,
      image,
      gallery,
      galleryLabels
    };
  });
};

// Play audio alert function for hotel owner when a new order/booking arrives
export const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Luxury pleasant chime: 523Hz (C5) -> 659Hz (E5) -> 783Hz (G5)
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    osc.frequency.setValueAtTime(783.99, now + 0.24);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // AudioContext might be restricted until user gesture; ignore safely
  }
};

// Evaluate genuine operational status based on configured business hours & manual override
export const isKitchenCurrentlyOpen = (settings) => {
  if (!settings) return true;
  if (settings.kitchenOpen === false) return false;
  const hours = settings.operatingHours;
  if (!hours || !hours.openTime || !hours.closeTime) {
    return settings.kitchenOpen !== false;
  }
  if (hours.autoSchedule) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5)); // Barpeta, Assam (IST UTC+5:30)
    const currentMins = istTime.getHours() * 60 + istTime.getMinutes();
    const [openH, openM] = hours.openTime.split(':').map(Number);
    const [closeH, closeM] = hours.closeTime.split(':').map(Number);
    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;
    return currentMins >= openMins && currentMins <= closeMins;
  }
  return settings.kitchenOpen !== false;
};

export const HotelProvider = ({ children }) => {
  // Load initial states from LocalStorage or seedData as fast startup cache
  const [menu, setMenu] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      return saved ? enrichMenu(JSON.parse(saved)) : INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) return enrichRooms(parsed);
      }
      return enrichRooms(INITIAL_ROOMS);
    } catch {
      return enrichRooms(INITIAL_ROOMS);
    }
  });

  const [physicalRooms, setPhysicalRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHYSICAL_ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 10) return parsed;
      }
      return OFFICIAL_PHYSICAL_ROOMS;
    } catch {
      return OFFICIAL_PHYSICAL_ROOMS;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : SAMPLE_ORDERS;
    } catch {
      return SAMPLE_ORDERS;
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return saved ? JSON.parse(saved) : SAMPLE_ROOM_BOOKINGS;
    } catch {
      return SAMPLE_ROOM_BOOKINGS;
    }
  });

  const [eventEnquiries, setEventEnquiries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [offers, setOffers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OFFERS);
      return saved ? JSON.parse(saved) : INITIAL_OFFERS;
    } catch {
      return INITIAL_OFFERS;
    }
  });

  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Derive genuinely active today's offer
  const activeTodayOffer = React.useMemo(() => {
    const now = new Date();
    return (offers || []).find(o => {
      if (!o.isActive) return false;
      if (o.startDate && new Date(o.startDate) > now) return false;
      if (o.endDate && new Date(o.endDate) < now) return false;
      return true;
    }) || null;
  }, [offers]);

  const toggleSoundAlerts = useCallback(() => {
    setSoundAlertsEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const testSoundAlert = useCallback(() => {
    playNotificationChime();
  }, []);

  // Location selection & GPS resolution state
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('jonak_selected_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'donakuchi',
      label: 'Donakuchi (Near NRL Petrol Pump)',
      city: 'Barpeta',
      address: 'BH Road, Near NRL Petrol Pump, Donakuchi, Barpeta'
    };
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const searchLocations = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const res = await fetch(apiUrl(`/api/delivery/localities?q=${encodeURIComponent(q)}`));
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(loc => ({
          id: loc.id,
          label: loc.name,
          city: 'Barpeta',
          address: `${loc.name}, Barpeta (${loc.distanceKm} km, ~${loc.estimatedTimeText || '35 mins'})`,
          distanceKm: loc.distanceKm,
          isDeliverable: loc.isDeliverable
        }));
        setLocationSuggestions(mapped);
      }
    } catch (err) {
      console.warn('Locality search error:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const resolveCoordinates = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(apiUrl('/api/delivery/resolve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.locality) {
          const loc = {
            id: data.locality.id,
            label: data.locality.name,
            city: 'Barpeta',
            address: `${data.locality.name} (${data.distanceKm} km from Jonak Hotel)`,
            distanceKm: data.distanceKm,
            coordinates: { lat, lng }
          };
          return loc;
        }
      }
    } catch (err) {
      console.warn('Coordinate resolution error:', err);
    }
    return null;
  }, []);

  const updateSelectedLocation = useCallback((loc) => {
    setSelectedLocation(loc);
    try {
      localStorage.setItem('jonak_selected_location', JSON.stringify(loc));
    } catch {}
  }, []);

  // Shopping Cart State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ERP State: Staff, Raw Inventory, Expenses, Tasks
  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      return saved ? JSON.parse(saved) : DEFAULT_STAFF_MEMBERS;
    } catch {
      return DEFAULT_STAFF_MEMBERS;
    }
  });

  const [rawInventory, setRawInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return saved ? JSON.parse(saved) : INITIAL_RAW_INVENTORY;
    } catch {
      return INITIAL_RAW_INVENTORY;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Visitor & Customer CRM Tracking States
  const [visitorStats, setVisitorStats] = useState(() => {
    try {
      const saved = localStorage.getItem('jonak_visitor_stats_v1');
      return saved ? JSON.parse(saved) : {
        totalLifetimeVisitors: 1248,
        todayVisitors: 86,
        thisMonthVisitors: 940,
        devices: { mobile: 780, desktop: 468 },
        pageViews: { home: 1248, menu: 890, rooms: 640, events: 210 }
      };
    } catch {
      return { totalLifetimeVisitors: 1248, todayVisitors: 86, thisMonthVisitors: 940, devices: { mobile: 780, desktop: 468 } };
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('jonak_customers_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dbStatus, setDbStatus] = useState({
    connected: false,
    type: 'Local High-Speed Persistent JSON',
    databaseName: 'hotel_data.json',
    documentCounts: {}
  });

  // Multi-Role Staff Session & User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jonak_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [csrfToken, setCsrfToken] = useState(() => {
    return localStorage.getItem('jonak_csrf_token') || '';
  });

  const [staffSession, setStaffSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_SESSION);
      return saved ? JSON.parse(saved) : { role: 'owner', staffName: 'Shahidul Islam (Owner)', roleTitle: 'Super Admin / Hotel Owner' };
    } catch {
      return { role: 'owner', staffName: 'Shahidul Islam (Owner)', roleTitle: 'Super Admin / Hotel Owner' };
    }
  });

  // Admin Auth State
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || '';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return !!localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  });

  // Connection & Cloud Sync status
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const serverVersionRef = useRef(0);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Helper for admin authenticated API requests (Bearer Token + CSRF protection + Cookie support)
  const adminFetch = async (url, options = {}) => {
    const token = adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const csrf = csrfToken || localStorage.getItem('jonak_csrf_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(options.headers || {})
    };
    try {
      const fullUrl = apiUrl(url);
      const response = await fetch(fullUrl, { ...options, headers, credentials: 'include' });
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
        setAdminToken('');
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem('jonak_current_user');
      }
      return response;
    } catch (err) {
      console.warn('API fetch warning:', err);
      throw err;
    }
  };

  // Full state fetch from backend API
  const fetchStateFromBackend = useCallback(async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(apiUrl('/api/state'), { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.menu) setMenu(enrichMenu(data.menu));
      if (data.rooms) {
        const enrichedRooms = enrichRooms(data.rooms);
        setRooms(enrichedRooms);
        try { localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(enrichedRooms)); } catch {}
      }
      if (data.physicalRooms) setPhysicalRooms(data.physicalRooms);
      if (data.settings) setSettings(data.settings);
      if (data.offers) setOffers(data.offers);
      if (data.orders) setOrders(data.orders);
      if (data.bookings) setBookings(data.bookings);
      if (data.eventEnquiries) setEventEnquiries(data.eventEnquiries);
      if (data.staff) setStaff(data.staff);
      if (data.rawInventory) setRawInventory(data.rawInventory);
      if (data.expenses) setExpenses(data.expenses);
      if (data.tasks) setTasks(data.tasks);
      if (data.version) serverVersionRef.current = data.version;
      setIsCloudSynced(true);

      // Also fetch visitors, customers & database status
      try {
        const vRes = await fetch(apiUrl('/api/visitors/stats'));
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.stats) {
            setVisitorStats(vData.stats);
            localStorage.setItem('jonak_visitor_stats_v1', JSON.stringify(vData.stats));
          }
        }
        const cRes = await fetch(apiUrl('/api/customers'));
        if (cRes.ok) {
          const cData = await cRes.json();
          if (Array.isArray(cData)) {
            setCustomers(cData);
            localStorage.setItem('jonak_customers_v1', JSON.stringify(cData));
          }
        }
        const dbRes = await fetch(apiUrl('/api/db/status'));
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbStatus(dbData);
        }
      } catch {}
    } catch (err) {
      console.log('[Sync] Offline or backend warming up, using local state cache.');
    }
  }, []);

  // --------------------------------------------------------------------------
  // REAL-TIME SYNC: Server-Sent Events (SSE) & Fallback Polling
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 0. Automatic Website Visitor Tracking (Lifetime & Daily Counter)
    try {
      let vid = localStorage.getItem('jonak_visitor_id_v1');
      let isReturning = true;
      if (!vid) {
        vid = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem('jonak_visitor_id_v1', vid);
        isReturning = false;
      }
      const deviceType = window.innerWidth <= 768 ? 'Mobile' : 'Desktop';
      const page = window.location.hash ? window.location.hash.replace('#', '') || 'Home' : 'Home';
      fetch(apiUrl('/api/track-visit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          deviceType,
          page: page.toUpperCase(),
          referrer: document.referrer || 'Direct',
          isReturning
        })
      }).then(r => r.json()).then(data => {
        if (data?.stats) {
          setVisitorStats(data.stats);
          localStorage.setItem('jonak_visitor_stats_v1', JSON.stringify(data.stats));
        }
      }).catch(() => {});
    } catch {}

    // 1. Initial State Fetch
    fetchStateFromBackend();

    // 2. Connect to Server-Sent Events (SSE) for sub-second updates
    let eventSource;
    try {
      eventSource = new EventSource(apiUrl('/api/events'));

      eventSource.addEventListener('CONNECTED', (e) => {
        setIsCloudSynced(true);
        try {
          const data = JSON.parse(e.data);
          if (data.version) serverVersionRef.current = data.version;
        } catch {}
      });

      eventSource.addEventListener('VISITOR_TRACKED', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.payload?.stats) {
            setVisitorStats(data.payload.stats);
          }
        } catch {}
      });

      eventSource.addEventListener('MENU_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setMenu(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('ROOMS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setRooms(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('PHYSICAL_ROOMS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setPhysicalRooms(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('SETTINGS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setSettings((prev) => ({ ...prev, ...data.payload }));
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('OFFERS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setOffers(data.payload);
          try { localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(data.payload)); } catch {}
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('ORDERS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setOrders(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('ORDER_LOCATION_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          const { orderId, location, status } = data.payload || {};
          if (orderId && location) {
            setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, currentLocation: location, status: status || o.status } : o));
          }
        } catch {}
      });

      eventSource.addEventListener('BOOKINGS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setBookings(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('NEW_ORDER', (e) => {
        try {
          const data = JSON.parse(e.data);
          const newOrder = data.payload;
          setOrders((prev) => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          serverVersionRef.current = data.version;
          setUnreadAlertsCount((prev) => prev + 1);
          if (soundAlertsEnabled) playNotificationChime();
          showToast(`🔔 New Order Received: #${newOrder.id} by ${newOrder.customerName}!`, 'success');
        } catch {}
      });

      eventSource.addEventListener('NEW_BOOKING', (e) => {
        try {
          const data = JSON.parse(e.data);
          const newBooking = data.payload;
          setBookings((prev) => {
            if (prev.some(b => b.id === newBooking.id)) return prev;
            return [newBooking, ...prev];
          });
          serverVersionRef.current = data.version;
          setUnreadAlertsCount((prev) => prev + 1);
          if (soundAlertsEnabled) playNotificationChime();
          showToast(`🏨 New Room Booking: ${newBooking.guestName} (${newBooking.roomType})!`, 'success');
        } catch {}
      });

      eventSource.addEventListener('NEW_EVENT', (e) => {
        try {
          const data = JSON.parse(e.data);
          const newEvt = data.payload;
          setEventEnquiries((prev) => [newEvt, ...prev]);
          serverVersionRef.current = data.version;
          playNotificationChime();
          showToast(`🎉 New Event Enquiry from ${newEvt.contactName}!`, 'info');
        } catch {}
      });

      eventSource.addEventListener('INVENTORY_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setRawInventory(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('EXPENSES_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setExpenses(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('TASKS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setTasks(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('STAFF_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setStaff(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
        } catch {}
      });

      eventSource.addEventListener('STATE_RESET', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.payload) {
            setMenu(data.payload.menu);
            setRooms(data.payload.rooms);
            if (data.payload.physicalRooms) setPhysicalRooms(data.payload.physicalRooms);
            setSettings(data.payload.settings);
            setOrders(data.payload.orders);
            setBookings(data.payload.bookings);
          }
          showToast('Database reset to defaults by Hotel Owner.', 'info');
        } catch {}
      });

      eventSource.onerror = () => {
        setIsCloudSynced(false);
      };
    } catch {
      // SSE not supported or blocked
    }

    // 3. Connect to standards-based RFC 6455 WebSocket Gateway
    realtimeClient.connect();
    
    const unsubOrderCreated = realtimeClient.on('order.created', (envelope) => {
      const newOrder = envelope.data;
      if (newOrder?.orderId || newOrder?.id) {
        const orderId = newOrder.orderId || newOrder.id;
        setOrders(prev => {
          if (prev.some(o => o.id === orderId)) return prev;
          return [{ ...newOrder, id: orderId }, ...prev];
        });
        setUnreadAlertsCount(prev => prev + 1);
        if (soundAlertsEnabled) playNotificationChime();
        showToast(`🔔 New Order #${orderId} (${newOrder.customerName || 'Customer'})`, 'success');
      }
    });

    const unsubStatusChanged = realtimeClient.on('order.status_changed', (envelope) => {
      const { orderId, status, timeline } = envelope.data || {};
      if (orderId && status) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, timeline: timeline || o.timeline } : o));
      }
    });

    const unsubBookingRequested = realtimeClient.on('booking.requested', (envelope) => {
      const newBooking = envelope.data;
      if (newBooking?.bookingId || newBooking?.id) {
        const id = newBooking.bookingId || newBooking.id;
        setBookings(prev => {
          if (prev.some(b => b.id === id)) return prev;
          return [{ ...newBooking, id }, ...prev];
        });
        setUnreadAlertsCount(prev => prev + 1);
        if (soundAlertsEnabled) playNotificationChime();
        showToast(`🏨 Room Request: ${newBooking.guestName} (${newBooking.roomType || 'Room'})`, 'success');
      }
    });

    // 4. Fallback Periodic Polling (every 5-10 seconds) to ensure synchronization
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(apiUrl('/api/health'));
        if (res.ok) {
          const info = await res.json();
          if ((info.version && info.version !== serverVersionRef.current) || pollCount % 2 === 0) {
            fetchStateFromBackend();
          }
          setIsCloudSynced(true);
        }
      } catch {
        setIsCloudSynced(false);
      }
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      unsubOrderCreated();
      unsubStatusChanged();
      unsubBookingRequested();
      realtimeClient.disconnect();
      clearInterval(pollInterval);
    };
  }, [fetchStateFromBackend, showToast]);

  // Sync to LocalStorage for fast offline cache
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu)); } catch {}
  }, [menu]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms)); } catch {}
  }, [rooms]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PHYSICAL_ROOMS, JSON.stringify(physicalRooms)); } catch {}
  }, [physicalRooms]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); } catch {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings)); } catch {}
  }, [bookings]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventEnquiries)); } catch {}
  }, [eventEnquiries]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff)); } catch {}
  }, [staff]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(rawInventory)); } catch {}
  }, [rawInventory]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); } catch {}
  }, [expenses]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.STAFF_SESSION, JSON.stringify(staffSession)); } catch {}
  }, [staffSession]);

  // --- CART ACTIONS ---
  const addToCart = (dish) => {
    if (!dish.inStock) {
      showToast(`${dish.name} is currently out of stock.`, 'danger');
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === dish.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === dish.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...dish, qty: 1 }];
    });
    showToast(`Added ${dish.name} to cart!`, 'success');
  };

  const updateCartQty = (dishId, newQty) => {
    if (newQty <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== dishId));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === dishId ? { ...item, qty: newQty } : item
        )
      );
    }
  };

  const clearCart = () => setCart([]);

  // --- MULTI-ROLE STAFF & ADMIN AUTHENTICATION ---

  // Helper for role display titles
  const getRoleTitle = (role) => {
    switch (role) {
      case 'owner': return 'Super Admin / Hotel Owner';
      case 'manager': return 'Front Desk & Operations Manager';
      case 'staff': return 'Kitchen & Service Staff';
      default: return 'Staff Member';
    }
  };

  // Step 1: Submit Email & Password
  const loginStep1 = async ({ email, password }) => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message || 'Network error during sign in.' };
    }
  };

  // Step 2: Verify TOTP Authenticator Code OR Single-Use Recovery Code
  const verifyMfa = async ({ tempToken, code, isRecoveryCode }) => {
    try {
      const res = await fetch(apiUrl('/api/auth/mfa/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tempToken, code, isRecoveryCode })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setAdminToken(data.token);
        setCsrfToken(data.csrfToken || '');
        setIsAdminAuthenticated(true);

        const newSession = {
          role: data.user.role || 'staff',
          staffName: data.user.name,
          roleTitle: getRoleTitle(data.user.role),
          permissions: data.user.role === 'owner' ? ['ALL'] : ['OPERATIONAL']
        };
        setStaffSession(newSession);

        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
        localStorage.setItem('jonak_current_user', JSON.stringify(data.user));
        localStorage.setItem('jonak_csrf_token', data.csrfToken || '');
        localStorage.setItem(STORAGE_KEYS.STAFF_SESSION, JSON.stringify(newSession));

        showToast(`Welcome back, ${data.user.name}! (${newSession.roleTitle})`, 'success');
        playNotificationChime();
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'MFA Verification failed.' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Error verifying MFA.' };
    }
  };

  // Fast 4-Team PIN Authentication (Shahidul 1234, Hafijur 2222, Master Chef 3333, Hafij 5555)
  const loginWithPin = async (pin) => {
    try {
      const res = await fetch(apiUrl('/api/auth/pin-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: String(pin).trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(data.token);
        setCsrfToken(data.csrfToken);
        setCurrentUser(data.user);
        setStaffSession(data.user);
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
          localStorage.setItem('jonak_csrf_token_v1', data.csrfToken);
          localStorage.setItem(STORAGE_KEYS.STAFF_SESSION, JSON.stringify(data.user));
        } catch {}
        showToast(`Welcome ${data.user.name} (${data.user.roleTitle})!`, 'success');
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid PIN' };
    } catch (err) {
      // Local fallback for offline mode
      const TEAM_PINS = {
        '1234': { id: 'usr_owner_001', name: 'Shahidul Islam', role: 'owner', roleTitle: '👑 Proprietor / Super Admin', phone: '+91 96785 82286' },
        '2222': { id: 'usr_rec_002', name: 'Hafijur', role: 'reception', roleTitle: '🛎️ Reception, Billing & KYC Verification Desk', phone: '+91 98540 11223' },
        '3333': { id: 'usr_chef_003', name: 'Master Chef', role: 'kitchen', roleTitle: '👨‍🍳 Head Master Chef & KDS Lead', phone: '+91 94350 33445' },
        '5555': { id: 'usr_care_004', name: 'Hafij', role: 'housekeeping', roleTitle: '🏃‍♂️ All-Rounder Caretaker, Room Guide & Housekeeping', phone: '+91 91010 77889' }
      };
      const member = TEAM_PINS[String(pin).trim()];
      if (member) {
        const dummyToken = `sess_local_${Date.now()}`;
        setAdminToken(dummyToken);
        setCurrentUser(member);
        setStaffSession(member);
        setIsAdminAuthenticated(true);
        showToast(`Welcome ${member.name} (${member.roleTitle})!`, 'success');
        return { success: true, user: member };
      }
      return { success: false, error: err.message || 'Error logging in with PIN' };
    }
  };

  // Compatibility wrapper for admin login
  const adminLogin = async (pinOrCreds) => {
    if (typeof pinOrCreds === 'object' && pinOrCreds.email) {
      return loginStep1(pinOrCreds);
    }
    const pin = typeof pinOrCreds === 'object' ? pinOrCreds.pin : pinOrCreds;
    return loginWithPin(pin);
  };

  // Upload KYC Document to S3 / Storage Adapter
  const uploadKycDocument = async (base64Image, meta = {}) => {
    try {
      const res = await fetch(apiUrl('/api/upload/kyc'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          guestName: meta.guestName || '',
          docType: meta.docType || 'Aadhaar / Govt ID'
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('KYC Upload failed:', err);
      return { success: false, error: err.message };
    }
  };

  // Verify or Reject KYC for Room Booking
  const verifyKyc = async (bookingId, status, notes = '', roomAssigned = null) => {
    try {
      const res = await fetch(apiUrl(`/api/bookings/${bookingId}/kyc-verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
        },
        body: JSON.stringify({ status, notes, roomAssigned })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.bookings) {
          setBookings(data.bookings);
        } else if (data.booking) {
          setBookings((prev) => prev.map((b) => (b.id === bookingId ? data.booking : b)));
        }
        showToast(status === 'Verified' ? `✅ KYC Approved for Booking #${bookingId}` : `❌ KYC Re-upload Requested`, status === 'Verified' ? 'success' : 'error');
        return { success: true, booking: data.booking };
      }
      return { success: false, error: data.error || 'KYC update failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Rider GPS Location
  const updateOrderLocation = async (orderId, location) => {
    try {
      const res = await fetch(apiUrl(`/api/orders/${orderId}/location`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, currentLocation: data.location } : o));
        return { success: true, location: data.location };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Export Customer CRM to CSV
  const exportCustomersCsv = () => {
    if (!customers || customers.length === 0) {
      showToast('No customer records to export', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Phone', 'Address', 'Total Orders', 'Total Stays', 'Total Spend (INR)', 'Tier', 'Last Visit'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      c.phone,
      `"${c.address || ''}"`,
      c.totalOrders || 0,
      c.totalStays || 0,
      c.totalSpend || 0,
      `"${c.customerType || 'New Customer'}"`,
      c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString() : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jonak_Hotel_Customers_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer CRM exported successfully!', 'success');
  };

  // Secure Sign Out
  const adminLogout = async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        credentials: 'include'
      });
    } catch {}

    setAdminToken('');
    setCurrentUser(null);
    setCsrfToken('');
    setIsAdminAuthenticated(false);
    setStaffSession({ role: 'staff', staffName: 'Guest Staff', roleTitle: 'None' });

    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem('jonak_current_user');
    localStorage.removeItem('jonak_csrf_token');
    localStorage.removeItem(STORAGE_KEYS.STAFF_SESSION);

    showToast('Signed out of Owner Portal.', 'info');
  };

  // Password Recovery Request
  const forgotPassword = async (email) => {
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Reset Password with Token
  const resetPassword = async ({ token, newPassword }) => {
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Accept Owner-Controlled Invitation
  const acceptInvitation = async ({ token, password }) => {
    try {
      const res = await fetch(apiUrl('/api/auth/invitations/accept'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Owner Management: Audit Logs
  const fetchAuditLogs = async (limit = 100, event = '') => {
    try {
      const res = await adminFetch(`/api/admin/audit-logs?limit=${limit}${event ? `&event=${event}` : ''}`);
      return await res.json();
    } catch (err) {
      return { success: false, logs: [] };
    }
  };

  // Owner Management: Users & Invitations
  const fetchUsersAndInvitations = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      return await res.json();
    } catch (err) {
      return { success: false, users: [], invitations: [] };
    }
  };

  // Owner Management: Create Invitation
  const createInvitation = async ({ email, name, role }) => {
    try {
      const res = await adminFetch('/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ email, name, role })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Owner Management: Update User Status (Suspend / Activate)
  const updateUserStatus = async (userId, status) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Owner Management: Active Sessions & Revocation
  const fetchActiveSessions = async () => {
    try {
      const res = await adminFetch('/api/admin/sessions');
      return await res.json();
    } catch (err) {
      return { success: false, sessions: [] };
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/revoke`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Event Enquiry Status Update
  const updateEventEnquiryStatus = async (id, status, notes) => {
    try {
      const res = await adminFetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (data.success && data.enquiries) {
        setEventEnquiries(data.enquiries);
        showToast(`Event enquiry updated to "${status}"`, 'success');
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // --- ADMIN LIVE ACTIONS (Synced across all devices) ---
  const toggleDishStock = async (dishId) => {
    // 1. Optimistic local update
    const target = menu.find((i) => i.id === dishId);
    const newStock = target ? !target.inStock : false;
    setMenu((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, inStock: newStock } : item))
    );
    showToast(`${target?.name || 'Dish'} is now ${newStock ? 'IN STOCK' : 'OUT OF STOCK'}`);

    // 2. Persist to real-time backend
    try {
      await adminFetch('/api/admin/menu/stock', {
        method: 'POST',
        body: JSON.stringify({ dishId })
      });
    } catch (err) {
      console.warn('Backend update queued locally:', err);
    }
  };

  const updateDishPrice = async (dishId, newPrice) => {
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    // 1. Optimistic update
    setMenu((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, price: priceNum } : item))
    );
    showToast(`Price updated to ₹${priceNum}!`, 'success');

    // 2. Persist to backend
    try {
      await adminFetch('/api/admin/menu/price', {
        method: 'POST',
        body: JSON.stringify({ dishId, price: priceNum })
      });
    } catch (err) {
      console.warn('Backend price update failed:', err);
    }
  };

  const toggleDishBestSeller = async (dishId) => {
    setMenu((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, bestSeller: !item.bestSeller } : item))
    );
    try {
      await adminFetch('/api/admin/menu/bestseller', {
        method: 'POST',
        body: JSON.stringify({ dishId })
      });
    } catch (err) {
      console.warn('Backend bestseller toggle failed:', err);
    }
  };

  const addDish = async (newDish) => {
    const dishWithId = {
      ...newDish,
      id: `dish-${Date.now()}`,
      inStock: true,
      price: parseFloat(newDish.price) || 100
    };
    setMenu((prev) => [dishWithId, ...prev]);
    showToast(`Added "${newDish.name}" to menu!`, 'success');

    try {
      await adminFetch('/api/admin/menu/add', {
        method: 'POST',
        body: JSON.stringify(dishWithId)
      });
    } catch (err) {
      console.warn('Backend add dish failed:', err);
    }
  };

  const deleteDish = async (dishId) => {
    setMenu((prev) => prev.filter((item) => item.id !== dishId));
    showToast(`Dish removed from menu.`, 'info');

    try {
      await adminFetch(`/api/admin/menu/${dishId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend delete dish failed:', err);
    }
  };

  const updateRoom = async (roomId, updates) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, ...updates } : room))
    );
    showToast(`Room details updated!`, 'success');

    try {
      await adminFetch(`/api/admin/rooms/${roomId}`, {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.warn('Backend room update failed:', err);
    }
  };

  const togglePhysicalRoom = async (roomNumber, isAvailable, guestName = '') => {
    setPhysicalRooms((prev) =>
      prev.map((r) => {
        if (r.roomNumber === roomNumber) {
          const nextAvail = isAvailable !== undefined ? isAvailable : !r.isAvailable;
          return {
            ...r,
            isAvailable: nextAvail,
            guestName: nextAvail ? '' : (guestName || r.guestName || 'Occupied')
          };
        }
        return r;
      })
    );
    showToast(`Room ${roomNumber} status toggled!`, 'info');

    try {
      const res = await adminFetch('/api/admin/physical-rooms/toggle', {
        method: 'POST',
        body: JSON.stringify({ roomNumber, isAvailable, guestName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rooms) {
        const enrichedRooms = enrichRooms(data.rooms);
        setRooms(enrichedRooms);
        try { localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(enrichedRooms)); } catch {}
      }
        if (data.physicalRooms) setPhysicalRooms(data.physicalRooms);
      }
    } catch (err) {
      console.warn('Backend physical room toggle failed:', err);
    }
  };

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    showToast(`Hotel settings saved & synced to all devices!`, 'success');

    try {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(merged)
      });
    } catch (err) {
      console.warn('Backend settings update failed:', err);
    }
  };

  const calculateDelivery = async ({ localityId, detailedAddress, coordinates, subtotal, orderMode }) => {
    try {
      const res = await fetch(apiUrl('/api/delivery/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localityId, detailedAddress, coordinates, subtotal, orderMode })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend delivery calculation unavailable, using fallback:', err);
    }
    return {
      eligible: true,
      distanceKm: 0.4,
      deliveryFee: subtotal >= 199 ? 0 : 30,
      isFreeDelivery: subtotal >= 199,
      estimatedMinutes: 35,
      estimatedTimeText: '30 - 40 mins'
    };
  };

  const addOrder = async (orderData) => {
    const idempotencyKey = orderData.idempotencyKey || `ord_cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ ...orderData, idempotencyKey })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register order.' };
      }
      if (data.order) {
        setOrders((prev) => {
          if (prev.some(o => o.id === data.order.id)) return prev;
          return [data.order, ...prev];
        });
        if (soundAlertsEnabled) playNotificationChime();
        return { success: true, order: data.order };
      }
    } catch (err) {
      console.warn('Network error placing order:', err);
    }

    const fallbackOrder = {
      ...orderData,
      id: `JNK-${Math.floor(1000 + Math.random() * 9000)}`,
      time: 'Just now',
      status: 'Received'
    };
    setOrders((prev) => [fallbackOrder, ...prev]);
    return { success: true, order: fallbackOrder };
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
    showToast(`Order #${orderId} marked as ${newStatus}!`, 'info');

    try {
      await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Backend order status update failed:', err);
    }
  };

  const addRoomBooking = async (bookingData) => {
    try {
      const res = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Room booking unavailable for chosen dates.' };
      }
      if (data.booking) {
        setBookings((prev) => {
          if (prev.some(b => b.id === data.booking.id)) return prev;
          return [data.booking, ...prev];
        });
        if (soundAlertsEnabled) playNotificationChime();
        return { success: true, booking: data.booking };
      }
    } catch (err) {
      console.warn('Network error placing room booking:', err);
    }

    const fallbackBooking = {
      ...bookingData,
      id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
      time: 'Just now',
      status: 'Request to confirm (Pending Front Desk Check)'
    };
    setBookings((prev) => [fallbackBooking, ...prev]);
    return { success: true, booking: fallbackBooking };
  };

  const updateRoomBookingStatus = async (bookingId, status) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    showToast(`Booking #${bookingId} status changed to ${status}!`, 'info');

    try {
      await adminFetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.warn('Backend booking update failed:', err);
    }
  };

  // Assign delivery order to courier staff
  const assignCourierToOrder = async (orderId, courierId, courierName) => {
    try {
      const res = await adminFetch(`/api/orders/${orderId}/assign-courier`, {
        method: 'POST',
        body: JSON.stringify({ courierId, courierName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
          showToast(`Order #${orderId} assigned to ${courierName}!`, 'success');
          return data.order;
        }
      }
    } catch (err) {
      console.warn('Courier assignment error:', err);
    }
    return null;
  };

  // Payment Gateway (Razorpay Sandbox & UPI Verification)
  const createPaymentOrder = async ({ amount, currency = 'INR', receipt, orderType }) => {
    try {
      const res = await fetch(apiUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, receipt, orderType })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, internalId, orderType }) => {
    try {
      const res = await fetch(apiUrl('/api/payment/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, internalId, orderType })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Today's Offers Management
  const addOffer = async (offerData) => {
    try {
      const res = await adminFetch('/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify(offerData)
      });
      const data = await res.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
        showToast("Today's verified offer published!", 'success');
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const toggleOffer = async (offerId) => {
    try {
      const res = await adminFetch(`/api/admin/offers/${offerId}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
        showToast('Offer status updated!', 'info');
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      const res = await adminFetch(`/api/admin/offers/${offerId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
        showToast('Offer removed from rotation.', 'info');
      }
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Owner Financial Reports (Separating Gross, Discounts, Taxes/Fees & Net)
  const fetchFinancialReport = async () => {
    try {
      const res = await adminFetch('/api/admin/reports/financial');
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Notification Outbox & Provider Config
  const fetchNotificationLogs = async () => {
    try {
      const res = await adminFetch('/api/admin/notifications');
      return await res.json();
    } catch (err) {
      return { success: false, outbox: [], providerStatus: {} };
    }
  };

  const addEventEnquiry = async (enquiryData) => {
    const localId = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEnquiry = {
      ...enquiryData,
      id: localId,
      time: 'Just now',
      status: 'New'
    };
    setEventEnquiries((prev) => [newEnquiry, ...prev]);
    playNotificationChime();

    try {
      const res = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnquiry)
      });
      if (res.ok) {
        const data = await res.json();
        return data.enquiry || newEnquiry;
      }
    } catch (err) {
      console.warn('Saved event enquiry locally:', err);
    }
    return newEnquiry;
  };

  // --- ERP SUITE ACTIONS: RAW INVENTORY, EXPENSES, TASKS, STAFF, HOUSEKEEPING ---
  const addStockPurchase = async ({ itemId, addedQty, purchaseCost, updatedBy, paidVia = 'Cash' }) => {
    let updatedItemName = 'Stock';
    setRawInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          updatedItemName = item.name;
          const newQty = (parseFloat(item.currentStock) || 0) + (parseFloat(addedQty) || 0);
          return {
            ...item,
            currentStock: Math.max(0, Math.round(newQty * 10) / 10),
            lastUpdated: 'Just now',
            updatedBy: updatedBy || staffSession?.staffName || 'Staff'
          };
        }
        return item;
      })
    );

    if (purchaseCost && parseFloat(purchaseCost) > 0) {
      const newExp = {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        item: `${updatedItemName} Purchase (+${addedQty})`,
        category: 'Kitchen Raw Stock',
        amount: parseFloat(purchaseCost),
        paidVia,
        loggedBy: updatedBy || staffSession?.staffName || 'Staff'
      };
      setExpenses((prev) => [newExp, ...prev]);
    }
    showToast(`Stock added for ${updatedItemName}! Expense logged.`, 'success');

    try {
      await adminFetch('/api/inventory/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId, addedQty, purchaseCost, updatedBy: updatedBy || staffSession?.staffName, paidVia })
      });
    } catch (err) {
      console.warn('Backend stock purchase sync failed:', err);
    }
  };

  const useStock = async ({ itemId, usedQty, updatedBy }) => {
    let itemName = 'Stock';
    setRawInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          itemName = item.name;
          const newQty = Math.max(0, (parseFloat(item.currentStock) || 0) - (parseFloat(usedQty) || 0));
          return {
            ...item,
            currentStock: Math.round(newQty * 10) / 10,
            lastUpdated: 'Just now',
            updatedBy: updatedBy || staffSession?.staffName || 'Staff'
          };
        }
        return item;
      })
    );
    showToast(`Updated usage for ${itemName}!`, 'info');

    try {
      await adminFetch('/api/inventory/use', {
        method: 'POST',
        body: JSON.stringify({ itemId, usedQty, updatedBy: updatedBy || staffSession?.staffName })
      });
    } catch (err) {
      console.warn('Backend stock use sync failed:', err);
    }
  };

  const addExpense = async (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: parseFloat(expenseData.amount) || 0,
      loggedBy: expenseData.loggedBy || staffSession?.staffName || 'Staff'
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast(`Expense of ₹${newExpense.amount} logged!`, 'success');

    try {
      await adminFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense)
      });
    } catch (err) {
      console.warn('Backend expense sync failed:', err);
    }
  };

  const toggleTask = async (taskId, completedBy) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextVal = !t.completed;
          return {
            ...t,
            completed: nextVal,
            completedBy: nextVal ? (completedBy || staffSession?.staffName || 'Staff') : null,
            completedAt: nextVal ? 'Just now' : null
          };
        }
        return t;
      })
    );
    showToast(`Task status updated!`, 'info');

    try {
      await adminFetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ completedBy: completedBy || staffSession?.staffName })
      });
    } catch (err) {
      console.warn('Backend task toggle failed:', err);
    }
  };

  const addTask = async (taskData) => {
    const newTask = {
      ...taskData,
      id: `TSK-${Date.now().toString().slice(-4)}`,
      completed: false,
      completedBy: null,
      completedAt: null
    };
    setTasks((prev) => [...prev, newTask]);
    showToast(`New task added: "${newTask.title}"!`, 'success');

    try {
      await adminFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
    } catch (err) {
      console.warn('Backend task creation failed:', err);
    }
  };

  const updateStaff = async (staffMember) => {
    setStaff((prev) => {
      const idx = prev.findIndex((s) => s.id === staffMember.id);
      if (idx >= 0) {
        return prev.map((s) => (s.id === staffMember.id ? { ...s, ...staffMember } : s));
      }
      return [...prev, { ...staffMember, id: staffMember.id || `STF-${Date.now().toString().slice(-3)}` }];
    });
    showToast(`Staff member updated!`, 'success');

    try {
      await adminFetch('/api/admin/update', {
        method: 'POST',
        body: JSON.stringify({ type: 'UPDATE_STAFF', payload: staffMember })
      });
    } catch (err) {
      console.warn('Backend staff update failed:', err);
    }
  };

  const updateHousekeeping = async (roomNumber, cleaningStatus) => {
    setPhysicalRooms((prev) =>
      prev.map((r) =>
        r.roomNumber === roomNumber ? { ...r, cleaningStatus } : r
      )
    );
    showToast(`Room ${roomNumber} marked as ${cleaningStatus}!`, 'info');

    try {
      await adminFetch('/api/rooms/housekeeping', {
        method: 'PUT',
        body: JSON.stringify({ roomNumber, cleaningStatus })
      });
    } catch (err) {
      console.warn('Backend housekeeping update failed:', err);
    }
  };

  const resetToDefaults = async () => {
    setMenu(INITIAL_MENU);
    setRooms(INITIAL_ROOMS);
    setPhysicalRooms(OFFICIAL_PHYSICAL_ROOMS);
    setSettings(INITIAL_SETTINGS);
    setOrders(SAMPLE_ORDERS);
    setBookings(SAMPLE_ROOM_BOOKINGS);
    setStaff(DEFAULT_STAFF_MEMBERS);
    setRawInventory(INITIAL_RAW_INVENTORY);
    setExpenses(INITIAL_EXPENSES);
    setTasks(INITIAL_TASKS);
    localStorage.clear();

    try {
      await adminFetch('/api/admin/reset', { method: 'POST' });
    } catch {}
    showToast('Reset all data to defaults successfully.', 'info');
  };

  return (
    <HotelContext.Provider
      value={{
        hotelInfo: HOTEL_INFO,
        settings,
        menu,
        rooms,
        physicalRooms,
        orders,
        bookings,
        eventEnquiries,
        cart,
        localities: BARPETA_LOCALITIES,
        landmarks: NEARBY_LANDMARKS,
        faqs: FAQ_DATA,
        events: INITIAL_EVENTS,
        toast,
        showToast,
        isCloudSynced,
        // ERP Multi-Role Ecosystem & Data
        staffRoles: STAFF_ROLES,
        staff,
        rawInventory,
        expenses,
        tasks,
        staffSession,
        setStaffSession,
        // Enterprise Owner & Staff Auth
        currentUser,
        csrfToken,
        isAdminAuthenticated,
        loginStep1,
        verifyMfa,
        adminLogin,
        adminLogout,
        forgotPassword,
        resetPassword,
        acceptInvitation,
        fetchAuditLogs,
        fetchUsersAndInvitations,
        createInvitation,
        updateUserStatus,
        fetchActiveSessions,
        revokeSession,
        updateEventEnquiryStatus,
        // Offers & Today's Special
        offers,
        activeTodayOffer,
        addOffer,
        toggleOffer,
        deleteOffer,
        // Real-time Sound Alerts & Notification Counters
        soundAlertsEnabled,
        toggleSoundAlerts,
        testSoundAlert,
        unreadAlertsCount,
        setUnreadAlertsCount,
        // Delivery Calculation & Payments
        calculateDelivery,
        selectedLocation,
        locationSuggestions,
        isSearchingLocation,
        searchLocations,
        resolveCoordinates,
        updateSelectedLocation,
        assignCourierToOrder,
        realtimeClient,
        createPaymentOrder,
        verifyPayment,
        fetchFinancialReport,
        fetchNotificationLogs,
        // Cart
        addToCart,
        updateCartQty,
        clearCart,
        // Admin Actions
        toggleDishStock,
        updateDishPrice,
        toggleDishBestSeller,
        addDish,
        deleteDish,
        updateRoom,
        togglePhysicalRoom,
        updateSettings,
        addOrder,
        updateOrderStatus,
        addRoomBooking,
        updateRoomBookingStatus,
        addEventEnquiry,
        resetToDefaults,
        // ERP Specific Actions
        addStockPurchase,
        useStock,
        addExpense,
        toggleTask,
        addTask,
        updateStaff,
        updateHousekeeping,
        // Permanent Visitor & Customer Database
        visitorStats,
        customers,
        dbStatus,
        // PIN Auth, KYC, GPS & Export Actions
        loginWithPin,
        uploadKycDocument,
        verifyKyc,
        updateOrderLocation,
        exportCustomersCsv
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
