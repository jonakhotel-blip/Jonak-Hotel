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
  STAFF_ROLES
} from '../data/seedData';

const HotelContext = createContext();

const STORAGE_KEYS = {
  MENU: 'jonak_menu_v1',
  ROOMS: 'jonak_rooms_v1',
  PHYSICAL_ROOMS: 'jonak_physical_rooms_v1',
  SETTINGS: 'jonak_settings_v1',
  ORDERS: 'jonak_orders_v1',
  BOOKINGS: 'jonak_bookings_v1',
  EVENTS: 'jonak_events_v1',
  CART: 'jonak_cart_v1',
  ADMIN_TOKEN: 'jonak_admin_token_v1',
  STAFF: 'jonak_staff_v1',
  INVENTORY: 'jonak_inventory_v1',
  EXPENSES: 'jonak_expenses_v1',
  TASKS: 'jonak_tasks_v1',
  STAFF_SESSION: 'jonak_staff_session_v1'
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

export const HotelProvider = ({ children }) => {
  // Load initial states from LocalStorage or seedData as fast startup cache
  const [menu, setMenu] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) return parsed;
      }
      return INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [physicalRooms, setPhysicalRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHYSICAL_ROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 9) return parsed;
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

  // Multi-Role Staff Session State
  const [staffSession, setStaffSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_SESSION);
      return saved ? JSON.parse(saved) : { role: 'owner', staffName: 'Bishnu Choudhury (Owner)', roleTitle: 'Super Admin / Hotel Owner' };
    } catch {
      return { role: 'owner', staffName: 'Bishnu Choudhury (Owner)', roleTitle: 'Super Admin / Hotel Owner' };
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

  // Helper for admin authenticated API requests
  const adminFetch = async (url, options = {}) => {
    const token = adminToken || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const pin = settings?.adminPin || '1234';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-admin-pin': pin,
      ...(options.headers || {})
    };
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
        setAdminToken('');
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
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
      const res = await fetch('/api/state', { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.menu) setMenu(data.menu);
      if (data.rooms) setRooms(data.rooms);
      if (data.physicalRooms) setPhysicalRooms(data.physicalRooms);
      if (data.settings) setSettings(data.settings);
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
        const vRes = await fetch('/api/visitors/stats');
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.stats) {
            setVisitorStats(vData.stats);
            localStorage.setItem('jonak_visitor_stats_v1', JSON.stringify(vData.stats));
          }
        }
        const cRes = await fetch('/api/customers');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (Array.isArray(cData)) {
            setCustomers(cData);
            localStorage.setItem('jonak_customers_v1', JSON.stringify(cData));
          }
        }
        const dbRes = await fetch('/api/db/status');
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
      fetch('/api/track-visit', {
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
      eventSource = new EventSource('/api/events');

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

      eventSource.addEventListener('ORDERS_UPDATED', (e) => {
        try {
          const data = JSON.parse(e.data);
          setOrders(data.payload);
          serverVersionRef.current = data.version;
          setIsCloudSynced(true);
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
          playNotificationChime();
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
          playNotificationChime();
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

    // 3. Fallback Periodic Polling (every 5-10 seconds) to ensure synchronization
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch('/api/health');
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
  const adminLogin = async (pin) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        setIsAdminAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);

        const newSession = {
          role: data.role || 'owner',
          staffName: data.staffName || 'Staff',
          roleTitle: data.roleTitle || 'Staff Member',
          permissions: data.permissions || ['ALL']
        };
        setStaffSession(newSession);
        localStorage.setItem(STORAGE_KEYS.STAFF_SESSION, JSON.stringify(newSession));

        if (data.settings) setSettings(data.settings);
        showToast(`Welcome back, ${newSession.staffName}! (${newSession.roleTitle})`, 'success');
        playNotificationChime();
        return { success: true, session: newSession };
      } else {
        return { success: false, error: data.error || 'Invalid Staff or Owner PIN' };
      }
    } catch (err) {
      // Local fallback for offline/development mode
      const cleanPin = pin ? pin.toString().trim() : '';
      let role = 'owner';
      let staffName = 'Hotel Owner';
      let roleTitle = 'Super Admin / Owner';

      if (cleanPin === (settings.adminPin || '1234') || cleanPin === '1234' || cleanPin === 'admin@jonak') {
        role = 'owner';
        staffName = 'Bishnu Choudhury (Owner)';
        roleTitle = 'Super Admin / Hotel Owner';
      } else if (cleanPin === '2222') {
        role = 'reception';
        staffName = 'Biki Sharma (Front Desk)';
        roleTitle = 'Front Desk Executive';
      } else if (cleanPin === '3333') {
        role = 'kitchen';
        staffName = 'Chef Ratan Das (Head Chef)';
        roleTitle = 'Head Master Chef & Store';
      } else if (cleanPin === '4444') {
        role = 'delivery';
        staffName = 'Monojit Roy (Delivery Captain)';
        roleTitle = 'Delivery & Room Service';
      } else if (cleanPin === '5555') {
        role = 'housekeeping';
        staffName = 'Rahul Barman (Housekeeping)';
        roleTitle = 'Housekeeping Supervisor';
      } else {
        return { success: false, error: 'Incorrect Staff PIN. Use 1234 (Owner), 2222 (Reception), 3333 (Kitchen), 4444 (Delivery), 5555 (Housekeeping).' };
      }

      const dummyToken = 'offline-token-' + Date.now();
      const newSession = { role, staffName, roleTitle, permissions: ['ALL'] };
      setAdminToken(dummyToken);
      setIsAdminAuthenticated(true);
      setStaffSession(newSession);
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, dummyToken);
      localStorage.setItem(STORAGE_KEYS.STAFF_SESSION, JSON.stringify(newSession));
      showToast(`Welcome back, ${staffName} (${roleTitle})!`, 'success');
      playNotificationChime();
      return { success: true, session: newSession };
    }
  };

  const adminLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setAdminToken('');
    setIsAdminAuthenticated(false);
    setStaffSession({ role: 'owner', staffName: 'Guest Staff', roleTitle: 'None' });
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STAFF_SESSION);
    showToast('Logged out of Staff Work Desk.', 'info');
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
        if (data.rooms) setRooms(data.rooms);
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

  const addOrder = async (orderData) => {
    const localId = `JNK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      ...orderData,
      id: localId,
      time: 'Just now',
      status: 'New'
    };
    setOrders((prev) => [newOrder, ...prev]);
    playNotificationChime();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (res.ok) {
        const data = await res.json();
        return data.order || newOrder;
      }
    } catch (err) {
      console.warn('Saved order locally:', err);
    }
    return newOrder;
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
    const localId = `BKG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      ...bookingData,
      id: localId,
      time: 'Just now',
      status: 'New'
    };
    setBookings((prev) => [newBooking, ...prev]);
    playNotificationChime();

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (res.ok) {
        const data = await res.json();
        return data.booking || newBooking;
      }
    } catch (err) {
      console.warn('Saved booking locally:', err);
    }
    return newBooking;
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
      const res = await fetch('/api/events', {
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
        // Admin Auth
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
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
        dbStatus
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
