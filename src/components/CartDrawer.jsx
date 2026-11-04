import React, { useState, useEffect, useCallback } from 'react';
import { useHotel, isKitchenCurrentlyOpen } from '../context/HotelContext';
import { apiUrl } from '../config/apiConfig';
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
  ArrowLeft,
  Copy,
  ExternalLink,
  Check,
  CreditCard,
  Tag,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';

// Official 10 Rooms for In-Room Dining Dropdown
export const OFFICIAL_IN_ROOM_OPTIONS = [
  { roomNumber: '101', label: 'Room 101 - Suite Room (A/C)' },
  { roomNumber: '102', label: 'Room 102 - Suite Room (A/C)' },
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
    calculateDelivery,
    offers,
    activeTodayOffer,
    createPaymentOrder,
    verifyPayment,
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
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('30 - 45 mins');
  const [isEligibleDelivery, setIsEligibleDelivery] = useState(true);
  const [deliveryError, setDeliveryError] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);

  // Offers & Promo Coupons
  const [couponInput, setCouponInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponError, setCouponError] = useState('');

  // In-Room Dining & Table fields
  const [roomNumber, setRoomNumber] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [qrPrefillSource, setQrPrefillSource] = useState(null);

  // Payment preference: 'UPI' | 'RAZORPAY' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showFullQr, setShowFullQr] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Order Success & Live Tracking
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Copy UPI ID helper
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

  // Close drawer on ESC key and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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

  // Calculate Subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Re-calculate delivery fee and eligibility from Server Delivery Engine
  const recalculateServerDelivery = useCallback(async () => {
    if (orderMode !== 'DELIVERY' || subtotal === 0) {
      setDeliveryFee(0);
      setIsEligibleDelivery(true);
      setDeliveryError('');
      return;
    }

    try {
      const result = await calculateDelivery({
        localityId: selectedLocality,
        detailedAddress,
        coordinates: userCoordinates,
        subtotal,
        orderMode: 'DELIVERY'
      });

      if (result) {
        setDeliveryDistanceKm(result.distanceKm || 0.4);
        setDeliveryFee(result.deliveryFee ?? 0);
        setIsEligibleDelivery(result.eligible !== false);
        setEstimatedDeliveryTime(result.estimatedTimeText || '35 - 45 mins');
        if (result.eligible === false) {
          setDeliveryError(result.error || 'Address exceeds maximum 15 KM delivery radius.');
        } else {
          setDeliveryError('');
        }
      }
    } catch (err) {
      console.warn('Delivery fee calculation error:', err);
    }
  }, [orderMode, selectedLocality, detailedAddress, userCoordinates, subtotal, calculateDelivery]);

  useEffect(() => {
    recalculateServerDelivery();
  }, [recalculateServerDelivery]);

  // Apply Coupon / Promo Code
  const handleApplyCoupon = (codeToApply) => {
    const targetCode = (codeToApply || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const matchedOffer = (offers || []).find(
      (o) => o.code.toUpperCase() === targetCode && o.active
    );

    if (!matchedOffer) {
      setCouponError(`Coupon "${targetCode}" is invalid or expired.`);
      setAppliedOffer(null);
      return;
    }

    const minSpend = matchedOffer.minOrder || 0;
    if (subtotal < minSpend) {
      setCouponError(`Code "${targetCode}" requires a minimum order of ₹${minSpend}. Add ₹${minSpend - subtotal} more!`);
      setAppliedOffer(null);
      return;
    }

    // Calculate discount amount
    const percent = matchedOffer.discountPercent || 0;
    let discAmount = Math.round((subtotal * percent) / 100);
    if (matchedOffer.maxDiscount && discAmount > matchedOffer.maxDiscount) {
      discAmount = matchedOffer.maxDiscount;
    }

    setAppliedOffer({
      ...matchedOffer,
      discountAmount: discAmount
    });
    setCouponError('');
    showToast(`🎉 Coupon ${targetCode} applied! Saved ₹${discAmount}`, 'success');
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponInput('');
    setCouponError('');
  };

  // Re-verify coupon validity if subtotal drops
  useEffect(() => {
    if (appliedOffer && subtotal < (appliedOffer.minOrder || 0)) {
      setAppliedOffer(null);
      setCouponError(`Coupon removed: minimum order ₹${appliedOffer.minOrder} required.`);
    } else if (appliedOffer) {
      // Re-calculate discount
      const percent = appliedOffer.discountPercent || 0;
      let discAmount = Math.round((subtotal * percent) / 100);
      if (appliedOffer.maxDiscount && discAmount > appliedOffer.maxDiscount) {
        discAmount = appliedOffer.maxDiscount;
      }
      setAppliedOffer(prev => ({ ...prev, discountAmount: discAmount }));
    }
  }, [subtotal]);

  // Discount and Grand Total
  const discountTotal = appliedOffer?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal - discountTotal + (orderMode === 'DELIVERY' ? deliveryFee : 0));

  // Trigger celebration confetti when 5 KM free delivery is unlocked
  useEffect(() => {
    if (isOpen && orderMode === 'DELIVERY' && deliveryDistanceKm <= (settings?.deliveryRules?.freeDeliveryRadiusKm || 5) && subtotal >= (settings?.deliveryRules?.freeDeliveryThreshold || 199)) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 }
      });
    }
  }, [isOpen, orderMode, deliveryDistanceKm, subtotal, settings]);

  // GPS Geolocation Handler with explicit consent
  const handlePerformGeolocation = () => {
    setShowLocationConsent(false);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'danger');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoordinates({ lat: latitude, lng: longitude });
        setIsLocating(false);
        showToast('📍 Live location captured! Recalculating delivery fee...', 'success');
      },
      (err) => {
        setIsLocating(false);
        showToast('Could not fetch GPS. Selected default locality instead.', 'info');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Live Tracking Status Refresh
  const handleRefreshTracking = async (orderId) => {
    setIsRefreshingStatus(true);
    try {
      const res = await fetch(apiUrl(`/api/orders/${orderId}/track`));
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
        showToast(`Status updated: ${data.status}`, 'info');
      }
    } catch (err) {
      console.warn('Failed to refresh order status:', err);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Checkout submission
  const handleProceedCheckout = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || customerName.trim().length < 2) {
      showToast('Please enter your full Name (minimum 2 characters).', 'danger');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast('Please enter a valid 10-digit mobile number.', 'danger');
      return;
    }

    if (orderMode === 'DELIVERY') {
      if (!detailedAddress.trim()) {
        showToast('Please provide your delivery address/house number.', 'danger');
        return;
      }
      if (!isEligibleDelivery) {
        showToast(deliveryError || 'Sorry, your address is outside our 15 KM delivery area.', 'danger');
        return;
      }
    }

    if (orderMode === 'IN_ROOM' && !roomNumber.trim()) {
      showToast('Please select your Hotel Room Number.', 'danger');
      return;
    }

    const isKitchenOpen = isKitchenCurrentlyOpen(settings);
    if (!isKitchenOpen) {
      showToast('Kitchen is currently closed for new orders.', 'danger');
      return;
    }

    setIsProcessingPayment(true);

    const idempotencyKey = `ord_cli_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Prepare Base Order Record
    const orderRecord = {
      idempotencyKey,
      customerName: customerName.trim(),
      phone: cleanPhone,
      mode: orderMode === 'DELIVERY' ? 'Home Delivery' : orderMode === 'IN_ROOM' ? 'In-Room Dining' : 'Dine-In Table Service',
      address: orderMode === 'DELIVERY' 
        ? `${detailedAddress.trim()}, ${localities.find(l => l.id === selectedLocality)?.name || 'Barpeta'}` 
        : orderMode === 'IN_ROOM' 
          ? `Jonak Hotel - ${roomNumber}` 
          : `Jonak Restaurant - ${tableNumber.trim() || 'Table / Takeaway'}`,
      distanceKm: orderMode === 'DELIVERY' ? deliveryDistanceKm : 0,
      deliveryFee: orderMode === 'DELIVERY' ? deliveryFee : 0,
      items: cart.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      subtotal,
      discount: discountTotal,
      couponCode: appliedOffer?.code || null,
      total: grandTotal,
      payment: paymentMethod === 'COD' 
        ? 'Cash on Delivery' 
        : paymentMethod === 'RAZORPAY'
          ? 'Razorpay Sandbox (Online Verified)'
          : `Paytm UPI (paytm.s1i7is2@pty)${paymentUtr.trim() ? ` • UTR: ${paymentUtr.trim()}` : ''}`,
      paymentStatus: paymentMethod === 'COD' 
        ? 'Pay on Delivery' 
        : paymentMethod === 'RAZORPAY'
          ? 'Paid (Razorpay Sandbox Verified)'
          : (paymentUtr.trim() ? 'Paid (UTR Provided)' : 'Transferred via UPI'),
      upiId: 'paytm.s1i7is2@pty',
      paymentUtr: paymentUtr.trim(),
      coordinates: userCoordinates
    };

    // Razorpay Sandbox Payment Flow
    if (paymentMethod === 'RAZORPAY') {
      try {
        const rzpOrder = await createPaymentOrder({
          amount: grandTotal,
          receipt: `rcpt_${Date.now()}`,
          orderType: 'FOOD'
        });

        if (rzpOrder && rzpOrder.orderId) {
          // Simulate sandbox verification token
          const mockPaymentId = `pay_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const verifyRes = await verifyPayment({
            razorpay_order_id: rzpOrder.orderId,
            razorpay_payment_id: mockPaymentId,
            orderType: 'FOOD'
          });

          if (!verifyRes.success) {
            showToast('Razorpay payment authorization failed.', 'danger');
            setIsProcessingPayment(false);
            return;
          }
          orderRecord.paymentId = mockPaymentId;
          orderRecord.razorpayOrderId = rzpOrder.orderId;
        }
      } catch (err) {
        console.warn('Razorpay sandbox error:', err);
      }
    }

    // Save order in state and sync with Real-Time Backend
    const saveResult = await addOrder(orderRecord);
    setIsProcessingPayment(false);

    if (saveResult && saveResult.success === false) {
      showToast(saveResult.error || 'Failed to place order.', 'danger');
      return;
    }

    const createdOrder = saveResult?.order || orderRecord;
    setOrderSuccess(createdOrder);
    setTrackingData(createdOrder);

    // Format WhatsApp Bill Text
    const itemsText = cart.map(item => `• ${item.name} x ${item.qty} = ₹${item.price * item.qty}`).join('%0A');
    const locationLink = userCoordinates 
      ? `https://maps.google.com/?q=${userCoordinates.lat},${userCoordinates.lng}` 
      : `Near ${localities.find(l => l.id === selectedLocality)?.name || 'Barpeta'}`;

    const whatsappMessage = 
`*NEW ORDER - JONAK HOTEL & RESTAURANT*%0A` +
`----------------------------------------%0A` +
`*Order ID:* #${createdOrder.id || 'JNK-NEW'}%0A` +
`*Customer:* ${customerName}%0A` +
`*Phone:* ${cleanPhone}%0A` +
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
(discountTotal > 0 ? `*Promo Discount (${appliedOffer?.code}):* -₹${discountTotal}%0A` : '') +
`*Delivery Charge:* ${deliveryFee === 0 ? 'FREE (₹0 - Within 5 KM)' : `₹${deliveryFee}`}%0A` +
`*GRAND TOTAL:* ₹${grandTotal}%0A` +
`----------------------------------------%0A` +
`*PAYMENT DETAILS:*%0A` +
`• Payment Mode: ${orderRecord.payment}%0A` +
(paymentUtr.trim() ? `• UPI Transaction UTR: ${paymentUtr.trim()}%0A` : '') +
(paymentMethod === 'UPI' ? `• Direct UPI Pay Link: upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR%0A` : '') +
`----------------------------------------%0A` +
`Please confirm and prepare my order!`;

    const whatsappUrl = `https://wa.me/${hotelInfo.whatsapp}?text=${whatsappMessage}`;

    // Clear cart
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              aria-label="Back to Menu"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-gold)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.35rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close Cart"
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
        </div>

        {/* Order Placed Success View with Real-time Timeline */}
        {orderSuccess ? (
          <div style={{ padding: '2rem 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
                margin: '0 auto 1rem'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem', color: '#FFFFFF' }}>
                Order Logged Successfully!
              </h3>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold-primary)',
                color: 'var(--gold-light)',
                fontSize: '0.95rem',
                fontWeight: 800,
                marginBottom: '0.75rem'
              }}>
                Order ID: #{orderSuccess.id}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Your order is recorded in the Jonak Hotel Command Center. Our kitchen staff is preparing your items now!
              </p>
            </div>

            {/* Live Order Status Timeline Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} />
                  <span>Live Kitchen Progress:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRefreshTracking(orderSuccess.id)}
                  disabled={isRefreshingStatus}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <RefreshCw size={12} className={isRefreshingStatus ? 'spin' : ''} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {/* Status Stepper */}
              {(() => {
                const currentStatus = trackingData?.status || orderSuccess.status || 'Received';
                const stages = [
                  { key: 'Received', label: 'Received' },
                  { key: 'Accepted', label: 'Accepted' },
                  { key: 'Preparing', label: 'Preparing' },
                  { key: 'Ready', label: orderMode === 'DELIVERY' ? 'Out for Delivery' : 'Ready' },
                  { key: 'Delivered', label: orderMode === 'DELIVERY' ? 'Delivered' : 'Completed' }
                ];
                const stageIndex = stages.findIndex(s => s.key.toLowerCase() === currentStatus.toLowerCase()) >= 0
                  ? stages.findIndex(s => s.key.toLowerCase() === currentStatus.toLowerCase())
                  : (currentStatus === 'Delivered' ? 4 : 1);

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '0.75rem' }}>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '10%',
                        right: '10%',
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        zIndex: 0
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(stageIndex / (stages.length - 1)) * 100}%`,
                          background: 'var(--gold-primary)',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      {stages.map((stg, i) => {
                        const isDone = i <= stageIndex;
                        return (
                          <div key={stg.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: isDone ? 'var(--gold-primary)' : '#0F172A',
                              border: isDone ? '2px solid var(--gold-light)' : '2px solid rgba(255, 255, 255, 0.2)',
                              color: isDone ? '#070B14' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              marginBottom: '0.35rem'
                            }}>
                              {isDone ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: isDone ? 700 : 500, color: isDone ? '#FFFFFF' : 'var(--text-muted)' }}>
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                      Current Status: <strong>{currentStatus}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Direct Action Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
              <a
                href={`tel:${hotelInfo.phoneRaw}`}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Phone size={16} />
                <span>Call Restaurant Desk ({hotelInfo.phone})</span>
              </a>

              <button
                onClick={() => { setOrderSuccess(null); setTrackingData(null); onClose(); }}
                className="btn btn-primary"
              >
                Done & Return to Menu
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

            {/* Step 2: Location-Aware Barpeta Delivery Calculator */}
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
                    onClick={() => setShowLocationConsent(true)}
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
                    <span>{isLocating ? 'Locating...' : (userCoordinates ? '📍 GPS Active' : 'Use My GPS')}</span>
                  </button>
                </div>

                {/* Location Consent Dialog */}
                {showLocationConsent && (
                  <div style={{
                    background: '#07101E',
                    border: '1px solid #38BDF8',
                    borderRadius: '6px',
                    padding: '0.85rem',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Info size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.78rem', color: '#FFFFFF', lineHeight: 1.4 }}>
                        <strong>Why we request location:</strong> Jonak Hotel checks your device coordinates only to verify you are within our 15 KM Barpeta service radius and calculate your lowest delivery fee. We never track you in the background.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowLocationConsent(false)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        Cancel (Pick Landmark)
                      </button>
                      <button
                        type="button"
                        onClick={handlePerformGeolocation}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                      >
                        Allow & Get Location
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Free Delivery or Distance Notice */}
                {!isEligibleDelivery ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#F87171',
                    fontSize: '0.82rem'
                  }}>
                    ⚠️ {deliveryError || 'Delivery not available beyond 15 KM radius. Please choose Dine-in / Takeaway.'}
                  </div>
                ) : deliveryDistanceKm <= (settings?.deliveryRules?.freeDeliveryRadiusKm || 5) && subtotal >= (settings?.deliveryRules?.freeDeliveryThreshold || 199) ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    color: '#34D399',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Sparkles size={16} />
                    <span>🎉 Free Delivery Unlocked! ({deliveryDistanceKm} KM • Est: {estimatedDeliveryTime})</span>
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
                    <strong>Distance: {deliveryDistanceKm} KM</strong> • Est: {estimatedDeliveryTime}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Delivery charge: ₹{deliveryFee} (Free for 0-5 KM on orders above ₹{settings?.deliveryRules?.freeDeliveryThreshold || 199})
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
              marginBottom: '1rem',
              maxHeight: '180px',
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

            {/* Promo Coupon Card */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px dashed rgba(212, 175, 55, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem'
            }}>
              {activeTodayOffer && !appliedOffer && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--gold-light)' }}>
                    <Tag size={13} />
                    <span>Today's Deal: <strong>{activeTodayOffer.code}</strong> ({activeTodayOffer.discountPercent}% OFF above ₹{activeTodayOffer.minOrder})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(activeTodayOffer.code)}
                    style={{
                      background: 'var(--gold-gradient)',
                      border: 'none',
                      color: '#070B14',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}

              {appliedOffer ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <div>
                      <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.85rem' }}>
                        {appliedOffer.code} Applied!
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                        ({appliedOffer.discountPercent}% off • -₹{discountTotal})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. ROYAL15)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    Apply Code
                  </button>
                </div>
              )}

              {couponError && (
                <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '0.35rem' }}>
                  {couponError}
                </div>
              )}
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

              {discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem', color: '#10B981' }}>
                  <span>Promo Discount ({appliedOffer?.code})</span>
                  <span style={{ fontWeight: 700 }}>-₹{discountTotal}</span>
                </div>
              )}

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

            {/* Step 4: Payment Options */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                PAYMENT PREFERENCE:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: settings?.codEnabled !== false ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'UPI' ? 'rgba(0, 186, 242, 0.15)' : 'var(--bg-surface)',
                  border: paymentMethod === 'UPI' ? '1.5px solid #00BAF2' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
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
                  <span>Paytm / Any UPI</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentMethod === 'RAZORPAY' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                  border: paymentMethod === 'RAZORPAY' ? '1.5px solid #3B82F6' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: paymentMethod === 'RAZORPAY' ? '#60A5FA' : 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="RAZORPAY"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    style={{ accentColor: '#3B82F6' }}
                  />
                  <span>Online (Cards/UPI)</span>
                </label>

                {settings?.codEnabled !== false && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: paymentMethod === 'COD' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
                    border: paymentMethod === 'COD' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
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
                )}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.9rem', alignItems: 'center' }}>
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

                    <div>
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
                </div>
              )}

              {/* Razorpay Sandbox Card */}
              {paymentMethod === 'RAZORPAY' && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 20, 0.98))',
                  border: '1.5px solid rgba(59, 130, 246, 0.45)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60A5FA', fontWeight: 800, fontSize: '0.9rem' }}>
                      <CreditCard size={18} />
                      <span>Razorpay Official Gateway</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', color: '#93C5FD', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      Sandbox Test Mode
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Pay securely using Credit/Debit Cards, NetBanking, or UPI. Verified with server-side HMAC signatures. Zero card data stored.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessingPayment || (orderMode === 'DELIVERY' && !isEligibleDelivery)}
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
              <span>{isProcessingPayment ? 'Processing Order...' : `Confirm & Place Order (₹${grandTotal})`}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '0.75rem'
            }}>
              Instant confirmation dispatched to Reception: <strong>+91 96785 82286</strong>
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
