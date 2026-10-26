import React from 'react';
import { useHotel } from '../context/HotelContext';
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
  ChevronRight
} from 'lucide-react';

export const Hero = ({ onOpenBookingModal }) => {
  const { hotelInfo, settings } = useHotel();

  return (
    <section id="home" style={{
      position: 'relative',
      padding: '3rem 0 4rem',
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
              marginBottom: '1.25rem'
            }}>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Star size={14} fill="#D4AF37" color="#D4AF37" />
                <span>Barpeta's #1 Rated Hotel & Family Restaurant (4.2★)</span>
              </span>

              <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Bike size={14} />
                <span>Free Home Delivery within 5 KM</span>
              </span>

              {settings.kitchenOpen ? (
                <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  <span>Kitchen Open & Accepting Orders</span>
                </span>
              ) : (
                <span className="badge badge-red" style={{ fontSize: '0.78rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                  <span>Kitchen Closed Currently</span>
                </span>
              )}
            </div>

            {/* Main Luxury Heading */}
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.2rem',
              color: 'var(--text-primary)'
            }}>
              Royal Assamese Warmth <br />
              <span className="text-gold-gradient">Meets 5-Star Luxury</span> In Barpeta
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '2rem',
              maxWidth: '620px'
            }}>
              Welcome to <strong>Jonak Hotel & Restaurant</strong> on BH Road, near NRL Petrol Pump, Donakuchi. 
              Savour Barpeta’s finest Dum Biryani, authentic Assamese local chicken, sizzlers, and Chinese delights, 
              or unwind in pristine executive AC rooms with 24/7 in-room dining and an open-air celebration stage.
            </p>

            {/* Primary Action Buttons */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.9rem',
              marginBottom: '2.5rem'
            }}>
              <a 
                href="#menu" 
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                <Utensils size={18} />
                <span>Order Food Online (Free 5KM)</span>
              </a>

              <button 
                onClick={onOpenBookingModal}
                className="btn btn-gold-outline"
                style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}
              >
                <BedDouble size={18} />
                <span>Book Luxury AC Room</span>
              </button>

              <a 
                href={`https://wa.me/${hotelInfo.whatsapp}?text=${encodeURIComponent('Hello Jonak Hotel! I would like to enquire about room availability & food delivery in Barpeta.')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ padding: '0.85rem 1.3rem' }}
              >
                <span>WhatsApp Us</span>
              </a>
            </div>

            {/* Micro Highlights Pill Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)'
                }}>
                  <Bike size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>0-5 KM Free</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Swift Delivery</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Star size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>4.2★ Rated</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>128+ Reviews</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA'
                }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>24/7 Service</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Room Dining</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FBBF24'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Open Stage</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Events & Lawns</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Luxury Visual Card Showcase */}
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
                  alt="Jonak Hotel & Restaurant Executive Suite Barpeta"
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
                      Executive Luxury AC
                    </span>
                    <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 700 }}>
                      Comfort & Elegance Guaranteed
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Starting at ₹1,499/night • 100% Power Backup
                    </p>
                  </div>
                  <button
                    onClick={onOpenBookingModal}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Book Now</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Sub Thumbnail Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginTop: '0.6rem'
              }}>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img src="/images/IMG_5222.JPG" alt="Deluxe Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Deluxe AC
                  </span>
                </div>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img src="/images/IMG_5217.JPG" alt="Family Suite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Family Suite
                  </span>
                </div>
                <div style={{ height: '76px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img src="/images/IMG_5228.JPG" alt="Open Stage Barpeta" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 3, left: 5, fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 3, color: '#FFF' }}>
                    Open Stage
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Floating Rating Badge */}
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
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Google Rated</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--gold-warm)' }}>#1 in Barpeta</div>
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
