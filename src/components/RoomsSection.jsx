import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  BedDouble, 
  Users, 
  Maximize2, 
  Wifi, 
  Wind, 
  Tv, 
  Coffee, 
  Check, 
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const RoomsSection = ({ onSelectRoomForBooking }) => {
  const { rooms, physicalRooms } = useHotel();
  const [activeImageIndex, setActiveImageIndex] = useState({});

  const handleNextImage = (roomId, totalImages) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % totalImages
    }));
  };

  return (
    <section id="rooms" style={{
      padding: '5rem 0',
      background: 'rgba(7, 11, 20, 0.95)',
      position: 'relative',
      borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
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
            <span>BARPETA’S PREMIER HOSPITALITY SUITES (9 ROOMS ACROSS 3 FLOORS)</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)'
          }}>
            Official Tariff & <span className="text-gold-gradient">Room Inventory</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Official verified room rates from <strong>₹1,400 to ₹5,000 / night</strong> (+ 5% GST). 
            Choose from Presidential Suites, Executive AC Doubles, Family Twin Rooms, and Budget Single Rooms with 24/7 power backup and in-room dining.
          </p>
        </div>

        {/* Room Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {rooms.map((room) => {
            const currentImgIdx = activeImageIndex[room.id] || 0;
            const images = room.gallery || [room.image];
            
            // Dynamic physical rooms calculation
            const catPhysicalRooms = (physicalRooms || []).filter(pr => pr.categoryId === room.id);
            const freeRooms = catPhysicalRooms.filter(pr => pr.isAvailable);
            const freeCount = freeRooms.length;
            const isSoldOut = freeCount === 0 || room.status === 'Sold Out';

            const baseTariff = room.tariff || 1400;
            const gstAmount = Math.round(baseTariff * 0.05);
            const totalWithGst = baseTariff + gstAmount;

            return (
              <div 
                key={room.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  border: isSoldOut ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)'
                }}
              >
                {/* Photo Header with live availability badge */}
                <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                  <img 
                    src={images[currentImgIdx] || room.image} 
                    alt={room.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                  />

                  {/* Gradient bottom bar */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(7, 11, 20, 0.8) 100%)'
                  }} />

                  {/* Badges Stack */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {/* A/C or Non-A/C Tag */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.22rem 0.55rem',
                      borderRadius: '4px',
                      background: room.ac ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)',
                      color: room.ac ? '#38BDF8' : '#FB923C',
                      border: room.ac ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(251, 146, 60, 0.5)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backdropFilter: 'blur(4px)',
                      width: 'fit-content'
                    }}>
                      <Wind size={12} />
                      <span>{room.ac ? 'Air-Conditioned' : 'Non-A/C Well-Ventilated'}</span>
                    </span>

                    {/* Dynamic Availability Status Badge */}
                    {isSoldOut ? (
                      <span className="badge badge-red" style={{ width: 'fit-content' }}>
                        <span>Sold Out / Housefull</span>
                      </span>
                    ) : freeCount === 1 && catPhysicalRooms.length > 1 ? (
                      <span className="badge badge-gold" style={{ background: 'rgba(245, 158, 11, 0.35)', border: '1px solid #F59E0B', color: '#FCD34D', width: 'fit-content' }}>
                        <span>⚡ Only 1 Left (Room {freeRooms[0].roomNumber})!</span>
                      </span>
                    ) : (
                      <span className="badge badge-green" style={{ width: 'fit-content' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <span>Available Today {freeRooms.length > 0 ? `(${freeRooms.map(r => `Rm ${r.roomNumber}`).join(', ')})` : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Photo Switcher Dots */}
                  {images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      display: 'flex',
                      gap: '4px',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '3px 6px',
                      borderRadius: '12px'
                    }}>
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveImageIndex(prev => ({ ...prev, [room.id]: idx }))}
                          style={{
                            width: idx === currentImgIdx ? '14px' : '6px',
                            height: '6px',
                            borderRadius: '3px',
                            background: idx === currentImgIdx ? 'var(--gold-primary)' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Room Type Tag */}
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--gold-light)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}>
                      {room.type}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Room Title */}
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem'
                    }}>
                      {room.title}
                    </h3>

                    {/* Room Meta (Capacity & Bed & Floor) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.65rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} color="var(--gold-primary)" />
                        <span>{room.capacity}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BedDouble size={14} color="var(--gold-primary)" />
                        <span>{room.bed}</span>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--gold-light)'
                      }}>
                        {room.floor}
                      </span>
                    </div>

                    {/* Assigned Room Numbers Tag */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Assigned Room{room.assignedRooms?.length > 1 ? 's' : ''}: <strong style={{ color: '#E2E8F0' }}>{room.assignedRooms?.join(', ')}</strong>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '1rem'
                    }}>
                      {room.description}
                    </p>

                    {/* Key Amenities */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.45rem',
                      marginBottom: '1.25rem'
                    }}>
                      {room.amenities.slice(0, 6).map((amenity, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <Check size={13} color="#10B981" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tariff & Booking Button Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.9rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{
                          fontSize: '1.45rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-serif)',
                          color: 'var(--gold-light)'
                        }}>
                          ₹{baseTariff.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ night</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
                        + 5% GST (₹{gstAmount}) = ₹{totalWithGst.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectRoomForBooking(room)}
                      disabled={isSoldOut}
                      className={isSoldOut ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      style={{
                        padding: '0.65rem 1.15rem',
                        opacity: isSoldOut ? 0.6 : 1,
                        cursor: isSoldOut ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <span>{isSoldOut ? 'Sold Out' : 'Instant Book'}</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Trust Note */}
        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <ShieldCheck size={16} color="var(--gold-primary)" />
          <span>Zero Cancellation Fee up to 24 hours prior to check-in • Pay at Hotel or Online UPI</span>
        </div>

      </div>
    </section>
  );
};
