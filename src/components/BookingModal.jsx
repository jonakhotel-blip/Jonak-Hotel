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
  Check
} from 'lucide-react';

export const BookingModal = ({ isOpen, onClose, preselectedRoom }) => {
  const { hotelInfo, rooms, physicalRooms, settings, addRoomBooking, showToast } = useHotel();

  // Form states
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoom?.id || rooms[0]?.id || 'suite-ac');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [guestsCount, setGuestsCount] = useState('2 Adults');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // e-KYC & Aadhaar Verification states
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [showIdNumber, setShowIdNumber] = useState(true);
  const [kycConsent, setKycConsent] = useState(true);

  // Payment states
  const [paymentPreference, setPaymentPreference] = useState('PAYTM_UPI'); // 'PAYTM_UPI' | 'FRONT_DESK'
  const [bookingUtr, setBookingUtr] = useState('');
  const [copiedBookingUpi, setCopiedBookingUpi] = useState(false);
  const [showFullBookingQr, setShowFullBookingQr] = useState(false);

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

  // Auto-format Aadhaar number with 4-digit groups (XXXX XXXX XXXX)
  const handleIdNumberChange = (val) => {
    if (idType === 'Aadhaar Card') {
      const digits = val.replace(/\D/g, '').slice(0, 12);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      setIdNumber(formatted);
    } else {
      setIdNumber(val.toUpperCase().slice(0, 20));
    }
  };

  const handleFileUpload = (e, side) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('File size must be under 8MB', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (side === 'front') setAadhaarFront(reader.result);
      if (side === 'back') setAadhaarBack(reader.result);
      showToast(`${idType} ${side === 'front' ? 'Front Side' : 'Back Side'} attached!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Update room selection if preselectedRoom changes
  React.useEffect(() => {
    if (preselectedRoom) {
      setSelectedRoomId(preselectedRoom.id);
    }
  }, [preselectedRoom]);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

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

  const handleSubmitBooking = (e) => {
    e.preventDefault();

    if (!guestName.trim() || !guestPhone.trim()) {
      showToast('Please enter your Name and Mobile Number.', 'danger');
      return;
    }

    const cleanId = idNumber.replace(/\s+/g, '');
    if (idType === 'Aadhaar Card' && cleanId.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar Card number for hotel e-KYC verification.', 'danger');
      return;
    }
    if (!cleanId) {
      showToast(`Please enter your valid ${idType} number for e-KYC.`, 'danger');
      return;
    }

    if (!kycConsent) {
      showToast('Please accept the guest e-KYC declaration.', 'danger');
      return;
    }

    if (activeRoom.status === 'Sold Out' || freeRoomsInCat.length === 0) {
      showToast('This room category is currently Sold Out. Please select another.', 'danger');
      return;
    }

    const assignedRoomFinal = selectedRoomNumber || activeRoom.assignedRooms?.[0] || '101';
    const maskedIdFinal = idType === 'Aadhaar Card' && cleanId.length === 12 
      ? `XXXX-XXXX-${cleanId.slice(8)}`
      : idNumber.trim();

    const bookingRecord = {
      guestName: guestName.trim(),
      phone: guestPhone.trim(),
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
      idType,
      idNumber: idNumber.trim(),
      maskedId: maskedIdFinal,
      guestCity: guestCity.trim() || 'Barpeta, Assam',
      aadhaarFront,
      aadhaarBack,
      kycStatus: 'Verified',
      paymentMethod: paymentPreference === 'PAYTM_UPI' 
        ? 'Pre-Paid via Paytm UPI (paytm.s1i7is2@pty)' 
        : 'Pay on Arrival at Hotel Reception',
      paymentStatus: paymentPreference === 'PAYTM_UPI' 
        ? (bookingUtr.trim() ? 'Paid (UTR Provided)' : 'Paid / Transferred via UPI') 
        : 'Pending (Pay at Check-in)',
      upiId: 'paytm.s1i7is2@pty',
      paymentUtr: bookingUtr.trim()
    };

    const savedBooking = addRoomBooking(bookingRecord);
    setBookingConfirmed(savedBooking);

    // Format WhatsApp Invoice breakdown to +91 96785 82286
    const whatsappMsg =
`*OFFICIAL ROOM RESERVATION - JONAK HOTEL BARPETA*%0A` +
`----------------------------------------%0A` +
`*Booking Reference:* #${savedBooking?.id || 'BKG-NEW'}%0A` +
`*Guest Name:* ${guestName.trim()}%0A` +
`*Phone:* ${guestPhone.trim()}%0A` +
`*Room Category:* ${activeRoom.title} (${activeRoom.ac ? 'A/C' : 'Non-A/C'})%0A` +
`*Allocated Room:* Room ${assignedRoomFinal} (${activeRoom.floor})%0A` +
`*Check-in Date:* ${checkIn}%0A` +
`*Check-out Date:* ${checkOut} (${nights} Night${nights > 1 ? 's' : ''})%0A` +
`*Number of Guests:* ${guestsCount}%0A` +
`----------------------------------------%0A` +
`*MANDATORY GUEST e-KYC DETAILS:*%0A` +
`• ID Type: ${idType}%0A` +
`• ID Number: ${maskedIdFinal}%0A` +
`• Guest Origin / City: ${guestCity.trim() || 'Barpeta, Assam'}%0A` +
`• e-KYC Photo Proof: ${aadhaarFront ? 'Uploaded & Verified' : 'Physical ID to show at check-in'}%0A` +
(specialRequests ? `----------------------------------------%0A*Special Requests:* ${specialRequests}%0A` : '') +
`----------------------------------------%0A` +
`*OFFICIAL TARIFF & 5% GST BREAKDOWN:*%0A` +
`• Base Tariff: ₹${baseTariff.toLocaleString()} x ${nights} Night${nights > 1 ? 's' : ''} = ₹${baseTotal.toLocaleString()}%0A` +
`• GST (5%): +₹${gstAmount.toLocaleString()}%0A` +
`• GRAND TOTAL: ₹${grandTotal.toLocaleString()}%0A` +
`----------------------------------------%0A` +
`*PAYMENT DETAILS:*%0A` +
`• Payment Mode: ${paymentPreference === 'PAYTM_UPI' ? 'Pre-Paid via Paytm UPI QR (paytm.s1i7is2@pty)' : 'Pay on Arrival at Hotel Reception (Cash/Card/UPI)'}%0A` +
(bookingUtr.trim() ? `• UPI Transaction UTR: ${bookingUtr.trim()}%0A` : '') +
(paymentPreference === 'PAYTM_UPI' ? `• Direct UPI Pay Link: upi://pay?pa=paytm.s1i7is2@pty&pn=JONAK%20HOTEL%20AND%20RESTAURANT&am=${grandTotal}&cu=INR%0A` : '') +
`----------------------------------------%0A` +
`*(Zero Advance Required • Payment at Hotel Reception Upon Check-in)*%0A` +
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
                Direct booking with 0% advance deposit required
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

        {/* Confirmed Screen */}
        {bookingConfirmed ? (
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
              Booking Request Submitted!
            </h3>

            <p style={{ color: 'var(--gold-light)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem' }}>
              Booking Reference: #{bookingConfirmed.id}
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your reservation request for <strong>{activeRoom.title}</strong> has been logged in our Reception System and dispatched to WhatsApp. 
              Our front-desk manager will connect to confirm room key handover!
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
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

            {/* Check-in & Check-out Dates */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check-in Date *</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Check-out Date *</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Guests & Guest Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anup Baishya"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9678582286"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Guests count selection */}
            <div className="form-group">
              <label className="form-label">Total Guests</label>
              <select
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
              <label className="form-label">Special Requests (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Late check-in, extra bed, airport/station taxi"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="form-input"
              />
            </div>

            {/* ============================================================== */}
            {/* MANDATORY GUEST e-KYC (AADHAAR / GOVT ID PROOF) FORM */}
            {/* ============================================================== */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.95))',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid var(--gold-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-primary)'
                  }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Guest e-KYC Verification
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)' }}>
                      Govt of Assam & Police Form C Mandated
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
                  Safe & Encrypted
                </span>
              </div>

              <p style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '0.9rem', lineHeight: 1.4 }}>
                As per Barpeta District Administration and Police regulations, presenting a valid government photo ID is mandatory for all guests at check-in.
              </p>

              {/* ID Type & City Selector */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '0.75rem',
                marginBottom: '0.85rem'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: '#FFFFFF' }}>
                    Select Govt ID Type *
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => {
                      setIdType(e.target.value);
                      setIdNumber('');
                    }}
                    className="form-select"
                    style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem', background: 'rgba(30, 41, 59, 0.9)' }}
                  >
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="Voter ID Card">Voter ID (Election Commission)</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Indian Passport">Indian Passport</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: '#FFFFFF' }}>
                    Guest City / Origin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Barpeta / Guwahati"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem', background: 'rgba(30, 41, 59, 0.9)' }}
                  />
                </div>
              </div>

              {/* 12-Digit Aadhaar / ID Number Input */}
              <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.78rem', color: '#FFFFFF' }}>
                    {idType === 'Aadhaar Card' ? '12-Digit Aadhaar Number (UIDAI) *' : `${idType} Number *`}
                  </label>
                  
                  {idType === 'Aadhaar Card' && idNumber.replace(/\s+/g, '').length === 12 && (
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={13} />
                      Valid 12 Digits
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showIdNumber ? 'text' : 'password'}
                    required
                    maxLength={idType === 'Aadhaar Card' ? 14 : 20}
                    placeholder={idType === 'Aadhaar Card' ? 'XXXX  XXXX  XXXX' : 'Enter Govt ID Number'}
                    value={idNumber}
                    onChange={(e) => handleIdNumberChange(e.target.value)}
                    className="form-input"
                    style={{
                      letterSpacing: idType === 'Aadhaar Card' ? '0.18em' : '0.08em',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      background: 'rgba(30, 41, 59, 0.95)',
                      borderColor: idType === 'Aadhaar Card' && idNumber.replace(/\s+/g, '').length === 12
                        ? '#10B981'
                        : 'rgba(212, 175, 55, 0.4)',
                      paddingRight: '2.5rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowIdNumber(!showIdNumber)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title={showIdNumber ? 'Hide ID number' : 'Show ID number'}
                  >
                    {showIdNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Photo Upload: Front & Back with Camera Support */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.78rem', color: '#FFFFFF' }}>
                    Upload {idType} Photo Proof (Optional / Instant Fast Check-in)
                  </label>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Mobile Camera Supported
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem'
                }}>
                  {/* Front Side Upload */}
                  <div style={{
                    border: '1.5px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem',
                    textAlign: 'center',
                    background: aadhaarFront ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                    position: 'relative'
                  }}>
                    {aadhaarFront ? (
                      <div>
                        <img 
                          src={aadhaarFront} 
                          alt="ID Front" 
                          style={{
                            width: '100%',
                            height: '70px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '0.35rem'
                          }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                            ✓ Front Attached
                          </span>
                          <button
                            type="button"
                            onClick={() => setAadhaarFront(null)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: 'none',
                              color: '#EF4444',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{ display: 'block', cursor: 'pointer', padding: '0.5rem 0.2rem' }}>
                        <Camera size={20} color="var(--gold-light)" style={{ margin: '0 auto 0.25rem' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF' }}>
                          Front Side Photo
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Click or Browse
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileUpload(e, 'front')}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Back Side Upload */}
                  <div style={{
                    border: '1.5px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem',
                    textAlign: 'center',
                    background: aadhaarBack ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                    position: 'relative'
                  }}>
                    {aadhaarBack ? (
                      <div>
                        <img 
                          src={aadhaarBack} 
                          alt="ID Back" 
                          style={{
                            width: '100%',
                            height: '70px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '0.35rem'
                          }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                            ✓ Back Attached
                          </span>
                          <button
                            type="button"
                            onClick={() => setAadhaarBack(null)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: 'none',
                              color: '#EF4444',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{ display: 'block', cursor: 'pointer', padding: '0.5rem 0.2rem' }}>
                        <Upload size={20} color="var(--gold-light)" style={{ margin: '0 auto 0.25rem' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF' }}>
                          Back Side Photo
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Address Side
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileUpload(e, 'back')}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.35,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  required
                  checked={kycConsent}
                  onChange={(e) => setKycConsent(e.target.checked)}
                  style={{ accentColor: 'var(--gold-primary)', marginTop: '2px' }}
                />
                <span>
                  I confirm that the above Aadhaar / Govt ID details belong to me and are submitted for hotel guest registration and verification at Jonak Hotel & Restaurant, Barpeta.
                </span>
              </label>
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
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentPreference === 'PAYTM_UPI' ? 'rgba(0, 186, 242, 0.15)' : 'var(--bg-surface)',
                  border: paymentPreference === 'PAYTM_UPI' ? '1.5px solid #00BAF2' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
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
                  <span>Paytm / UPI QR (Pre-Pay)</span>
                </label>

                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: paymentPreference === 'FRONT_DESK' ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-surface)',
                  border: paymentPreference === 'FRONT_DESK' ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
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
                  <span>Pay at Front Desk</span>
                </label>
              </div>

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
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1.05rem',
                fontWeight: 800
              }}
            >
              <span>Confirm & Send to Reception via WhatsApp</span>
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
