import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UtensilsCrossed, 
  Search, 
  RotateCcw, 
  BellRing, 
  Check, 
  Eye, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const KitchenDesk = () => {
  const { 
    orders, 
    updateOrderStatus, 
    menu, 
    toggleDishStock, 
    staffSession 
  } = useHotel();

  const [activeTab, setActiveTab] = useState('KDS'); // 'KDS' | 'STOCK_SWITCHER'
  const [menuSearch, setMenuSearch] = useState('');

  // Orders columns
  const newOrders = orders.filter(o => o.status === 'New');
  const cookingOrders = orders.filter(o => o.status === 'Cooking' || o.status === 'Confirmed');
  const readyOrders = orders.filter(o => o.status === 'Ready' || o.status === 'Ready for Pickup');

  // Filtered menu for 1-tap stockout switcher
  const filteredMenu = menu.filter(dish => {
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      return dish.name.toLowerCase().includes(q) || dish.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="kitchen-desk-wrapper">
      
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        background: 'rgba(255, 153, 0, 0.08)',
        border: '1px solid rgba(255, 153, 0, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Flame size={22} color="#FF9900" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              Master Chef’s Live KDS (Kitchen Display System)
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time order ticket flow: New Orders ➔ Cooking in Progress ➔ Ready for Delivery & Service.
          </p>
        </div>

        {/* View Switcher: KDS vs Stock Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.3rem', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('KDS')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'KDS' ? '#FF9900' : 'transparent',
              color: activeTab === 'KDS' ? '#070B14' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Flame size={15} />
            <span>Live KDS Board ({newOrders.length + cookingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STOCK_SWITCHER')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'STOCK_SWITCHER' ? '#FF9900' : 'transparent',
              color: activeTab === 'STOCK_SWITCHER' ? '#070B14' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <UtensilsCrossed size={15} />
            <span>1-Tap Dish Stock-Out</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* VIEW 1: LIVE KDS BOARD (3 COLUMNS)                                    */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'KDS' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          alignItems: 'flex-start'
        }}>
          
          {/* Column 1: New Orders Received */}
          <div style={{
            background: 'rgba(7, 11, 20, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            minHeight: '480px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. New Orders ({newOrders.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Needs Prep</span>
            </div>

            {newOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                No pending new orders. Kitchen is all caught up!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {newOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.1rem',
                      borderLeft: '4px solid #EF4444',
                      background: 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                          #{order.id}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                          {order.diningType === 'room_service' ? `🏨 Room ${order.roomNumber}` : (order.diningType === 'dine_in' ? `🍽️ Table ${order.tableNumber || '1'}` : '🛵 5 KM Delivery')}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} />
                        {order.time || 'Just now'}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.85rem',
                      fontSize: '0.85rem'
                    }}>
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#FFFFFF' }}>
                          <span><strong>{it.qty}x</strong> {it.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                      {order.cookingInstructions && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-warm)', marginTop: '0.4rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.3rem' }}>
                          📝 <em>Note: {order.cookingInstructions}</em>
                        </div>
                      )}
                    </div>

                    {/* Start Cooking Button */}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Cooking')}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: 'linear-gradient(135deg, #FF9900 0%, #D4AF37 100%)',
                        color: '#070B14'
                      }}
                    >
                      <Flame size={16} />
                      <span>Accept & Start Cooking 🔥</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Cooking in Progress */}
          <div style={{
            background: 'rgba(7, 11, 20, 0.85)',
            border: '1px solid rgba(255, 153, 0, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            minHeight: '480px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 153, 0, 0.25)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={16} color="#FF9900" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FF9900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Cooking in Pan ({cookingOrders.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live on stove</span>
            </div>

            {cookingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Clock size={32} color="#FF9900" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                No active cooking tickets. Accept new orders from column 1!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cookingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.1rem',
                      borderLeft: '4px solid #FF9900',
                      background: 'rgba(255, 153, 0, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                          #{order.id}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                          {order.diningType === 'room_service' ? `🏨 Room ${order.roomNumber}` : (order.diningType === 'dine_in' ? `🍽️ Table ${order.tableNumber || '1'}` : '🛵 5 KM Delivery')}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 153, 0, 0.15)',
                        color: '#FF9900',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        🔥 Cooking
                      </span>
                    </div>

                    {/* Order Items */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.85rem',
                      fontSize: '0.85rem'
                    }}>
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#FFFFFF' }}>
                          <span><strong>{it.qty}x</strong> {it.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mark Ready Button */}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Ready')}
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Food Ready for Delivery / Waiter ✅</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Food Ready for Pickup / Delivery */}
          <div style={{
            background: 'rgba(7, 11, 20, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            minHeight: '480px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#10B981" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Ready for Service ({readyOrders.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery Boy alert</span>
            </div>

            {readyOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Check size={32} color="#10B981" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                No orders waiting on the kitchen dispatch counter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.1rem',
                      borderLeft: '4px solid #10B981',
                      background: 'rgba(16, 185, 129, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                          #{order.id}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                          Ready on Counter ({order.customerName || 'Guest'})
                        </div>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        Dispatched
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                      {(order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '0.5rem'
                    }}>
                      <span>Destination: {order.deliveryAddress || `Room ${order.roomNumber}` || 'Dine-In'}</span>
                      <strong style={{ color: '#FFFFFF' }}>₹{order.total}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ---------------------------------------------------------------------- */
        /* VIEW 2: 1-TAP DISH STOCK-OUT SWITCHER                                  */
        /* ---------------------------------------------------------------------- */
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                Chef’s Fast Dish Availability Switcher
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                If an item is finished in the kitchen, tap the button to immediately mark it Sold Out on the customer website.
              </p>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search dish name..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.85rem 0.45rem 2.2rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {filteredMenu.map((dish) => (
              <div
                key={dish.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.1rem',
                  borderRadius: '8px',
                  background: dish.inStock ? 'rgba(255, 255, 255, 0.03)' : 'rgba(239, 68, 68, 0.08)',
                  border: dish.inStock ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EF4444'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.92rem' }}>
                    {dish.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {dish.category} • ₹{dish.price}
                  </div>
                </div>

                <button
                  onClick={() => toggleDishStock(dish.id, !dish.inStock)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    background: dish.inStock ? '#10B981' : '#EF4444',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {dish.inStock ? (
                    <>
                      <Check size={14} />
                      <span>In Stock</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>Sold Out</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
