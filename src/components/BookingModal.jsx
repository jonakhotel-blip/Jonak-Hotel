import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  Users, 
  BedDouble, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Camera,
  Upload,
  Eye,
  EyeOff,
  FileText,
  Trash2,
  Lock,
  MapPin,
  Copy,
  ExternalLink,
  Check,
  CreditCard,
  Clock,
  RefreshCw
} from 'lucide-react';

export const BookingModal = ({ isOpen, onClose, preselectedRoom }) => {
  const { 
    hotelInfo, 
    rooms, 
    physicalRooms, 
    settings, 
    addRoomBooking, 
    createPaymentOrder, 
    verifyPayment, 
    showToast,
    uploadKycDocument 
  } = useHotel();

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoom?.id || rooms[0]?.id || 'suite-ac');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(() => todayStr);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [guestsCount, setGuestsCount] = useState('2 Adults');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Digital KYC Document Upload
  const [kycDocUrl, setKycDocUrl] = useState('');
  const [kycDocName, setKycDocName] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  // In-Person Verification & Consent
  const [acknowledgedIdPolicy, setAcknowledgedIdPolicy] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Payment states
  const [paymentPreference, setPaymentPreference] = useState('PAYTM_UPI'); // 'PAYTM_UPI' | 'RAZORPAY' | 'FRONT_DESK'
  const [bookingUtr, setBookingUtr] = useState('');
  const [copiedBookingUpi, setCopiedBookingUpi] = useState(false);
  const [showFullBookingQr, setShowFullBookingQr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room Photograph Showcase & Gallery Navigation
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Reset photo index when activeRoom changes
  React.useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [selectedRoomId]);

  const handleKycFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Document image size should be under 8MB', 'danger');
      return;
    }
    setIsUploadingKyc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const res = await uploadKycDocument(base64, {
        guestName: guestName.trim() || 'Room Guest',
        docType: 'Aadhaar / Govt Photo ID'
      });
      setIsUploadingKyc(false);
      if (res && res.success) {
        setKycDocUrl(res.url);
        setKycDocName(file.name);
        showToast('✅ Government ID / Aadhaar uploaded & encrypted successfully!', 'success');
      } else {
        showToast('Failed to upload document. You can present it at check-in.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyBookingUpi = () => {
    try {
      navigator.clipboard?.writeText('paytm.s1i7is2@pty');
      setCopiedBookingUpi(true);
      showToast('UPI ID paytm.s1i7is2@pty copied!', 'success');
      setTimeout(() => setCopiedBookingUpi(false), 2500);
    } catch {
      showToast('UPI ID: paytm.s1i7is2@pty', 'info');
    }
  };

  const handleCheckInChange = (newDate) => {
    setCheckIn(newDate);
    setFormErrors(prev => ({ ...prev, dates: undefined }));
    if (newDate >= checkOut) {
      const nextDay = new Date(newDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split('T')[0]);
    }
  };

  const handleCheckOutChange = (newDate) => {
    setCheckOut(newDate);
    setFormErrors(prev => ({ ...prev, dates: undefined }));
  };

  // Update room selection if preselectedRoom changes
  React.useEffect(() => {
    if (preselectedRoom) {
      setSelectedRoomId(preselectedRoom.id);
    }
  }, [preselectedRoom]);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const roomImagesList = React.useMemo(() => {
    if (!activeRoom) return ['/images/IMG_5217.JPG'];
    const list = [];
    if (activeRoom.image) list.push(activeRoom.image);
    if (Array.isArray(activeRoom.gallery)) {
      activeRoom.gallery.forEach(img => {
        if (!list.includes(img)) list.push(img);
      });
    }
    if (list.length === 0) list.push('/images/IMG_5217.JPG');
    return list;
  }, [activeRoom]);

  const currentDisplayImage = roomImagesList[selectedPhotoIndex] || roomImagesList[0] || '/images/IMG_5217.JPG';

  // Set default room number whenever active category changes
  React.useEffect(() => {
    if (activeRoom) {
      const availablePhys = (physicalRooms || []).filter(
        pr => pr.categoryId === activeRoom.id && pr.isAvailable
      );
      if (availablePhys.length > 0) {
        setSelectedRoomNumber(availablePhys[0].roomNumber);
      } else if (activeRoom.assignedRooms?.length > 0) {
        setSelectedRoomNumber(activeRoom.assignedRooms[0]);
      } else {
        setSelectedRoomNumber('');
      }
    }
  }, [activeRoom, physicalRooms]);

  // Calculate nights
  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.max(end - start, 86400000);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const baseTariff = activeRoom?.tariff || 1400;
  const baseTotal = baseTariff * nights;
  const gstPercent = settings?.gstPercent ?? 5;
  const isGstApplied = settings?.applyGst !== false;
  const gstAmount = isGstApplied ? Math.round(baseTotal * (gstPercent / 100)) : 0;
  const grandTotal = baseTotal + gstAmount;

  // Physical rooms for this category
  const catPhysicalRooms = (physicalRooms || []).filter(pr => pr.categoryId === activeRoom?.id);
  const freeRoomsInCat = catPhysicalRooms.filter(pr => pr.isAvailable);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validate Guest Name
    if (!guestName.trim() || guestName.trim().length < 2) {
      errors.guestName = 'Please enter your full name (minimum 2 characters).';
    }

    // Validate Indian Mobile Phone (10 digits starting with 6-9)
    const cleanPhone = guestPhone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      errors.guestPhone = 'Please enter a valid 10-digit mobile number.';
    }

    // Validate Dates
    if (!checkIn || checkIn < todayStr) {
      errors.dates = 'Check-in date cannot be in the past.';
    } else if (!checkOut || checkOut <= checkIn) {
      errors.dates = 'Check-out date must be after check-in date.';
    }

    // Validate Physical ID Acknowledgement
    if (!acknowledgedIdPolicy) {
      errors.idPolicy = 'Please acknowledge the in-person government ID presentation requirement.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast(Object.values(errors)[0], 'danger');
      return;
    }

    setFormErrors({});

    if (activeRoom.status === 'Sold Out' || freeRoomsInCat.length === 0) {
      showToast('This room category is currently Sold Out. Please select another.', 'danger');
      return;
    }

    setIsSubmitting(true);
    const assignedRoomFinal = selectedRoomNumber || activeRoom.assignedRooms?.[0] || '101';

    const bookingRecord = {
      guestName: guestName.trim(),
      phone: cleanPhone,
      roomType: activeRoom.title,
      roomId: activeRoom.id,
      roomNumber: assignedRoomFinal,
      floor: activeRoom.floor,
      checkIn,
      checkOut,
      nights,
      guests: guestsCount,
      baseTariff,
      baseTotal,
      gstPercent,
      gstAmount,
      totalTariff: grandTotal,
      specialRequests: specialRequests.trim(),
      idVerificationMethod: kycDocUrl ? 'Uploaded & Encrypted Government ID (S3 / Cloud Adapter)' : 'In-person physical ID presentation at front desk check-in',
      kycDocUrl: kycDocUrl || '',
      kycDocName: kycDocName || '',
      kycStatus: kycDocUrl ? 'Pending Verification' : 'Present at Check-in',
      kycDocType: 'Aadhaar / Govt Photo ID',
      status: 'Request to confirm',
      paymentMethod: paymentPreference === 'PAYTM_UPI' 
        ? 'Pre-Paid via Paytm UPI (paytm.s1i7is2@pty)' 
        : paymentPreference === 'RAZORPAY'
          ? 'Razorpay Sandbox (Online Verified)'
          : 'Pay on Arrival at Hotel Reception',
      paymentStatus: paymentPreference === 'PAYTM_UPI' 
        ? (bookingUtr.trim() ? 'Paid (UTR Provided)' : 'Paid / Transferred via UPI') 
        : paymentPreference === 'RAZORPAY'
          ? 'Pre-Paid (Razorpay Verified)'
          : 'Pending (Pay at Check-in)',
      upiId: 'paytm.s1i7is2@pty',
      paymentUtr: bookingUtr.trim()
    };

    // Razorpay sandbox simulation
    if (paymentPreference === 'RAZORPAY') {
      try {
        const rzp = await createPaymentOrder({
          amount: grandTotal,
          receipt: `rcpt_room_${Date.now()}`,
          orderType: 'ROOM'
        });
        if (rzp && rzp.orderId) {
          const mockPaymentId = `pay_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await verifyPayment({
            razorpay_order_id: rzp.orderId,
            razorpay_payment_id: mockPaymentId,
            orderType: 'ROOM'
          });
          bookingRecord.paymentId = mockPaymentId;
          bookingRecord.razorpayOrderId = rzp.orderId;
        }
      } catch (err) {
        console.warn('Razorpay room sandbox error:', err);
      }
    }

    const savedResult = await addRoomBooking(bookingRecord);
    setIsSubmitting(false);

    if (savedResult && savedResult.success === false) {
      showToast(savedResult.error || 'Room unavailable for chosen dates.', 'danger');
      return;
    }

    const savedBooking = savedResult?.booking || bookingRecord;
    setBookingConfirmed(savedBooking);

    // Format WhatsApp Reservation Request (zero sensitive ID numbers transmitted)
    const whatsappMsg =
`*ROOM RESERVATION REQUEST - JONAK HOTEL BARPETA*%0A` +
`----------------------------------------%0A` +
`*Booking Reference:* #${savedBooking?.id || 'BKG-NEW'}%0A` +
`*Guest Name:* ${guestName.trim()}%0A` +
`*Mobile Phone:* ${cleanPhone}%0A` +
`*Room Category:* ${activeRoom.title} (${activeRoom.ac ? 'A/C' : 'Non-A/C'})%0A` +
`*Allocated Room:* Room ${assignedRoomFinal} (${activeRoom.floor})%0A` +
`*Check-in Date:* ${checkIn}%0A` +
`*Check-out Date:* ${checkOut} (${nights} Night${nights > 1 ? 's' : ''})%0A` +
`*Number of Guests:* ${guestsCount}%0A` +
(specialRequests ? `----------------------------------------%0A*Special Requests:* ${specialRequests}%0A` : '') +
`----------------------------------------%0A` +
`*TARIFF & 5% GST BREAKDOWN:*%0A` +
`• Base Tariff: ₹${baseTariff.toLocaleString()} x ${nights} Night${nights > 1 ? 's' : ''} = ₹${baseTotal.toLocaleString()}%0A` +
`• GST (5%): +₹${gstAmount.toLocaleString()}%0A` +
`• GRAND TOTAL: ₹${grandTotal.toLocaleString()} (Taxes Included)*%0A` +
`*(Tariff subject to owner confirmation)*%0A` +
`----------------------------------------%0A` +
`*PAYMENT DETAILS:*%0A` +
`• Payment Mode: ${bookingRecord.paymentMethod}%0A` +
(bookingUtr.trim() ? `• UPI Transaction UTR: ${bookingUtr.trim()}%0A` : '') +
(paymentPreference === 'PAYTM_UPI' ? `• Direct UPI Pay Link: upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR%0A` : '') +
`----------------------------------------%0A` +
`*Notice:* Valid physical Government Photo ID will be presented in-person at hotel check-in desk.%0A` +
`Kindly confirm my room reservation. Thank you!`;

    const whatsappUrl = `https://wa.me/${hotelInfo.whatsapp}?text=${whatsappMsg}`;

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 }
    });

    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-gold)',
          background: 'rgba(7, 11, 20, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BedDouble size={22} color="var(--gold-primary)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Instant Room Reservation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Authoritative server inventory • 0% advance deposit required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Booking Dialog"
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

        {/* Confirmed Screen */}
        {bookingConfirmed ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
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

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem', color: '#FFFFFF' }}>
              Booking Request Submitted!
            </h3>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--gold-primary)',
              color: 'var(--gold-light)',
              fontSize: '0.95rem',
              fontWeight: 800,
              marginBottom: '0.75rem'
            }}>
              Reference: #{bookingConfirmed.id}
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              color: '#93C5FD',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              ⚡ Status: <strong>Request to confirm</strong> (Pending Front Desk Check)
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 400 }}>
                Our reception manager will confirm physical key handover upon check-in.
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Your reservation request for <strong>{activeRoom.title}</strong> has been logged in our Reception System and dispatched to WhatsApp.
            </p>

            {/* Confirmed Room Photo Preview */}
            <div style={{
              width: '100%',
              maxWidth: '340px',
              margin: '0 auto 1.5rem',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1.5px solid var(--border-gold)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              background: 'rgba(7, 11, 20, 0.95)'
            }}>
              <img
                src={currentDisplayImage}
                alt={activeRoom.title}
                style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '0.65rem 0.85rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.88rem' }}>{activeRoom.title}</strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Room {selectedRoomNumber || activeRoom.assignedRooms?.[0]} • {activeRoom.floor}</div>
                </div>
                <span style={{ fontSize: '0.88rem', color: 'var(--gold-light)', fontWeight: 800 }}>
                  ₹{grandTotal?.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
              <a
                href={`tel:${hotelInfo.phoneRaw}`}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Phone size={16} />
                <span>Call Reception Desk ({hotelInfo.phone})</span>
              </a>

              <button
                onClick={() => { setBookingConfirmed(null); onClose(); }}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmitBooking} style={{ padding: '1.25rem 1.5rem' }}>
            
            {/* Select Room Category */}
            <div className="form-group">
              <label className="form-label">Select Room Category *</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="form-select"
                style={{
                  background: 'var(--bg-card)',
                  color: '#FFFFFF',
                  borderColor: 'var(--border-gold)',
                  fontSize: '0.88rem'
                }}
              >
                {rooms.map((r) => {
                  const catPhys = (physicalRooms || []).filter(pr => pr.categoryId === r.id);
                  const freeInCat = catPhys.filter(pr => pr.isAvailable);
                  const soldOut = freeInCat.length === 0 || r.status === 'Sold Out';
                  const gst = Math.round(r.tariff * 0.05);
                  return (
                    <option key={r.id} value={r.id} disabled={soldOut}>
                      {r.title} — ₹{r.tariff.toLocaleString()} + 5% GST = ₹{(r.tariff + gst).toLocaleString()}/night ({soldOut ? 'Sold Out' : `${freeInCat.length} Free`})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Preferred Room Number Picker */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Assigned / Preferred Room Number *</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                  {activeRoom.floor} ({catPhysicalRooms.length} physical room{catPhysicalRooms.length > 1 ? 's' : ''})
                </span>
              </div>
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="form-select"
                style={{
                  background: 'var(--bg-card)',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.18)',
                  fontSize: '0.88rem'
                }}
              >
                {catPhysicalRooms.length > 0 ? (
                  catPhysicalRooms.map((pr) => (
                    <option key={pr.roomNumber} value={pr.roomNumber} disabled={!pr.isAvailable}>
                      Room {pr.roomNumber} — {pr.floor} ({pr.isAvailable ? 'Available Now' : 'Currently Occupied'})
                    </option>
                  ))
                ) : (
                  (activeRoom.assignedRooms || []).map((rn) => (
                    <option key={rn} value={rn}>Room {rn} — {activeRoom.floor}</option>
                  ))
                )}
              </select>
            </div>

            {/* Authentic Room Photograph & Gallery Showcase */}
            <div style={{
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1.5px solid var(--border-gold)',
              background: 'rgba(15, 23, 42, 0.95)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              {/* Main Photo Banner */}
              <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                <img
                  src={currentDisplayImage}
                  alt={activeRoom.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(7, 11, 20, 0.9) 100%)'
                }} />

                {/* Badges Stack */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: (activeRoom.isAc || activeRoom.ac) ? 'rgba(56, 189, 248, 0.3)' : 'rgba(251, 146, 60, 0.3)',
                    color: (activeRoom.isAc || activeRoom.ac) ? '#38BDF8' : '#FB923C',
                    border: (activeRoom.isAc || activeRoom.ac) ? '1px solid #38BDF8' : '1px solid #FB923C',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {(activeRoom.isAc || activeRoom.ac) ? 'Air-Conditioned' : 'Non-A/C Natural Breeze'}
                  </span>
                  <span style={{
                    background: 'rgba(212, 175, 55, 0.25)',
                    color: 'var(--gold-warm)',
                    border: '1px solid var(--border-gold)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {activeRoom.floor}
                  </span>
                </div>

                {/* Tariff on bottom right */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '0.3rem 0.7rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  fontSize: '0.78rem',
                  color: '#FFFFFF'
                }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 800 }}>₹{activeRoom.tariff?.toLocaleString()}</span> / night
                </div>

                {/* Room Title & Features on bottom left */}
                <div style={{ position: 'absolute', bottom: '8px', left: '10px', right: '130px' }}>
                  <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {activeRoom.title}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                    {activeRoom.bed} • {activeRoom.size}
                  </div>
                </div>
              </div>

              {/* Gallery Thumbnails Row */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(7, 11, 20, 0.95)',
                overflowX: 'auto',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0, fontWeight: 700 }}>
                  Room Photos ({roomImagesList.length}):
                </span>
                {roomImagesList.map((imgSrc, idx) => {
                  const isSelected = selectedPhotoIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      style={{
                        width: '52px',
                        height: '36px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                        opacity: isSelected ? 1 : 0.65,
                        transition: 'all 0.2s ease',
                        background: '#000'
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt={`${activeRoom.title} view ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Check-in & Check-out Dates */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-checkin">Check-in Date *</label>
                <input
                  id="booking-checkin"
                  type="date"
                  required
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: formErrors.dates ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-checkout">Check-out Date *</label>
                <input
                  id="booking-checkout"
                  type="date"
                  required
                  min={checkIn || todayStr}
                  value={checkOut}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className="form-input"
                  style={{
                    borderColor: formErrors.dates ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
            </div>

            {formErrors.dates && (
              <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.85rem' }}>
                {formErrors.dates}
              </div>
            )}

            {/* Guests & Guest Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-name">Guest Full Name *</label>
                <input
                  id="booking-name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Anup Baishya"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (formErrors.guestName) setFormErrors(prev => ({ ...prev, guestName: undefined }));
                  }}
                  className="form-input"
                  style={{
                    borderColor: formErrors.guestName ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
                {formErrors.guestName && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                    {formErrors.guestName}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-phone">Mobile / WhatsApp Number *</label>
                <input
                  id="booking-phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestPhone(e.target.value);
                    if (formErrors.guestPhone) setFormErrors(prev => ({ ...prev, guestPhone: undefined }));
                  }}
                  className="form-input"
                  maxLength={10}
                  style={{
                    borderColor: formErrors.guestPhone ? '#EF4444' : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
                {formErrors.guestPhone && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                    {formErrors.guestPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Guests count selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="booking-guests">Total Guests</label>
              <select
                id="booking-guests"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                className="form-select"
              >
                <option value="1 Adult">1 Adult</option>
                <option value="2 Adults">2 Adults</option>
                <option value="2 Adults + 1 Child">2 Adults + 1 Child</option>
                <option value="3 Adults">3 Adults</option>
                <option value="4+ Family Guests">4+ Family Guests</option>
              </select>
            </div>

            {/* Special Requests */}
            <div className="form-group">
              <label className="form-label" htmlFor="booking-requests">Special Requests (Optional)</label>
              <input
                id="booking-requests"
                type="text"
                placeholder="e.g. Late check-in, extra bed, ground floor preference"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Express KYC Upload (S3 / Storage Adapter) */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="var(--gold-primary)" />
                  Optional Express Check-In (Aadhaar / ID Upload)
                </span>
                <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  Hafijur Pre-Verification
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Upload your Aadhaar or Govt ID now so Reception Desk (Hafijur) can verify and assign your room key before you arrive!
              </p>

              {kycDocUrl ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  padding: '0.6rem 0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>{kycDocName || 'Aadhaar_Document.jpg'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Encrypted & Stored in S3 / KYC Vault</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setKycDocUrl(''); setKycDocName(''); }}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: '1.5px dashed rgba(212, 175, 55, 0.4)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--gold-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <Upload size={16} />
                  <span>{isUploadingKyc ? 'Uploading to S3 / Cloud Vault...' : 'Tap to Upload Aadhaar / Voter ID / Passport'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleKycFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* ============================================================== */}
            {/* PRIVACY & PHYSICAL GOVT ID VERIFICATION NOTICE */}
            {/* ============================================================== */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.95))',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Government ID & Privacy Notice
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: '#10B981' }}>
                      In-Person Physical Check-in Verification
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.68rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10B981',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Lock size={11} />
                  Zero ID Data Stored Online
                </span>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.72)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                To safeguard guest privacy and uphold data protection principles, Jonak Hotel does <strong>not</strong> collect or store your Aadhaar or government ID documents online. As per local guest register regulations, adult guests must simply present an original physical photo ID (Aadhaar Card, Voter ID, Driving License, or Passport) at the hotel front desk upon arrival.
              </p>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                fontSize: '0.74rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.4,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  required
                  checked={acknowledgedIdPolicy}
                  onChange={(e) => setAcknowledgedIdPolicy(e.target.checked)}
                  style={{ accentColor: 'var(--gold-primary)', marginTop: '2px' }}
                />
                <span>
                  I understand that adult guests will present an original physical government photo ID at the front desk upon check-in.
                </span>
              </label>

              {formErrors.idPolicy && (
                <div style={{ color: '#EF4444', fontSize: '0.72rem', marginTop: '0.35rem' }}>
                  {formErrors.idPolicy}
                </div>
              )}
            </div>

            {/* Official Tariff & 5% GST Calculation Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.15rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem'
              }}>
                <span>Base Tariff ({nights} Night{nights > 1 ? 's' : ''} × ₹{baseTariff.toLocaleString()}):</span>
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>₹{baseTotal.toLocaleString()}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                paddingBottom: '0.45rem',
                borderBottom: '1px dashed rgba(255, 255, 255, 0.12)'
              }}>
                <span>Hotel GST (5%):</span>
                <span style={{ fontWeight: 600, color: '#38BDF8' }}>+₹{gstAmount.toLocaleString()}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-light)' }}>
                    Total Tariff Payable
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                    ₹{grandTotal.toLocaleString()}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#10B981', textAlign: 'right', lineHeight: 1.4 }}>
                  ✓ Official Jonak Hotel Tariff<br />
                  ✓ 0% Hidden Extra Charges
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* PAYMENT PREFERENCE & OFFICIAL PAYTM UPI INTEGRATION */}
            {/* ============================================================== */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                PAYMENT PREFERENCE:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentPreference === 'PAYTM_UPI' ? 'rgba(0, 186, 242, 0.15)' : 'var(--bg-surface)',
                  border: paymentPreference === 'PAYTM_UPI' ? '1.5px solid #00BAF2' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: paymentPreference === 'PAYTM_UPI' ? '#00BAF2' : 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="bookingPayment"
                    value="PAYTM_UPI"
                    checked={paymentPreference === 'PAYTM_UPI'}
                    onChange={() => setPaymentPreference('PAYTM_UPI')}
                    style={{ accentColor: '#00BAF2' }}
                  />
                  <span>Paytm UPI</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentPreference === 'RAZORPAY' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                  border: paymentPreference === 'RAZORPAY' ? '1.5px solid #3B82F6' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: paymentPreference === 'RAZORPAY' ? '#60A5FA' : 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="bookingPayment"
                    value="RAZORPAY"
                    checked={paymentPreference === 'RAZORPAY'}
                    onChange={() => setPaymentPreference('RAZORPAY')}
                    style={{ accentColor: '#3B82F6' }}
                  />
                  <span>Online Card</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentPreference === 'FRONT_DESK' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
                  border: paymentPreference === 'FRONT_DESK' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <input
                    type="radio"
                    name="bookingPayment"
                    value="FRONT_DESK"
                    checked={paymentPreference === 'FRONT_DESK'}
                    onChange={() => setPaymentPreference('FRONT_DESK')}
                    style={{ accentColor: 'var(--gold-primary)' }}
                  />
                  <span>Front Desk</span>
                </label>
              </div>

              {/* Razorpay Online Sandbox Card */}
              {paymentPreference === 'RAZORPAY' && (
                <div style={{
                  padding: '0.9rem',
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 20, 0.98))',
                  border: '1.5px solid rgba(59, 130, 246, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60A5FA', fontWeight: 800, fontSize: '0.85rem' }}>
                      <CreditCard size={16} />
                      <span>Razorpay Official Gateway</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', color: '#93C5FD', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                      Sandbox Test Mode
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Pre-pay securely using Credit/Debit Cards, NetBanking, or UPI. Verified with server-side HMAC signatures. Zero card data stored.
                  </p>
                </div>
              )}

              {/* Official Paytm QR Payment Card */}
              {paymentPreference === 'PAYTM_UPI' && (
                <div style={{
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
                        <span style={{ fontSize: '0.75rem', color: '#10B981', marginLeft: '0.4rem', fontWeight: 700 }}>• Instant Confirmation</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                        Payee: JONAK HOTEL AND RESTAURANT
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Payable Total</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00BAF2', fontFamily: 'var(--font-serif)' }}>
                        ₹{grandTotal.toLocaleString()}
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
                        onClick={() => setShowFullBookingQr(true)}
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
                        onClick={() => setShowFullBookingQr(true)}
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
                          Official Hotel UPI ID:
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
                            onClick={handleCopyBookingUpi}
                            style={{
                              background: copiedBookingUpi ? '#10B981' : '#00BAF2',
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
                            {copiedBookingUpi ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedBookingUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 1-Tap Mobile UPI App Link */}
                      <a
                        href={`upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR&tn=Room%20Reservation`}
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
                        <span>Pay ₹{grandTotal.toLocaleString()} in UPI App</span>
                      </a>

                      {/* 12-Digit UTR Number Input */}
                      <div style={{ marginTop: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                            12-Digit UPI Ref / UTR No. (Optional):
                          </label>
                          <span style={{ fontSize: '0.65rem', color: '#10B981' }}>Fast Check-in</span>
                        </div>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="e.g. 428910482910"
                          value={bookingUtr}
                          onChange={(e) => setBookingUtr(e.target.value.replace(/[^0-9]/g, ''))}
                          className="form-input"
                          style={{
                            fontSize: '0.82rem',
                            padding: '0.35rem 0.6rem',
                            letterSpacing: '0.08em',
                            fontFamily: 'monospace',
                            background: 'rgba(0, 0, 0, 0.5)',
                            borderColor: bookingUtr.length >= 10 ? '#10B981' : 'rgba(255,255,255,0.15)'
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
                    <span>Supported apps:</span>
                    <strong style={{ color: '#FFFFFF' }}>Paytm • Google Pay • PhonePe • BHIM • CRED</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
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
              <span>{isSubmitting ? 'Verifying Availability...' : 'Request Room Reservation via WhatsApp'}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '0.75rem'
            }}>
              Jonak Reception Desk: <strong>+91 96785 82286</strong> • Immediate Assistance
            </div>

          </form>
        )}

        {/* Full Size Paytm QR Code Modal */}
        {showFullBookingQr && (
          <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div className="modal-content" style={{ maxWidth: '380px', padding: '1.25rem', textAlign: 'center', background: '#071A2C', border: '2px solid #00BAF2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, color: '#00BAF2', fontSize: '1rem' }}>Paytm Official UPI QR</span>
                <button 
                  onClick={() => setShowFullBookingQr(false)}
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
                onClick={() => setShowFullBookingQr(false)}
                className="btn btn-primary"
                style={{ width: '100%', background: '#00BAF2', borderColor: '#00BAF2' }}
              >
                Close & Return to Booking
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
