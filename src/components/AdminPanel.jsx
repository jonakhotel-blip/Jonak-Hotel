import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useHotel, playNotificationChime } from '../context/HotelContext';
import { 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  UtensilsCrossed, 
  BedDouble, 
  Settings as SettingsIcon, 
  ShoppingBag, 
  Phone, 
  MessageCircle, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  Bike, 
  Flame, 
  Sparkles, 
  RotateCcw, 
  ArrowLeft,
  Calendar,
  Eye,
  LogOut,
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Wifi,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const AdminPanel = ({ onExitAdmin }) => {
  const { 
    hotelInfo, 
    settings, 
    updateSettings, 
    menu, 
    toggleDishStock, 
    updateDishPrice, 
    toggleDishBestSeller, 
    addDish, 
    deleteDish, 
    rooms, 
    updateRoom, 
    physicalRooms,
    togglePhysicalRoom,
    orders, 
    updateOrderStatus, 
    bookings, 
    updateRoomBookingStatus, 
    eventEnquiries,
    resetToDefaults,
    showToast,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isCloudSynced
  } = useHotel();

  // Authentication state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab: 'DASHBOARD' | 'ORDERS' | 'MENU' | 'ROOMS' | 'SETTINGS' | 'QR_CODES'
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Menu Search & Filter
  const [dishSearch, setDishSearch] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('ALL');
  const [showAddDishModal, setShowAddDishModal] = useState(false);

  // New Dish Form
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Biryani');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(false);
  const [newDishDesc, setNewDishDesc] = useState('');

  // Orders status filter
  const [orderFilter, setOrderFilter] = useState('ALL');

  // QR Code Generator States
  const [qrTargetType, setQrTargetType] = useState('ROOM'); // 'ROOM' | 'TABLE'
  const [qrTargetValue, setQrTargetValue] = useState('101');
  const [qrCustomDomain, setQrCustomDomain] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://jonakhotelgroup.in';
  });
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState('');
  const [viewKycBooking, setViewKycBooking] = useState(null);

  // Re-generate QR whenever parameters change
  useEffect(() => {
    const cleanBase = qrCustomDomain.replace(/\/+$/, '');
    const paramKey = qrTargetType === 'ROOM' ? 'room' : 'table';
    const targetUrl = `${cleanBase}/?${paramKey}=${encodeURIComponent(qrTargetValue)}`;

    QRCode.toDataURL(targetUrl, {
      width: 380,
      margin: 2,
      color: {
        dark: '#070B14',
        light: '#FFFFFF'
      }
    }).then(url => {
      setGeneratedQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR:', err);
    });
  }, [qrTargetType, qrTargetValue, qrCustomDomain]);

  // Handle Secure PIN Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Please enter your 4-digit Owner PIN or Password.');
      return;
    }
    setIsLoggingIn(true);
    setPinError('');
    const res = await adminLogin(pinInput.trim());
    setIsLoggingIn(false);
    if (!res.success) {
      setPinError(res.error || 'Incorrect PIN or Password.');
    }
  };

  // Quick dish add submit
  const handleAddNewDish = (e) => {
    e.preventDefault();
    if (!newDishName.trim() || !newDishPrice) {
      showToast('Dish name and price are required.', 'danger');
      return;
    }
    addDish({
      name: newDishName.trim(),
      category: newDishCategory,
      price: parseFloat(newDishPrice),
      isVeg: newDishIsVeg,
      description: newDishDesc.trim() || 'Prepared fresh with authentic spices.'
    });
    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setShowAddDishModal(false);
  };

  // Categories for Menu Manager
  const menuCategories = ['ALL', 'Biryani', 'Chicken Specialties', 'Starters', 'Rolls', 'Momos', 'Fried Rice & Noodles', 'Paneer & Veg', 'Fish & Seafood', 'Tandoori & Kebabs', 'Sizzlers', 'Breads', 'Desserts & Beverages'];

  // Filtered Menu
  const filteredDishes = menu.filter((item) => {
    if (dishCategoryFilter !== 'ALL' && item.category !== dishCategoryFilter) return false;
    if (dishSearch.trim()) {
      const q = dishSearch.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === 'ALL') return true;
    return order.status === orderFilter;
  });

  // Counts for Top Summary Cards
  const inStockCount = menu.filter(m => m.inStock).length;
  const outOfStockCount = menu.length - inStockCount;
  const pendingOrdersCount = orders.filter(o => o.status === 'New' || o.status === 'Confirmed').length;
  const pendingBookingsCount = bookings.filter(b => b.status === 'New').length;

  // --------------------------------------------------------------------------
  // 1. PIN LOGIN SCREEN
  // --------------------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div className="glass-card" style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--gold-primary)',
          position: 'relative'
        }}>
          {/* Back to Site Button */}
          <button
            onClick={onExitAdmin}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Customer Site</span>
          </button>

          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '2px solid var(--gold-primary)',
            color: 'var(--gold-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Lock size={28} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.4rem' }}>
            Owner Command Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.8rem' }}>
            Jonak Hotel & Restaurant • Barpeta<br />
            Enter your secret Owner PIN or Password
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                autoFocus
                placeholder="Enter 4-Digit PIN or Password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '0.2em',
                  fontWeight: 800
                }}
              />
            </div>

            {pinError && (
              <div style={{
                color: '#EF4444',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '0.5rem',
                borderRadius: '6px'
              }}>
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}
            >
              <Unlock size={16} />
              <span>{isLoggingIn ? 'Verifying PIN...' : 'Unlock Admin Panel'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATED OWNER COMMAND CENTER
  // --------------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#070B14', paddingBottom: '5rem' }}>
      
      {/* Top Admin Navigation Header */}
      <header style={{
        background: '#0B1120',
        borderBottom: '1px solid var(--border-gold)',
        padding: '0.85rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 850
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Logo & Portal Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/jonak.png" alt="Jonak Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                Owner Command Center
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Jonak Hotel & Restaurant • Smartphone & Desktop Hub
              </div>
            </div>
          </div>

          {/* Quick Sound Alert Test, Cloud Sync & Logout Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Live Cloud Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              color: isCloudSynced ? '#34D399' : '#FBBF24',
              background: isCloudSynced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isCloudSynced ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isCloudSynced ? '#10B981' : '#F59E0B',
                boxShadow: isCloudSynced ? '0 0 8px #10B981' : 'none'
              }} />
              <span className="hide-on-mobile">{isCloudSynced ? 'Cloud Synced' : 'Syncing...'}</span>
            </div>

            <button
              onClick={() => {
                playNotificationChime();
                showToast('🔔 Chime test sound played successfully!', 'success');
              }}
              className="btn btn-secondary btn-sm"
              title="Test New Order Sound Alert"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Bell size={14} color="var(--gold-primary)" />
              <span className="hide-on-mobile">Test Sound</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="btn btn-gold-outline btn-sm"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Eye size={14} />
              <span className="hide-on-mobile">View Website</span>
            </button>

            <button
              onClick={() => adminLogout()}
              className="btn btn-secondary btn-sm"
              title="Lock Admin"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <LogOut size={14} color="#EF4444" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="container" style={{ marginTop: '0.75rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`btn btn-sm ${activeTab === 'DASHBOARD' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <LayoutDashboard size={14} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`btn btn-sm ${activeTab === 'ORDERS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', position: 'relative' }}
            >
              <ShoppingBag size={14} />
              <span>Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  marginLeft: '4px'
                }}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('MENU')}
              className={`btn btn-sm ${activeTab === 'MENU' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <UtensilsCrossed size={14} />
              <span>1-Tap Menu Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('ROOMS')}
              className={`btn btn-sm ${activeTab === 'ROOMS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <BedDouble size={14} />
              <span>Rooms & Tariffs</span>
            </button>

            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`btn btn-sm ${activeTab === 'SETTINGS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <SettingsIcon size={14} />
              <span>Delivery & Hotel Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('QR_CODES')}
              className={`btn btn-sm ${activeTab === 'QR_CODES' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)', borderColor: 'var(--gold-primary)' }}
            >
              <QrCode size={14} color="var(--gold-primary)" />
              <span style={{ color: activeTab === 'QR_CODES' ? '#070B14' : 'var(--gold-light)' }}>
                Room & Table QR Codes
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Tab Body */}
      <main className="container" style={{ marginTop: '2rem' }}>
        
        {/* ==================================================================
            TAB 1: OVERVIEW DASHBOARD
            ================================================================== */}
        {activeTab === 'DASHBOARD' && (
          <div>
            {/* Top Stat Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {/* Card 1: Today's Food Orders */}
              <div 
                className="glass-card" 
                onClick={() => setActiveTab('ORDERS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--gold-primary)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Food Orders
                  </span>
                  <ShoppingBag size={20} color="var(--gold-primary)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {orders.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  {pendingOrdersCount} Active / In Preparation
                </div>
              </div>

              {/* Card 2: Room Bookings */}
              <div 
                className="glass-card" 
                onClick={() => setActiveTab('ROOMS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #3B82F6' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Room Enquiries
                  </span>
                  <BedDouble size={20} color="#3B82F6" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {bookings.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-warm)', fontWeight: 600 }}>
                  {pendingBookingsCount} New reservation requests
                </div>
              </div>

              {/* Card 3: Active Menu Dishes */}
              <div 
                className="glass-card" 
                onClick={() => setActiveTab('MENU')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #10B981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Menu Items
                  </span>
                  <UtensilsCrossed size={20} color="#10B981" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {inStockCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {menu.length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: outOfStockCount > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {outOfStockCount > 0 ? `${outOfStockCount} Out of Stock Today` : 'All items in stock'}
                </div>
              </div>

              {/* Card 4: Kitchen Status */}
              <div 
                className="glass-card"
                onClick={() => setActiveTab('SETTINGS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${settings.kitchenOpen ? '#10B981' : '#EF4444'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Kitchen Status
                  </span>
                  <Bike size={20} color={settings.kitchenOpen ? '#10B981' : '#EF4444'} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: settings.kitchenOpen ? '#10B981' : '#EF4444', marginTop: '0.5rem' }}>
                  {settings.kitchenOpen ? 'OPEN (Delivering)' : 'CLOSED (Offline)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Free Radius: {settings.freeDeliveryRadiusKm} KM
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Actions for Busy Owner */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--gold-light)' }}>
                ⚡ Quick Owner Shortcuts (1-Tap Controls)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* 1. Toggle Kitchen */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Kitchen Status</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepting food delivery</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ kitchenOpen: !settings.kitchenOpen })}
                    className={settings.kitchenOpen ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                    style={{ background: settings.kitchenOpen ? '#10B981' : '#EF4444', color: '#FFF' }}
                  >
                    {settings.kitchenOpen ? 'Open' : 'Closed'}
                  </button>
                </div>

                {/* 2. Announcement Banner Toggle */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Announcement Bar</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special offer marquee</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ announcementActive: !settings.announcementActive })}
                    className="btn btn-sm"
                    style={{ background: settings.announcementActive ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)', color: settings.announcementActive ? '#070B14' : '#FFF' }}
                  >
                    {settings.announcementActive ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* 3. Add New Dish Quick Button */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add New Dish</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Put item on menu in 10s</div>
                  </div>
                  <button
                    onClick={() => { setActiveTab('MENU'); setShowAddDishModal(true); }}
                    className="btn btn-gold-outline btn-sm"
                  >
                    <Plus size={14} />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview on Dashboard */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Recent Orders & Enquiries
                </h3>
                <button onClick={() => setActiveTab('ORDERS')} className="btn btn-secondary btn-sm">
                  View All Orders
                </button>
              </div>

              {orders.slice(0, 3).map((order) => (
                <div 
                  key={order.id}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>#{order.id}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{order.customerName}</span>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{order.mode}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {order.items.map(i => `${i.name} (${i.qty})`).join(', ')} • <strong>₹{order.total}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={`tel:${order.phone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hello ${order.customerName}, regarding your Jonak Hotel order #${order.id}...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================================================================
            TAB 2: ORDERS & BOOKINGS LOG
            ================================================================== */}
        {activeTab === 'ORDERS' && (
          <div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Live Orders & Room Bookings
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Manage incoming food deliveries, in-room dining orders, and hotel room bookings
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['ALL', 'New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`btn btn-sm ${orderFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <ShoppingBag size={40} color="var(--gold-primary)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                <h4>No orders found with status "{orderFilter}"</h4>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      borderLeft: order.status === 'New' ? '4px solid #EF4444' : order.status === 'Delivered' ? '4px solid #10B981' : '4px solid var(--gold-primary)'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                          #{order.id}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {order.customerName}
                        </span>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                          {order.mode}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.time}
                        </span>
                      </div>

                      {/* Status Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="form-select"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--gold-primary)',
                            color: '#FFFFFF'
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr',
                      gap: '1rem',
                      alignItems: 'start'
                    }} className="order-details-grid">
                      <div>
                        {/* Address or Room */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          <strong>Location / Address:</strong> {order.address} {order.distanceKm > 0 && `(~${order.distanceKm} KM)`}
                        </div>

                        {/* Items list */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem'
                        }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                              <span>• {it.name} x {it.qty}</span>
                              <span style={{ fontWeight: 600 }}>₹{it.price * it.qty}</span>
                            </div>
                          ))}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '0.4rem',
                            marginTop: '0.4rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700,
                            color: 'var(--gold-light)'
                          }}>
                            <span>Total (incl. Delivery: ₹{order.deliveryFee || 0}):</span>
                            <span>₹{order.total} ({order.payment})</span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons for Owner */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <a
                          href={`tel:${order.phone}`}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <Phone size={14} color="#10B981" />
                          <span>Call: {order.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hello ${order.customerName}! Your order #${order.id} from Jonak Hotel & Restaurant is ${order.status.toLowerCase()}. Thank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <MessageCircle size={14} />
                          <span>Reply on WhatsApp</span>
                        </a>

                        {order.coordinates && (
                          <a
                            href={`https://maps.google.com/?q=${order.coordinates.lat},${order.coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
                          >
                            <span>📍 View Customer GPS Map</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Room Bookings Log Subsection */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
                Recent Hotel Room Reservations ({bookings.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map((bkg) => (
                  <div
                    key={bkg.id}
                    className="glass-card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>#{bkg.id}</span>
                        <span style={{ fontWeight: 700 }}>{bkg.guestName}</span>
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{bkg.roomType}</span>
                        {bkg.roomNumber && (
                          <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                            Room {bkg.roomNumber}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10B981',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          <ShieldCheck size={12} />
                          e-KYC: {bkg.idType || 'Aadhaar'} ({bkg.maskedId || (bkg.idNumber ? `XXXX-XXXX-${bkg.idNumber.slice(-4)}` : 'Verified')})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Check-in: <strong>{bkg.checkIn}</strong> • Check-out: <strong>{bkg.checkOut}</strong> • {bkg.guests} • Estimated: <strong>₹{bkg.totalTariff}</strong>
                        {bkg.guestCity && <span> • Origin: <strong>{bkg.guestCity}</strong></span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setViewKycBooking(bkg)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          background: 'rgba(212, 175, 55, 0.12)',
                          borderColor: 'var(--gold-primary)',
                          color: 'var(--gold-light)',
                          padding: '0.3rem 0.65rem'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>e-KYC Proof</span>
                      </button>

                      <select
                        value={bkg.status}
                        onChange={(e) => updateRoomBookingStatus(bkg.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <option value="New">New</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <a href={`tel:${bkg.phone}`} className="btn btn-secondary btn-sm">
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================== */}
            {/* e-KYC AADHAAR CARD PROOF INSPECTION MODAL */}
            {/* ============================================================== */}
            {viewKycBooking && (
              <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div className="modal-content" style={{ maxWidth: '520px', background: '#0B1120', border: '1.5px solid var(--gold-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={22} color="var(--gold-primary)" />
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>
                        Guest e-KYC Identity Verification
                      </h3>
                    </div>
                    <button 
                      onClick={() => setViewKycBooking(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Guest Name:</span>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{viewKycBooking.guestName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Contact Phone:</span>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>+91 {viewKycBooking.phone}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Allocated Room:</span>
                        <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                          Room {viewKycBooking.roomNumber || '101'} ({viewKycBooking.roomType})
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Guest Origin/City:</span>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{viewKycBooking.guestCity || 'Barpeta, Assam'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID Type:</span>
                        <div style={{ fontWeight: 700, color: '#38BDF8' }}>{viewKycBooking.idType || 'Aadhaar Card'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID / Aadhaar Number:</span>
                        <div style={{ fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                          {viewKycBooking.idNumber || viewKycBooking.maskedId || '5412 8763 9021'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photos Preview */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                      Attached Government ID Photos (Form C Record)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', marginBottom: '0.35rem' }}>Front Photo</div>
                        {viewKycBooking.aadhaarFront ? (
                          <img 
                            src={viewKycBooking.aadhaarFront} 
                            alt="Front ID" 
                            style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <FileText size={28} style={{ opacity: 0.5, marginBottom: '0.3rem' }} />
                            Physical ID shown at check-in
                          </div>
                        )}
                      </div>

                      <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', marginBottom: '0.35rem' }}>Back Photo</div>
                        {viewKycBooking.aadhaarBack ? (
                          <img 
                            src={viewKycBooking.aadhaarBack} 
                            alt="Back ID" 
                            style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px' }}
                          />
                        ) : (
                          <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <FileText size={28} style={{ opacity: 0.5, marginBottom: '0.3rem' }} />
                            Address verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => window.print()}
                      className="btn btn-secondary" 
                      style={{ flex: 1, fontSize: '0.85rem' }}
                    >
                      <Printer size={15} />
                      <span>Print Form C Slip</span>
                    </button>
                    <button 
                      onClick={() => setViewKycBooking(null)}
                      className="btn btn-primary" 
                      style={{ flex: 1, fontSize: '0.85rem' }}
                    >
                      <span>Close Verification</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================
            TAB 3: ONE-TAP MENU & PRICE MANAGER (SWIGGY/ZOMATO PARTNER STYLE)
            ================================================================== */}
        {activeTab === 'MENU' && (
          <div>
            {/* Action Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  1-Tap Menu & Price Manager
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Tap the switch to immediately take any dish In/Out of Stock or edit prices live on the website
                </p>
              </div>

              <button
                onClick={() => setShowAddDishModal(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add New Dish (10 Seconds)</span>
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="glass-card" style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <div style={{ flex: '1 1 240px' }}>
                <input
                  type="text"
                  placeholder="Quick search dish by name..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={dishCategoryFilter}
                onChange={(e) => setDishCategoryFilter(e.target.value)}
                className="form-select"
                style={{ flex: '0 1 200px', fontSize: '0.85rem' }}
              >
                {menuCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Dish Rows Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredDishes.map((dish) => (
                <div 
                  key={dish.id}
                  className="glass-card"
                  style={{
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderLeft: dish.inStock ? '4px solid #10B981' : '4px solid #EF4444'
                  }}
                >
                  {/* Left: Dish Info */}
                  <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={`food-type-icon ${dish.isVeg ? 'veg' : 'non-veg'}`}>
                      <div className="dot" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {dish.category} • {dish.isVeg ? 'Veg' : 'Non-Veg'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Best Seller & Price Editor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* 1-Tap Best Seller Toggle */}
                    <button
                      onClick={() => toggleDishBestSeller(dish.id)}
                      style={{
                        background: dish.bestSeller ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: dish.bestSeller ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                        color: dish.bestSeller ? '#FBBF24' : 'var(--text-muted)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontWeight: 600
                      }}
                      title="Toggle Best Seller Badge"
                    >
                      <Flame size={13} />
                      <span>{dish.bestSeller ? 'Special' : 'Normal'}</span>
                    </button>

                    {/* Inline Instant Price Editor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold-warm)', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        value={dish.price}
                        onChange={(e) => updateDishPrice(dish.id, e.target.value)}
                        style={{
                          width: '75px',
                          padding: '0.35rem 0.45rem',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: 1-Tap In Stock / Out of Stock Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => toggleDishStock(dish.id)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: 'var(--radius-full)',
                        background: dish.inStock ? '#10B981' : '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        minWidth: '110px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {dish.inStock ? <Check size={13} /> : <X size={13} />}
                      <span>{dish.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${dish.name} from menu?`)) {
                          deleteDish(dish.id);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.4rem'
                      }}
                      title="Remove Dish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Dish Modal */}
            {showAddDishModal && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '500px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add New Dish to Menu</h3>
                    <button onClick={() => setShowAddDishModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAddNewDish}>
                    <div className="form-group">
                      <label className="form-label">Dish Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Assamese Duck Roast with Gourd"
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Category *</label>
                        <select
                          value={newDishCategory}
                          onChange={(e) => setNewDishCategory(e.target.value)}
                          className="form-select"
                        >
                          {menuCategories.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 350"
                          value={newDishPrice}
                          onChange={(e) => setNewDishPrice(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dietary Preference</label>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isVeg"
                            checked={newDishIsVeg}
                            onChange={() => setNewDishIsVeg(true)}
                          />
                          <span>Veg</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isVeg"
                            checked={!newDishIsVeg}
                            onChange={() => setNewDishIsVeg(false)}
                          />
                          <span>Non-Veg</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Description</label>
                      <textarea
                        rows="2"
                        placeholder="Brief description of flavors & preparation..."
                        value={newDishDesc}
                        onChange={(e) => setNewDishDesc(e.target.value)}
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button type="button" onClick={() => setShowAddDishModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Save to Menu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================
            TAB 4: ROOM TARIFF & AVAILABILITY CONTROLLER
            ================================================================== */}
        {/* ==================================================================
            TAB 4: OFFICIAL ROOM INVENTORY & TARIFF CONTROLLER (9 ROOMS)
            ================================================================== */}
        {activeTab === 'ROOMS' && (
          <div>
            {/* Header & Stats Banner */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BedDouble size={24} color="var(--gold-primary)" />
                    <span>Floor-wise Room Grid & Live Occupancy</span>
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Official 9 rooms across 3 floors. Tap any room number to switch between Available (Green) and Occupied/Booked (Red).
                  </p>
                </div>

                {/* 1-Tap Quick Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (window.confirm('Mark ALL 9 rooms as Available (Vacant)?')) {
                        (physicalRooms || []).forEach(r => {
                          if (!r.isAvailable) togglePhysicalRoom(r.roomNumber, true);
                        });
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span>✓ Mark All Available</span>
                  </button>
                </div>
              </div>

              {/* Occupancy Stats Bar */}
              {(() => {
                const totalRooms = (physicalRooms || []).length || 9;
                const vacantRooms = (physicalRooms || []).filter(r => r.isAvailable).length;
                const occupiedRooms = totalRooms - vacantRooms;
                const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1.25rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Physical Rooms</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>{totalRooms} Rooms (Floors 1-3)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase' }}>Vacant / Available Today</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>{vacantRooms} Rooms Free</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'uppercase' }}>Occupied / Booked</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444' }}>{occupiedRooms} Rooms Occupied</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-warm)', textTransform: 'uppercase' }}>Hotel Occupancy Rate</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-light)' }}>{occupancyRate}% Full</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Visual Floor-wise Room Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
              {[
                { floorNum: 1, title: '1st Floor (VIP & Presidential Suite)', filter: (r) => r.floorNumber === 1 || r.roomNumber.startsWith('1') },
                { floorNum: 2, title: '2nd Floor (Deluxe AC, Single AC & Twin AC)', filter: (r) => r.floorNumber === 2 || r.roomNumber.startsWith('2') },
                { floorNum: 3, title: '3rd Floor (Deluxe AC, Twin Non-AC & Single Non-AC)', filter: (r) => r.floorNumber === 3 || r.roomNumber.startsWith('3') }
              ].map((floorGroup) => {
                const floorRooms = (physicalRooms || []).filter(floorGroup.filter);
                return (
                  <div key={floorGroup.floorNum} style={{
                    background: 'rgba(11, 17, 32, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    {/* Floor Title */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.65rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                        {floorGroup.title}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {floorRooms.filter(r => r.isAvailable).length} of {floorRooms.length} Available
                      </span>
                    </div>

                    {/* Floor Room Cards Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                      gap: '1rem'
                    }}>
                      {floorRooms.map((rm) => {
                        const gstRate = 0.05;
                        const basePrice = rm.basePrice || 1400;
                        const gstAmount = Math.round(basePrice * gstRate);
                        const totalWithGst = basePrice + gstAmount;

                        return (
                          <div
                            key={rm.roomNumber}
                            style={{
                              background: rm.isAvailable 
                                ? 'rgba(16, 185, 129, 0.08)' 
                                : 'rgba(239, 68, 68, 0.1)',
                              border: `1.5px solid ${rm.isAvailable ? '#10B981' : '#EF4444'}`,
                              borderRadius: '10px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: rm.isAvailable 
                                ? '0 4px 14px rgba(16, 185, 129, 0.15)' 
                                : '0 4px 14px rgba(239, 68, 68, 0.15)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div>
                              {/* Room Number & Status Badge */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{
                                  fontSize: '1.6rem',
                                  fontWeight: 900,
                                  fontFamily: 'var(--font-serif)',
                                  color: '#FFFFFF',
                                  letterSpacing: '0.05em'
                                }}>
                                  Room {rm.roomNumber}
                                </div>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: rm.isAvailable ? '#10B981' : '#EF4444',
                                  color: '#FFFFFF',
                                  textTransform: 'uppercase'
                                }}>
                                  {rm.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                                </span>
                              </div>

                              {/* Category Name */}
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                {rm.categoryName}
                              </div>

                              {/* AC / Non-AC tag & Highlights */}
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  background: rm.ac ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 146, 60, 0.2)',
                                  color: rm.ac ? '#38BDF8' : '#FB923C',
                                  fontWeight: 700
                                }}>
                                  {rm.ac ? 'A/C' : 'Non-A/C'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {rm.highlights?.split(',')[0] || ''}
                                </span>
                              </div>

                              {/* Price + 5% GST breakdown */}
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.9rem',
                                padding: '0.4rem 0.55rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '6px'
                              }}>
                                <div>
                                  Tariff: <strong>₹{basePrice.toLocaleString()}</strong> / night
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                                  + 5% GST (₹{gstAmount}) = <strong>₹{totalWithGst.toLocaleString()}</strong> net
                                </div>
                              </div>
                            </div>

                            {/* 1-Tap Toggle Button */}
                            <div>
                              <button
                                onClick={() => {
                                  togglePhysicalRoom(rm.roomNumber, !rm.isAvailable);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.5rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: rm.isAvailable ? '#EF4444' : '#10B981',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  transition: 'background 0.2s ease'
                                }}
                              >
                                {rm.isAvailable ? (
                                  <>
                                    <X size={14} />
                                    <span>Tap: Mark Occupied / Check-In</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} />
                                    <span>Tap: Check-Out / Mark Free</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room Categories & Base Tariffs Manager */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-light)', marginBottom: '0.35rem' }}>
                Official Room Category Rates & Base Tariffs
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Adjust nightly base tariffs for the 6 official categories. Availability status updates automatically based on the physical room occupancy above.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {rooms.map((room) => {
                  const catPhys = (physicalRooms || []).filter(pr => pr.categoryId === room.id);
                  const freeInCat = catPhys.filter(pr => pr.isAvailable);
                  const freeCount = freeInCat.length;

                  return (
                    <div 
                      key={room.id}
                      className="glass-card room-admin-card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
                        <img 
                          src={room.image} 
                          alt={room.title}
                          style={{ width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                              {room.title}
                            </h4>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: room.ac ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)',
                              color: room.ac ? '#38BDF8' : '#FB923C'
                            }}>
                              {room.ac ? 'A/C' : 'Non-A/C'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {room.floor} • Capacity: {room.capacity} • {room.bed}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold-warm)', marginTop: '0.2rem' }}>
                            Physical Rooms: <strong>{room.assignedRooms?.join(', ')}</strong> ({freeCount} of {catPhys.length} free right now)
                          </div>
                        </div>
                      </div>

                      {/* Availability & Tariff Controls */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        {/* Auto-computed vs Manual Category Status */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Customer Website Status:
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {['Available', 'Filling Fast', 'Sold Out'].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateRoom(room.id, { status: st })}
                                className="btn btn-sm"
                                style={{
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.75rem',
                                  background: room.status === st 
                                    ? st === 'Available' ? '#10B981' : st === 'Filling Fast' ? '#F59E0B' : '#EF4444'
                                    : 'rgba(255,255,255,0.06)',
                                  color: room.status === st ? '#FFFFFF' : 'var(--text-secondary)',
                                  fontWeight: room.status === st ? 800 : 500
                                }}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Nightly Base Tariff Editor */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Base Tariff (Excl. 5% GST):
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--gold-warm)' }}>₹</span>
                            <input
                              type="number"
                              value={room.tariff}
                              onChange={(e) => updateRoom(room.id, { tariff: parseFloat(e.target.value) || 0 })}
                              style={{
                                width: '100px',
                                padding: '0.35rem 0.55rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-gold)',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                textAlign: 'center'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#10B981' }}>
                              (+5% GST = ₹{Math.round(room.tariff * 1.05).toLocaleString()})
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================
            TAB 5: HOTEL SETTINGS & DELIVERY RULES
            ================================================================== */}
        {activeTab === 'SETTINGS' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                Delivery Rules & Hotel Configuration
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Configure 5 KM free delivery radius, per-KM rates, kitchen operating hours, and top marquee banner
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              
              {/* 1. Free Delivery Radius & Extra Charge */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '1rem' }}>
                🚚 Delivery Radius & Fee Engine
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Free Delivery Radius (KM)</label>
                  <input
                    type="number"
                    value={settings.freeDeliveryRadiusKm}
                    onChange={(e) => updateSettings({ freeDeliveryRadiusKm: parseFloat(e.target.value) || 5 })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: 5 KM (₹0 delivery charge)</small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Extra Charge / KM above Free Radius (₹)</label>
                  <input
                    type="number"
                    value={settings.extraFeePerKm}
                    onChange={(e) => updateSettings({ extraFeePerKm: parseFloat(e.target.value) || 15 })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: ₹15 per extra KM</small>
                </div>
              </div>

              {/* 2. Kitchen Status Switch */}
              <div style={{
                background: 'var(--bg-surface)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                    Kitchen Orders Acceptance
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Turn off if restaurant is closed for the night or chef is unavailable
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateSettings({ kitchenOpen: !settings.kitchenOpen })}
                  className="btn btn-sm"
                  style={{
                    background: settings.kitchenOpen ? '#10B981' : '#EF4444',
                    color: '#FFF',
                    fontWeight: 800,
                    minWidth: '100px'
                  }}
                >
                  {settings.kitchenOpen ? 'KITCHEN OPEN' : 'CLOSED'}
                </button>
              </div>

              {/* 3. Room Booking Tax & Direct Discount Policy */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem' }}>
                🏨 Room Booking GST & Direct Discount Policy
              </h4>

              <div style={{
                background: 'var(--bg-surface)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Apply 5% GST on Rooms</label>
                    <input
                      type="checkbox"
                      checked={settings.applyGst !== false}
                      onChange={(e) => updateSettings({ applyGst: e.target.checked })}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Adds statutory 5% GST to booking modal and invoice
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Direct Booking 5% Discount</label>
                    <input
                      type="checkbox"
                      checked={!!settings.directDiscountActive}
                      onChange={(e) => updateSettings({ directDiscountActive: e.target.checked })}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Toggles 5% instant discount banner for direct bookings
                  </div>
                </div>
              </div>

              {/* 4. Special Offer Banner Marquee */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem' }}>
                📢 Top Announcement Banner
              </h4>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Announcement Text</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.announcementActive}
                      onChange={(e) => updateSettings({ announcementActive: e.target.checked })}
                    />
                    <span>Show on Website</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => updateSettings({ announcementText: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* 4. Owner PIN Change */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
                🔒 Owner Security PIN
              </h4>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Current Admin PIN</label>
                <input
                  type="text"
                  value={settings.adminPin}
                  onChange={(e) => updateSettings({ adminPin: e.target.value })}
                  className="form-input"
                  style={{ maxWidth: '160px', fontWeight: 700 }}
                />
              </div>
              {/* Official Hotel Paytm UPI QR Integration */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#00BAF2', marginBottom: '0.75rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💳 Official Paytm UPI Payment QR
              </h4>

              <div style={{
                background: 'linear-gradient(145deg, rgba(7, 26, 44, 0.95), rgba(4, 15, 27, 0.98))',
                border: '1.5px solid rgba(0, 186, 242, 0.45)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src="/images/jonak-paytm-qr.png" 
                      alt="Official Paytm QR" 
                      style={{ width: '135px', height: 'auto', borderRadius: '8px', border: '2px solid #00BAF2', background: '#FFF' }}
                    />
                    <a 
                      href="/images/jonak-paytm-qr.png" 
                      download="Jonak-Hotel-Paytm-QR.png"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                      <Download size={12} />
                      Download QR
                    </a>
                  </div>

                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered Business Name:</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>JONAK HOTEL AND RESTAURANT</div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active UPI ID:</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00BAF2', fontFamily: 'monospace' }}>
                        paytm.s1i7is2@pty
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                      ✓ All customer food orders and room reservations display this official QR.<br />
                      ✓ Customers can 1-tap pay on mobile or enter their 12-digit UTR.<br />
                      ✓ Direct zero-commission settlement into Jonak Hotel's bank account.
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Reset to Defaults */}
              <div style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EF4444' }}>
                    Restore Initial Seed Data
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Reset all menu dishes and sample orders to original PDF defaults
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all menu items, settings and orders to factory defaults?')) {
                      resetToDefaults();
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#EF4444' }}
                >
                  <RotateCcw size={14} />
                  <span>Reset All</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: ROOM & TABLE QR CODE GENERATOR                               */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'QR_CODES' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.3rem' }}>
                  Smart Room & Table QR Code Generator
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Print instant scannable QR cards for hotel rooms and dining tables. When guests scan with their phone, their room or table number is automatically pre-filled in their cart!
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>Print QR Tent Card</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              
              {/* Left Column: QR Configuration Controls */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SettingsIcon size={18} />
                  <span>1. Configure Target QR</span>
                </h4>

                {/* Target Type Switcher: Hotel Room vs Table */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Select QR Location Type:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setQrTargetType('ROOM');
                        setQrTargetValue('101');
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: qrTargetType === 'ROOM' ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        color: qrTargetType === 'ROOM' ? '#070B14' : '#FFF',
                        border: qrTargetType === 'ROOM' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <BedDouble size={16} />
                      <span>Hotel Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQrTargetType('TABLE');
                        setQrTargetValue('Table 1');
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: qrTargetType === 'TABLE' ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        color: qrTargetType === 'TABLE' ? '#070B14' : '#FFF',
                        border: qrTargetType === 'TABLE' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>Dining Table</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Chips */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Quick Select {qrTargetType === 'ROOM' ? 'Official Hotel Room (101 to 304)' : 'Restaurant Table (1 to 15)'}:
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                      {qrTargetType === 'ROOM' ? '9 Official Rooms' : '15 Tables'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(qrTargetType === 'ROOM'
                      ? ['101', '201', '202', '203', '204', '301', '302', '303', '304']
                      : ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Table 11', 'Table 12', 'Table 13', 'Table 14', 'Table 15']
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQrTargetValue(preset)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: qrTargetValue === preset ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                          color: qrTargetValue === preset ? 'var(--gold-light)' : 'var(--text-secondary)',
                          border: qrTargetValue === preset ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {qrTargetType === 'ROOM' ? `Room ${preset}` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Name / Number Input */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">
                    Custom {qrTargetType === 'ROOM' ? 'Room Identifier' : 'Table Identifier'}:
                  </label>
                  <input
                    type="text"
                    value={qrTargetValue}
                    onChange={(e) => setQrTargetValue(e.target.value)}
                    placeholder="e.g. Room 105 or Garden Table 2"
                    className="form-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                {/* Website Base Domain Input */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Website Domain / Target URL:</label>
                  <input
                    type="text"
                    value={qrCustomDomain}
                    onChange={(e) => setQrCustomDomain(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setQrCustomDomain(window.location.origin)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      Use Current Local ({window.location.origin})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrCustomDomain('https://jonakhotelgroup.in')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      Use Official Domain (jonakhotelgroup.in)
                    </button>
                  </div>
                </div>

                {/* Direct Link & Quick Actions */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Generated Direct Customer Link:
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: 'var(--gold-warm)',
                    wordBreak: 'break-all',
                    marginBottom: '0.75rem'
                  }}>
                    {`${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = `${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`;
                        navigator.clipboard.writeText(targetUrl);
                        showToast('Link copied to clipboard!', 'success');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = `${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`;
                        window.open(targetUrl, '_blank');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <ExternalLink size={13} />
                      <span>Test in New Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!generatedQrDataUrl) return;
                        const a = document.createElement('a');
                        a.href = generatedQrDataUrl;
                        a.download = `jonak-${qrTargetType.toLowerCase()}-${qrTargetValue.replace(/\s+/g, '-')}-qr.png`;
                        a.click();
                        showToast('QR Code image downloaded!', 'success');
                      }}
                      className="btn btn-gold-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Download size={13} />
                      <span>Download QR PNG</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Printable Luxury Tent Card Preview */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>2. Printable Table Tent Card Preview:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Ready to Print / Laminate</span>
                </div>

                <div
                  id="printable-qr-card"
                  style={{
                    background: '#0B1120',
                    border: '3px solid var(--gold-primary)',
                    borderRadius: '16px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Luxury Top Header Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <img src="/jonak.png" alt="Jonak Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--gold-light)', textTransform: 'uppercase' }}>
                        Jonak Hotel & Restaurant
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        BH Road, Donakuchi, Barpeta, Assam 781314
                      </div>
                    </div>
                  </div>

                  {/* Target Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--gold-gradient)',
                    color: '#070B14',
                    padding: '0.4rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    letterSpacing: '0.08em',
                    margin: '0.75rem auto 1.25rem',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                  }}>
                    {qrTargetType === 'ROOM' ? `HOTEL ROOM • ${qrTargetValue}` : `DINING TABLE • ${qrTargetValue}`}
                  </div>

                  {/* QR Image Container with Crisp White Plate */}
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    marginBottom: '1.25rem'
                  }}>
                    {generatedQrDataUrl ? (
                      <img
                        src={generatedQrDataUrl}
                        alt="QR Code"
                        style={{ width: '220px', height: '220px', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                    SCAN TO ORDER FOOD & DRINKS
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gold-warm)', fontWeight: 600, marginBottom: '0.8rem' }}>
                    {qrTargetType === 'ROOM'
                      ? '✨ 100% Free In-Room Dining Delivery'
                      : '✨ Direct Kitchen-to-Table Service'}
                  </p>
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    1. Open your phone camera & scan QR code<br />
                    2. Browse Digital Menu & select dishes<br />
                    3. Your {qrTargetType === 'ROOM' ? 'Room #' : 'Table #'} is pre-filled automatically!
                  </div>

                  {/* Footer Reception Line */}
                  <div style={{
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(212, 175, 55, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}>
                    <Phone size={13} color="var(--gold-primary)" />
                    <span>Reception / WhatsApp: <strong>+91 96785 82286</strong></span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontWeight: 800 }}
                  >
                    <Printer size={16} />
                    <span>Print This Stand (Instant Clean PDF / Paper)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <style>{`
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
          .order-details-grid { grid-template-columns: 1fr !important; }
        }

        /* Clean Printable Tent Card CSS */
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-card, #printable-qr-card * {
            visibility: visible !important;
          }
          #printable-qr-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 360px !important;
            border: 3px solid #D4AF37 !important;
            background: #0B1120 !important;
            box-shadow: none !important;
            padding: 2rem !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
