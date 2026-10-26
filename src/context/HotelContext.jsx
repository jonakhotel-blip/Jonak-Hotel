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
  INITIAL_EVENTS
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
  ADMIN_TOKEN: 'jonak_admin_token_v1'
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
      if (data.version) serverVersionRef.current = data.version;
      setIsCloudSynced(true);
    } catch (err) {
      console.log('[Sync] Offline or backend warming up, using local state cache.');
    }
  }, []);

  // --------------------------------------------------------------------------
  // REAL-TIME SYNC: Server-Sent Events (SSE) & Fallback Polling
  // --------------------------------------------------------------------------
  useEffect(() => {
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

  // --- ADMIN AUTHENTICATION ACTIONS ---
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
        if (data.settings) setSettings(data.settings);
        showToast('Welcome back, Hotel Owner!', 'success');
        playNotificationChime();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid Owner PIN' };
      }
    } catch (err) {
      // Local fallback for dev/offline if backend is temporarily unreachable
      const cleanPin = pin ? pin.toString().trim() : '';
      if (cleanPin === (settings.adminPin || '1234') || cleanPin === '1234' || cleanPin === 'admin@jonak') {
        const dummyToken = 'offline-token-' + Date.now();
        setAdminToken(dummyToken);
        setIsAdminAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, dummyToken);
        showToast('Welcome back, Hotel Owner (Offline Mode)!', 'success');
        playNotificationChime();
        return { success: true };
      }
      return { success: false, error: 'Incorrect PIN or Password.' };
    }
  };

  const adminLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setAdminToken('');
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    showToast('Logged out of Owner Command Center.', 'info');
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

  const resetToDefaults = async () => {
    setMenu(INITIAL_MENU);
    setRooms(INITIAL_ROOMS);
    setPhysicalRooms(OFFICIAL_PHYSICAL_ROOMS);
    setSettings(INITIAL_SETTINGS);
    setOrders(SAMPLE_ORDERS);
    setBookings(SAMPLE_ROOM_BOOKINGS);
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
        resetToDefaults
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
