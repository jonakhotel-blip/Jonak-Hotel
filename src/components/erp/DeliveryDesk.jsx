import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Check, 
  ExternalLink,
  ShoppingBag,
  CreditCard,
  Banknote
} from 'lucide-react';

export const DeliveryDesk = () => {
  const { 
    orders, 
    updateOrderStatus, 
    staffSession,
    showToast 
  } = useHotel();

  const [filterType, setFilterType] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED'

  // Filter deliveries & room service orders
  const deliveryOrders = orders.filter(o => 
    o.diningType === 'delivery' || o.isDelivery || (o.deliveryAddress && !o.roomNumber) || o.diningType === 'room_service'
  );

  const activeDeliveries = deliveryOrders.filter(o => o.status === 'Ready' || o.status === 'Cooking' || o.status === 'New');
  const completedDeliveries = deliveryOrders.filter(o => o.status === 'Delivered');

  // Stats today
  const totalDeliveriesCount = completedDeliveries.length;
  const totalCashCollected = completedDeliveries
    .filter(o => !o.utrNumber && !o.paymentMethod?.toLowerCase().includes('upi'))
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  const handleMarkDelivered = (orderId) => {
    updateOrderStatus(orderId, 'Delivered');
    showToast(`Order #${orderId} marked Delivered! Cash collection recorded.`, 'success');
  };

  return (
    <div className="delivery-desk-wrapper">
      
      {/* Top Banner & Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Bike size={22} color="#10B981" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              Delivery Partner & Room Waiter Desk
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time delivery dispatch, 1-tap Google Maps navigation, phone dialer, and cash collection confirmation.
          </p>
        </div>

        {/* Delivery Counters */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>
              {activeDeliveries.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending Deliveries
            </div>
          </div>

          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-light)' }}>
              {totalDeliveriesCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Delivered Today
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilterType('ACTIVE')}
          className={`btn ${filterType === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          🛵 Active Deliveries ({activeDeliveries.length})
        </button>
        <button
          onClick={() => setFilterType('COMPLETED')}
          className={`btn ${filterType === 'COMPLETED' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
        >
          ✅ Completed Delivery History ({completedDeliveries.length})
        </button>
      </div>

      {/* Delivery Cards Grid */}
      {filterType === 'ACTIVE' ? (
        activeDeliveries.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <Bike size={42} color="#10B981" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', marginBottom: '0.3rem' }}>All Deliveries Completed!</h4>
            <p style={{ fontSize: '0.85rem' }}>There are no active food deliveries waiting right now.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.25rem'
          }}>
            {activeDeliveries.map((order) => {
              const isReady = order.status === 'Ready' || order.status === 'Ready for Pickup';
              const cleanAddress = order.deliveryAddress || (order.roomNumber ? `Jonak Hotel Room ${order.roomNumber}` : 'Barpeta, Assam');
              const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanAddress}, Barpeta, Assam`)}`;

              return (
                <div
                  key={order.id}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    border: isReady ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isReady ? 'rgba(16, 185, 129, 0.05)' : 'rgba(11, 17, 32, 0.7)',
                    position: 'relative'
                  }}
                >
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        background: isReady ? '#10B981' : '#FF9900',
                        color: isReady ? '#FFFFFF' : '#070B14',
                        fontWeight: 800,
                        fontSize: '0.75rem'
                      }}>
                        {isReady ? 'READY TO DISPATCH' : 'CHEF COOKING'}
                      </span>
                      <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                        #{order.id}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {order.time || 'Today'}
                    </span>
                  </div>

                  {/* Customer Contact */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                      {order.customerName || 'Customer'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <a
                        href={`tel:${order.customerPhone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.75rem',
                          background: 'rgba(0, 186, 242, 0.15)',
                          color: '#00BAF2',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        <Phone size={14} />
                        <span>Call: {order.customerPhone || 'N/A'}</span>
                      </a>
                    </div>

                    {/* Delivery Address & Map Link */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <MapPin size={16} color="var(--gold-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{cleanAddress}</span>
                    </div>

                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        color: 'var(--gold-light)',
                        textDecoration: 'none',
                        fontWeight: 700
                      }}
                    >
                      <Navigation size={14} />
                      <span>Open in Google Maps GPS Navigation</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Food Items & Amount */}
                  <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>ITEMS ORDERED:</div>
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#FFFFFF' }}>
                        <span>{it.qty}x {it.name}</span>
                        <span>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 800 }}>
                      <span style={{ color: 'var(--gold-light)' }}>Total Collection Amount:</span>
                      <span style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>₹{order.total}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: order.utrNumber ? '#10B981' : '#F59E0B', marginTop: '0.2rem' }}>
                      {order.utrNumber ? `✅ Paid via Paytm UPI (UTR: ${order.utrNumber})` : '💵 Collect Cash on Delivery / Scan Paytm QR'}
                    </div>
                  </div>

                  {/* Action: Mark Delivered */}
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      background: '#10B981',
                      border: 'none',
                      color: '#FFFFFF'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Confirm Handover & Mark Delivered ✅</span>
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Completed Deliveries History */
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)', textAlign: 'left', color: 'var(--gold-light)' }}>
                <th style={{ padding: '0.75rem' }}>Order ID</th>
                <th style={{ padding: '0.75rem' }}>Customer</th>
                <th style={{ padding: '0.75rem' }}>Delivery Address</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem' }}>Payment</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {completedDeliveries.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#FFFFFF' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{order.id}</td>
                  <td style={{ padding: '0.75rem' }}>{order.customerName} ({order.customerPhone})</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{order.deliveryAddress || `Room ${order.roomNumber}` || 'Barpeta'}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--gold-primary)' }}>₹{order.total}</td>
                  <td style={{ padding: '0.75rem' }}>{order.utrNumber ? `UPI (UTR: ${order.utrNumber.slice(-4)})` : 'Cash'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                      Delivered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
