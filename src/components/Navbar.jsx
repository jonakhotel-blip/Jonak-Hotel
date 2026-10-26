import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  Phone, 
  ShoppingBag, 
  MapPin, 
  Star, 
  Menu as MenuIcon, 
  X, 
  Lock, 
  BellRing,
  Utensils,
  BedDouble,
  Sparkles
} from 'lucide-react';

export const Navbar = ({ onOpenCart, onOpenAdmin, activeView, setActiveView }) => {
  const { hotelInfo, settings, cart } = useHotel();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 900 }}>
      {/* Top Announcement Banner (Controlled by Owner) */}
      {settings.announcementActive && settings.announcementText && (
        <div style={{
          background: 'linear-gradient(90deg, #997010 0%, #D4AF37 50%, #997010 100%)',
          color: '#070B14',
          fontSize: '0.82rem',
          fontWeight: 700,
          padding: '0.45rem 1rem',
          textAlign: 'center',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} />
          <span>{settings.announcementText}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav style={{
        background: 'rgba(7, 11, 20, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.22)',
        padding: '0.75rem 0'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo & Hotel Identity */}
          <a 
            href="#home" 
            onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '2px solid var(--gold-primary)',
              padding: '2px',
              background: 'rgba(212, 175, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src="/jonak.png" 
                alt="Jonak Hotel & Restaurant" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                color: 'var(--text-primary)'
              }}>
                JONAK <span style={{ color: 'var(--gold-primary)' }}>HOTEL</span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                color: 'var(--gold-warm)',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                & RESTAURANT • BARPETA
              </div>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.8rem',
            fontWeight: 500,
            fontSize: '0.92rem'
          }} className="desktop-nav-links">
            <a 
              href="#menu" 
              onClick={() => setActiveView('home')} 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--gold-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Food Menu & Delivery
            </a>
            <a 
              href="#rooms" 
              onClick={() => setActiveView('home')}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--gold-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              AC Rooms & Suites
            </a>
            <a 
              href="#events" 
              onClick={() => setActiveView('home')}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--gold-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Open Stage & Events
            </a>
            <a 
              href="#landmarks" 
              onClick={() => setActiveView('home')}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--gold-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Barpeta Guide
            </a>
            <a 
              href="#faq" 
              onClick={() => setActiveView('home')}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--gold-light)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              FAQ
            </a>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Google Rating Trust Badge (Desktop) */}
            <div style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--gold-light)'
            }} className="desktop-rating-badge">
              <Star size={14} fill="#D4AF37" color="#D4AF37" />
              <span>4.2★ Google Rated (128+)</span>
            </div>

            {/* Shopping Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="btn btn-gold-outline"
              style={{
                position: 'relative',
                padding: '0.55rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              aria-label="View Shopping Cart"
            >
              <ShoppingBag size={18} />
              <span className="cart-btn-text" style={{ fontSize: '0.85rem' }}>Cart</span>
              {cartCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '2px'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Call Reception Button (Quick Access) */}
            <a
              href={`tel:${hotelInfo.phoneRaw}`}
              className="btn btn-primary desktop-call-btn"
              style={{
                display: 'none',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem'
              }}
            >
              <Phone size={15} />
              <span>Call Reception</span>
            </a>

            {/* Owner Command Center Portal Button */}
            <button
              onClick={onOpenAdmin}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                borderColor: activeView === 'admin' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)'
              }}
              title="Hotel Owner Command Center"
            >
              <Lock size={14} color="var(--gold-warm)" />
              <span style={{ display: 'none' }} className="admin-btn-label">Owner Portal</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="mobile-hamburger"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{
            background: 'var(--bg-card-solid)',
            borderTop: '1px solid var(--border-gold)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--gold-warm)',
              fontSize: '0.85rem',
              fontWeight: 700,
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <Star size={14} fill="#D4AF37" color="#D4AF37" />
              <span>Barpeta's #1 Rated Hotel & Restaurant (4.2★)</span>
            </div>

            <a 
              href="#menu" 
              onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            >
              <Utensils size={18} color="var(--gold-primary)" />
              <span>Digital Food Menu & Free 5 KM Delivery</span>
            </a>

            <a 
              href="#rooms" 
              onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            >
              <BedDouble size={18} color="var(--gold-primary)" />
              <span>AC Rooms & Luxury Suites</span>
            </a>

            <a 
              href="#events" 
              onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            >
              <Sparkles size={18} color="var(--gold-primary)" />
              <span>Open Stage & Celebration Bookings</span>
            </a>

            <a 
              href="#landmarks" 
              onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            >
              <MapPin size={18} color="var(--gold-primary)" />
              <span>Nearby Landmarks (Barpeta Satra, FAAMCH)</span>
            </a>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <a
                href={`tel:${hotelInfo.phoneRaw}`}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                <Phone size={16} />
                <span>Call Hotel</span>
              </a>
              <button
                onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                <Lock size={15} color="var(--gold-warm)" />
                <span>Owner Portal</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Style overrides for responsive navigation */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav-links { display: flex !important; }
          .desktop-rating-badge { display: flex !important; }
          .desktop-call-btn { display: inline-flex !important; }
          .mobile-hamburger { display: none !important; }
          .admin-btn-label { display: inline !important; }
        }
      `}</style>
    </header>
  );
};
