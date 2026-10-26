import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  Check, 
  Send, 
  Music, 
  Flame, 
  Mic, 
  PhoneCall,
  CheckCircle2
} from 'lucide-react';

export const EventsSection = () => {
  const { hotelInfo, events, addEventEnquiry, showToast } = useHotel();

  // Quote form state
  const [eventType, setEventType] = useState('Birthday Party / Anniversary');
  const [guestCount, setGuestCount] = useState(50);
  const [eventDate, setEventDate] = useState('');
  const [cateringType, setCateringType] = useState('Multi-Course Buffet + Live Starters');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Approximate cost estimator per head based on options
  const estimatedCostPerGuest = cateringType.includes('Buffet') ? 450 : 250;
  const estimatedTotal = guestCount * estimatedCostPerGuest;

  const handleEventQuoteSubmit = (e) => {
    e.preventDefault();

    if (!contactName.trim() || !contactPhone.trim() || !eventDate) {
      showToast('Please fill all required event details.', 'danger');
      return;
    }

    const enquiryRecord = {
      eventType,
      guestCount,
      eventDate,
      cateringType,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      estimatedBudget: estimatedTotal
    };

    addEventEnquiry(enquiryRecord);
    setSubmitted(true);

    const whatsappMsg =
`*NEW EVENT & OPEN STAGE ENQUIRY - JONAK HOTEL*%0A` +
`----------------------------------------%0A` +
`*Event Type:* ${eventType}%0A` +
`*Expected Guests:* ${guestCount} Guests%0A` +
`*Preferred Date:* ${eventDate}%0A` +
`*Catering Choice:* ${cateringType}%0A` +
`*Estimated Budget:* ~₹${estimatedTotal}%0A` +
`----------------------------------------%0A` +
`*Host Name:* ${contactName}%0A` +
`*Contact:* ${contactPhone}%0A` +
`----------------------------------------%0A` +
`Please provide the final package details and banquet availability!`;

    const whatsappUrl = `https://wa.me/${hotelInfo.whatsapp}?text=${whatsappMsg}`;

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 }
    });

    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="events" style={{
      padding: '5rem 0',
      background: 'rgba(11, 17, 32, 0.75)',
      position: 'relative'
    }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: 'var(--gold-warm)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.8rem'
          }}>
            <Sparkles size={14} />
            <span>BARPETA'S EXCLUSIVE BANQUET & OPEN STAGE ARENA</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)'
          }}>
            Celebrations, Parties & <span className="text-gold-gradient">Open Stage Events</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            From memorable birthday bashes and anniversary dinners to cultural open-stage music evenings and executive corporate seminars, 
            Jonak Hotel brings you Barpeta’s most versatile indoor-outdoor event destination.
          </p>
        </div>

        {/* 2-Column Layout: Visual Showcase vs Quote Calculator */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2.5rem',
          alignItems: 'start'
        }} className="events-grid">
          
          {/* Left: Event Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {events.map((evt) => (
              <div 
                key={evt.id}
                className="glass-card event-card-inner"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  overflow: 'hidden'
                }}
              >
                <div style={{ height: '180px', position: 'relative' }}>
                  <img src={evt.image} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 20%, rgba(7, 11, 20, 0.9) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '15px' }}>
                    <span className="badge badge-gold">{evt.capacity}</span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem', color: '#FFFFFF' }}>
                    {evt.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gold-warm)', marginBottom: '0.9rem' }}>
                    {evt.tagline}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {evt.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <Check size={13} color="var(--gold-primary)" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Instant Event Quote Calculator */}
          <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--gold-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--gold-gradient)',
                color: '#070B14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Flame size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Get Instant Event Quote</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Transparent estimates with instant WhatsApp booking
                </p>
              </div>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Quote Request Sent!</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Our event manager will contact you with availability and customized stage setup packages.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn-secondary btn-sm">
                  Plan Another Event
                </button>
              </div>
            ) : (
              <form onSubmit={handleEventQuoteSubmit}>
                {/* Event Type */}
                <div className="form-group">
                  <label className="form-label">Occasion / Event Type *</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="form-select"
                  >
                    <option value="Birthday Party / Anniversary">Birthday Party / Anniversary</option>
                    <option value="Jonak Open Stage Musical / Cultural Show">Jonak Open Stage Musical / Cultural Show</option>
                    <option value="Corporate Seminar / Conference">Corporate Seminar / Conference</option>
                    <option value="Wedding Reception / Ring Ceremony">Wedding Reception / Ring Ceremony</option>
                    <option value="Family Get-Together / Reunion">Family Get-Together / Reunion</option>
                  </select>
                </div>

                {/* Guest Count Range */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Expected Number of Guests:</label>
                    <span style={{ fontWeight: 800, color: 'var(--gold-light)', fontSize: '0.95rem' }}>
                      {guestCount} Guests
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="400"
                    step="25"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--gold-primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>25 Guests</span>
                    <span>200 Guests</span>
                    <span>400+ Guests</span>
                  </div>
                </div>

                {/* Preferred Date */}
                <div className="form-group">
                  <label className="form-label">Preferred Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Catering Package */}
                <div className="form-group">
                  <label className="form-label">Catering & Dining Style</label>
                  <select
                    value={cateringType}
                    onChange={(e) => setCateringType(e.target.value)}
                    className="form-select"
                  >
                    <option value="Multi-Course Royal Buffet + Live Starters">Multi-Course Royal Buffet + Live Starters (~₹450/guest)</option>
                    <option value="Assamese Traditional Thali Buffet">Assamese Traditional Thali Buffet (~₹400/guest)</option>
                    <option value="High-Tea, Snacks & Mocktail Counters">High-Tea, Snacks & Mocktail Counters (~₹250/guest)</option>
                    <option value="Stage Venue Only (No Catering)">Stage Venue Only (Bring own catering)</option>
                  </select>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manash Roy"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9864012345"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Estimated Budget Box */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.9rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Event Budget:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gold-light)' }}>
                      ~₹{estimatedTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold-warm)', textAlign: 'right' }}>
                    Includes Stage & Seating<br />Sound system available
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 800 }}
                >
                  <Send size={16} />
                  <span>Request Stage & Catering Quote</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 960px) {
          .events-grid {
            grid-template-columns: 1fr 1.05fr !important;
          }
        }
      `}</style>
    </section>
  );
};
