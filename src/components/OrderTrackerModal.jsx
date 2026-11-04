import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './OrderTrackerModal.css';
import { useHotel } from '../context/HotelContext';
import confetti from 'canvas-confetti';
import {
  X,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  Flame,
  UtensilsCrossed,
  ChefHat,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Home,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Heart,
  Lock,
  ArrowLeft,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  Power,
  DollarSign,
  Radio,
  AlertTriangle,
  ExternalLink,
  Send,
  User,
  Eye,
  Menu
} from 'lucide-react';

// Jonak Hotel Coordinates (BH Road, near NRL Petrol Pump, Donakuchi, Barpeta)
const RESTAURANT_COORDS = [26.3308, 91.0064];

// Customer Destination Coordinates (Barpeta Town center, ~3.4 KM away)
const DESTINATION_COORDS = [26.3210, 91.0180];

// Realistic high-resolution waypoints along BH Road toward Barpeta Town
const ROUTE_WAYPOINTS = [
  [26.3308, 91.0064], // 0: Jonak Hotel & Restaurant Hub
  [26.3298, 91.0075], // 1: NRL Petrol Pump Junction
  [26.3288, 91.0088], // 2: BH Road Southbound
  [26.3276, 91.0102], // 3: Donakuchi Crossing
  [26.3263, 91.0118], // 4: Garemara Pathar Approach
  [26.3252, 91.0132], // 5: Barpeta Bypass Link
  [26.3241, 91.0145], // 6: Barpeta College Gate
  [26.3232, 91.0157], // 7: Dakshinhati Road Crossing
  [26.3221, 91.0169], // 8: Town Approach
  [26.3210, 91.0180]  // 9: Customer Doorstep
];

// Calculate bearing angle between two coordinates for vehicle orientation
function calculateBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;
  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Initial Menu Items for Customer Quick Order
const MENU_ITEMS_CATALOG = [
  { id: 'item-1', name: 'Jonak Special Dum Biryani', price: 350, category: 'Biryani', isVeg: false, desc: 'Aromatic basmati rice cooked with tender marinated chicken & saffron' },
  { id: 'item-2', name: 'Assamese Deluxe Thali', price: 280, category: 'Local Platters', isVeg: false, desc: 'Steamed Joha rice, dal, seasonal labra, duck curry & pitika' },
  { id: 'item-3', name: 'Butter Chicken Masala', price: 320, category: 'Indian Main', isVeg: false, desc: 'Tandoori roasted chicken tossed in creamy rich tomato gravy' },
  { id: 'item-4', name: 'Paneer Butter Masala', price: 260, category: 'Indian Main', isVeg: true, desc: 'Cottage cheese simmered in butter silk tomato gravy' },
  { id: 'item-5', name: 'Butter Naan (2 pcs)', price: 80, category: 'Indian Main', isVeg: true, desc: 'Fresh tandoor-baked leavened flatbread brushed with amul butter' },
  { id: 'item-6', name: 'Chilli Chicken Dry', price: 240, category: 'Starters', isVeg: false, desc: 'Crispy diced chicken tossed with capsicum, green chilies & soy glaze' }
];

// Active Nearby Delivery Partners for Kitchen Dispatch
const NEARBY_RIDERS = [
  { id: 'RDR-01', name: 'Rahul Sharma', rating: 4.9, vehicle: 'Hero Splendor (AS-15-H-4821)', battery: '92%', distanceKm: 0.8, status: 'Active (On Duty)' },
  { id: 'RDR-02', name: 'Monojit Roy', rating: 4.8, vehicle: 'Honda Activa (AS-15-B-1286)', battery: '78%', distanceKm: 1.4, status: 'Available' },
  { id: 'RDR-03', name: 'Bikash Das', rating: 4.9, vehicle: 'Bajaj Pulsar (AS-15-K-9021)', battery: '85%', distanceKm: 2.1, status: 'Available' }
];

export const OrderTrackerModal = ({ isOpen, onClose, targetOrderId = null }) => {
  const { orders, hotelInfo, showToast } = useHotel();

  // --------------------------------------------------------------------------
  // TOP SWITCHER: 'CUSTOMER' | 'RIDER' | 'KITCHEN'
  // --------------------------------------------------------------------------
  const [activeSuiteRole, setActiveSuiteRole] = useState('CUSTOMER');

  // Customer sub-tab: 'TRACK' | 'MENU_ORDER'
  const [customerSubTab, setCustomerSubTab] = useState('TRACK');
  const [orderTypeSelection, setOrderTypeSelection] = useState('CITY_DELIVERY'); // 'CITY_DELIVERY' | 'ROOM_DELIVERY'
  const [roomNumberInput, setRoomNumberInput] = useState('101');
  const [cartItems, setCartItems] = useState([
    { id: 'item-1', name: 'Jonak Special Dum Biryani', price: 350, qty: 1, isVeg: false },
    { id: 'item-5', name: 'Butter Naan (2 pcs)', price: 80, qty: 2, isVeg: true }
  ]);

  // --------------------------------------------------------------------------
  // CENTRAL SYNCHRONIZED ORDER & DEMO ENGINE STATE
  // --------------------------------------------------------------------------
  // Operational Status Lifecycle:
  // 1: 'PLACED' (Customer placed order -> Kitchen gets alert)
  // 2: 'PREPARING' (Kitchen cooking -> Rider gets radar alert)
  // 3: 'READY_FOR_PICKUP' (Kitchen packed -> Rider arrives at Jonak Hotel)
  // 4: 'OUT_FOR_DELIVERY' (Rider departs -> Live GPS motion on map)
  // 5: 'ARRIVED_DOORSTEP' (Rider reaches doorstep -> OTP verification)
  // 6: 'DELIVERED' (OTP submitted -> Complete & Celebration)
  const [lifecyclePhase, setLifecyclePhase] = useState(4); // Default to live tracking phase
  const [isAutoLooping, setIsAutoLooping] = useState(true);

  // Dynamic ETA & Countdown
  const [etaMinutes, setEtaMinutes] = useState(14);
  const [riderWaypointIndex, setRiderWaypointIndex] = useState(4);
  const [riderBearing, setRiderBearing] = useState(135);

  // Rider specific state
  const [isRiderOnline, setIsRiderOnline] = useState(true);
  const [radarSecondsRemaining, setRadarSecondsRemaining] = useState(30);
  const [showRiderOtpModal, setShowRiderOtpModal] = useState(false);
  const [riderOtpInput, setRiderOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Customer verification OTP
  const deliveryOtp = '5914';

  // Customer interactive toggles
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [selectedTip, setSelectedTip] = useState(30);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const traversedPolylineRef = useRef(null);

  // Selected active order
  const activeOrder = useMemo(() => {
    return {
      id: targetOrderId || 'JNK-84920',
      customerName: 'Shahidul Guest',
      phone: '9678582286',
      deliveryAddress: orderTypeSelection === 'ROOM_DELIVERY'
        ? `Room ${roomNumberInput} • Jonak Hotel & Restaurant`
        : 'BH Road, near Satra, Barpeta Town, Assam 781314',
      items: cartItems,
      subtotal: cartItems.reduce((acc, i) => acc + i.price * i.qty, 0),
      deliveryFee: 0,
      total: cartItems.reduce((acc, i) => acc + i.price * i.qty, 0) + selectedTip,
      paymentMethod: 'Paytm UPI (paytm.s1i7is2@pty)',
      createdAt: '10:30 AM'
    };
  }, [targetOrderId, orderTypeSelection, roomNumberInput, cartItems, selectedTip]);

  // --------------------------------------------------------------------------
  // CONTINUOUS MULTI-SCREEN DEMO LOOP ENGINE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !isAutoLooping) return;

    let timer;

    if (lifecyclePhase === 1) {
      // Phase 1: Customer Placed (6s)
      setEtaMinutes(35);
      setRiderWaypointIndex(0);
      timer = setTimeout(() => {
        setLifecyclePhase(2);
      }, 7000);

    } else if (lifecyclePhase === 2) {
      // Phase 2: Kitchen Preparing & Rider receives radar alert (7s)
      setEtaMinutes(25);
      setRiderWaypointIndex(0);
      setRadarSecondsRemaining(30);
      timer = setTimeout(() => {
        setLifecyclePhase(3);
      }, 7000);

    } else if (lifecyclePhase === 3) {
      // Phase 3: Food Ready & Rider arrived at Jonak Hotel (6s)
      setEtaMinutes(20);
      setRiderWaypointIndex(0);
      timer = setTimeout(() => {
        setLifecyclePhase(4);
      }, 6000);

    } else if (lifecyclePhase === 4) {
      // Phase 4: Out for Delivery & Live Movement (18s)
      let step = 0;
      const stepInterval = setInterval(() => {
        step += 1;
        if (step < ROUTE_WAYPOINTS.length) {
          setRiderWaypointIndex(step);
          const remainingMinutes = Math.max(1, Math.round(15 - (step / ROUTE_WAYPOINTS.length) * 14));
          setEtaMinutes(remainingMinutes);

          // Calculate directional angle
          const prev = ROUTE_WAYPOINTS[step - 1];
          const curr = ROUTE_WAYPOINTS[step];
          const b = calculateBearing(prev[0], prev[1], curr[0], curr[1]);
          setRiderBearing(b);
        }
      }, 1800); // 10 waypoints * 1.8s = 18s

      timer = setTimeout(() => {
        clearInterval(stepInterval);
        setLifecyclePhase(5);
      }, 18000);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(timer);
      };

    } else if (lifecyclePhase === 5) {
      // Phase 5: Arrived at Doorstep (6s)
      setEtaMinutes(1);
      setRiderWaypointIndex(ROUTE_WAYPOINTS.length - 1);
      timer = setTimeout(() => {
        setLifecyclePhase(6);
      }, 6000);

    } else if (lifecyclePhase === 6) {
      // Phase 6: Delivered & Celebration (6s) -> Reset back to Phase 1
      setEtaMinutes(0);
      setRiderWaypointIndex(ROUTE_WAYPOINTS.length - 1);

      try {
        confetti({
          particleCount: 60,
          spread: 90,
          origin: { y: 0.55 }
        });
      } catch {}

      timer = setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('🔄 Demo Engine: Resetting cycle to Phase 1 (Customer Order Placed)', 'info');
        }
        setLifecyclePhase(1);
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [isOpen, lifecyclePhase, isAutoLooping, showToast]);

  // Global ESC Key Listener & Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // --------------------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION & RESIZE GUARDS
  // --------------------------------------------------------------------------
  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    if (!window.L) {
      console.warn('Leaflet library is loading...');
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = window.L;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [26.3259, 91.0122],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // Add Zoom control bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Voyager / CartoDB tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // 1. Restaurant Marker (Jonak Hotel Hub)
      const restaurantIcon = L.divIcon({
        className: 'custom-restaurant-icon-wrapper',
        html: `
          <div class="jonak-map-marker-restaurant">
            <span style="font-size: 20px;">🏨</span>
            <div class="jonak-pulse-ring"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      L.marker(RESTAURANT_COORDS, { icon: restaurantIcon })
        .addTo(map)
        .bindPopup(`<strong>🏨 Jonak Hotel & Restaurant</strong><br/>BH Road, Donakuchi, Barpeta<br/><em>Kitchen Dispatch Hub</em>`);

      // 2. 5 KM Free Delivery Coverage Circle
      L.circle(RESTAURANT_COORDS, {
        radius: 5000,
        color: '#D4AF37',
        fillColor: '#003838',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '5, 8'
      }).addTo(map);

      // 3. Customer Destination Marker
      const destIcon = L.divIcon({
        className: 'custom-dest-icon-wrapper',
        html: `
          <div class="jonak-map-marker-dest">
            <span style="font-size: 20px;">🏠</span>
            <div class="jonak-pulse-ring-dest"></div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      L.marker(DESTINATION_COORDS, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>📍 Customer Delivery Point</strong><br/>${activeOrder?.deliveryAddress}`);

      // 4. Base Route Polyline
      const baseRoute = L.polyline(ROUTE_WAYPOINTS, {
        color: '#D4AF37',
        weight: 4,
        opacity: 0.5,
        dashArray: '6, 8'
      }).addTo(map);
      routePolylineRef.current = baseRoute;

      // 5. Dynamic Traversed Polyline
      const traversed = L.polyline([RESTAURANT_COORDS], {
        color: '#10B981',
        weight: 5,
        opacity: 0.95
      }).addTo(map);
      traversedPolylineRef.current = traversed;

      // 6. Delivery Rider Marker
      const initialPos = ROUTE_WAYPOINTS[riderWaypointIndex] || ROUTE_WAYPOINTS[0];
      const bikeIcon = L.divIcon({
        className: 'custom-bike-icon-wrapper',
        html: `
          <div id="jonak-bike-marker-inner" class="jonak-map-marker-bike" style="transform: rotate(${riderBearing}deg);">
            <span style="font-size: 22px;">🛵</span>
          </div>
        `,
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      });

      const riderMarker = L.marker(initialPos, { icon: bikeIcon, zIndexOffset: 1000 }).addTo(map);
      riderMarker.bindPopup(`<strong>🛵 Rahul Sharma</strong><br/>Hero Splendor (AS-15-H-4821)`);
      riderMarkerRef.current = riderMarker;

      map.fitBounds(baseRoute.getBounds(), { padding: [50, 50] });

      // Invalidate size across multiple passes to guarantee 0 blank screens on iOS Safari/Chrome Mobile
      [100, 300, 600, 1000].forEach(delay => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });

    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }
  }, [activeOrder?.deliveryAddress, riderBearing, riderWaypointIndex]);

  // Mount/Re-mount map whenever view opens or active role switches
  useEffect(() => {
    if (isOpen && (activeSuiteRole === 'CUSTOMER' || activeSuiteRole === 'RIDER')) {
      const timer = setTimeout(() => {
        initMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeSuiteRole, initMap]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update bike position on map
  useEffect(() => {
    if (!riderMarkerRef.current || !mapInstanceRef.current) return;

    const currentCoord = ROUTE_WAYPOINTS[riderWaypointIndex] || ROUTE_WAYPOINTS[0];
    riderMarkerRef.current.setLatLng(currentCoord);

    const bikeInnerEl = document.getElementById('jonak-bike-marker-inner');
    if (bikeInnerEl) {
      bikeInnerEl.style.transform = `rotate(${riderBearing}deg)`;
    }

    if (traversedPolylineRef.current) {
      const traversedCoords = ROUTE_WAYPOINTS.slice(0, riderWaypointIndex + 1);
      traversedPolylineRef.current.setLatLngs(traversedCoords);
    }
  }, [riderWaypointIndex, riderBearing]);

  // Copy OTP Helper
  const handleCopyOtp = () => {
    try {
      navigator.clipboard?.writeText(deliveryOtp);
      setCopiedOtp(true);
      if (typeof showToast === 'function') {
        showToast(`Delivery OTP ${deliveryOtp} copied!`, 'success');
      }
      setTimeout(() => setCopiedOtp(false), 2500);
    } catch {
      if (typeof showToast === 'function') {
        showToast(`Delivery OTP is ${deliveryOtp}`, 'info');
      }
    }
  };

  // Rider OTP Submission Verification
  const handleVerifyRiderOtp = () => {
    if (riderOtpInput.trim() === deliveryOtp) {
      setShowRiderOtpModal(false);
      setOtpError('');
      setLifecyclePhase(6); // Move to DELIVERED
      if (typeof showToast === 'function') {
        showToast('🎉 OTP 5914 Verified! Order marked DELIVERED successfully.', 'success');
      }
    } else {
      setOtpError('Invalid OTP! Please ask customer for correct 4-digit code (5914).');
    }
  };

  if (!isOpen) return null;

  // Phase metadata for Customer & Stepper
  const phaseMetadata = {
    1: { title: 'Order Placed & Confirmed', sub: 'Kitchen received your ticket', badge: 'Placed', progress: 15 },
    2: { title: 'Kitchen is Preparing Food', sub: 'Chef is cooking authentic Barpeta spices', badge: 'Cooking', progress: 35 },
    3: { title: 'Food Ready & Rider Arrived', sub: 'Packed in insulated thermal hot-bag', badge: 'Packed', progress: 55 },
    4: { title: 'Rahul is on the way!', sub: 'Moving via BH Road at 28 km/h', badge: 'Out for Delivery', progress: 80 },
    5: { title: 'Rider Reached Doorstep', sub: 'Please share OTP 5914 with rider', badge: 'Arrived', progress: 95 },
    6: { title: 'Order Delivered Successfully!', sub: 'Enjoy your hot meal from Jonak Hotel 🍽️', badge: 'Delivered', progress: 100 }
  };

  const currentMeta = phaseMetadata[lifecyclePhase] || phaseMetadata[4];

  return (
    <div className="jonak-tracker-overlay" onClick={onClose}>
      <div className="jonak-tracker-shell" onClick={(e) => e.stopPropagation()}>

        {/* ================================================================== */}
        {/* TOP BRAND & MULTI-ROLE SWITCHER HEADER                             */}
        {/* ================================================================== */}
        <header className="jonak-suite-header">
          {/* Top Brand Line */}
          <div className="jonak-suite-toprow">
            <div className="jonak-suite-brand">
              <div className="jonak-suite-brand-logo">🏨</div>
              <div className="jonak-suite-brand-text">
                <h1>Jonak Hotel &amp; Restaurant</h1>
                <p>jonakhotelgroup.in • Unified Dispatch Suite</p>
              </div>
            </div>

            <div className="jonak-suite-controls-right">
              {/* Recenter Map on demand */}
              <button
                type="button"
                className="jonak-demo-pill"
                onClick={() => {
                  if (mapInstanceRef.current && routePolylineRef.current) {
                    mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
                    mapInstanceRef.current.invalidateSize();
                  }
                }}
                title="Recenter Map View"
              >
                <Navigation size={13} />
                <span>Fit Route</span>
              </button>

              <button
                type="button"
                className="jonak-topbar-close-btn"
                onClick={onClose}
                aria-label="Close Portal"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Role Switcher Bar */}
          <div className="jonak-role-switcher-bar">
            {/* 3 Interactive View Buttons */}
            <div className="jonak-role-tabs">
              <button
                type="button"
                className={`jonak-role-tab-btn ${activeSuiteRole === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setActiveSuiteRole('CUSTOMER')}
              >
                <ShoppingBag size={14} />
                <span>Customer View</span>
              </button>

              <button
                type="button"
                className={`jonak-role-tab-btn rider ${activeSuiteRole === 'RIDER' ? 'active' : ''}`}
                onClick={() => setActiveSuiteRole('RIDER')}
              >
                <Bike size={14} />
                <span>Rider Console</span>
                {lifecyclePhase === 2 && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />}
              </button>

              <button
                type="button"
                className={`jonak-role-tab-btn kitchen ${activeSuiteRole === 'KITCHEN' ? 'active' : ''}`}
                onClick={() => setActiveSuiteRole('KITCHEN')}
              >
                <ChefHat size={14} />
                <span>Kitchen Admin</span>
              </button>
            </div>

            {/* Continuous Looping State Machine Controls */}
            <div className="jonak-demo-engine-controls">
              <button
                type="button"
                className="jonak-demo-pill"
                onClick={() => setIsAutoLooping(v => !v)}
                title={isAutoLooping ? 'Pause continuous demo cycle' : 'Resume continuous demo cycle'}
              >
                {isAutoLooping ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoLooping ? 'Loop: ON' : 'Paused'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5, 6].map(ph => (
                  <button
                    key={ph}
                    type="button"
                    style={{
                      background: lifecyclePhase === ph ? '#D4AF37' : 'rgba(255,255,255,0.06)',
                      color: lifecyclePhase === ph ? '#070B14' : '#94A3B8',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setLifecyclePhase(ph);
                      if (ph === 1 || ph === 2 || ph === 3) setRiderWaypointIndex(0);
                      else if (ph === 4) setRiderWaypointIndex(4);
                      else setRiderWaypointIndex(ROUTE_WAYPOINTS.length - 1);
                    }}
                    title={`Jump to Phase ${ph}`}
                  >
                    P{ph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================== */}
        {/* SUITE CONTENT AREA                                                 */}
        {/* ================================================================== */}
        <div className="jonak-suite-content">

          {/* ---------------------------------------------------------------- */}
          {/* VIEW 1: CUSTOMER ORDER & LIVE TRACKING PORTAL (MODULE 3)         */}
          {/* ---------------------------------------------------------------- */}
          {activeSuiteRole === 'CUSTOMER' && (
            <div className="jonak-customer-split">
              {/* Left / Top Map Canvas */}
              <div className="jonak-customer-map-pane">
                <div ref={mapContainerRef} className="jonak-map-canvas-full" />

                {/* Branded Live GPS Pill */}
                <div className="jonak-map-floating-pill">
                  <span className="jonak-live-indicator-dot" />
                  <div>
                    <div className="jonak-floating-pill-title">JONAK EXPRESS • LIVE GPS</div>
                    <div className="jonak-floating-pill-sub">BH Road ➔ Barpeta Town</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="jonak-recenter-btn"
                  onClick={() => {
                    if (mapInstanceRef.current && routePolylineRef.current) {
                      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
                      mapInstanceRef.current.invalidateSize();
                    }
                  }}
                  title="Recenter Route"
                >
                  <Navigation size={18} color="#D4AF37" />
                </button>
              </div>

              {/* Right / Bottom Customer Details Panel */}
              <div className="jonak-customer-details-pane">
                {/* Switch between Live Tracking and Quick Menu Ordering */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <button
                    type="button"
                    className={`jonak-role-tab-btn ${customerSubTab === 'TRACK' ? 'active' : ''}`}
                    onClick={() => setCustomerSubTab('TRACK')}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Bike size={14} />
                    <span>Live Tracking</span>
                  </button>
                  <button
                    type="button"
                    className={`jonak-role-tab-btn ${customerSubTab === 'MENU_ORDER' ? 'active' : ''}`}
                    onClick={() => setCustomerSubTab('MENU_ORDER')}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <UtensilsCrossed size={14} />
                    <span>Dynamic Menu</span>
                  </button>
                </div>

                {customerSubTab === 'MENU_ORDER' ? (
                  /* Dynamic Menu & Cart Section */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#D4AF37' }}>Delivery Destination:</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className={`jonak-sim-btn ${orderTypeSelection === 'CITY_DELIVERY' ? 'active' : ''}`}
                          onClick={() => setOrderTypeSelection('CITY_DELIVERY')}
                        >
                          <MapPin size={12} />
                          <span>City Home Delivery</span>
                        </button>
                        <button
                          type="button"
                          className={`jonak-sim-btn ${orderTypeSelection === 'ROOM_DELIVERY' ? 'active' : ''}`}
                          onClick={() => setOrderTypeSelection('ROOM_DELIVERY')}
                        >
                          <Home size={12} />
                          <span>Hotel Room Delivery</span>
                        </button>
                      </div>

                      {orderTypeSelection === 'ROOM_DELIVERY' && (
                        <div style={{ marginTop: '0.65rem' }}>
                          <label style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Select Room Number:</label>
                          <select
                            value={roomNumberInput}
                            onChange={(e) => setRoomNumberInput(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              background: '#090E17',
                              border: '1px solid #D4AF37',
                              color: '#FFFFFF',
                              marginTop: '0.25rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            {['101', '102', '201', '202', '203', '204', '301', '302', '303', '304'].map(r => (
                              <option key={r} value={r}>Room {r} ({r === '101' ? 'Presidential Suite' : 'Deluxe AC'})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.9rem', color: '#FFFFFF', margin: '0.2rem 0 0' }}>Jonak Specialties:</h4>
                    {MENU_ITEMS_CATALOG.map(dish => (
                      <div
                        key={dish.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className={dish.isVeg ? 'jonak-veg-dot' : 'jonak-nonveg-dot'} />
                            <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>{dish.name}</strong>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: '0.2rem 0' }}>{dish.desc}</p>
                          <span style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 800 }}>₹{dish.price}</span>
                        </div>
                        <button
                          type="button"
                          className="jonak-sim-btn"
                          style={{ background: '#10B981', color: '#070B14', fontWeight: 800 }}
                          onClick={() => {
                            setCartItems(prev => {
                              const exists = prev.find(i => i.id === dish.id);
                              if (exists) {
                                return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i);
                              }
                              return [...prev, { ...dish, qty: 1 }];
                            });
                            if (typeof showToast === 'function') {
                              showToast(`Added ${dish.name} to order`, 'success');
                            }
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Live Tracking Cards */
                  <>
                    {/* Live ETA Card */}
                    <div className="jonak-eta-card">
                      <div className="jonak-eta-top-row">
                        <span className="jonak-eta-badge">
                          <span className="jonak-live-indicator-dot" style={{ width: '6px', height: '6px' }} />
                          {currentMeta.badge}
                        </span>

                        <div className="jonak-eta-countdown">
                          <Clock size={16} color="#D4AF37" />
                          <span className="jonak-eta-time-val">
                            {lifecyclePhase === 6 ? 'Delivered' : `${etaMinutes} mins`}
                          </span>
                          {lifecyclePhase !== 6 && <span className="jonak-eta-time-lbl">ESTIMATED</span>}
                        </div>
                      </div>

                      <h3 className="jonak-status-headline">{currentMeta.title}</h3>
                      <p className="jonak-status-subtext">{currentMeta.sub}</p>

                      <div className="jonak-progress-bar-track">
                        <div className="jonak-progress-bar-fill" style={{ width: `${currentMeta.progress}%` }} />
                      </div>

                      {/* Stepper */}
                      <div className="jonak-stepper-row">
                        {[
                          { step: 1, label: 'Placed' },
                          { step: 2, label: 'Cooking' },
                          { step: 3, label: 'Packed' },
                          { step: 4, label: 'On Way' },
                          { step: 5, label: 'Doorstep' },
                          { step: 6, label: 'Delivered' }
                        ].map(st => {
                          const isDone = lifecyclePhase > st.step;
                          const isCurrent = lifecyclePhase === st.step;
                          return (
                            <div key={st.step} className={`jonak-step-node ${isDone ? 'completed' : isCurrent ? 'current' : ''}`}>
                              <div className="jonak-step-dot">
                                {isDone ? <Check size={11} strokeWidth={3} /> : st.step}
                              </div>
                              <span className="jonak-step-label">{st.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery Captain Card */}
                    <div className="jonak-captain-card">
                      <div className="jonak-captain-header">
                        <div className="jonak-captain-bio">
                          <div className="jonak-captain-avatar">
                            <span>🛵</span>
                          </div>
                          <div>
                            <h4 className="jonak-captain-name">
                              Rahul Sharma
                              <span className="jonak-captain-rating">★ 4.9</span>
                            </h4>
                            <p className="jonak-captain-stats">Hero Splendor • AS-15-H-4821</p>
                          </div>
                        </div>

                        <div className="jonak-captain-actions">
                          <a href="tel:+918876055667" className="jonak-captain-btn call" title="Call Rahul">
                            <Phone size={15} />
                          </a>
                          <a
                            href={`https://wa.me/919678582286?text=${encodeURIComponent(`Hello Rahul, I am tracking Order #${activeOrder.id}. Please deliver safely!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jonak-captain-btn"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={15} />
                          </a>
                        </div>
                      </div>

                      <div className="jonak-safety-pill">
                        <ShieldCheck size={15} color="#10B981" />
                        <span>Rider sanitized helmet &amp; thermal bag verified • Temperature 98.2°F</span>
                      </div>

                      {/* Tip Selector */}
                      <div className="jonak-tip-section">
                        <div className="jonak-tip-label">
                          <span>Tip your delivery partner:</span>
                          <span style={{ color: '#D4AF37' }}>{selectedTip > 0 ? `₹${selectedTip} added` : 'Optional'}</span>
                        </div>
                        <div className="jonak-tip-chips">
                          {[20, 30, 50, 100].map(tip => (
                            <button
                              key={tip}
                              type="button"
                              className={`jonak-tip-chip ${selectedTip === tip ? 'active' : ''}`}
                              onClick={() => setSelectedTip(selectedTip === tip ? 0 : tip)}
                            >
                              + ₹{tip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Delivery OTP Box */}
                    <div className="jonak-otp-card">
                      <div className="jonak-otp-left">
                        <div className="jonak-otp-icon-wrap">
                          <Lock size={18} />
                        </div>
                        <div>
                          <p className="jonak-otp-title">DELIVERY VERIFICATION OTP</p>
                          <p className="jonak-otp-sub">Share with Rahul only upon receiving food</p>
                        </div>
                      </div>

                      <div className="jonak-otp-code-box" onClick={handleCopyOtp} style={{ cursor: 'pointer' }} title="Click to copy OTP">
                        {copiedOtp ? 'COPIED!' : deliveryOtp}
                      </div>
                    </div>

                    {/* Delivery Address & Contactless switch */}
                    <div className="jonak-address-card">
                      <div className="jonak-address-row">
                        <MapPin size={18} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div className="jonak-address-text">
                          <strong>Delivering To:</strong>
                          <span>{activeOrder.deliveryAddress}</span>
                        </div>
                      </div>

                      <label className="jonak-door-toggle">
                        <span>Leave at door / contactless delivery</span>
                        <div className="jonak-switch">
                          <input type="checkbox" checked={leaveAtDoor} onChange={e => setLeaveAtDoor(e.target.checked)} />
                          <span className="jonak-slider" />
                        </div>
                      </label>
                    </div>

                    {/* Order Summary Accordion */}
                    <div className="jonak-order-accordion">
                      <div className="jonak-accordion-header" onClick={() => setIsAccordionOpen(v => !v)}>
                        <div className="jonak-accordion-header-left">
                          <ShoppingBag size={16} color="#D4AF37" />
                          <span className="jonak-accordion-title">Order Summary ({cartItems.length} items)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="jonak-accordion-badge">₹{activeOrder.total}</span>
                          {isAccordionOpen ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                        </div>
                      </div>

                      {isAccordionOpen && (
                        <div className="jonak-accordion-content">
                          {cartItems.map((item, idx) => (
                            <div key={idx} className="jonak-order-item-row">
                              <div className="jonak-order-item-left">
                                <span className={item.isVeg ? 'jonak-veg-dot' : 'jonak-nonveg-dot'} />
                                <span style={{ color: '#FFFFFF' }}>{item.name} <span style={{ color: '#94A3B8' }}>x{item.qty}</span></span>
                              </div>
                              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{item.price * item.qty}</span>
                            </div>
                          ))}

                          <div className="jonak-bill-summary">
                            <div className="jonak-bill-row">
                              <span>Subtotal</span>
                              <span>₹{activeOrder.subtotal}</span>
                            </div>
                            <div className="jonak-bill-row">
                              <span>Delivery Fee (Within 5 KM)</span>
                              <span style={{ color: '#10B981', fontWeight: 700 }}>FREE (₹0)</span>
                            </div>
                            {selectedTip > 0 && (
                              <div className="jonak-bill-row">
                                <span>Captain Tip</span>
                                <span>₹{selectedTip}</span>
                              </div>
                            )}
                            <div className="jonak-bill-row total">
                              <span>Total Amount</span>
                              <span style={{ color: '#D4AF37' }}>₹{activeOrder.total}</span>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                              <span className="jonak-paid-tag">
                                <Check size={12} strokeWidth={3} /> Paid via Paytm UPI (paytm.s1i7is2@pty)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* VIEW 2: DEDICATED RIDER / DELIVERY PARTNER CONSOLE (MODULE 2)    */}
          {/* ---------------------------------------------------------------- */}
          {activeSuiteRole === 'RIDER' && (
            <div className="jonak-rider-container">
              {/* Rider Shift & Earnings Header */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="jonak-rider-shift-bar">
                  <div className="jonak-rider-status-toggle" onClick={() => setIsRiderOnline(v => !v)}>
                    <span className={`jonak-rider-status-badge ${isRiderOnline ? 'online' : 'offline'}`}>
                      <span className="jonak-live-indicator-dot" style={{ background: isRiderOnline ? '#10B981' : '#EF4444' }} />
                      {isRiderOnline ? 'ON DUTY (ONLINE)' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="jonak-rider-earnings-pill">
                    <DollarSign size={14} />
                    <span>₹680 Earned today • 7 trips</span>
                  </div>
                </div>

                {/* Main Rider View */}
                <div className="jonak-rider-active-mission">
                  {/* Left / Top Map View */}
                  <div className="jonak-rider-map-pane">
                    <div ref={mapContainerRef} className="jonak-map-canvas-full" />

                    <div className="jonak-map-floating-pill">
                      <span className="jonak-live-indicator-dot" />
                      <div>
                        <div className="jonak-floating-pill-title">RIDER GPS NAVIGATION</div>
                        <div className="jonak-floating-pill-sub">Speed: 28 km/h • Next turn: BH Road South</div>
                      </div>
                    </div>
                  </div>

                  {/* Right / Bottom Controls View */}
                  <div className="jonak-rider-controls-pane">
                    {/* Incoming Order Radar Alert Card (shown during Phase 2) */}
                    {lifecyclePhase === 2 && (
                      <div className="jonak-radar-card">
                        <div className="jonak-radar-header">
                          <span className="jonak-radar-alert-tag">
                            <Radio size={12} />
                            INCOMING ORDER ALERT
                          </span>
                          <span className="jonak-radar-timer-pill">{radarSecondsRemaining}s</span>
                        </div>

                        <div className="jonak-radar-countdown-bar">
                          <div className="jonak-radar-countdown-fill" style={{ width: `${(radarSecondsRemaining / 30) * 100}%` }} />
                        </div>

                        <div className="jonak-radar-locations">
                          <div className="jonak-radar-loc-row">
                            <div className="jonak-radar-loc-icon pickup">🏨</div>
                            <div className="jonak-radar-loc-details">
                              <h5>PICKUP: Jonak Hotel &amp; Restaurant</h5>
                              <p>BH Road, near NRL Petrol Pump, Donakuchi (0.4 KM away)</p>
                            </div>
                          </div>

                          <div className="jonak-radar-loc-row">
                            <div className="jonak-radar-loc-icon drop">📍</div>
                            <div className="jonak-radar-loc-details">
                              <h5>DROP: {activeOrder.deliveryAddress}</h5>
                              <p>Distance: 3.4 KM • Estimated Delivery: 18 mins</p>
                            </div>
                          </div>
                        </div>

                        <div className="jonak-radar-payout-box">
                          <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>Estimated Rider Payout:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>₹65</span>
                        </div>

                        <div className="jonak-radar-actions">
                          <button
                            type="button"
                            className="jonak-radar-btn accept"
                            onClick={() => {
                              setLifecyclePhase(3);
                              if (typeof showToast === 'function') {
                                showToast('🛵 Order Accepted! Proceed to Jonak Hotel kitchen for pickup.', 'success');
                              }
                            }}
                          >
                            <Check size={16} strokeWidth={3} />
                            <span>ACCEPT ORDER</span>
                          </button>
                          <button
                            type="button"
                            className="jonak-radar-btn decline"
                            onClick={() => {
                              setLifecyclePhase(1);
                              if (typeof showToast === 'function') {
                                showToast('Order skipped.', 'info');
                              }
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Turn-by-Turn Navigation & Action Workflow Steps */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>Order #{activeOrder.id}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Customer: {activeOrder.customerName} ({activeOrder.phone})</div>
                        </div>
                        <span className="jonak-eta-badge">{currentMeta.badge}</span>
                      </div>

                      {/* 5 Turn-by-Turn Rider Workflow Action Buttons */}
                      <div className="jonak-rider-action-grid">
                        <button
                          type="button"
                          className={`jonak-rider-step-btn ${lifecyclePhase === 3 ? 'current' : lifecyclePhase > 3 ? 'completed' : ''}`}
                          onClick={() => {
                            setLifecyclePhase(3);
                            showToast('Status: Reached Jonak Hotel kitchen', 'info');
                          }}
                        >
                          <span>1. Reached Restaurant (Jonak Hotel)</span>
                          {lifecyclePhase > 3 ? <Check size={16} /> : <Navigation size={16} />}
                        </button>

                        <button
                          type="button"
                          className={`jonak-rider-step-btn ${lifecyclePhase === 3 ? 'completed' : lifecyclePhase === 4 ? 'current' : lifecyclePhase > 4 ? 'completed' : ''}`}
                          onClick={() => {
                            setLifecyclePhase(4);
                            showToast('Status: Order Picked Up! Moving out for delivery', 'success');
                          }}
                        >
                          <span>2. Order Picked Up / Food Collected</span>
                          {lifecyclePhase > 3 ? <Check size={16} /> : <ShoppingBag size={16} />}
                        </button>

                        <button
                          type="button"
                          className={`jonak-rider-step-btn ${lifecyclePhase === 4 ? 'current' : lifecyclePhase > 4 ? 'completed' : ''}`}
                          onClick={() => {
                            setLifecyclePhase(4);
                            showToast('Status: Out for Delivery on BH Road', 'info');
                          }}
                        >
                          <span>3. Out for Delivery (Live GPS Active)</span>
                          <Bike size={16} />
                        </button>

                        <button
                          type="button"
                          className={`jonak-rider-step-btn ${lifecyclePhase === 5 ? 'current' : lifecyclePhase > 5 ? 'completed' : ''}`}
                          onClick={() => {
                            setLifecyclePhase(5);
                            showToast('Status: Arrived at Customer Doorstep', 'info');
                          }}
                        >
                          <span>4. Arrived at Customer Doorstep</span>
                          {lifecyclePhase >= 5 ? <Check size={16} /> : <Home size={16} />}
                        </button>

                        <button
                          type="button"
                          className={`jonak-rider-step-btn ${lifecyclePhase === 6 ? 'completed' : 'current'}`}
                          style={{ background: lifecyclePhase === 6 ? '#10B981' : '#F59E0B', color: '#070B14' }}
                          onClick={() => {
                            setShowRiderOtpModal(true);
                          }}
                        >
                          <span>5. Enter Customer OTP &amp; Complete</span>
                          <Lock size={16} />
                        </button>
                      </div>

                      {/* Quick Communication Tools */}
                      <div className="jonak-rider-quick-tools" style={{ marginTop: '1rem' }}>
                        <a href="tel:+919678582286" className="jonak-rider-tool-btn">
                          <Phone size={14} color="#10B981" />
                          <span>Call Customer</span>
                        </a>

                        <a
                          href={`https://maps.google.com/?q=${DESTINATION_COORDS[0]},${DESTINATION_COORDS[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jonak-rider-tool-btn"
                        >
                          <ExternalLink size={14} color="#D4AF37" />
                          <span>Open Google Maps</span>
                        </a>

                        <button
                          type="button"
                          className="jonak-rider-tool-btn sos"
                          onClick={() => showToast('🚨 Emergency SOS alert sent to Jonak Support Manager', 'danger')}
                        >
                          <AlertTriangle size={14} />
                          <span>SOS Support</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider OTP Verification Submission Modal */}
              {showRiderOtpModal && (
                <div className="jonak-mini-modal-overlay" onClick={() => setShowRiderOtpModal(false)}>
                  <div className="jonak-mini-modal-box" onClick={e => e.stopPropagation()}>
                    <Lock size={32} color="#D4AF37" style={{ margin: '0 auto 0.5rem' }} />
                    <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', margin: 0 }}>Customer Delivery OTP</h3>
                    <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                      Ask customer for the 4-digit verification code shown on their tracking screen.
                    </p>

                    <div className="jonak-otp-inputs-row">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="5914"
                        value={riderOtpInput}
                        onChange={e => setRiderOtpInput(e.target.value)}
                        className="jonak-otp-digit"
                        style={{ width: '160px', letterSpacing: '0.4em' }}
                        autoFocus
                      />
                    </div>

                    {otpError && <p style={{ color: '#EF4444', fontSize: '0.74rem', marginBottom: '0.75rem' }}>{otpError}</p>}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="jonak-radar-btn accept"
                        onClick={handleVerifyRiderOtp}
                      >
                        Verify &amp; Complete
                      </button>
                      <button
                        type="button"
                        className="jonak-radar-btn decline"
                        onClick={() => setShowRiderOtpModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* VIEW 3: KITCHEN / MANAGER DISPATCH DESK (MODULE 4)               */}
          {/* ---------------------------------------------------------------- */}
          {activeSuiteRole === 'KITCHEN' && (
            <div className="jonak-kitchen-container">
              {/* Header */}
              <div className="jonak-kitchen-header">
                <div className="jonak-kitchen-title">
                  <ChefHat size={26} color="#F97316" />
                  <div>
                    <h3>Master Chef Kitchen &amp; Dispatch Desk</h3>
                    <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: 0 }}>Jonak Hotel Kitchen Hub • Live Order Management</p>
                  </div>
                  <span>LIVE KDS</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="jonak-demo-pill"
                    style={{ background: '#F97316', color: '#070B14' }}
                    onClick={() => {
                      setLifecyclePhase(2);
                      showToast('Kitchen cooking alert dispatched to chef lane', 'info');
                    }}
                  >
                    Start Cooking
                  </button>
                  <button
                    type="button"
                    className="jonak-demo-pill"
                    style={{ background: '#10B981', color: '#070B14' }}
                    onClick={() => {
                      setLifecyclePhase(3);
                      showToast('📢 Food Ready! Pinged assigned rider Rahul Sharma for pickup.', 'success');
                    }}
                  >
                    Mark Food Ready
                  </button>
                </div>
              </div>

              {/* 4 Kanban Operational Columns */}
              <div className="jonak-kanban-board">
                {/* Column 1: New Orders */}
                <div className="jonak-kanban-col">
                  <div className="jonak-kanban-col-head">
                    <span className="jonak-kanban-col-title">
                      <Clock size={14} color="#D4AF37" />
                      1. New Orders
                    </span>
                    <span className="jonak-kanban-count">{lifecyclePhase === 1 ? '1' : '0'}</span>
                  </div>

                  {lifecyclePhase === 1 ? (
                    <div className="jonak-kcard active-kcard">
                      <div className="jonak-kcard-top">
                        <span className="jonak-kcard-id">#{activeOrder.id}</span>
                        <span className="jonak-kcard-time">Just now</span>
                      </div>
                      <div className="jonak-kcard-items">
                        • 1x Jonak Special Dum Biryani<br />
                        • 2x Butter Naan (2 pcs)
                      </div>
                      <div className="jonak-kcard-dest">
                        <MapPin size={12} />
                        <span>{activeOrder.deliveryAddress}</span>
                      </div>
                      <button
                        type="button"
                        className="jonak-kcard-action-btn prepare"
                        onClick={() => setLifecyclePhase(2)}
                      >
                        <Flame size={14} />
                        <span>Accept &amp; Start Cooking</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>No new pending tickets</div>
                  )}
                </div>

                {/* Column 2: In Kitchen / Preparing */}
                <div className="jonak-kanban-col">
                  <div className="jonak-kanban-col-head">
                    <span className="jonak-kanban-col-title">
                      <Flame size={14} color="#F97316" />
                      2. In Kitchen
                    </span>
                    <span className="jonak-kanban-count">{lifecyclePhase === 2 ? '1' : '0'}</span>
                  </div>

                  {lifecyclePhase === 2 ? (
                    <div className="jonak-kcard active-kcard">
                      <div className="jonak-kcard-top">
                        <span className="jonak-kcard-id">#{activeOrder.id}</span>
                        <span className="jonak-kcard-time" style={{ color: '#F97316' }}>Cooking (12m left)</span>
                      </div>
                      <div className="jonak-kcard-items">
                        • 1x Jonak Special Dum Biryani<br />
                        • 2x Butter Naan (2 pcs)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981' }}>✓ Rider Rahul Sharma alerted via radar</div>
                      <button
                        type="button"
                        className="jonak-kcard-action-btn ready"
                        onClick={() => setLifecyclePhase(3)}
                      >
                        <Check size={14} strokeWidth={3} />
                        <span>Mark Food Ready</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>Kitchen lane clear</div>
                  )}
                </div>

                {/* Column 3: Food Ready for Pickup */}
                <div className="jonak-kanban-col">
                  <div className="jonak-kanban-col-head">
                    <span className="jonak-kanban-col-title">
                      <ShoppingBag size={14} color="#10B981" />
                      3. Ready for Pickup
                    </span>
                    <span className="jonak-kanban-count">{lifecyclePhase === 3 ? '1' : '0'}</span>
                  </div>

                  {lifecyclePhase === 3 ? (
                    <div className="jonak-kcard active-kcard">
                      <div className="jonak-kcard-top">
                        <span className="jonak-kcard-id">#{activeOrder.id}</span>
                        <span className="jonak-kcard-time" style={{ color: '#10B981' }}>Hot-Bag Packed</span>
                      </div>
                      <div className="jonak-kcard-items">
                        Assigned: <strong>Rahul Sharma</strong> (Arrived at outlet)
                      </div>
                      <button
                        type="button"
                        className="jonak-kcard-action-btn assigned"
                        onClick={() => setLifecyclePhase(4)}
                      >
                        <Bike size={14} />
                        <span>Handover to Rider</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>No orders waiting at counter</div>
                  )}
                </div>

                {/* Column 4: Dispatched / Out for Delivery */}
                <div className="jonak-kanban-col">
                  <div className="jonak-kanban-col-head">
                    <span className="jonak-kanban-col-title">
                      <Bike size={14} color="#3B82F6" />
                      4. Out on Road
                    </span>
                    <span className="jonak-kanban-count">{lifecyclePhase >= 4 ? '1' : '0'}</span>
                  </div>

                  {lifecyclePhase >= 4 ? (
                    <div className="jonak-kcard">
                      <div className="jonak-kcard-top">
                        <span className="jonak-kcard-id">#{activeOrder.id}</span>
                        <span className="jonak-kcard-time" style={{ color: '#3B82F6' }}>
                          {lifecyclePhase === 6 ? 'Delivered' : `On BH Road (~${etaMinutes}m)`}
                        </span>
                      </div>
                      <div className="jonak-kcard-items">
                        Rider: <strong>Rahul Sharma</strong> (AS-15-H-4821)<br />
                        Status: {currentMeta.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#D4AF37' }}>
                        OTP Required at doorstep: <strong>5914</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>No active dispatches</div>
                  )}
                </div>
              </div>

              {/* Active Delivery Partners Grid */}
              <div className="jonak-active-riders-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#FFFFFF' }}>Active Nearby Delivery Partners (Barpeta Hub)</h4>
                  <span style={{ fontSize: '0.74rem', color: '#10B981' }}>3 Riders Online</span>
                </div>

                <div className="jonak-riders-grid">
                  {NEARBY_RIDERS.map(r => (
                    <div key={r.id} className="jonak-rider-card-mini">
                      <div className="jonak-rider-mini-bio">
                        <div className="jonak-rider-mini-avatar">🛵</div>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#FFFFFF' }}>{r.name} ★ {r.rating}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{r.vehicle} • {r.distanceKm} km away</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>{r.battery} Bat</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default OrderTrackerModal;
