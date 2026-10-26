import React from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  Utensils, 
  BedDouble, 
  ShoppingBag, 
  Phone, 
  MessageCircle
} from 'lucide-react';

export const MobileActionDock = ({ onOpenCart, onOpenBookingModal, setActiveView }) => {
  const { hotelInfo, cart } = useHotel();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="mobile-action-dock">
      {/* Menu / Order Food */}
      <a 
        href="#menu" 
        onClick={() => setActiveView('home')}
        className="dock-item"
      >
        <Utensils size={18} color="var(--gold-primary)" />
        <span>Menu</span>
      </a>

      {/* Book Room */}
      <button 
        type="button"
        onClick={onOpenBookingModal}
        className="dock-item"
      >
        <BedDouble size={18} color="var(--gold-primary)" />
        <span>Book Room</span>
      </button>

      {/* Cart (Central Highlight CTA) */}
      <button 
        type="button"
        onClick={onOpenCart}
        className="dock-item dock-cta"
        style={{ position: 'relative' }}
      >
        <ShoppingBag size={18} />
        <span>Cart</span>
        {cartCount > 0 && (
          <span className="dock-badge">
            {cartCount}
          </span>
        )}
      </button>

      {/* Direct Call Reception */}
      <a 
        href={`tel:${hotelInfo.phoneRaw}`}
        className="dock-item"
      >
        <Phone size={18} color="#10B981" />
        <span>Call</span>
      </a>

      {/* Direct WhatsApp Reception */}
      <a 
        href={`https://wa.me/${hotelInfo.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="dock-item"
      >
        <MessageCircle size={18} color="#25D366" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
};
