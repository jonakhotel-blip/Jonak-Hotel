import React from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  ExternalLink, 
  Compass, 
  Building2,
  Sparkles
} from 'lucide-react';

export const LandmarksSection = () => {
  const { hotelInfo, landmarks } = useHotel();

  return (
    <section id="landmarks" style={{
      padding: '5rem 0',
      background: 'rgba(7, 11, 20, 0.95)',
      position: 'relative',
      borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
    }}>
      <div className="container">
        
        {/* Header */}
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
            <Compass size={14} />
            <span>PRIME BARPETA HIGHWAY LOCATION</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)'
          }}>
            Nearby Landmarks & <span className="text-gold-gradient">Distance Guide</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Strategically located directly on <strong>BH Road, near NRL Petrol Pump, Donakuchi</strong>, 
            Jonak Hotel offers quick, traffic-free connectivity to every major cultural, administrative, and healthcare destination in Barpeta.
          </p>
        </div>

        {/* Landmarks Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem'
        }}>
          {landmarks.map((landmark, idx) => (
            <div 
              key={idx}
              className="glass-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '3px solid var(--gold-primary)'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                    {landmark.name}
                  </h3>
                  <span className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                    {landmark.distance}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {landmark.note}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem',
                color: 'var(--gold-warm)',
                fontWeight: 600,
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <Clock size={13} />
                <span>Drive time: ~{landmark.driveTime}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Map & Direction Helper Box */}
        <div className="glass-card location-box-grid" style={{
          padding: '1.75rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-warm)', marginBottom: '0.5rem' }}>
              <MapPin size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Official Physical Address</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
              {hotelInfo.address}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Coordinates: <code>26.3308° N, 91.0064° E</code> • Landmark: Direct entry next to Donakuchi NRL Petrol Pump on BH Road. 
              Ample private car & bus parking available inside hotel premises.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={`https://maps.google.com/?q=${hotelInfo.coordinates.lat},${hotelInfo.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <Navigation size={14} />
                <span>Open in Google Maps</span>
              </a>

              <a
                href={`tel:${hotelInfo.phoneRaw}`}
                className="btn btn-secondary btn-sm"
              >
                <span>Call for Directions: +91 96785 82286</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 900px) {
          .location-box-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
