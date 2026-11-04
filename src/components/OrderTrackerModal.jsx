import React, { useState, useEffect, useRef } from 'react';
import { useHotel } from '../context/HotelContext';
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
  RotateCcw
} from 'lucide-react';

export const OrderTrackerModal = ({ isOpen, onClose, targetOrderId = null }) => {
  const { orders, hotelInfo, updateOrderLocation, showToast } = useHotel();

  // Track by phone or ID search
  const [searchInput, setSearchInput] = useState('');
  const [searchedOrderId, setSearchedOrderId] = useState(targetOrderId);

  // Find target order or latest active delivery order
  const resolvedOrderId = searchedOrderId || targetOrderId;
  const activeOrder = orders.find(o => o.id === resolvedOrderId) || 
                      orders.find(o => o.orderType === 'DELIVERY' || o.deliveryAddress) || 
                      orders[0];

  // ESC key + body overflow
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

  // Handle search by order ID or phone
  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    // Search by order ID
    const byId = orders.find(o => o.id?.toLowerCase() === q.toLowerCase());
    // Search by phone
    const byPhone = orders.find(o => (o.phone || o.customerPhone || o.customer_phone || '')
      .replace(/\D/g, '').endsWith(q.replace(/\D/g, '')));
    if (byId) {
      setSearchedOrderId(byId.id);
      showToast(`📦 Found order #${byId.id}`, 'success');
    } else if (byPhone) {
      setSearchedOrderId(byPhone.id);
      showToast(`📦 Found order #${byPhone.id} for this phone`, 'success');
    } else {
      showToast('No order found. Try your Order ID (e.g. JNK-1234) or phone number.', 'danger');
    }
  };

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const bikeMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const simIntervalRef = useRef(null);

  const [simStep, setSimStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  // Jonak Hotel Coordinates (BH Road, Donakuchi, Barpeta)
  const hotelLat = 26.3308;
  const hotelLng = 91.0064;

  // Destination coordinates (default to Barpeta Town ~3.4 KM away)
  const destLat = activeOrder?.customerCoordinates?.lat || 26.3210;
  const destLng = activeOrder?.customerCoordinates?.lng || 91.0180;

  // Waypoints for road route polyline from Jonak Hotel to Destination
  const routeWaypoints = [
    [hotelLat, hotelLng], // Jonak Hotel Hub
    [26.3290, 91.0085], // BH Road Junction
    [26.3265, 91.0115], // Donakuchi Crossing
    [26.3240, 91.0145], // Barpeta College Gate
    [destLat, destLng]   // Customer Address
  ];

  // Rider coordinates: from active order or simulated waypoint
  const currentRiderPos = activeOrder?.currentLocation?.lat && activeOrder?.currentLocation?.lng
    ? [activeOrder.currentLocation.lat, activeOrder.currentLocation.lng]
    : routeWaypoints[simStep % routeWaypoints.length];

  // 5-Stage Milestone Progress mapping
  const getStageIndex = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'new':
      case 'pending':
        return 1;
      case 'confirmed':
      case 'accepted':
        return 2;
      case 'cooking':
      case 'in prep':
        return 3;
      case 'out for delivery':
      case 'on the way':
        return 4;
      case 'delivered':
      case 'completed':
        return 5;
      default:
        return 3;
    }
  };

  const currentStage = getStageIndex(activeOrder?.status);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!window.L) {
      console.warn('Leaflet library is loading...');
      return;
    }

    // Clean up previous instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const L = window.L;
      const map = L.map(mapContainerRef.current, {
        center: [hotelLat, hotelLng],
        zoom: 14,
        zoomControl: true
      });
      mapInstanceRef.current = map;

      // OpenStreetMap Tiles with sleek modern styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // 1. Jonak Hotel Hub Marker (Custom Gold Icon)
      const hotelIcon = L.divIcon({
        className: 'custom-hotel-marker',
        html: `
          <div style="background: #D4AF37; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(212, 175, 55, 0.8); border: 2px solid #FFFFFF;">
            <span style="font-size: 18px;">🏨</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      L.marker([hotelLat, hotelLng], { icon: hotelIcon })
        .addTo(map)
        .bindPopup(`<strong>🏨 Jonak Hotel & Restaurant</strong><br/>BH Road, Donakuchi, Barpeta<br/><em>Kitchen Dispatch Center</em>`)
        .openPopup();

      // 2. 5 KM Free Delivery Radius Circle
      L.circle([hotelLat, hotelLng], {
        radius: 5000,
        color: '#D4AF37',
        fillColor: '#D4AF37',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '6, 6'
      }).addTo(map);

      // 3. Customer Destination Marker
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div style="background: #EF4444; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); border: 2px solid #FFFFFF;">
            <span style="font-size: 16px;">📍</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>📍 Customer Delivery Point</strong><br/>${activeOrder?.deliveryAddress || 'Barpeta Town'}`);

      // 4. Uber H3 Spatial Grid Overlay (Simulated Barpeta Delivery Hexagons)
      const h3Hexagons = [
        // Zone 1: Donakuchi Hub (H3 Index 886194b633fffff)
        [[26.335, 91.002], [26.338, 91.010], [26.333, 91.017], [26.326, 91.016], [26.324, 91.007], [26.329, 91.000]],
        // Zone 2: Barpeta Town Center
        [[26.325, 91.012], [26.328, 91.020], [26.323, 91.027], [26.316, 91.025], [26.314, 91.017], [26.319, 91.010]],
        // Zone 3: FAAMCH Medical Corridor
        [[26.318, 91.022], [26.321, 91.030], [26.316, 91.037], [26.309, 91.035], [26.307, 91.027], [26.312, 91.020]]
      ];

      h3Hexagons.forEach((hex, i) => {
        L.polygon(hex, {
          color: '#10B981',
          weight: 1,
          fillColor: '#10B981',
          fillOpacity: 0.05,
          dashArray: '3, 5'
        }).addTo(map);
      });

      // 5. Road Route Polyline
      const polyline = L.polyline(routeWaypoints, {
        color: '#D4AF37',
        weight: 4,
        opacity: 0.85
      }).addTo(map);
      routePolylineRef.current = polyline;

      // 6. Moving Rider Bike Marker
      const bikeIcon = L.divIcon({
        className: 'custom-bike-marker',
        html: `
          <div style="background: #10B981; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(16, 185, 129, 0.9); border: 2.5px solid #FFFFFF; animation: pulse 1.8s infinite;">
            <span style="font-size: 20px;">🛵</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const bikeMarker = L.marker(currentRiderPos, { icon: bikeIcon })
        .addTo(map)
        .bindPopup(`<strong>🛵 Monojit Roy (Delivery Captain)</strong><br/>Speed: 28 km/h • ETA: ~18 mins`);
      bikeMarkerRef.current = bikeMarker;

      // Fit bounds to show route nicely
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isOpen, activeOrder?.id]);

  // Update bike position when coordinates change
  useEffect(() => {
    if (bikeMarkerRef.current && currentRiderPos) {
      bikeMarkerRef.current.setLatLng(currentRiderPos);
    }
  }, [currentRiderPos]);

  // Simulation: Move delivery bike along route step-by-step
  const toggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simIntervalRef.current);
      setIsSimulating(false);
      showToast('Live GPS broadcast simulation paused.', 'info');
    } else {
      setIsSimulating(true);
      showToast('🛵 Live GPS broadcast started! Watch delivery bike move on map.', 'success');
      
      let step = simStep;
      simIntervalRef.current = setInterval(() => {
        step = (step + 1) % routeWaypoints.length;
        setSimStep(step);
        const nextCoord = routeWaypoints[step];

        // Broadcast to server if order exists
        if (activeOrder?.id && updateOrderLocation) {
          updateOrderLocation(activeOrder.id, {
            lat: nextCoord[0],
            lng: nextCoord[1],
            speed: 26,
            heading: 45
          });
        }
      }, 3000);
    }
  };

  if (!isOpen) return null;

  // No order found — show search UI
  if (!activeOrder) return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(7, 11, 20, 0.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100000, padding: '1rem'
    }}
    onClick={onClose}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px',
        padding: '2rem', textAlign: 'center'
      }}
      onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Track Your Order</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Enter your Order ID (e.g. JNK-1234) or your phone number to track your food delivery.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Order ID or Phone number"
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)',
              color: '#FFFFFF', fontSize: '0.9rem', outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '0.75rem 1.2rem', borderRadius: '8px',
              background: 'var(--gold-primary)', color: '#1C1C1C',
              border: 'none', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Track
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.6rem 1.5rem', borderRadius: '8px',
            background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto'
          }}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(7, 11, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '1rem'
    }}
    onClick={onClose}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-premium)',
        position: 'relative'
      }}
      onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(212, 175, 55, 0.05)',
          gap: '1rem'
        }}>
          {/* Back button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            <RotateCcw size={14} />
            Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                background: '#10B981',
                color: '#070B14',
                fontWeight: 800,
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#070B14' }} />
                ZOMATO-STYLE LIVE TRACKING
              </span>
              <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '1rem' }}>
                Order #{activeOrder.id}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Jonak Hotel Dispatch ➔ {activeOrder.deliveryAddress || 'Barpeta Town'}
            </p>
          </div>

          {/* Search box to switch order */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Order ID / Phone"
              style={{
                padding: '0.4rem 0.65rem', borderRadius: '6px',
                border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)',
                color: '#FFFFFF', fontSize: '0.78rem', outline: 'none', width: '140px'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '0.4rem 0.7rem', borderRadius: '6px',
                background: 'var(--gold-primary)', color: '#1C1C1C',
                border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem'
              }}
            >
              🔍
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              flexShrink: 0
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 5-Stage Milestone Progress Bar */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.2)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '0.75rem'
          }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '5%',
              right: '5%',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              zIndex: 1
            }} />
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '5%',
              width: `${((currentStage - 1) / 4) * 90}%`,
              height: '3px',
              background: 'linear-gradient(90deg, #D4AF37, #10B981)',
              zIndex: 2,
              transition: 'width 0.4s ease'
            }} />

            {[
              { stage: 1, label: 'Order Placed', icon: CheckCircle2 },
              { stage: 2, label: 'Kitchen Confirmed', icon: UtensilsCrossed },
              { stage: 3, label: 'Chef Cooking', icon: Flame },
              { stage: 4, label: 'Out for Delivery', icon: Bike },
              { stage: 5, label: 'Delivered', icon: ShieldCheck }
            ].map(st => {
              const isPast = currentStage >= st.stage;
              const isCurrent = currentStage === st.stage;
              const IconComp = st.icon;

              return (
                <div key={st.stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '18%' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isPast ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                    border: `2px solid ${isCurrent ? '#D4AF37' : isPast ? '#10B981' : 'rgba(255, 255, 255, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPast ? '#070B14' : 'var(--text-muted)',
                    boxShadow: isCurrent ? '0 0 10px rgba(212, 175, 55, 0.8)' : 'none',
                    marginBottom: '0.4rem',
                    transition: 'all 0.3s ease'
                  }}>
                    <IconComp size={16} />
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? '#FFFFFF' : isPast ? '#10B981' : 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.2
                  }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div style={{ position: 'relative', width: '100%', height: '320px' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating ETA Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(7, 11, 20, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--gold-primary)',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <Clock size={18} color="var(--gold-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ESTIMATED TIME</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>18 - 25 Mins</div>
            </div>
          </div>

          {/* Floating Simulation Trigger Button */}
          <button
            onClick={toggleSimulation}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: isSimulating ? '#EF4444' : '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            {isSimulating ? <RotateCcw size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Pause GPS Sim' : 'Simulate Bike Moving'}</span>
          </button>
        </div>

        {/* Delivery Captain & Order Details */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>

          {/* Captain Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '2px solid var(--gold-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem'
              }}>
                🛵
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                  Monojit Roy
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  4.9 ★ Verified Delivery Captain
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Honda Activa (AS-15-B-1286)
                </div>
              </div>
            </div>

            <a
              href="tel:+918876055667"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none'
              }}
            >
              <Phone size={14} />
              <span>Call</span>
            </a>
          </div>

          {/* Delivery Location & Bill Summary */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>
              <span style={{ fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
                {activeOrder.deliveryAddress || 'Barpeta Town (Within 5 KM)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order Total:</span>
              <span style={{ fontWeight: 800, color: 'var(--gold-primary)', fontSize: '1rem' }}>
                ₹{activeOrder.total || '380'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>
                {activeOrder.paymentMethod || 'Paytm UPI (paytm.s1i7is2@pty)'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

