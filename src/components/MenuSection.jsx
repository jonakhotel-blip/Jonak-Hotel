import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { 
  Search, 
  Plus, 
  Minus, 
  Flame, 
  Sparkles, 
  Download, 
  Bike, 
  Check, 
  AlertCircle,
  Filter
} from 'lucide-react';

export const MenuSection = ({ onOpenCart }) => {
  const { menu, cart, addToCart, updateCartQty, settings } = useHotel();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'
  const [bestSellerOnly, setBestSellerOnly] = useState(false);

  // Extract all categories dynamically from menu items
  const categories = useMemo(() => {
    const cats = ['All'];
    menu.forEach((item) => {
      if (!cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    return cats;
  }, [menu]);

  // Filtered menu list
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      // Category match
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Veg / Non-Veg match
      if (vegFilter === 'VEG' && !item.isVeg) return false;
      if (vegFilter === 'NON_VEG' && item.isVeg) return false;
      // Best Seller match
      if (bestSellerOnly && !item.bestSeller) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCat = item.category?.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [menu, selectedCategory, vegFilter, bestSellerOnly, searchQuery]);

  // Get current quantity in cart for this dish
  const getItemQty = (id) => {
    const found = cart.find((i) => i.id === id);
    return found ? found.qty : 0;
  };

  return (
    <section id="menu" style={{
      padding: '4.5rem 0',
      background: 'rgba(11, 17, 32, 0.65)',
      position: 'relative'
    }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem' }}>
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
            <span>AUTHENTIC ASSAMESE & MULTI-CUISINE DINING</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)'
          }}>
            Interactive <span className="text-gold-gradient">Digital Menu</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Prepared fresh by master chefs using premium local ingredients. 
            Enjoy <strong style={{ color: '#10B981' }}>100% FREE Home Delivery within 5 KM</strong> or order in-room dining directly to your suite.
          </p>

          {/* Quick PDF Menu Download Link */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a 
              href="/menu.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} color="var(--gold-primary)" />
              <span>Download Original PDF Menu</span>
            </a>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '0.35rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              color: '#34D399',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              <Bike size={14} />
              <span>Free Delivery Radius: {settings.freeDeliveryRadiusKm} KM</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="glass-card" style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: '1 1 280px',
            maxWidth: '420px'
          }}>
            <Search 
              size={18} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text"
              placeholder="Search Biryani, Chicken, Rolls, Momos, Paneer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '2.5rem',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-full)'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Dietary Filters (Veg / Non-Veg / Best Seller) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setVegFilter('ALL')}
              className={`btn btn-sm ${vegFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              All Types
            </button>

            <button
              onClick={() => setVegFilter(vegFilter === 'VEG' ? 'ALL' : 'VEG')}
              className={`btn btn-sm ${vegFilter === 'VEG' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <div className="food-type-icon veg" style={{ width: 14, height: 14 }}>
                <div className="dot" style={{ width: 6, height: 6 }} />
              </div>
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setVegFilter(vegFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
              className={`btn btn-sm ${vegFilter === 'NON_VEG' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <div className="food-type-icon non-veg" style={{ width: 14, height: 14 }}>
                <div className="dot" style={{ width: 6, height: 6 }} />
              </div>
              <span>Non-Veg Only</span>
            </button>

            <button
              onClick={() => setBestSellerOnly(!bestSellerOnly)}
              className={`btn btn-sm ${bestSellerOnly ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Flame size={14} color={bestSellerOnly ? '#070B14' : '#F59E0B'} fill={bestSellerOnly ? '#070B14' : '#F59E0B'} />
              <span>Best Sellers</span>
            </button>
          </div>
        </div>

        {/* Visual Category Filter Chips */}
        <div style={{
          display: 'flex',
          gap: '0.55rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          marginBottom: '2rem',
          scrollbarWidth: 'thin'
        }}>
          {categories.map((cat) => {
            const count = cat === 'All' 
              ? menu.length 
              : menu.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? 'var(--gold-gradient)' : 'rgba(15, 23, 42, 0.85)',
                  color: isSelected ? '#070B14' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <span>{cat}</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(7, 11, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#070B14' : 'var(--text-muted)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dish Items Grid */}
        {filteredMenu.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <AlertCircle size={40} color="var(--gold-primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No dishes found matching your filter</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try clearing the search or switching categories.</p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setVegFilter('ALL'); setBestSellerOnly(false); }}
              className="btn btn-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredMenu.map((dish) => {
              const qty = getItemQty(dish.id);

              return (
                <div 
                  key={dish.id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    opacity: dish.inStock ? 1 : 0.65,
                    border: dish.inStock ? '1px solid var(--border-subtle)' : '1px dashed rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <div>
                    {/* Top Row: Type Indicator & Badges */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div className={`food-type-icon ${dish.isVeg ? 'veg' : 'non-veg'}`}>
                          <div className="dot" />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {dish.category}
                        </span>
                      </div>

                      {dish.bestSeller && (
                        <span className="badge badge-gold" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                          <Flame size={11} fill="#F59E0B" color="#F59E0B" />
                          <span>Best Seller</span>
                        </span>
                      )}
                    </div>

                    {/* Dish Name */}
                    <h3 style={{
                      fontSize: '1.08rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: 'var(--text-primary)'
                    }}>
                      {dish.name}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {dish.description}
                    </p>
                  </div>

                  {/* Bottom Row: Price & Add to Cart Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {/* Price */}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Price</div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-serif)',
                        color: 'var(--gold-light)'
                      }}>
                        ₹{dish.price}
                      </div>
                    </div>

                    {/* Action: Stock or Quantity */}
                    {!dish.inStock ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#EF4444',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        Sold Out
                      </span>
                    ) : qty > 0 ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem',
                        border: '1px solid var(--gold-primary)'
                      }}>
                        <button
                          onClick={() => updateCartQty(dish.id, qty - 1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--gold-light)',
                            cursor: 'pointer',
                            padding: '0.25rem 0.4rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          minWidth: '22px',
                          textAlign: 'center',
                          color: '#FFFFFF'
                        }}>
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(dish)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--gold-light)',
                            cursor: 'pointer',
                            padding: '0.25rem 0.4rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(dish)}
                        className="btn btn-gold-outline btn-sm"
                        style={{
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontWeight: 700
                        }}
                      >
                        <Plus size={15} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Cart Bar if cart has items */}
        {cart.length > 0 && (
          <div style={{
            marginTop: '2.5rem',
            textAlign: 'center'
          }}>
            <button
              onClick={onOpenCart}
              className="btn btn-primary"
              style={{
                padding: '0.9rem 2.2rem',
                fontSize: '1.05rem',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-luxury)'
              }}
            >
              <Bike size={20} />
              <span>Review Order ({cart.reduce((s, i) => s + i.qty, 0)} Items) • Proceed to Delivery</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
