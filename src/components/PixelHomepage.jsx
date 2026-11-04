import React, { useState, useMemo } from 'react';
import './PixelHomepage.css';
import { useHotel } from '../context/HotelContext';
import { JonakImage } from './common/JonakImage';
import { 
  MapPin, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Utensils, 
  BedDouble, 
  ShoppingBag, 
  Calendar, 
  Home, 
  Percent, 
  Bell, 
  Wind, 
  Wifi, 
  Coffee, 
  ShieldCheck, 
  Sparkles,
  X,
  Crown
} from 'lucide-react';

export function PixelHomepage({
  onOpenCart,
  onOpenBookingModal,
  onOpenAdmin,
  onOpenTracker
}) {
  const { addToCart, menu, physicalRooms, rooms } = useHotel();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFullMenuModal, setShowFullMenuModal] = useState(false);
  const [showFullRoomsModal, setShowFullRoomsModal] = useState(false);

  // Live filtered search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedFood = (menu || []).filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.category && item.category.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedRooms = (rooms || []).filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.type.toLowerCase().includes(q)
    ).slice(0, 2);

    return { food: matchedFood, rooms: matchedRooms };
  }, [searchQuery, menu, rooms]);

  // Handle Order Dum Biryani
  const handleOrderDumBiryani = (e) => {
    e.stopPropagation();
    const item = (menu || []).find(m => m.name.toLowerCase().includes('dum biryani')) || {
      id: 'dish-dum-biryani',
      name: 'Jonak Special Dum Biryani',
      price: 350,
      image: '/images/ui/dum_biryani_card.jpg',
      category: 'Biryani & Rice'
    };
    addToCart(item);
    if (typeof onOpenCart === 'function') {
      onOpenCart();
    }
  };

  // Handle Order Chicken Biryani
  const handleOrderChickenBiryani = (e) => {
    e.stopPropagation();
    const item = (menu || []).find(m => m.name.toLowerCase() === 'chicken biryani') || {
      id: 'dish-chicken-biryani',
      name: 'Chicken Biryani',
      price: 300,
      image: '/images/ui/chicken_biryani_card.jpg',
      category: 'Biryani & Rice'
    };
    addToCart(item);
    if (typeof onOpenCart === 'function') {
      onOpenCart();
    }
  };

  // Handle Room Booking Click
  const handleBookRoom = (roomType = 'deluxe-ac') => {
    if (typeof onOpenBookingModal === 'function') {
      onOpenBookingModal({
        id: 'deluxe-ac',
        name: 'AC Rooms (Executive Deluxe)',
        type: 'Deluxe Room',
        price: 1499,
        tariff: 1499
      });
    }
  };

  // Smooth scroll to sections
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRoomTabClick = () => {
    scrollToSection('room-booking-section');
    setTimeout(() => {
      handleBookRoom('deluxe-ac');
    }, 350);
  };

  const handleNavRoomsClick = () => {
    setActiveNavTab('rooms');
    scrollToSection('room-booking-section');
    setTimeout(() => {
      handleBookRoom('deluxe-ac');
    }, 350);
  };

  return (
    <div className="pixel-home-wrapper">
      <div className="pixel-home-container">

        {/* ================================================================== */}
        {/* 1. TOP HEADER                                                      */}
        {/* ================================================================== */}
        <header className="pixel-header">
          {/* Top Row: Logo & Brand Tagline + Bell */}
          <div className="pixel-header-top">
            {/* Logo Left */}
            <div className="pixel-logo-group" onClick={() => setActiveNavTab('home')}>
              <div className="pixel-logo-mark">
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer glow ring */}
                  <circle cx="24" cy="24" r="22" fill="#FFFFFF" fillOpacity="0.12" stroke="#FFFFFF" strokeWidth="1.5" />
                  {/* Orange circular badge */}
                  <circle cx="24" cy="24" r="18" fill="#F26522" />
                  {/* Green Leaf above dot */}
                  <path d="M25 10C27 12 28 14 26 16C24 16 23 14 25 10Z" fill="#10B981" />
                  {/* White 'J' glyph */}
                  <path d="M26 17V26C26 28.5 24 30.5 21.5 30.5C19 30.5 17 28.5 17 26H20C20 26.8 20.7 27.5 21.5 27.5C22.3 27.5 23 26.8 23 26V17H26Z" fill="#FFFFFF" />
                  <circle cx="25" cy="14" r="1.5" fill="#FFFFFF" />
                </svg>
                <div className="pixel-logo-text-col">
                  <span className="pixel-logo-title">
                    <span className="pixel-logo-orange">ONAK</span>
                  </span>
                  <div className="pixel-logo-subbar">
                    <span className="pixel-subbar-line"></span>
                    <span className="pixel-subbar-text">HOTEL &amp; RESTAURANT</span>
                    <span className="pixel-subbar-line"></span>
                  </div>
                  <span className="pixel-logo-city">BARPETA</span>
                </div>
              </div>
            </div>

            {/* Tagline & Bell Right */}
            <div className="pixel-header-right">
              {/* Notification Bell */}
              <button 
                type="button" 
                className="pixel-bell-btn" 
                onClick={() => setShowNotificationModal(true)}
                aria-label="Notifications"
              >
                <Bell size={20} color="#FFFFFF" />
                <span className="pixel-bell-dot"></span>
              </button>

              {/* Exact Brand Tagline */}
              <div className="pixel-tagline-box">
                <p className="pixel-tagline-line">Good Food</p>
                <p className="pixel-tagline-line">Better Stays</p>
                <p className="pixel-tagline-line">A Warmer Barpeta</p>
                <div className="pixel-tagline-underline"></div>
              </div>
            </div>
          </div>

          {/* Location Row */}
          <div className="pixel-location-row" onClick={() => setShowLocationModal(true)}>
            <div className="pixel-location-pin">
              <MapPin size={17} color="#FFFFFF" fill="#FFFFFF" />
            </div>
            <span className="pixel-location-text">Barpeta</span>
            <ChevronDown size={15} color="#FFFFFF" className="pixel-chevron-down" />
          </div>

          {/* Search Bar */}
          <div className="pixel-search-wrapper">
            <div className="pixel-search-bar">
              <Search size={18} color="#222222" className="pixel-search-icon" />
              <input
                type="text"
                className="pixel-search-input"
                placeholder="Search food, rooms or offers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="pixel-search-clear" 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={16} color="#777777" />
                </button>
              )}
            </div>

            {/* Live Search Suggestions Dropdown */}
            {searchResults && (
              <div className="pixel-search-dropdown">
                {searchResults.food.length === 0 && searchResults.rooms.length === 0 ? (
                  <div className="pixel-search-empty">No results matching "{searchQuery}"</div>
                ) : (
                  <>
                    {searchResults.food.length > 0 && (
                      <div className="pixel-search-group">
                        <span className="pixel-search-group-title">Food Menu</span>
                        {searchResults.food.map((f) => (
                          <div 
                            key={f.id} 
                            className="pixel-search-item" 
                            onClick={() => {
                              addToCart(f);
                              if (onOpenCart) onOpenCart();
                              setSearchQuery('');
                            }}
                          >
                            <span>{f.name}</span>
                            <span className="pixel-search-price">₹{f.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.rooms.length > 0 && (
                      <div className="pixel-search-group">
                        <span className="pixel-search-group-title">Rooms</span>
                        {searchResults.rooms.map((r) => (
                          <div 
                            key={r.id} 
                            className="pixel-search-item" 
                            onClick={() => {
                              handleBookRoom(r.id);
                              setSearchQuery('');
                            }}
                          >
                            <span>{r.name}</span>
                            <span className="pixel-search-price">₹{r.price}/night</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Main Action Tabs */}
          <div className="pixel-action-tabs">
            {/* Left Button: Food Offers */}
            <button
              type="button"
              className="pixel-tab-btn pixel-tab-food"
              onClick={() => scrollToSection('food-offers-section')}
            >
              <div className="pixel-tab-icon-wrap">
                <Utensils size={18} color="#1C1C1C" strokeWidth={2.4} />
              </div>
              <span className="pixel-tab-label">Food Offers</span>
              <ChevronRight size={17} color="#1C1C1C" strokeWidth={2.5} className="pixel-tab-arrow" />
            </button>

            {/* Right Button: Room Booking */}
            <button
              type="button"
              className="pixel-tab-btn pixel-tab-rooms"
              onClick={handleRoomTabClick}
            >
              <div className="pixel-tab-icon-wrap">
                <BedDouble size={18} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <span className="pixel-tab-label">Room Booking</span>
              <ChevronRight size={17} color="#FFFFFF" strokeWidth={2.5} className="pixel-tab-arrow" />
            </button>
          </div>
        </header>

        {/* ================================================================== */}
        {/* 2. FREE DELIVERY OFFER BANNER                                      */}
        {/* ================================================================== */}
        <section className="pixel-delivery-banner" aria-label="Free Delivery Promotion">
          {/* Delivery Rider on Right */}
          <div className="pixel-banner-rider">
            <JonakImage 
              src="/images/jonak-food-delivery-hero.webp" 
              fallbackSrc="/images/ui/delivery_rider_hq.jpg"
              alt="Jonak Food Delivery Rider" 
              className="pixel-rider-img"
            />
          </div>

          {/* Content on Left */}
          <div className="pixel-banner-content">
            <div className="pixel-banner-headline-row">
              <h2 className="pixel-banner-title">FREE HOME DELIVERY</h2>
            </div>
            
            <div className="pixel-banner-subline-row">
              <span className="pixel-golden-dash"></span>
              <span className="pixel-banner-subline">WITHIN 5 KM</span>
              <span className="pixel-golden-dash"></span>
            </div>

            {/* 3 Benefit Items */}
            <div className="pixel-banner-benefits">
              {/* Scooter Icon */}
              <div className="pixel-benefit-scooter">
                <svg width="34" height="22" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Speed lines */}
                  <path d="M2 8H8" stroke="#004C4C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 12H6" stroke="#004C4C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 16H8" stroke="#004C4C" strokeWidth="2" strokeLinecap="round" />
                  {/* Wheels */}
                  <circle cx="14" cy="18" r="4" fill="#004C4C" />
                  <circle cx="30" cy="18" r="4" fill="#004C4C" />
                  <circle cx="14" cy="18" r="1.5" fill="#FFF1CD" />
                  <circle cx="30" cy="18" r="1.5" fill="#FFF1CD" />
                  {/* Scooter Body & Seat */}
                  <path d="M14 17L19 17L22 13L29 13L30 17" stroke="#004C4C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M27 13L25 7H29" stroke="#004C4C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="18" y="9" width="6" height="4" rx="1.5" fill="#004C4C" />
                </svg>
              </div>

              {/* Benefit 1 */}
              <div className="pixel-benefit-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#004C4C" stroke="#004C4C" strokeWidth="1">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="none" opacity="0"/>
                  <path d="M17.5 7C14.5 7 11 9 10 12C9 15 10 18 10 18C10 18 13 17 15 15C17 13 18 10 17.5 7Z" />
                </svg>
                <span>Freshly Prepared</span>
              </div>

              {/* Benefit 2 */}
              <div className="pixel-benefit-item">
                <ShieldCheck size={14} color="#004C4C" strokeWidth={2.4} />
                <span>Hygienic Food</span>
              </div>

              {/* Benefit 3 */}
              <div className="pixel-benefit-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004C4C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>At Your Doorstep</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* 3. POPULAR FOOD OFFERS SECTION                                     */}
        {/* ================================================================== */}
        <section id="food-offers-section" className="pixel-section">
          {/* Section Heading Row */}
          <div className="pixel-section-header">
            <div>
              <h3 className="pixel-section-title">Popular Food Offers</h3>
              <p className="pixel-section-subtitle">Authentic Flavours of Assam</p>
            </div>
            <button 
              type="button" 
              className="pixel-view-all-btn" 
              onClick={() => setShowFullMenuModal(true)}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Food Cards Grid (2 Cards) */}
          <div className="pixel-food-cards-grid">
            
            {/* Card 1: Jonak Special Dum Biryani */}
            <article className="pixel-food-card">
              <div className="pixel-card-image-wrap">
                <JonakImage 
                  src="/images/jonak-special-dum-biryani.webp" 
                  fallbackSrc="/images/jonak-special-dum-biryani.jpg"
                  alt="Jonak Special Dum Biryani" 
                  className="pixel-card-img"
                  aspectRatio="4/3"
                />
                {/* Floating Special Badge */}
                <div className="pixel-special-badge">
                  <Crown size={12} color="#D4AF37" fill="#D4AF37" />
                  <div className="pixel-special-badge-text">
                    <span>JONAK</span>
                    <span>SPECIAL</span>
                  </div>
                </div>
              </div>

              <div className="pixel-card-body">
                <h4 className="pixel-food-title">Jonak Special Dum Biryani</h4>
                <p className="pixel-food-desc">Rich • Aromatic • Unforgettable</p>

                <div className="pixel-card-action-row">
                  <span className="pixel-food-price">₹350</span>
                  <button 
                    type="button" 
                    className="pixel-order-btn" 
                    onClick={handleOrderDumBiryani}
                    aria-label="Order Jonak Special Dum Biryani"
                  >
                    <ShoppingBag size={14} color="#1C1C1C" strokeWidth={2.4} />
                    <span>Order Food</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Card 2: Chicken Biryani */}
            <article className="pixel-food-card">
              <div className="pixel-card-image-wrap">
                <JonakImage 
                  src="/images/chicken-biryani.webp" 
                  fallbackSrc="/images/chicken-biryani.jpg"
                  alt="Chicken Biryani" 
                  className="pixel-card-img"
                  aspectRatio="4/3"
                />
              </div>

              <div className="pixel-card-body">
                <h4 className="pixel-food-title">Chicken Biryani</h4>
                <p className="pixel-food-desc">Classic Taste, Always a Favourite</p>

                <div className="pixel-card-action-row">
                  <span className="pixel-food-price">₹300</span>
                  <button 
                    type="button" 
                    className="pixel-order-btn" 
                    onClick={handleOrderChickenBiryani}
                    aria-label="Order Chicken Biryani"
                  >
                    <ShoppingBag size={14} color="#1C1C1C" strokeWidth={2.4} />
                    <span>Order Food</span>
                  </button>
                </div>
              </div>
            </article>

          </div>
        </section>

        {/* ================================================================== */}
        {/* 4. ROOM BOOKING SECTION                                            */}
        {/* ================================================================== */}
        <section id="room-booking-section" className="pixel-section" style={{ marginBottom: '5.5rem' }}>
          {/* Section Heading Row */}
          <div className="pixel-section-header">
            <div>
              <h3 className="pixel-section-title">Comfortable Stays at Jonak</h3>
              <p className="pixel-section-subtitle">Clean Rooms. Warm Hospitality. A Better Barpeta.</p>
            </div>
            <button 
              type="button" 
              className="pixel-view-all-btn" 
              onClick={() => setShowFullRoomsModal(true)}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Large Horizontal Room Booking Card */}
          <article className="pixel-room-card">
            {/* Left: Luxury Bedroom Photo */}
            <div className="pixel-room-image-wrap">
              <JonakImage 
                src="/images/jonak-ac-room.webp" 
                fallbackSrc="/images/jonak-ac-room.jpg"
                alt="Jonak Luxury AC Hotel Bedroom" 
                className="pixel-room-img"
                aspectRatio="16/10"
              />
            </div>

            {/* Right: Booking Details Panel */}
            <div className="pixel-room-body">
              {/* Heading with Bed Icon */}
              <div className="pixel-room-heading-row">
                <div className="pixel-room-icon-badge">
                  <BedDouble size={16} color="#003838" strokeWidth={2.2} />
                </div>
                <h4 className="pixel-room-title">AC Rooms</h4>
              </div>

              {/* Price Line */}
              <div className="pixel-room-price-line">
                <span className="pixel-from-prefix">from</span>
                <span className="pixel-room-price">₹1,499</span>
                <span className="pixel-night-suffix">/ night</span>
              </div>

              {/* 3 Amenities */}
              <div className="pixel-room-amenities">
                <div className="pixel-amenity-chip">
                  <Wind size={13} color="#004C4C" strokeWidth={2.2} />
                  <span>AC</span>
                </div>
                <div className="pixel-amenity-chip">
                  <Wifi size={13} color="#004C4C" strokeWidth={2.2} />
                  <span>Free Wi-Fi</span>
                </div>
                <div className="pixel-amenity-chip">
                  <Coffee size={13} color="#004C4C" strokeWidth={2.2} />
                  <span>Room Service</span>
                </div>
              </div>

              {/* CTA Button */}
              <button 
                type="button" 
                className="pixel-book-room-btn" 
                onClick={() => handleBookRoom('deluxe-ac')}
                aria-label="Book a Room"
              >
                <Calendar size={15} color="#FFFFFF" />
                <span>Book a Room</span>
                <ChevronRight size={15} color="#FFFFFF" />
              </button>
            </div>
          </article>
        </section>

        {/* ================================================================== */}
        {/* 5. BOTTOM NAVIGATION                                               */}
        {/* ================================================================== */}
        <nav className="pixel-bottom-nav" aria-label="Main App Navigation">
          <div className="pixel-bottom-nav-inner">
            
            {/* 1. Home (Active) */}
            <button 
              type="button" 
              className={`pixel-nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                setActiveNavTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Home size={22} color={activeNavTab === 'home' ? '#F5C542' : '#CBD5E1'} strokeWidth={activeNavTab === 'home' ? 2.5 : 2} />
              <span className="pixel-nav-label">Home</span>
              {activeNavTab === 'home' && <span className="pixel-nav-active-bar"></span>}
            </button>

            {/* 2. Food */}
            <button 
              type="button" 
              className={`pixel-nav-item ${activeNavTab === 'food' ? 'active' : ''}`}
              onClick={() => {
                setActiveNavTab('food');
                scrollToSection('food-offers-section');
              }}
            >
              <Utensils size={20} color={activeNavTab === 'food' ? '#F5C542' : '#CBD5E1'} />
              <span className="pixel-nav-label">Food</span>
            </button>

            {/* 3. Rooms */}
            <button 
              type="button" 
              className={`pixel-nav-item ${activeNavTab === 'rooms' ? 'active' : ''}`}
              onClick={handleNavRoomsClick}
            >
              <BedDouble size={20} color={activeNavTab === 'rooms' ? '#F5C542' : '#CBD5E1'} />
              <span className="pixel-nav-label">Rooms</span>
            </button>

            {/* 4. Offers */}
            <button 
              type="button" 
              className={`pixel-nav-item ${activeNavTab === 'offers' ? 'active' : ''}`}
              onClick={() => {
                setActiveNavTab('offers');
                scrollToSection('food-offers-section');
              }}
            >
              <Percent size={20} color={activeNavTab === 'offers' ? '#F5C542' : '#CBD5E1'} />
              <span className="pixel-nav-label">Offers</span>
            </button>

            {/* 5. Brand area on Right */}
            <div className="pixel-nav-brand-area" onClick={onOpenAdmin}>
              <div className="pixel-brand-leaves">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="none" opacity="0"/>
                  <path d="M16 6C13 6 10 8 9 11C8 14 9 17 9 17C9 17 12 16 14 14C16 12 17 9 16 6Z" fill="#D4AF37" />
                  <path d="M7 11C8.5 8.5 11 8 11 8C11 8 10.5 10.5 9 12C7.5 13.5 6 14 6 14C6 14 5.5 12.5 7 11Z" fill="#10B981" />
                </svg>
              </div>
              <div className="pixel-brand-tag-col">
                <span className="pixel-brand-text-1">LOCAL TASTE</span>
                <span className="pixel-brand-text-2">LASTING MEMORIES</span>
              </div>
            </div>

          </div>
        </nav>

        {/* ================================================================== */}
        {/* MODALS: Location, Notifications, Full Menu, Full Rooms             */}
        {/* ================================================================== */}

        {/* Location Info Modal */}
        {showLocationModal && (
          <div className="pixel-modal-backdrop" onClick={() => setShowLocationModal(false)}>
            <div className="pixel-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pixel-modal-header">
                <h4>Hotel &amp; Delivery Location</h4>
                <button type="button" onClick={() => setShowLocationModal(false)}><X size={18} /></button>
              </div>
              <div className="pixel-modal-body">
                <p><strong>Jonak Hotel &amp; Restaurant</strong></p>
                <p>BH Road, near NRL Petrol Pump, Donakuchi, Barpeta, Assam 781314</p>
                <p className="pixel-highlight-tag">Free 5 KM Home Delivery covering all of Barpeta Town!</p>
                <button 
                  type="button" 
                  className="pixel-modal-btn" 
                  onClick={() => setShowLocationModal(false)}
                >
                  Confirm Barpeta Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="pixel-modal-backdrop" onClick={() => setShowNotificationModal(false)}>
            <div className="pixel-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pixel-modal-header">
                <h4>Hotel Updates &amp; Announcements</h4>
                <button type="button" onClick={() => setShowNotificationModal(false)}><X size={18} /></button>
              </div>
              <div className="pixel-modal-body">
                <div className="pixel-notif-item">
                  <Sparkles size={16} color="#D4AF37" />
                  <div>
                    <strong>Welcome to Jonak Hotel &amp; Restaurant!</strong>
                    <p>Enjoy our Authentic Dum Biryani &amp; Luxury AC Stays in Barpeta. Free home delivery within 5 KM.</p>
                  </div>
                </div>
                {onOpenTracker && (
                  <button 
                    type="button" 
                    className="pixel-modal-btn" 
                    style={{ marginTop: '1rem', background: '#003838', color: '#FFFFFF' }}
                    onClick={() => {
                      setShowNotificationModal(false);
                      onOpenTracker();
                    }}
                  >
                    Track Live Food Delivery
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Menu View All Modal */}
        {showFullMenuModal && (
          <div className="pixel-modal-backdrop" onClick={() => setShowFullMenuModal(false)}>
            <div className="pixel-modal-sheet pixel-full-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pixel-modal-header">
                <h4>All Popular Food Items ({menu ? menu.length : 82})</h4>
                <button type="button" onClick={() => setShowFullMenuModal(false)}><X size={18} /></button>
              </div>
              <div className="pixel-modal-scroll-body">
                <div className="pixel-menu-catalog-grid">
                  {(menu || []).slice(0, 16).map(dish => (
                    <div key={dish.id} className="pixel-catalog-card">
                      <JonakImage src={dish.image || '/images/food/biryani.jpg'} alt={dish.name} className="pixel-catalog-img" />
                      <div className="pixel-catalog-info">
                        <strong>{dish.name}</strong>
                        <span className="pixel-catalog-cat">{dish.category}</span>
                        <div className="pixel-catalog-bottom">
                          <span className="pixel-catalog-price">₹{dish.price}</span>
                          <button 
                            type="button" 
                            className="pixel-catalog-add"
                            onClick={() => {
                              addToCart(dish);
                              if (onOpenCart) onOpenCart();
                              setShowFullMenuModal(false);
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rooms View All Modal */}
        {showFullRoomsModal && (
          <div className="pixel-modal-backdrop" onClick={() => setShowFullRoomsModal(false)}>
            <div className="pixel-modal-sheet pixel-full-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pixel-modal-header">
                <h4>Available Rooms &amp; Suites (Rooms 101–304)</h4>
                <button type="button" onClick={() => setShowFullRoomsModal(false)}><X size={18} /></button>
              </div>
              <div className="pixel-modal-scroll-body">
                <div className="pixel-rooms-catalog-grid">
                  {[
                    { id: '101', name: 'Presidential Suite 101 (A/C)', price: 5000, img: '/images/jonak-presidential-suite.webp', fallback: '/images/rooms/room_101.jpg' },
                    { id: '102', name: 'Executive Suite 102 (A/C)', price: 5000, img: '/images/rooms/room_102.jpg', fallback: '/images/rooms/room_102.jpg' },
                    { id: '201', name: 'Deluxe AC Room 201', price: 2500, img: '/images/jonak-deluxe-ac-room.webp', fallback: '/images/rooms/room_201.jpg' },
                    { id: '202', name: 'Single AC Room 202', price: 2000, img: '/images/jonak-single-room.webp', fallback: '/images/rooms/room_202.jpg' },
                    { id: '203', name: 'Deluxe AC Room 203', price: 2500, img: '/images/rooms/room_203.jpg', fallback: '/images/rooms/room_203.jpg' },
                    { id: '204', name: 'Twin AC Room 204', price: 3500, img: '/images/jonak-twin-room.webp', fallback: '/images/rooms/room_204.jpg' },
                    { id: '301', name: 'Deluxe AC Room 301', price: 2500, img: '/images/rooms/room_301.jpg', fallback: '/images/rooms/room_301.jpg' },
                    { id: '302', name: 'Single Non-AC Room 302', price: 1400, img: '/images/rooms/room_302.jpg', fallback: '/images/rooms/room_302.jpg' },
                    { id: '303', name: 'Twin Non-AC Room 303', price: 3500, img: '/images/rooms/room_303.jpg', fallback: '/images/rooms/room_303.jpg' },
                    { id: '304', name: 'Single Non-AC Room 304', price: 1400, img: '/images/rooms/room_304.jpg', fallback: '/images/rooms/room_304.jpg' }
                  ].map(r => (
                    <div key={r.id} className="pixel-room-catalog-card">
                      <JonakImage src={r.img} fallbackSrc={r.fallback} alt={r.name} className="pixel-room-cat-img" />
                      <div className="pixel-room-cat-info">
                        <strong>{r.name}</strong>
                        <span className="pixel-room-cat-price">₹{r.price} / night</span>
                        <button 
                          type="button" 
                          className="pixel-book-room-btn" 
                          style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem' }}
                          onClick={() => {
                            setShowFullRoomsModal(false);
                            handleBookRoom(r.id);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PixelHomepage;

