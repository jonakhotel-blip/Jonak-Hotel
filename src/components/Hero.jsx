import React from 'react';
import { useHotel, isKitchenCurrentlyOpen } from '../context/HotelContext';
import { LocationOfferHome } from './LocationOfferHome';
import { 
  Star, 
  MapPin, 
  Bike, 
  Utensils, 
  BedDouble, 
  Sparkles, 
  PhoneCall, 
  ShieldCheck,
  Clock,
  Car,
  Wifi,
  ChevronRight,
  PartyPopper,
  Tag,
  Percent,
  CheckCircle2
} from 'lucide-react';

export const Hero = ({ onOpenBookingModal }) => {
  const { 
    hotelInfo, 
    settings, 
    activeTodayOffer,
    selectedLocation,
    locationSuggestions,
    isSearchingLocation,
    searchLocations,
    resolveCoordinates,
    updateSelectedLocation
  } = useHotel();
  const isKitchenOpen = isKitchenCurrentlyOpen(settings);

  const activeOfferFormatted = React.useMemo(() => {
    if (!activeTodayOffer) return null;
    return {
      id: activeTodayOffer.id || 'today-special',
      eyebrow: activeTodayOffer.badge || "TODAY'S VERIFIED SPECIAL",
      title: activeTodayOffer.title,
      detail: `${activeTodayOffer.description} (Use Code: ${activeTodayOffer.code})`,
      terms: activeTodayOffer.terms,
      endsAt: activeTodayOffer.endDate ? new Date(activeTodayOffer.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
    };
  }, [activeTodayOffer]);

  const handleNavigate = (action) => {
    if (action === 'food') {
      const el = document.getElementById('menu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'rooms') {
      if (typeof onOpenBookingModal === 'function') {
        onOpenBookingModal();
      } else {
        const el = document.getElementById('rooms');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'events') {
      const el = document.getElementById('events');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" style={{
      position: 'relative',
      padding: '2.5rem 0 3.5rem',
      overflow: 'hidden',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
    }}>
      {/* Ambient Lighting Gradients */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(30, 58, 138, 0.25) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2.5rem',
          alignItems: 'center'
        }} className="hero-grid">
          
          {/* Left Column: Hero Content */}
          <div>
            {/* Trust Badges Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginBottom: '1rem'
            }}>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Star size={14} fill="#D4AF37" color="#D4AF37" />
                <span>4.2★ Google Rated (128+ Verified Reviews)</span>
              </span>

              <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Bike size={14} />
                <span>0-5 KM Free Delivery • Barpeta Town</span>
              </span>

              {isKitchenOpen ? (
                <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  <span>Kitchen Open (10:30 AM - 10:30 PM) • Accepting Orders</span>
                </span>
              ) : (
                <span className="badge badge-red" style={{ fontSize: '0.78rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span>Kitchen Closed (Opens 10:30 AM) • Reception Active 24/7</span>
                </span>
              )}
            </div>

            {/* Main Luxury Heading */}
            <h1 style={{
              fontSize: 'clamp(2.1rem, 4.2vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Royal Assamese Warmth <br />
              <span className="text-gold-gradient">Meets Premier Hospitality</span> In Barpeta
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 'clamp(0.95rem, 1.6vw, 1.08rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '1.4rem',
              maxWidth: '620px'
            }}>
              Welcome to <strong>Jonak Hotel & Restaurant</strong> on BH Road, near NRL Petrol Pump, Donakuchi. 
              Savour authentic Handi Dum Biryani, local chicken curry, sizzlers and Chinese specialties, 
              or rest in 9 executive AC/Non-AC rooms with in-room dining, power backup, and an open celebration lawn.
            </p>

            {/* LOCATION-AWARE & TODAY'S ACTIVE OFFER COMPONENT */}
            <div style={{ marginBottom: '1.75rem' }}>
              <LocationOfferHome
                selectedLocation={selectedLocation}
                activeOffer={activeOfferFormatted}
                suggestions={locationSuggestions}
                isSearching={isSearchingLocation}
                onSearchLocations={searchLocations}
                onResolveCoordinates={resolveCoordinates}
                onSelectLocation={updateSelectedLocation}
                onNavigate={handleNavigate}
              />
            </div>

            {/* Micro Highlights Pill Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.85rem',
              paddingTop: '1.15rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)'
                }}>
                  <Bike size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>0-5 KM Free</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GPS Delivery</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Star size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>4.2★ Google</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>128+ Reviews</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA'
                }}>
                  <Clock size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>24/7 Desk</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In-Room Dining</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24'
                }}>
                  <Sparkles size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Open Stage</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lawns & Galas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Luxury Visual Card Showcase (Genuine Property Photos) */}
          <div style={{ position: 'relative' }}>
            {/* Main Featured Photo Card */}
            <div className="glass-card" style={{
              overflow: 'hidden',
              padding: '0.6rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'relative',
                borderRadius: 'calc(var(--radius-md) - 4px)',
                overflow: 'hidden',
                aspectRatio: '16/11'
              }}>
                <img 
                  src="/images/IMG_5206.JPG" 
                  alt="Jonak Hotel & Restaurant Executive Suite Room 101 Barpeta with Air Conditioning and In-Room Dining"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.6s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.04)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                />
                
                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(7, 11, 20, 0.88) 100%)'
                }} />

                {/* Floating Bottom Info */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  right: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: '0.4rem' }}>
                      Executive Luxury AC • Room 101
                    </span>
                    <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 700 }}>
                      Comfort & Elegance Guaranteed
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>Starting from <strong>₹1,400/night</strong> <span style={{ color: '#10B981', fontWeight: 600 }}>(+5% GST = ₹1,470 total)*</span></div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--gold-warm)', marginTop: '2px' }}>*Verified room inventory • 24/7 Power Backup & Wi-Fi</div>
                    </div>
                  </div>
                  <button
                    onClick={onOpenBookingModal}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Check Dates</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Sub Thumbnail Strip with Genuine Hotel Photos */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginTop: '0.6rem'
              }}>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src="/images/IMG_5222.JPG" 
                    alt="Jonak Hotel Deluxe AC Double Bed Room 201 Barpeta" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Deluxe AC (201)
                  </span>
                </div>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src="/images/IMG_5217.JPG" 
                    alt="Jonak Hotel Twin Executive AC Suite Room 204 Barpeta" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Twin AC (204)
                  </span>
                </div>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src="/images/IMG_5228.JPG" 
                    alt="Jonak Open Stage Celebration Lawn Barpeta for Marriages and Banquets" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Open Stage Lawn
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Rating Badge */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-10px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--gold-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: 'var(--shadow-luxury)'
            }}>
              <div style={{
                background: 'var(--gold-gradient)',
                color: '#070B14',
                fontWeight: 900,
                fontSize: '1rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px'
              }}>
                4.2
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Google Rating</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--gold-warm)' }}>128+ Verified Reviews</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 960px) {
          .hero-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </section>
  );
};
