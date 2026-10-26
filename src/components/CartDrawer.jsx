import React, { useState, useEffect } from 'react';
import { useHotel } from '../context/HotelContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Bike, 
  BedDouble, 
  ShoppingBag, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  QrCode, 
  Phone, 
  Send,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Copy,
  ExternalLink,
  Check,
  CreditCard
} from 'lucide-react';

// Haversine formula to calculate distance in KM between two lat/lng points
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

// Official 9 Rooms for In-Room Dining Dropdown
export const OFFICIAL_IN_ROOM_OPTIONS = [
  { roomNumber: '101', label: 'Room 101 - Suite Room (A/C)' },
  { roomNumber: '201', label: 'Room 201 - Deluxe Room (A/C)' },
  { roomNumber: '202', label: 'Room 202 - Single Room (A/C)' },
  { roomNumber: '203', label: 'Room 203 - Deluxe Room (A/C)' },
  { roomNumber: '204', label: 'Room 204 - Twin Room (A/C)' },
  { roomNumber: '301', label: 'Room 301 - Deluxe Room (A/C)' },
  { roomNumber: '302', label: 'Room 302 - Single Room (Non-A/C)' },
  { roomNumber: '303', label: 'Room 303 - Twin Room (Non-A/C)' },
  { roomNumber: '304', label: 'Room 304 - Single Room (Non-A/C)' }
];

export const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    hotelInfo, 
    cart, 
    updateCartQty, 
    clearCart, 
    settings, 
    localities, 
    addOrder,
    physicalRooms,
    showToast 
  } = useHotel();

  // Order Modes: 'DELIVERY' | 'IN_ROOM' | 'DINE_IN'
  const [orderMode, setOrderMode] = useState('DELIVERY');
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Delivery fields
  const [selectedLocality, setSelectedLocality] = useState(localities[0]?.id || 'donakuchi');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0.4);
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // In-Room Dining & Table fields
  const [roomNumber, setRoomNumber] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [qrPrefillSource, setQrPrefillSource] = useState(null);

  // Payment preference: 'COD' | 'UPI'
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showFullQr, setShowFullQr] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleCopyUpi = () => {
    try {
      navigator.clipboard?.writeText('paytm.s1i7is2@pty');
      setCopiedUpi(true);
      showToast('UPI ID paytm.s1i7is2@pty copied to clipboard!', 'success');
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      showToast('UPI ID: paytm.s1i7is2@pty', 'info');
    }
  };

  // Auto-detect Room or Table from QR URL parameters (?room=101 or ?table=4)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let roomParam = searchParams.get('room');
      let tableParam = searchParams.get('table');

      if (!roomParam && !tableParam && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        roomParam = hashParams.get('room');
        tableParam = hashParams.get('table');
      }

      if (roomParam) {
        const clean = roomParam.trim();
        const numOnly = clean.replace(/\D/g, '');
        const matched = OFFICIAL_IN_ROOM_OPTIONS.find(r => r.roomNumber === numOnly || clean.includes(r.roomNumber));
        const finalValue = matched ? matched.label : (clean.toLowerCase().startsWith('room') ? clean : `Room ${clean}`);
        setOrderMode('IN_ROOM');
        setRoomNumber(finalValue);
        setQrPrefillSource({ type: 'ROOM', value: finalValue });
      } else if (tableParam) {
        const clean = tableParam.trim();
        const formatted = clean.toLowerCase().startsWith('table') ? clean : `Table ${clean}`;
        setOrderMode('DINE_IN');
        setTableNumber(formatted);
        setQrPrefillSource({ type: 'TABLE', value: formatted });
      }
    } catch {}
  }, []);

  // Update distance when locality changes
  useEffect(() => {
    if (orderMode === 'DELIVERY' && !userCoordinates) {
      const loc = localities.find((l) => l.id === selectedLocality);
      if (loc) {
        setDeliveryDistanceKm(loc.distanceKm);
      }
    }
  }, [selectedLocality, orderMode, userCoordinates, localities]);

  // Subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Calculate Delivery Fee based on distance and admin settings
  let deliveryFee = 0;
  if (orderMode === 'DELIVERY') {
    if (deliveryDistanceKm <= settings.freeDeliveryRadiusKm) {
      deliveryFee = 0;
    } else {
      const extraKm = deliveryDistanceKm - settings.freeDeliveryRadiusKm;
      deliveryFee = Math.round(extraKm * settings.extraFeePerKm);
    }
  }

  const grandTotal = subtotal + deliveryFee;

  // Trigger celebration confetti when 5 KM free delivery is unlocked
  useEffect(() => {
    if (isOpen && orderMode === 'DELIVERY' && deliveryDistanceKm <= settings.freeDeliveryRadiusKm && subtotal > 0) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [isOpen, orderMode, deliveryDistanceKm, subtotal, settings.freeDeliveryRadiusKm]);

  // Browser GPS Geolocation handler
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'danger');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoordinates({ lat: latitude, lng: longitude });
        const dist = calculateHaversineDistance(
          hotelInfo.coordinates.lat,
          hotelInfo.coordinates.lng,
          latitude,
          longitude
        );
        setDeliveryDistanceKm(dist);
        setIsLocating(false);
        showToast(`📍 Live location captured: ${dist} KM from Jonak Hotel!`, 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Could not fetch GPS. Selected default locality instead.', 'info');
      },
      { timeout: 8000 }
    );
  };

  // Submit Order & Generate WhatsApp Message
  const handleProceedCheckout = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Please enter your Name and Mobile Number.', 'danger');
      return;
    }

    if (orderMode === 'DELIVERY' && !detailedAddress.trim()) {
      showToast('Please provide your delivery address/house number.', 'danger');
      return;
    }

    if (orderMode === 'IN_ROOM' && !roomNumber.trim()) {
      showToast('Please enter your Hotel Room Number.', 'danger');
      return;
    }

    if (!settings.kitchenOpen) {
      showToast('Kitchen is currently closed for new orders.', 'danger');
      return;
    }

    // Prepare Order Object for Admin Panel & Persistent Server DB
    const orderRecord = {
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      mode: orderMode === 'DELIVERY' ? 'Home Delivery' : orderMode === 'IN_ROOM' ? 'In-Room Dining' : 'Dine-In Table Service',
      address: orderMode === 'DELIVERY' 
        ? `${detailedAddress}, ${localities.find(l => l.id === selectedLocality)?.name || 'Barpeta'}` 
        : orderMode === 'IN_ROOM' 
          ? `Jonak Hotel - ${roomNumber}` 
          : `Jonak Restaurant - ${tableNumber || 'Table / Takeaway'}`,
      distanceKm: orderMode === 'DELIVERY' ? deliveryDistanceKm : 0,
      deliveryFee,
      items: cart.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      subtotal,
      total: grandTotal,
      payment: paymentMethod === 'COD' 
        ? 'Cash on Delivery' 
        : `Paytm UPI (paytm.s1i7is2@pty)${paymentUtr.trim() ? ` • UTR: ${paymentUtr.trim()}` : ''}`,
      paymentStatus: paymentMethod === 'COD' 
        ? 'Pay on Delivery' 
        : (paymentUtr.trim() ? 'Paid (UTR Provided)' : 'Paid / Transferred via UPI'),
      upiId: 'paytm.s1i7is2@pty',
      paymentUtr: paymentUtr.trim(),
      coordinates: userCoordinates
    };

    // Save order in state and sync with Real-Time Backend
    const savedOrder = await addOrder(orderRecord);
    setOrderSuccess(savedOrder || orderRecord);

    // Format WhatsApp Bill Text
    const itemsText = cart.map(item => `• ${item.name} x ${item.qty} = ₹${item.price * item.qty}`).join('%0A');
    const locationLink = userCoordinates 
      ? `https://maps.google.com/?q=${userCoordinates.lat},${userCoordinates.lng}` 
      : `Near ${localities.find(l => l.id === selectedLocality)?.name || 'Barpeta'}`;

    const whatsappMessage = 
`*NEW ORDER - JONAK HOTEL & RESTAURANT*%0A` +
`----------------------------------------%0A` +
`*Order ID:* #${savedOrder?.id || 'JNK-NEW'}%0A` +
`*Customer:* ${customerName}%0A` +
`*Phone:* ${customerPhone}%0A` +
`*Order Mode:* ${orderRecord.mode}%0A` +
(orderMode === 'IN_ROOM' 
  ? `*Room No:* ${roomNumber}%0A` 
  : orderMode === 'DINE_IN' 
    ? `*Table No:* ${tableNumber || 'Dine-In'}%0A` 
    : `*Delivery Address:* ${orderRecord.address}%0A*Distance:* ${deliveryDistanceKm} KM%0A*Map Link:* ${locationLink}%0A`) +
`----------------------------------------%0A` +
`*ITEMS ORDERED:*%0A${itemsText}%0A` +
`----------------------------------------%0A` +
`*Subtotal:* ₹${subtotal}%0A` +
`*Delivery Charge:* ${deliveryFee === 0 ? 'FREE (₹0 - Within 5 KM)' : `₹${deliveryFee}`}%0A` +
`*GRAND TOTAL:* ₹${grandTotal}%0A` +
`----------------------------------------%0A` +
`*PAYMENT DETAILS:*%0A` +
`• Payment Mode: ${paymentMethod === 'COD' ? 'Cash on Delivery (Pay at Doorstep)' : 'Paytm UPI QR (paytm.s1i7is2@pty)'}%0A` +
(paymentUtr.trim() ? `• UPI Transaction UTR: ${paymentUtr.trim()}%0A` : '') +
(paymentMethod === 'UPI' ? `• Direct UPI Pay Link: upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR%0A` : '') +
`----------------------------------------%0A` +
`Please confirm and prepare my order!`;

    const whatsappUrl = `https://wa.me/${hotelInfo.whatsapp}?text=${whatsappMessage}`;

    // Clear cart and open WhatsApp
    clearCart();

    // Trigger celebration
    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.6 }
    });

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="modal-content" style={{ maxWidth: '640px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-gold)',
          background: 'rgba(7, 11, 20, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={22} color="var(--gold-primary)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Your Jonak Cart</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {cart.length} unique dishes selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Order Placed Success View */}
        {orderSuccess ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF' }}>
              Order Placed Successfully!
            </h3>
            
            <p style={{ color: 'var(--gold-light)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.8rem' }}>
              Order ID: #{orderSuccess.id}
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your order has been logged into our Hotel Command Center and forwarded to Jonak Restaurant's WhatsApp. Our manager is preparing your items now!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
              <a
                href={`tel:${hotelInfo.phoneRaw}`}
                className="btn btn-secondary"
              >
                <Phone size={16} />
                <span>Call Restaurant Reception</span>
              </a>

              <button
                onClick={() => { setOrderSuccess(null); onClose(); }}
                className="btn btn-primary"
              >
                Back to Food Menu
              </button>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <ShoppingBag size={48} color="var(--gold-primary)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your Cart is Empty</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Browse our delicious Biryanis, Chicken Curries, Momos, and Rolls.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Explore Digital Menu
            </button>
          </div>
        ) : (
          /* Cart Form & Checkout */
          <form onSubmit={handleProceedCheckout} style={{ padding: '1.25rem 1.5rem' }}>
            
            {/* Scanned QR Detected Luxury Banner */}
            {qrPrefillSource && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Sparkles size={20} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: '#FFF' }}>
                  <div style={{ fontWeight: 800, color: 'var(--gold-light)' }}>
                    ✨ Scanned QR Detected: {qrPrefillSource.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {qrPrefillSource.type === 'ROOM'
                      ? '100% Free In-Room Dining Delivery pre-selected'
                      : 'Direct Kitchen Dining Table Service pre-selected'}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Select Order Mode */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                1. SELECT ORDER MODE:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setOrderMode('DELIVERY')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: orderMode === 'DELIVERY' ? 'var(--gold-gradient)' : 'var(--bg-surface)',
                    color: orderMode === 'DELIVERY' ? '#070B14' : 'var(--text-primary)',
                    border: orderMode === 'DELIVERY' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Bike size={18} />
                  <span>Home Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderMode('IN_ROOM')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: orderMode === 'IN_ROOM' ? 'var(--gold-gradient)' : 'var(--bg-surface)',
                    color: orderMode === 'IN_ROOM' ? '#070B14' : 'var(--text-primary)',
                    border: orderMode === 'IN_ROOM' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <BedDouble size={18} />
                  <span>In-Room Dining</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderMode('DINE_IN')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: orderMode === 'DINE_IN' ? 'var(--gold-gradient)' : 'var(--bg-surface)',
                    color: orderMode === 'DINE_IN' ? '#070B14' : 'var(--text-primary)',
                    border: orderMode === 'DINE_IN' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>Dine-In / Pickup</span>
                </button>
              </div>
            </div>

            {/* Step 2: 5 KM Smart Delivery Calculator (If Home Delivery) */}
            {orderMode === 'DELIVERY' && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                    Barpeta Delivery Calculator:
                  </span>
                  <button
                    type="button"
                    onClick={handleGetLiveLocation}
                    disabled={isLocating}
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid var(--gold-primary)',
                      color: 'var(--gold-warm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Navigation size={12} />
                    <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
                  </button>
                </div>

                {/* Popular Barpeta Localities Dropdown */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Select Your Landmark / Locality in Barpeta:</label>
                  <select
                    value={selectedLocality}
                    onChange={(e) => {
                      setSelectedLocality(e.target.value);
                      setUserCoordinates(null);
                    }}
                    className="form-select"
                  >
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} (~{loc.distanceKm} KM from Hotel)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Celebratory Free Delivery Badge or Transparent Extra Fee Banner */}
                {deliveryDistanceKm <= settings.freeDeliveryRadiusKm ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#34D399',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Sparkles size={16} />
                    <span>🎉 You unlocked FREE Delivery! ({deliveryDistanceKm} KM is within our {settings.freeDeliveryRadiusKm} KM free zone)</span>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#FBBF24',
                    fontSize: '0.82rem',
                    lineHeight: 1.4
                  }}>
                    <strong>Distance: {deliveryDistanceKm} KM</strong> (Beyond {settings.freeDeliveryRadiusKm} KM free zone)
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Delivery charge: ₹{settings.extraFeePerKm}/KM after 5 KM = +₹{deliveryFee}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Customer Information */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Das"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9864012345"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Mode-Specific Address / Room Number */}
            {orderMode === 'DELIVERY' && (
              <div className="form-group">
                <label className="form-label">Delivery Street Address / House / Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House #14, Near Satra Gate, Barpeta"
                  value={detailedAddress}
                  onChange={(e) => setDetailedAddress(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {orderMode === 'IN_ROOM' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Hotel Room *</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    ⚡ 15-Min Express Room Service
                  </span>
                </div>
                <select
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="form-input"
                  style={{
                    background: 'var(--bg-card)',
                    color: roomNumber ? '#FFFFFF' : 'var(--text-muted)',
                    borderColor: roomNumber ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '0.75rem 0.9rem'
                  }}
                >
                  <option value="" style={{ background: '#0F172A', color: '#94A3B8' }}>
                    -- Choose Room (101 to 304) --
                  </option>
                  {OFFICIAL_IN_ROOM_OPTIONS.map((rm) => (
                    <option key={rm.roomNumber} value={rm.label} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                      {rm.label}
                    </option>
                  ))}
                </select>
                {qrPrefillSource?.type === 'ROOM' && (
                  <div style={{ 
                    marginTop: '0.35rem', 
                    fontSize: '0.75rem', 
                    color: '#34D399', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem' 
                  }}>
                    <span>✓ Auto-detected via Room QR Code</span>
                  </div>
                )}
              </div>
            )}

            {orderMode === 'DINE_IN' && (
              <div className="form-group">
                <label className="form-label">Restaurant Table Number / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Table 4 or VIP Hall Table 2"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {/* Selected Items List */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              maxHeight: '190px',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                <span>Item</span>
                <span>Qty & Price</span>
              </div>

              {cart.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`food-type-icon ${item.isVeg ? 'veg' : 'non-veg'}`} style={{ width: 12, height: 12 }}>
                      <div className="dot" style={{ width: 5, height: 5 }} />
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--gold-light)', cursor: 'pointer' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--gold-light)', cursor: 'pointer' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold-light)', minWidth: '55px', textAlign: 'right' }}>
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div style={{
              background: 'rgba(7, 11, 20, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem 1.1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Item Total</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal}</span>
              </div>

              {orderMode === 'DELIVERY' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Delivery Fee ({deliveryDistanceKm} KM)
                  </span>
                  <span style={{ fontWeight: 700, color: deliveryFee === 0 ? '#10B981' : 'var(--text-primary)' }}>
                    {deliveryFee === 0 ? 'FREE (₹0)' : `₹${deliveryFee}`}
                  </span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: 800,
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--gold-light)'
              }}>
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Step 4: Official Paytm UPI & Payment Preference */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                PAYMENT PREFERENCE:
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'UPI' ? 'rgba(0, 186, 242, 0.15)' : 'var(--bg-surface)',
                  border: paymentMethod === 'UPI' ? '1.5px solid #00BAF2' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: paymentMethod === 'UPI' ? '#00BAF2' : 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    style={{ accentColor: '#00BAF2' }}
                  />
                  <span>Paytm / Any UPI (Fastest)</span>
                </label>

                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'COD' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
                  border: paymentMethod === 'COD' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: 'var(--gold-primary)' }}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>

              {/* Official Paytm QR Payment Card */}
              {paymentMethod === 'UPI' && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'linear-gradient(145deg, rgba(7, 26, 44, 0.95), rgba(4, 15, 27, 0.98))',
                  border: '1.5px solid rgba(0, 186, 242, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ color: '#00BAF2' }}>Paytm</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>se</span>
                        <span style={{ color: '#FDB913' }}>UPI</span>
                        <span style={{ fontSize: '0.75rem', color: '#10B981', marginLeft: '0.4rem', fontWeight: 700 }}>• 0% Fee</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                        Merchant: JONAK HOTEL AND RESTAURANT
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Payable Amount</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00BAF2', fontFamily: 'var(--font-serif)' }}>
                        ₹{grandTotal}
                      </div>
                    </div>
                  </div>

                  {/* QR Image + Action Controls Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.9rem', alignItems: 'center' }}>
                    {/* Official QR Image */}
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src="/images/jonak-paytm-qr.png"
                        alt="Jonak Hotel Paytm UPI QR"
                        onClick={() => setShowFullQr(true)}
                        style={{
                          width: '125px',
                          height: 'auto',
                          borderRadius: '8px',
                          border: '2px solid #00BAF2',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'block',
                          margin: '0 auto',
                          boxShadow: '0 4px 12px rgba(0, 186, 242, 0.25)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowFullQr(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00BAF2',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          margin: '0.35rem auto 0',
                          padding: 0
                        }}
                      >
                        <ExternalLink size={11} />
                        Zoom QR Code
                      </button>
                    </div>

                    {/* Right Side Options */}
                    <div>
                      {/* Copy UPI ID */}
                      <div style={{ marginBottom: '0.6rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Official UPI ID:
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(0, 186, 242, 0.3)',
                          borderRadius: '6px',
                          padding: '0.3rem 0.5rem'
                        }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            paytm.s1i7is2@pty
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            style={{
                              background: copiedUpi ? '#10B981' : '#00BAF2',
                              border: 'none',
                              color: '#FFFFFF',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 1-Tap Mobile UPI App Link */}
                      <a
                        href={`upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR&tn=Food%20Order`}
                        className="btn"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #00BAF2, #0088CC)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          textDecoration: 'none',
                          boxShadow: '0 3px 10px rgba(0, 186, 242, 0.3)'
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Pay ₹{grandTotal} in UPI App</span>
                      </a>

                      {/* 12-Digit UTR Number Input */}
                      <div style={{ marginTop: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                            12-Digit UTR Ref No. (Optional):
                          </label>
                          <span style={{ fontSize: '0.65rem', color: '#10B981' }}>Fast Approval</span>
                        </div>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="e.g. 428910482910"
                          value={paymentUtr}
                          onChange={(e) => setPaymentUtr(e.target.value.replace(/[^0-9]/g, ''))}
                          className="form-input"
                          style={{
                            fontSize: '0.82rem',
                            padding: '0.35rem 0.6rem',
                            letterSpacing: '0.08em',
                            fontFamily: 'monospace',
                            background: 'rgba(0, 0, 0, 0.5)',
                            borderColor: paymentUtr.length >= 10 ? '#10B981' : 'rgba(255,255,255,0.15)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supported Apps Strip */}
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.55)'
                  }}>
                    <span>Supported on all apps:</span>
                    <strong style={{ color: '#FFFFFF' }}>Paytm • Google Pay • PhonePe • BHIM • CRED</strong>
                  </div>
                </div>
              )}
            </div>

            {/* One-Tap Checkout Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}
            >
              <span>Place Order via WhatsApp (₹{grandTotal})</span>
              <ArrowRight size={18} />
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '0.75rem'
            }}>
              Instant WhatsApp order confirmation dispatched to Reception: <strong>+91 96785 82286</strong>
            </div>

          </form>
        )}

        {/* Full Size Paytm QR Code Modal */}
        {showFullQr && (
          <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div className="modal-content" style={{ maxWidth: '380px', padding: '1.25rem', textAlign: 'center', background: '#071A2C', border: '2px solid #00BAF2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, color: '#00BAF2', fontSize: '1rem' }}>Paytm Official UPI QR</span>
                <button 
                  onClick={() => setShowFullQr(false)}
                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <img 
                src="/images/jonak-paytm-qr.png" 
                alt="Jonak Hotel Paytm QR" 
                style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '12px', background: '#FFF', margin: '0 auto 0.75rem' }} 
              />

              <div style={{ fontSize: '0.82rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '0.25rem' }}>
                JONAK HOTEL AND RESTAURANT
              </div>
              <div style={{ fontSize: '0.85rem', color: '#00BAF2', fontFamily: 'monospace', fontWeight: 800, marginBottom: '1rem' }}>
                paytm.s1i7is2@pty
              </div>

              <button 
                type="button"
                onClick={() => setShowFullQr(false)}
                className="btn btn-primary"
                style={{ width: '100%', background: '#00BAF2', borderColor: '#00BAF2' }}
              >
                Close & Return to Cart
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
