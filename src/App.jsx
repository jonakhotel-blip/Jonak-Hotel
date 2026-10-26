import React, { useState, useEffect } from 'react';
import { useHotel } from './context/HotelContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { RoomsSection } from './components/RoomsSection';
import { EventsSection } from './components/EventsSection';
import { LandmarksSection } from './components/LandmarksSection';
import { AboutSection } from './components/AboutSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { BookingModal } from './components/BookingModal';
import { MobileActionDock } from './components/MobileActionDock';
import { AdminPanel } from './components/AdminPanel';
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

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setActiveView('admin');
      } else if (window.location.hash === '#cart') {
        setIsCartOpen(true);
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
      
      {/* View Switch: Owner Command Center vs Customer Luxury Website */}
      {activeView === 'admin' ? (
        <AdminPanel onExitAdmin={() => {
          setActiveView('home');
          window.location.hash = '';
        }} />
      ) : (
        <>
          {/* Main Navigation */}
          <Navbar 
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAdmin={() => {
              setActiveView('admin');
              window.location.hash = 'admin';
            }}
            activeView={activeView}
            setActiveView={setActiveView}
          />

          {/* Hero Section */}
          <Hero onOpenBookingModal={() => handleOpenRoomBooking(null)} />

          {/* Digital Menu & 5 KM Delivery Engine */}
          <MenuSection onOpenCart={() => setIsCartOpen(true)} />

          {/* Room Showcase & Booking Flow */}
          <RoomsSection onSelectRoomForBooking={handleOpenRoomBooking} />

          {/* Events & Open Stage Celebrations */}
          <EventsSection />

          {/* About Us, Founder's Philosophy & Four Pillars */}
          <AboutSection />

          {/* Nearby Landmarks Distance Guide */}
          <LandmarksSection />

          {/* FAQ Accordion */}
          <FAQSection />

          {/* Footer */}
          <Footer 
            onOpenAdmin={() => {
              setActiveView('admin');
              window.location.hash = 'admin';
            }} 
            setActiveView={setActiveView}
          />

          {/* Mobile Bottom Dock */}
          <MobileActionDock 
            onOpenCart={() => setIsCartOpen(true)}
            onOpenBookingModal={() => handleOpenRoomBooking(null)}
            setActiveView={setActiveView}
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
