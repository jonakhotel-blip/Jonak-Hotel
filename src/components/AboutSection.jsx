import React from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  Award, 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  UtensilsCrossed, 
  BedDouble, 
  Star,
  Quote
} from 'lucide-react';

export const AboutSection = () => {
  const { hotelInfo } = useHotel();

  return (
    <section id="about" className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '-5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.07) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 186, 242, 0.05) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '50px',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--border-gold)',
            color: 'var(--gold-light)',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} color="var(--gold-primary)" />
            <span>The Jonak Legacy • Barpeta, Assam</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.25,
            marginBottom: '1rem'
          }}>
            Where Royal Assamese Warmth Meets <span className="gold-text">Modern Luxury</span>
          </h2>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7
          }}>
            In the heart of Barpeta on BH Road, Jonak Hotel & Restaurant stands as a beacon of comfort, authentic regional flavors, and unforgettable celebrations.
          </p>
        </div>

        {/* Story & Visual Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
          marginBottom: '4rem'
        }}>
          {/* Left: Authentic Story & Meaning of Jonak */}
          <div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'var(--gold-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Our Philosophy & Heritage
            </div>

            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#FFFFFF',
              marginBottom: '1.25rem',
              lineHeight: 1.3
            }}>
              "Jonak" — The Gentle Radiance of Moonlight
            </h3>

            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.75,
              marginBottom: '1.25rem'
            }}>
              In Assamese culture, <strong>"Jonak" (জোনাক)</strong> represents the serene, peaceful glow of a full moonlit night. Established on BH Road near NRL Petrol Pump in Donakuchi / Garemara Pathar, our hotel was founded to offer weary travelers, visiting pilgrims of the sacred <strong>Barpeta Satra</strong>, and local families a tranquil sanctuary of royal hospitality.
            </p>

            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.75,
              marginBottom: '1.75rem'
            }}>
              From slow-dum fragrant Biryanis and traditional Assamese Thalis to our newly renovated 9 physical rooms across three floors, we bring heartfelt care to every guest who walks through our doors.
            </p>

            {/* Quick Stat Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'var(--font-serif)' }}>
                  9
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Luxury AC & Non-AC Rooms
                </div>
              </div>

              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'var(--font-serif)' }}>
                  82+
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Authentic Menu Dishes
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-serif)' }}>
                  5 KM
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  100% Free Food Delivery
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hotel Image Showcase Collage */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
              border: '2px solid var(--border-gold)'
            }}>
              <img
                src="/images/IMG_5206.JPG"
                alt="Jonak Hotel & Restaurant Entrance"
                style={{
                  width: '100%',
                  height: '380px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(7, 11, 20, 0.9) 0%, transparent 60%)'
              }} />

              {/* Floating Overlay Card */}
              <div style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '1.25rem',
                right: '1.25rem',
                background: 'rgba(11, 17, 32, 0.92)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  flexShrink: 0
                }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Prime Highway Location on BH Road
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Near NRL Petrol Pump, Donakuchi • 8 mins drive to Barpeta Satra
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Founder & Owner Welcome Message Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 20, 0.98))',
          border: '1.5px solid var(--border-gold)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.25rem',
          marginBottom: '4rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}>
          <Quote size={50} style={{
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
            color: 'rgba(212, 175, 55, 0.15)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--gold-light)',
                textTransform: 'uppercase',
                marginBottom: '0.6rem'
              }}>
                <HeartHandshake size={15} />
                <span>Message from Hotel Leadership</span>
              </div>

              <h4 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '1rem',
                lineHeight: 1.35
              }}>
                "Your Comfort, Dignity & Delight Are Our Sacred Duty."
              </h4>

              <p style={{
                fontSize: '0.92rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginBottom: '1.25rem'
              }}>
                "When you visit Jonak Hotel & Restaurant, you are not just a customer — you are family. We have personally inspected every room, trained our culinary team to use only the freshest local spices, and made our digital services 100% transparent with zero advance deposits and instant direct WhatsApp connectivity."
              </p>

              <div>
                <div style={{ fontWeight: 800, color: 'var(--gold-light)', fontSize: '1.05rem' }}>
                  Management & Proprietor
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Jonak Hotel & Restaurant Group • Barpeta, Assam
                </div>
              </div>
            </div>

            {/* Direct Official Contact Cards */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                Direct Reception & Management Desk
              </div>

              <a 
                href={`tel:${hotelInfo.phoneRaw}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.2s'
                }}
              >
                <Phone size={16} color="var(--gold-primary)" />
                <span>+91 96785 82286 (24/7 Desk)</span>
              </a>

              <a 
                href={`mailto:${hotelInfo.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.2s'
                }}
              >
                <Mail size={16} color="#00BAF2" />
                <span>{hotelInfo.email}</span>
              </a>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                padding: '0.5rem 0.75rem',
                lineHeight: 1.4
              }}>
                <Clock size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Front Desk: 24/7 • Kitchen: 7:00 AM - 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Pillar 1 */}
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)',
              margin: '0 auto 1rem'
            }}>
              <BedDouble size={24} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              9 Physical AC & Non-AC Rooms
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Suite, Deluxe, Twin, and Single options with 5% GST transparency, power backup, and in-room dining.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              margin: '0 auto 1rem'
            }}>
              <UtensilsCrossed size={24} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Authentic Kitchen & Dum Biryani
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Over 82 authentic recipes from Assamese fish thalis to tandoori kebabs, crafted by seasoned chefs.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(0, 186, 242, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00BAF2',
              margin: '0 auto 1rem'
            }}>
              <ShieldCheck size={24} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Form C & e-KYC Compliant
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              100% compliant with Assam Police & Barpeta District Administration with mobile Aadhaar photo capture.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              margin: '0 auto 1rem'
            }}>
              <Sparkles size={24} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Open Stage & Galas
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Barpeta's signature open-air performance arena for weddings, birthdays, cultural concerts, and banquets.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
