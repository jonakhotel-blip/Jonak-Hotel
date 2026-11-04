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
  ShoppingBag
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

export const OrderTrackerModal = ({ isOpen, onClose, targetOrderId = null }) => {
  const { orders, hotelInfo, showToast } = useHotel();

  // Selected or active order
  const activeOrder = useMemo(() => {
    if (targetOrderId) {
      const found = orders?.find(o => o.id === targetOrderId);
      if (found) return found;
    }
    return orders?.find(o => o.orderType === 'DELIVERY' || o.deliveryAddress) || orders?.[0] || {
      id: 'JNK-84920',
      customerName: 'Guest Customer',
      customerPhone: '9678582286',
      deliveryAddress: 'BH Road, Barpeta Town (Near Satra)',
      items: [
        { name: 'Jonak Special Dum Biryani', qty: 1, price: 350, isVeg: false },
        { name: 'Butter Naan', qty: 2, price: 40, isVeg: true },
        { name: 'Jeera Rice', qty: 1, price: 140, isVeg: true }
      ],
      total: 570,
      subtotal: 570,
      deliveryFee: 0,
      paymentMethod: 'Paytm UPI (paytm.s1i7is2@pty)'
    };
  }, [orders, targetOrderId]);

  // --------------------------------------------------------------------------
  // 4-STAGE RECURRING LOOPING STATE MACHINE
  // --------------------------------------------------------------------------
  // Phase 1: "Order Confirmed & Preparing Food" (8s)
  // Phase 2: "Food Ready & Driver Assigned" (8s)
  // Phase 3: "Out for Delivery & Live Movement" (18s)
  // Phase 4: "Arrived / Order Delivered" (8s)
  // Auto-Reset: wait 5s and loop back to Phase 1
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isAutoLooping, setIsAutoLooping] = useState(true);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(8);
  const [dynamicEtaMinutes, setDynamicEtaMinutes] = useState(30);

  // Rider position interpolation along route
  const [riderWaypointIndex, setRiderWaypointIndex] = useState(0);
  const [riderBearing, setRiderBearing] = useState(135);

  // Interactive UI states
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState(30);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const traversedPolylineRef = useRef(null);

  // Delivery OTP code
  const deliveryOtp = useMemo(() => {
    return '4821';
  }, []);

  // Delivery captain info
  const captain = useMemo(() => ({
    name: 'Rahul Sharma',
    rating: 4.9,
    trips: '840+ deliveries',
    phone: '+91 88760 55667',
    vehicle: 'Hero Splendor • AS-15-H-4821',
    vaccinated: true
  }), []);

  // --------------------------------------------------------------------------
  // STATE MACHINE TIMER & DYNAMIC TRANSITIONS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !isAutoLooping) return;

    let timer;

    if (currentPhase === 1) {
      setDynamicEtaMinutes(32);
      setRiderWaypointIndex(0);
      setPhaseSecondsLeft(8);

      timer = setTimeout(() => {
        setCurrentPhase(2);
      }, 8000);

    } else if (currentPhase === 2) {
      setDynamicEtaMinutes(22);
      setRiderWaypointIndex(0);
      setPhaseSecondsLeft(8);

      timer = setTimeout(() => {
        setCurrentPhase(3);
      }, 8000);

    } else if (currentPhase === 3) {
      setPhaseSecondsLeft(18);

      // Animate rider along the waypoints over 18 seconds
      let step = 0;
      const stepInterval = setInterval(() => {
        step += 1;
        if (step < ROUTE_WAYPOINTS.length) {
          setRiderWaypointIndex(step);
          // Decrease ETA dynamically from 15 mins to 1 min
          const remainingMinutes = Math.max(1, Math.round(15 - (step / ROUTE_WAYPOINTS.length) * 14));
          setDynamicEtaMinutes(remainingMinutes);

          // Calculate bearing to next point
          const prev = ROUTE_WAYPOINTS[step - 1];
          const curr = ROUTE_WAYPOINTS[step];
          const b = calculateBearing(prev[0], prev[1], curr[0], curr[1]);
          setRiderBearing(b);
        }
      }, 1800); // 10 waypoints * 1.8s = 18s

      timer = setTimeout(() => {
        clearInterval(stepInterval);
        setCurrentPhase(4);
      }, 18000);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(timer);
      };

    } else if (currentPhase === 4) {
      setDynamicEtaMinutes(0);
      setRiderWaypointIndex(ROUTE_WAYPOINTS.length - 1);
      setPhaseSecondsLeft(8);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {}

      // Wait 8s in Delivered phase, then 5s fade & reset loop back to Phase 1
      timer = setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('🔄 Demo Cycle: Restarting live order journey from Phase 1', 'info');
        }
        setCurrentPhase(1);
      }, 13000);
    }

    return () => clearTimeout(timer);
  }, [isOpen, currentPhase, isAutoLooping, showToast]);

  // Global ESC key listener & body scroll lock
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
      console.warn('Leaflet window.L not ready yet.');
      return;
    }

    // Clean up existing map instance
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

      // High-performance OpenStreetMap CartoDB Dark/Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // 1. Restaurant Marker (Custom Gold & Teal Crest with Radar Pulse)
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

      // 3. Customer Destination Marker (Home Icon with Radar Pulse)
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
        .bindPopup(`<strong>📍 Your Delivery Address</strong><br/>${activeOrder?.deliveryAddress || 'Barpeta Town'}`);

      // 4. Base Route Polyline (Gold dashed guide)
      const baseRoute = L.polyline(ROUTE_WAYPOINTS, {
        color: '#D4AF37',
        weight: 4,
        opacity: 0.5,
        dashArray: '6, 8'
      }).addTo(map);
      routePolylineRef.current = baseRoute;

      // 5. Dynamic Traversed Polyline (Bright Emerald Green)
      const traversed = L.polyline([RESTAURANT_COORDS], {
        color: '#10B981',
        weight: 5,
        opacity: 0.95
      }).addTo(map);
      traversedPolylineRef.current = traversed;

      // 6. Delivery Rider Marker (Custom 2-Wheeler Bike Icon with Bearing Rotation)
      const initialPos = ROUTE_WAYPOINTS[0];
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
      riderMarker.bindPopup(`<strong>🛵 Rahul Sharma</strong><br/>Speed: 28 km/h • Hero Splendor`);
      riderMarkerRef.current = riderMarker;

      // Fit bounds to display both points nicely
      map.fitBounds(baseRoute.getBounds(), { padding: [50, 50] });

      // Invalidate size across multiple render passes to prevent blank tiles on Safari/Mobile Chrome
      [100, 300, 600, 1000].forEach(delay => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });

    } catch (err) {
      console.error('Error initializing live tracking Leaflet map:', err);
    }
  }, [activeOrder?.deliveryAddress, riderBearing]);

  // Mount map when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small timeout ensures DOM elements have rendered explicit dimensions
      const timer = setTimeout(() => {
        initMap();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initMap]);

  // Handle window resize for map
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recenter map bounds on demand
  const handleRecenter = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
      mapInstanceRef.current.invalidateSize();
      if (typeof showToast === 'function') {
        showToast('📍 Route view centered', 'info');
      }
    }
  };

  // Update rider position and traversed polyline on map as waypoint changes
  useEffect(() => {
    if (!riderMarkerRef.current || !mapInstanceRef.current) return;

    const currentCoord = ROUTE_WAYPOINTS[riderWaypointIndex] || ROUTE_WAYPOINTS[0];
    riderMarkerRef.current.setLatLng(currentCoord);

    // Update bearing rotation
    const bikeInnerEl = document.getElementById('jonak-bike-marker-inner');
    if (bikeInnerEl) {
      bikeInnerEl.style.transform = `rotate(${riderBearing}deg)`;
    }

    // Update traversed line up to current waypoint
    if (traversedPolylineRef.current) {
      const traversedCoords = ROUTE_WAYPOINTS.slice(0, riderWaypointIndex + 1);
      traversedPolylineRef.current.setLatLngs(traversedCoords);
    }
  }, [riderWaypointIndex, riderBearing]);

  // Copy OTP helper
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

  // Manual Phase Jumper for testing/demo
  const handleJumpToPhase = (phaseNumber) => {
    setCurrentPhase(phaseNumber);
    if (phaseNumber === 1) {
      setRiderWaypointIndex(0);
      setDynamicEtaMinutes(32);
    } else if (phaseNumber === 2) {
      setRiderWaypointIndex(0);
      setDynamicEtaMinutes(22);
    } else if (phaseNumber === 3) {
      setRiderWaypointIndex(4);
      setDynamicEtaMinutes(12);
    } else if (phaseNumber === 4) {
      setRiderWaypointIndex(ROUTE_WAYPOINTS.length - 1);
      setDynamicEtaMinutes(0);
    }
  };

  if (!isOpen) return null;

  // Phase metadata
  const phaseConfig = {
    1: {
      title: 'Kitchen is preparing your food',
      subtext: 'Master Chef is cooking with authentic Barpeta spices',
      badge: 'Order Confirmed',
      etaText: '28 - 35 mins',
      progress: 25,
      icon: ChefHat,
      color: '#D4AF37'
    },
    2: {
      title: 'Food packed & captain arrived',
      subtext: 'Rahul Sharma arrived at Jonak Hotel with insulated hot-bag',
      badge: 'Driver Assigned',
      etaText: '22 mins',
      progress: 50,
      icon: UtensilsCrossed,
      color: '#3B82F6'
    },
    3: {
      title: 'Rahul is on the way with your order!',
      subtext: 'Moving via BH Road at 28 km/h • Near Donakuchi Crossing',
      badge: 'Out for Delivery',
      etaText: `${dynamicEtaMinutes} mins`,
      progress: 75,
      icon: Bike,
      color: '#10B981'
    },
    4: {
      title: 'Order Delivered! Enjoy your meal 🍽️',
      subtext: 'Delivered hot & fresh to your doorstep • Thank you!',
      badge: 'Delivered',
      etaText: 'Delivered',
      progress: 100,
      icon: CheckCircle2,
      color: '#10B981'
    }
  };

  const activePhaseInfo = phaseConfig[currentPhase];

  return (
    <div className="jonak-tracker-overlay" onClick={onClose}>
      <div className="jonak-tracker-shell" onClick={(e) => e.stopPropagation()}>

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP NAVIGATION BAR                                              */}
        {/* ------------------------------------------------------------------ */}
        <header className="jonak-tracker-topbar">
          <div className="jonak-topbar-left">
            <button
              type="button"
              className="jonak-topbar-back-btn"
              onClick={onClose}
              aria-label="Back to Website"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="jonak-topbar-meta">
              <h2>Jonak Hotel &amp; Restaurant</h2>
              <p>
                <span className="jonak-topbar-order-pill">#{activeOrder.id || 'JNK-84920'}</span>
                <span>• BH Road, Barpeta</span>
              </p>
            </div>
          </div>

          <div className="jonak-topbar-right">
            <a
              href="tel:+919678582286"
              className="jonak-help-pill"
              title="Call Jonak Hotel Reception"
            >
              <Phone size={13} />
              <span>Help</span>
            </a>
            <button
              type="button"
              className="jonak-topbar-close-btn"
              onClick={onClose}
              aria-label="Close Tracker"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* 2. BODY SPLIT: LEAFLET MAP (LEFT/TOP) & DETAILS SHEET (RIGHT/BOTTOM) */}
        {/* ------------------------------------------------------------------ */}
        <div className="jonak-tracker-body">

          {/* MAP CANVAS */}
          <section className="jonak-map-wrapper">
            {/* Map Div with explicit sizing */}
            <div ref={mapContainerRef} className="jonak-map-canvas" />

            {/* Branded Live Dispatch Pill (NO Zomato watermark) */}
            <div className="jonak-map-floating-pill">
              <span className="jonak-live-indicator-dot" />
              <div>
                <div className="jonak-floating-pill-title">JONAK EXPRESS • LIVE GPS</div>
                <div className="jonak-floating-pill-sub">BH Road ➔ Barpeta Town</div>
              </div>
            </div>

            {/* Recenter Map Button */}
            <button
              type="button"
              className="jonak-recenter-btn"
              onClick={handleRecenter}
              title="Recenter Route"
              aria-label="Recenter Map"
            >
              <Navigation size={18} color="#D4AF37" />
            </button>

            {/* Continuous Loop & Stage Selector Controls */}
            <div className="jonak-map-sim-controls">
              <button
                type="button"
                className={`jonak-sim-btn ${isAutoLooping ? 'active' : ''}`}
                onClick={() => setIsAutoLooping(v => !v)}
                title={isAutoLooping ? 'Pause 4-Stage Auto Cycle' : 'Resume 4-Stage Auto Cycle'}
              >
                {isAutoLooping ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAutoLooping ? 'Auto-Cycle ON' : 'Paused'}</span>
              </button>

              {[
                { phase: 1, label: '1. Prep' },
                { phase: 2, label: '2. Packed' },
                { phase: 3, label: '3. On Way' },
                { phase: 4, label: '4. Delivered' }
              ].map(p => (
                <button
                  key={p.phase}
                  type="button"
                  className={`jonak-sim-btn ${currentPhase === p.phase ? 'active' : ''}`}
                  onClick={() => handleJumpToPhase(p.phase)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* DETAILS & ACTIONS PANEL */}
          <section className="jonak-details-panel">
            {/* Grab handle for touch feel */}
            <span className="jonak-sheet-handle" />

            {/* A. LIVE ETA & PROGRESS BANNER */}
            <div className="jonak-eta-card">
              <div className="jonak-eta-top-row">
                <span className="jonak-eta-badge">
                  <span className="jonak-live-indicator-dot" style={{ width: '6px', height: '6px' }} />
                  {activePhaseInfo.badge}
                </span>

                <div className="jonak-eta-countdown">
                  <Clock size={16} color="#D4AF37" />
                  <span className="jonak-eta-time-val">{activePhaseInfo.etaText}</span>
                  {currentPhase !== 4 && <span className="jonak-eta-time-lbl">ESTIMATED</span>}
                </div>
              </div>

              <h3 className="jonak-status-headline">
                {activePhaseInfo.title}
              </h3>
              <p className="jonak-status-subtext">
                {activePhaseInfo.subtext}
              </p>

              {/* Progress Bar */}
              <div className="jonak-progress-bar-track">
                <div
                  className="jonak-progress-bar-fill"
                  style={{ width: `${activePhaseInfo.progress}%` }}
                />
              </div>

              {/* 4 Milestone Stepper */}
              <div className="jonak-stepper-row">
                {[
                  { stage: 1, label: 'Placed' },
                  { stage: 2, label: 'Cooking' },
                  { stage: 3, label: 'On Way' },
                  { stage: 4, label: 'Delivered' }
                ].map(s => {
                  const isDone = currentPhase > s.stage;
                  const isCurrent = currentPhase === s.stage;
                  return (
                    <div
                      key={s.stage}
                      className={`jonak-step-node ${isDone ? 'completed' : isCurrent ? 'current' : ''}`}
                    >
                      <div className="jonak-step-dot">
                        {isDone ? <Check size={12} strokeWidth={3} /> : s.stage}
                      </div>
                      <span className="jonak-step-label">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. DELIVERY CAPTAIN PROFILE CARD */}
            <div className="jonak-captain-card">
              <div className="jonak-captain-header">
                <div className="jonak-captain-bio">
                  <div className="jonak-captain-avatar">
                    <span>🛵</span>
                    <span className="jonak-captain-verified-badge">
                      <Check size={10} color="#070B14" strokeWidth={3} />
                    </span>
                  </div>
                  <div>
                    <h4 className="jonak-captain-name">
                      {captain.name}
                      <span className="jonak-captain-rating">★ {captain.rating}</span>
                    </h4>
                    <p className="jonak-captain-stats">
                      {captain.trips} • {captain.vehicle}
                    </p>
                  </div>
                </div>

                <div className="jonak-captain-actions">
                  <a
                    href={`tel:${captain.phone}`}
                    className="jonak-captain-btn call"
                    title={`Call ${captain.name}`}
                  >
                    <Phone size={16} />
                  </a>
                  <a
                    href={`https://wa.me/919678582286?text=${encodeURIComponent(`Hello Rahul, I am tracking Order #${activeOrder.id}. Please deliver safely!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jonak-captain-btn"
                    title="Send WhatsApp Message"
                  >
                    <MessageSquare size={16} />
                  </a>
                </div>
              </div>

              {/* Safety Pill */}
              <div className="jonak-safety-pill">
                <ShieldCheck size={15} color="#10B981" />
                <span>Rider temperature verified (98.2°F) • Sanitized helmet &amp; thermal bag</span>
              </div>

              {/* Quick Tip Selector */}
              <div className="jonak-tip-section">
                <div className="jonak-tip-label">
                  <span>Tip your delivery captain</span>
                  <span style={{ color: '#D4AF37' }}>
                    {selectedTip > 0 ? `₹${selectedTip} added` : 'Optional'}
                  </span>
                </div>
                <div className="jonak-tip-chips">
                  {[20, 30, 50].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`jonak-tip-chip ${selectedTip === amt ? 'active' : ''}`}
                      onClick={() => {
                        const newTip = selectedTip === amt ? 0 : amt;
                        setSelectedTip(newTip);
                        if (newTip > 0 && typeof showToast === 'function') {
                          showToast(`❤️ Added ₹${newTip} tip for ${captain.name}!`, 'success');
                        }
                      }}
                    >
                      + ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`jonak-tip-chip ${selectedTip === 100 ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTip(selectedTip === 100 ? 0 : 100);
                      if (typeof showToast === 'function') {
                        showToast(`❤️ Generous ₹100 tip for ${captain.name}!`, 'success');
                      }
                    }}
                  >
                    + ₹100
                  </button>
                </div>
              </div>
            </div>

            {/* C. OTP VERIFICATION BOX */}
            <div className="jonak-otp-card">
              <div className="jonak-otp-left">
                <div className="jonak-otp-icon-wrap">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="jonak-otp-title">DELIVERY VERIFICATION OTP</p>
                  <p className="jonak-otp-sub">Share with rider only after receiving food</p>
                </div>
              </div>

              <div
                className="jonak-otp-code-box"
                onClick={handleCopyOtp}
                title="Click to copy OTP"
                style={{ cursor: 'pointer' }}
              >
                {copiedOtp ? 'COPIED!' : deliveryOtp}
              </div>
            </div>

            {/* D. DELIVERY ADDRESS & SAFETY NOTE */}
            <div className="jonak-address-card">
              <div className="jonak-address-row">
                <MapPin size={18} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div className="jonak-address-text">
                  <strong>Delivering to:</strong>
                  <span>{activeOrder.deliveryAddress || 'BH Road, Barpeta Town, Assam 781314'}</span>
                </div>
              </div>

              {/* Leave at Door Switch */}
              <label className="jonak-door-toggle">
                <span>Leave order at the door / contactless handover</span>
                <div className="jonak-switch">
                  <input
                    type="checkbox"
                    checked={leaveAtDoor}
                    onChange={(e) => {
                      setLeaveAtDoor(e.target.checked);
                      if (typeof showToast === 'function') {
                        showToast(e.target.checked ? '🚪 Contactless handover selected' : 'Direct delivery handover', 'info');
                      }
                    }}
                  />
                  <span className="jonak-slider" />
                </div>
              </label>
            </div>

            {/* E. ORDER SUMMARY ACCORDION */}
            <div className="jonak-order-accordion">
              <div
                className="jonak-accordion-header"
                onClick={() => setIsAccordionOpen(v => !v)}
              >
                <div className="jonak-accordion-header-left">
                  <ShoppingBag size={16} color="#D4AF37" />
                  <span className="jonak-accordion-title">
                    Order Summary ({activeOrder.items?.length || 3} items)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="jonak-accordion-badge">₹{activeOrder.total || 570}</span>
                  {isAccordionOpen ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                </div>
              </div>

              {isAccordionOpen && (
                <div className="jonak-accordion-content">
                  {(activeOrder.items || [
                    { name: 'Jonak Special Dum Biryani', qty: 1, price: 350, isVeg: false },
                    { name: 'Butter Naan', qty: 2, price: 40, isVeg: true },
                    { name: 'Jeera Rice', qty: 1, price: 140, isVeg: true }
                  ]).map((item, idx) => (
                    <div key={idx} className="jonak-order-item-row">
                      <div className="jonak-order-item-left">
                        <span className={item.isVeg ? 'jonak-veg-dot' : 'jonak-nonveg-dot'} />
                        <span style={{ color: '#FFFFFF' }}>
                          {item.name} <span style={{ color: '#94A3B8' }}>x{item.qty || 1}</span>
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                        ₹{item.price * (item.qty || 1)}
                      </span>
                    </div>
                  ))}

                  <div className="jonak-bill-summary">
                    <div className="jonak-bill-row">
                      <span>Item Subtotal</span>
                      <span>₹{activeOrder.subtotal || 570}</span>
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
                      <span>Grand Total</span>
                      <span style={{ color: '#D4AF37' }}>
                        ₹{(Number(activeOrder.total) || 570) + selectedTip}
                      </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="jonak-paid-tag">
                        <Check size={12} strokeWidth={3} /> Paid via Paytm UPI (paytm.s1i7is2@pty)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Back to Home Button at bottom of details panel */}
            <button
              type="button"
              className="jonak-sim-btn"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Restaurant Menu</span>
            </button>

          </section>

        </div>

      </div>
    </div>
  );
};

export default OrderTrackerModal;
