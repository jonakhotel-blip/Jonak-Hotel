import React, { useState, useEffect } from 'react';
import { useHotel } from './context/HotelContext';
import { PixelHomepage } from './components/PixelHomepage';
import { CartDrawer } from './components/CartDrawer';
import { BookingModal } from './components/BookingModal';
import { AdminPanel } from './components/AdminPanel';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function App() {
  const { toast } = useHotel();

  // Active view: 'home' | 'admin'
  const [activeView, setActiveView] = useState(() => {
    return window.location.hash === '#admin' ? 'admin' : 'home';
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setActiveView('admin');
      } else if (window.location.hash === '#cart') {
        setIsCartOpen(true);
      } else if (window.location.hash === '#track' || window.location.hash === '#rider' || window.location.hash === '#dispatch' || window.location.hash === '#kds') {
        setIsTrackerOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenRoomBooking = (room = null) => {
    setPreselectedRoom(room);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="jonak-app-root">
      
      {/* View Switch: Owner Command Center vs Customer Pixel-Accurate Web App */}
      {activeView === 'admin' ? (
        <AdminPanel onExitAdmin={() => {
          setActiveView('home');
          window.location.hash = '';
        }} />
      ) : (
        <>
          {/* Pixel-Accurate Mobile-First Homepage */}
          <PixelHomepage 
            onOpenCart={() => setIsCartOpen(true)}
            onOpenBookingModal={handleOpenRoomBooking}
            onOpenAdmin={() => {
              setActiveView('admin');
              window.location.hash = 'admin';
            }}
            onOpenTracker={() => setIsTrackerOpen(true)}
          />

          {/* Cart Drawer */}
          <CartDrawer 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />

          {/* Room Booking Modal */}
          <BookingModal 
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            preselectedRoom={preselectedRoom}
          />

          {/* Zomato-Style Live Order & Map Tracker Modal */}
          <OrderTrackerModal
            isOpen={isTrackerOpen}
            onClose={() => setIsTrackerOpen(false)}
            targetOrderId={trackingOrderId}
          />
        </>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast">
          {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" />}
          {toast.type === 'danger' && <AlertCircle size={18} color="#EF4444" />}
          {toast.type === 'info' && <Info size={18} color="var(--gold-primary)" />}
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

    </div>
  );
}

export default App;
