import React from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Lock, 
  Heart, 
  Bike,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Footer = ({ onOpenAdmin, setActiveView }) => {
  const { hotelInfo } = useHotel();

  return (
    <footer style={{
      background: '#04070D',
      borderTop: '1px solid var(--border-gold)',
      padding: '4rem 0 2rem',
      color: 'var(--text-secondary)'
    }}>
      <div className="container">
        
        {/* Main Footer Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          
          {/* Col 1: Hotel Brand & Summary */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <img 
                src="/jonak.png" 
                alt="Jonak Hotel Logo" 
                style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
              />
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.1
                }}>
                  JONAK HOTEL
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', letterSpacing: '0.1em' }}>
                  & RESTAURANT • BARPETA
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '1.2rem', color: 'var(--text-secondary)' }}>
              Barpeta’s #1 rated hospitality destination combining Royal Assamese warmth, 5-star luxury AC accommodations, 
              and authentic multi-cuisine dining with Free 5 KM home delivery.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              fontSize: '0.78rem',
              color: 'var(--gold-light)'
            }}>
              <Star size={13} fill="#D4AF37" color="#D4AF37" />
              <span>4.2★ Rated on Google (128+ Verified Reviews)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#FFFFFF',
              marginBottom: '1.2rem'
            }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <li>
                <a href="#home" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Home & Overview
                </a>
              </li>
              <li>
                <a href="#menu" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Online Food Menu & 5 KM Delivery
                </a>
              </li>
              <li>
                <a href="#rooms" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Luxury AC Executive Rooms
                </a>
              </li>
              <li>
                <a href="#events" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Open Stage & Party Lawns
                </a>
              </li>
              <li>
                <a href="#landmarks" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Barpeta Satra & FAAMCH Distances
                </a>
              </li>
              <li>
                <a href="#about" onClick={() => setActiveView('home')} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Our Story & Hotel Leadership
                </a>
              </li>
              <li>
                <a href="/menu.pdf" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-warm)', textDecoration: 'none' }}>
                  Download Menu (PDF)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Direct Reception */}
          <div>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#FFFFFF',
              marginBottom: '1.2rem'
            }}>
              Contact Reception
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <MapPin size={17} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{hotelInfo.address}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Phone size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <a href={`tel:${hotelInfo.phoneRaw}`} style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>
                  {hotelInfo.phone}
                </a>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Mail size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <a href={`mailto:${hotelInfo.email}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {hotelInfo.email}
                </a>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href={`https://wa.me/${hotelInfo.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                  style={{ width: '100%' }}
                >
                  <span>Chat on WhatsApp (+91 96785 82286)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Discreet Owner Command Center Link */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Jonak Hotel & Restaurant. All Rights Reserved. • BH Road, Barpeta, Assam 781314.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Discreet Hotel Owner Command Center Link */}
            <button
              onClick={onOpenAdmin}
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                color: 'var(--gold-light)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600
              }}
            >
              <Lock size={12} color="var(--gold-primary)" />
              <span>Owner Command Center (PIN: 1234)</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
