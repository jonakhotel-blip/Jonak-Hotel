import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ShieldCheck,
  Phone,
  X,
  Camera,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const RoomsSection = ({ onSelectRoomForBooking }) => {
  const { rooms, physicalRooms, hotelInfo } = useHotel();
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'suite' | 'ac' | 'non-ac' | '1st' | '2nd' | '3rd'
  
  // Fullscreen Photo Lightbox State
  const [lightboxRoom, setLightboxRoom] = useState(null);
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState(0);

  // Cycle image for a specific room card
  const handlePrevImage = (roomId, totalImages, e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleNextImage = (roomId, totalImages, e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % totalImages
    }));
  };

  const handleSelectThumbnail = (roomId, index, e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex(prev => ({
      ...prev,
      [roomId]: index
    }));
  };

  const handleOpenLightbox = (room, initialIndex = 0, e) => {
    if (e) e.stopPropagation();
    setLightboxRoom(room);
    setLightboxPhotoIndex(initialIndex);
  };

  const handleCloseLightbox = () => {
    setLightboxRoom(null);
  };

  // Keyboard navigation for photo lightbox
  useEffect(() => {
    if (!lightboxRoom) return;

    const handleKeyDown = (e) => {
      const images = lightboxRoom.gallery || [lightboxRoom.image];
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        setLightboxPhotoIndex(prev => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxPhotoIndex(prev => (prev + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxRoom]);

  // Filtered rooms
  const filteredRooms = React.useMemo(() => {
    if (activeFilter === 'all') return rooms;
    if (activeFilter === 'suite') return rooms.filter(r => r.id === 'suite-ac');
    if (activeFilter === 'ac') return rooms.filter(r => r.isAc || r.ac);
    if (activeFilter === 'non-ac') return rooms.filter(r => !r.isAc && !r.ac);
    if (activeFilter === '1st') return rooms.filter(r => r.floor?.includes('1st'));
    if (activeFilter === '2nd') return rooms.filter(r => r.floor?.includes('2nd'));
    if (activeFilter === '3rd') return rooms.filter(r => r.floor?.includes('3rd'));
    return rooms;
  }, [rooms, activeFilter]);

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
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            color: 'var(--gold-warm)',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '0.9rem',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={15} />
            <span>BARPETA’S PREMIER HOSPITALITY SUITES • 10 PHYSICAL ROOMS ACROSS 3 FLOORS</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.8vw, 3rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Real Room Photography & <span className="text-gold-gradient">Direct Booking</span>
          </h2>

          <p style={{
            fontSize: '0.96rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '1.5rem'
          }}>
            Browse authentic, untouched photos of our bedrooms, luxury bathrooms, and guest living lounges in Barpeta. 
            Tap any photo to view all angles or click <strong>Book This Room</strong> to secure your stay with zero cancellation charges.
          </p>

          {/* Quick Room Category Filter Bar (Mobile-Friendly Horizontal Swipe) */}
          <div style={{
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            justifyContent: 'flex-start',
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.25rem 0.5rem 0.5rem'
          }}>
            {[
              { id: 'all', label: `All Rooms (${rooms.length} Categories)` },
              { id: 'suite', label: '👑 Presidential Suites (Rooms 101 & 102)' },
              { id: 'ac', label: '❄️ Air-Conditioned (7 Rooms)' },
              { id: 'non-ac', label: '🍃 Budget Non-A/C (3 Rooms)' },
              { id: '1st', label: '1st Floor (VIP Suites)' },
              { id: '2nd', label: '2nd Floor' },
              { id: '3rd', label: '3rd Floor' },
            ].map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    border: isActive ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: isActive ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.28) 0%, rgba(184, 134, 11, 0.2) 100%)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 10px rgba(212, 175, 55, 0.25)' : 'none'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Cards Grid (Mobile Responsive minmax) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '1.8rem'
        }}>
          {filteredRooms.map((room) => {
            const currentImgIdx = activeImageIndex[room.id] || 0;
            const images = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image || '/images/IMG_5217.JPG'];
            const labels = room.galleryLabels || [];
            const activePhotoLabel = labels[currentImgIdx] || `Authentic Room Photo ${currentImgIdx + 1}`;
            
            // Dynamic physical rooms calculation
            const catPhysicalRooms = (physicalRooms || []).filter(pr => pr.categoryId === room.id);
            const freeRooms = catPhysicalRooms.filter(pr => pr.isAvailable);
            const freeCount = freeRooms.length;
            const isSoldOut = freeCount === 0 || room.status === 'Sold Out';

            const baseTariff = room.tariff || 1400;
            const gstAmount = Math.round(baseTariff * 0.05);
            const totalWithGst = baseTariff + gstAmount;

            const primaryAssignedRoom = room.assignedRooms?.[0] || '101';

            return (
              <div 
                key={room.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  border: isSoldOut ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--border-gold)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(12, 18, 30, 0.95)'
                }}
              >
                {/* 1. Main Interactive Photo Banner */}
                <div 
                  style={{ 
                    position: 'relative', 
                    aspectRatio: '16/10', 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: '#070B14'
                  }}
                  onClick={() => handleOpenLightbox(room, currentImgIdx)}
                  title="Click to view full screen real photos of this room"
                >
                  <img 
                    src={images[currentImgIdx] || room.image} 
                    alt={`${room.title} - ${activePhotoLabel}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                  />

                  {/* Gradient bottom bar for caption contrast */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(7, 11, 20, 0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(7, 11, 20, 0.9) 100%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Top Badges Stack (AC & Availability) */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '6px',
                    zIndex: 2 
                  }}>
                    {/* A/C Tag */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      background: (room.isAc || room.ac) ? 'rgba(14, 165, 233, 0.85)' : 'rgba(249, 115, 22, 0.85)',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(4px)'
                    }}>
                      <Wind size={13} />
                      <span>{(room.isAc || room.ac) ? 'Air-Conditioned' : 'Non-A/C Natural Breeze'}</span>
                    </span>

                    {/* Floor Tag */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: 'var(--gold-light)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {room.floor}
                    </span>

                    {/* Availability Tag */}
                    {isSoldOut ? (
                      <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>
                        <span>Sold Out</span>
                      </span>
                    ) : (
                      <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <span>Available Now</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right: Fullscreen Lightbox Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenLightbox(room, currentImgIdx, e)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(7, 11, 20, 0.85)',
                      color: '#FFFFFF',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      zIndex: 3,
                      backdropFilter: 'blur(6px)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(7, 11, 20, 0.85)'}
                    title="Click to view all photos in high resolution"
                  >
                    <Camera size={13} color="var(--gold-light)" />
                    <span>View {images.length} Real Photos</span>
                  </button>

                  {/* Previous Photo Button */}
                  {images.length > 1 && (
                    <button
                      type="button"
                      aria-label="Previous room photo"
                      onClick={(e) => handlePrevImage(room.id, images.length, e)}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(7, 11, 20, 0.8)',
                        border: '1.5px solid rgba(255, 255, 255, 0.35)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 3,
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gold-primary)';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(7, 11, 20, 0.8)';
                        e.currentTarget.style.color = '#FFF';
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  {/* Next Photo Button */}
                  {images.length > 1 && (
                    <button
                      type="button"
                      aria-label="Next room photo"
                      onClick={(e) => handleNextImage(room.id, images.length, e)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(7, 11, 20, 0.8)',
                        border: '1.5px solid rgba(255, 255, 255, 0.35)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 3,
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--gold-primary)';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(7, 11, 20, 0.8)';
                        e.currentTarget.style.color = '#FFF';
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}

                  {/* Bottom Photo Caption Tag */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    zIndex: 2
                  }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.82)',
                      padding: '0.35rem 0.7rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      maxWidth: '85%'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-warm)', fontWeight: 800 }}>
                        📸 Photo {currentImgIdx + 1} of {images.length}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activePhotoLabel}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.85)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room No.</div>
                      <strong style={{ color: 'var(--gold-light)', fontSize: '0.88rem' }}>
                        {room.assignedRooms?.join(', ') || '101'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Photo Thumbnails Strip (Click to Switch Photo) */}
                <div style={{
                  display: 'flex',
                  gap: '0.45rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(7, 11, 20, 0.98)',
                  borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                  overflowX: 'auto',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0, fontWeight: 700 }}>
                    Angles:
                  </span>
                  {images.map((imgSrc, idx) => {
                    const isSelected = currentImgIdx === idx;
                    const thumbLabel = labels[idx] || `Angle ${idx + 1}`;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleSelectThumbnail(room.id, idx, e)}
                        title={thumbLabel}
                        style={{
                          width: '54px',
                          height: '38px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                          opacity: isSelected ? 1 : 0.6,
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          background: '#000',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt={thumbLabel}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    );
                  })}
                  
                  <button
                    type="button"
                    onClick={(e) => handleOpenLightbox(room, currentImgIdx, e)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'rgba(212, 175, 55, 0.12)',
                      border: '1px solid var(--border-gold)',
                      color: 'var(--gold-warm)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Maximize2 size={12} />
                    <span>Zoom All</span>
                  </button>
                </div>

                {/* 3. Direct Visual Booking Quick Action ("Image Dekh Kar Booking") */}
                <div style={{
                  padding: '0.85rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(7, 11, 20, 0.8) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
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
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>/ night</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                      + 5% GST (₹{gstAmount}) = ₹{totalWithGst.toLocaleString()} total
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRoomForBooking(room)}
                    disabled={isSoldOut}
                    className={isSoldOut ? 'btn btn-secondary' : 'btn btn-primary'}
                    style={{
                      padding: '0.65rem 1.15rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: isSoldOut ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.35)'
                    }}
                  >
                    <Calendar size={15} />
                    <span>{isSoldOut ? 'Sold Out' : (room.assignedRooms?.length > 1 ? `Book Room (${room.assignedRooms.join(', ')})` : `Book Room ${primaryAssignedRoom}`)}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* 4. Room Details, Capacity & Amenities */}
                <div style={{ padding: '1.35rem 1.4rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Room Title & Type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--gold-warm)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em'
                        }}>
                          {room.type}
                        </span>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          marginTop: '2px'
                        }}>
                          {room.title}
                        </h3>
                      </div>

                      <div style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        color: '#E2E8F0',
                        fontWeight: 600
                      }}>
                        {room.size}
                      </div>
                    </div>

                    {/* Meta Specifications */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Layers size={14} color="var(--gold-primary)" />
                        <span>{room.floor}</span>
                      </div>
                    </div>

                    {/* Room Description */}
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '1rem'
                    }}>
                      {room.description}
                    </p>

                    {/* Verified Amenities Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.45rem',
                      marginBottom: '1.2rem',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {room.amenities.slice(0, 6).map((amenity, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <Check size={13} color="#10B981" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Direct Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    paddingTop: '0.9rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <a
                      href={`tel:${hotelInfo.phoneRaw}`}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      title="Call reception desk for immediate queries"
                    >
                      <Phone size={13} />
                      <span>Call Desk</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onSelectRoomForBooking(room)}
                      disabled={isSoldOut}
                      className={isSoldOut ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                      style={{
                        padding: '0.55rem 1.15rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>{isSoldOut ? 'Sold Out' : 'Instant Book'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Real Estate & Booking Trust Guarantee */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--border-gold)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-warm)',
              flexShrink: 0
            }}>
              <Camera size={18} />
            </div>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>
                100% Genuine Property Photos
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                All photographs displayed are taken directly on site at Jonak Hotel, BH Road, Barpeta. What you see is what you get.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>
                Zero Cancellation Fee
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Cancel up to 24 hours prior to check-in with 100% refund. Pay at hotel check-in or via official UPI ({hotelInfo.phone}).
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
              flexShrink: 0
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>
                24/7 Power & In-Room Dining
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Full automatic generator backup, free reserved parking, high-speed Wi-Fi, and 24/7 restaurant room service.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Fullscreen High-Resolution Room Photo Lightbox Modal */}
      {lightboxRoom && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.94)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          {/* Lightbox Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                  {lightboxRoom.type}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {lightboxRoom.floor} • Room {lightboxRoom.assignedRooms?.join(', ') || '101'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginTop: '3px' }}>
                {lightboxRoom.title}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="d-sm-block">
                <span style={{ color: 'var(--gold-light)', fontSize: '1.3rem', fontWeight: 800 }}>
                  ₹{lightboxRoom.tariff?.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>/night (+5% GST)</span>
              </div>

              <button
                type="button"
                onClick={handleCloseLightbox}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                title="Close photo viewer (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Stage (Large Photo + Arrows) */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            maxWidth: '1100px',
            width: '100%',
            margin: '0 auto',
            padding: '1rem 0'
          }}>
            {/* Prev Arrow */}
            {(lightboxRoom.gallery || [lightboxRoom.image]).length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const len = (lightboxRoom.gallery || [lightboxRoom.image]).length;
                  setLightboxPhotoIndex(prev => (prev - 1 + len) % len);
                }}
                style={{
                  position: 'absolute',
                  left: '10px',
                  zIndex: 10,
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(7, 11, 20, 0.85)',
                  border: '1.5px solid var(--border-gold)',
                  color: 'var(--gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Main Crisp High-Resolution Photo */}
            <div style={{
              maxHeight: 'min(54vh, 500px)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              <img
                src={(lightboxRoom.gallery || [lightboxRoom.image])[lightboxPhotoIndex] || lightboxRoom.image}
                alt={`${lightboxRoom.title} photo ${lightboxPhotoIndex + 1}`}
                style={{
                  maxHeight: 'min(54vh, 500px)',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            </div>

            {/* Next Arrow */}
            {(lightboxRoom.gallery || [lightboxRoom.image]).length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const len = (lightboxRoom.gallery || [lightboxRoom.image]).length;
                  setLightboxPhotoIndex(prev => (prev + 1) % len);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  zIndex: 10,
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(7, 11, 20, 0.85)',
                  border: '1.5px solid var(--border-gold)',
                  color: 'var(--gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Controls & Direct Booking CTA */}
          <div style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            {/* Caption & Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 600 }}>
                <span style={{ color: 'var(--gold-light)', fontWeight: 800 }}>
                  📸 Photo {lightboxPhotoIndex + 1} of {(lightboxRoom.gallery || [lightboxRoom.image]).length}:
                </span>{' '}
                {(lightboxRoom.galleryLabels || [])[lightboxPhotoIndex] || `Authentic Angle ${lightboxPhotoIndex + 1}`}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                ✓ Attached Bath • Free Wi-Fi • 24/7 In-Room Dining
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              padding: '0.25rem 0'
            }}>
              {(lightboxRoom.gallery || [lightboxRoom.image]).map((img, idx) => {
                const isSelected = lightboxPhotoIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxPhotoIndex(idx)}
                    style={{
                      width: '64px',
                      height: '44px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: isSelected ? '2px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.25)',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.6,
                      background: '#000'
                    }}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>

            {/* Action Buttons Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '0.65rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                  ₹{lightboxRoom.tariff?.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ night (+ 5% GST = ₹{(lightboxRoom.tariff + Math.round(lightboxRoom.tariff * 0.05)).toLocaleString()})</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={`tel:${hotelInfo.phoneRaw}`}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem' }}
                >
                  <Phone size={15} />
                  <span>Call Reception</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const roomToBook = lightboxRoom;
                    handleCloseLightbox();
                    onSelectRoomForBooking(roomToBook);
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1.4rem',
                    fontWeight: 800
                  }}
                >
                  <Calendar size={16} />
                  <span>Proceed to Book This Room (Room {lightboxRoom.assignedRooms?.[0] || '101'})</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default RoomsSection;
