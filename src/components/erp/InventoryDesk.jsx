import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Flame, 
  DollarSign, 
  Clock, 
  X,
  CreditCard,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';

export const InventoryDesk = () => {
  const { 
    rawInventory, 
    addStockPurchase, 
    useStock, 
    staffSession, 
    expenses 
  } = useHotel();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [purchasePaidVia, setPurchasePaidVia] = useState('Cash');

  const [selectedItemForUse, setSelectedItemForUse] = useState(null);
  const [useQty, setUseQty] = useState('');

  // Categories
  const categories = ['ALL', 'Meat & Poultry', 'Dairy & Cheese', 'Grains & Staples', 'Oils & Spices', 'Fuel & Energy', 'Beverages', 'Housekeeping'];

  // Low stock items
  const lowStockItems = rawInventory.filter(item => parseFloat(item.currentStock) <= parseFloat(item.minThreshold));

  // Filtered inventory
  const filteredItems = rawInventory.filter(item => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle Add Stock Purchase Submit
  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemForPurchase || !purchaseQty) return;

    addStockPurchase({
      itemId: selectedItemForPurchase.id,
      addedQty: parseFloat(purchaseQty),
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0,
      updatedBy: staffSession?.staffName || 'Kitchen Staff',
      paidVia: purchasePaidVia
    });

    setSelectedItemForPurchase(null);
    setPurchaseQty('');
    setPurchaseCost('');
  };

  // Handle Use Stock Submit
  const handleUseSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemForUse || !useQty) return;

    useStock({
      itemId: selectedItemForUse.id,
      usedQty: parseFloat(useQty),
      updatedBy: staffSession?.staffName || 'Kitchen Staff'
    });

    setSelectedItemForUse(null);
    setUseQty('');
  };

  return (
    <div className="inventory-desk-wrapper">
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={22} color="var(--gold-primary)" />
            <span>Kitchen Raw Material & Store Inventory</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Paperless tracking for meats, dairy, basmati rice, cooking oils, LPG gas cylinders, and toiletries.
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-light)' }}>
              {rawInventory.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tracked Items
            </div>
          </div>

          <div style={{
            padding: '0.5rem 1rem',
            background: lowStockItems.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${lowStockItems.length > 0 ? '#EF4444' : '#10B981'}`,
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: lowStockItems.length > 0 ? '#EF4444' : '#10B981' }}>
              {lowStockItems.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Low Stock Alert
            </div>
          </div>
        </div>
      </div>

      {/* Critical Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '1rem 1.25rem',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #EF4444',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          color: '#FCA5A5'
        }}>
          <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
              ⚠️ Critical Low Stock Notification for Kitchen & Store
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              The following raw materials have reached minimum safety thresholds:
              {' '}
              {lowStockItems.map((item, idx) => (
                <strong key={item.id} style={{ color: '#F87171' }}>
                  {item.name} ({item.currentStock} {item.unit} left){idx < lowStockItems.length - 1 ? ', ' : ''}
                </strong>
              ))}
              . Please purchase fresh stock immediately to avoid food preparation delays!
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        marginBottom: '1.5rem'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem', maxWidth: '100%' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '50px',
                border: categoryFilter === cat ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: categoryFilter === cat ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: categoryFilter === cat ? 'var(--gold-light)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search raw material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Inventory Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {filteredItems.map((item) => {
          const isLow = parseFloat(item.currentStock) <= parseFloat(item.minThreshold);
          const percentLeft = Math.min(100, Math.round((parseFloat(item.currentStock) / (parseFloat(item.minThreshold) * 2.5)) * 100));

          return (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '1.35rem',
                border: isLow ? '1px solid #EF4444' : '1px solid rgba(212, 175, 55, 0.2)',
                position: 'relative',
                background: isLow ? 'rgba(239, 68, 68, 0.04)' : 'rgba(11, 17, 32, 0.65)'
              }}
            >
              {/* Category & Low Stock Tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.category}
                </span>
                {isLow ? (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#EF4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    <AlertTriangle size={12} />
                    <span>Low Stock</span>
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    In Stock
                  </span>
                )}
              </div>

              {/* Item Name & Stock Count */}
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.6rem' }}>
                {item.name}
              </h4>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: isLow ? '#EF4444' : 'var(--gold-light)' }}>
                  {item.currentStock}
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {item.unit}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Min Threshold: {item.minThreshold} {item.unit}
                </span>
              </div>

              {/* Stock Bar */}
              <div style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentLeft}%`,
                  background: isLow ? '#EF4444' : (percentLeft > 50 ? '#10B981' : 'var(--gold-primary)'),
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Metadata */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Est. Rate: ₹{item.costPerUnit}/{item.unit}</span>
                <span>By: {item.updatedBy || 'Staff'}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => {
                    setSelectedItemForPurchase(item);
                    setPurchaseQty('');
                    setPurchaseCost('');
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Plus size={14} />
                  <span>+ Purchased</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedItemForUse(item);
                    setUseQty('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Minus size={14} />
                  <span>- Used Today</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: ADD STOCK PURCHASED (AUTOMATICALLY LOGS EXPENSE)              */}
      {/* ---------------------------------------------------------------------- */}
      {selectedItemForPurchase && (
        <div className="modal-backdrop" onClick={() => setSelectedItemForPurchase(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              border: '2px solid var(--gold-primary)',
              borderRadius: 'var(--radius-lg)',
              background: '#070B14'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                Add Fresh Stock Purchased
              </h3>
              <button onClick={() => setSelectedItemForPurchase(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>Item:</strong> {selectedItemForPurchase.name} ({selectedItemForPurchase.category})<br />
              <strong>Current Stock:</strong> {selectedItemForPurchase.currentStock} {selectedItemForPurchase.unit}
            </div>

            <form onSubmit={handlePurchaseSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Quantity Added ({selectedItemForPurchase.unit}): *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder={`e.g. 10 (${selectedItemForPurchase.unit})`}
                  value={purchaseQty}
                  onChange={(e) => {
                    const q = e.target.value;
                    setPurchaseQty(q);
                    if (q && selectedItemForPurchase.costPerUnit) {
                      setPurchaseCost(Math.round(parseFloat(q) * selectedItemForPurchase.costPerUnit));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Total Purchase Bill Cost (₹): * (Auto-logged to P&L Expenses)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2200"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Paid Via:
                </label>
                <select
                  value={purchasePaidVia}
                  onChange={(e) => setPurchasePaidVia(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0B1120',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Cash">Cash in Drawer</option>
                  <option value="Paytm UPI">Official Paytm UPI (paytm.s1i7is2@pty)</option>
                  <option value="Bank Transfer">Current Account NEFT/RTGS</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItemForPurchase(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Confirm & Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: USE STOCK (KITCHEN PREPARATION)                              */}
      {/* ---------------------------------------------------------------------- */}
      {selectedItemForUse && (
        <div className="modal-backdrop" onClick={() => setSelectedItemForUse(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div 
            className="glass-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '2rem',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 'var(--radius-lg)',
              background: '#070B14'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                Record Cooking Stock Usage
              </h3>
              <button onClick={() => setSelectedItemForUse(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>Item:</strong> {selectedItemForUse.name}<br />
              <strong>Available:</strong> {selectedItemForUse.currentStock} {selectedItemForUse.unit}
            </div>

            <form onSubmit={handleUseSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Quantity Consumed Today ({selectedItemForUse.unit}): *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder={`e.g. 5 (${selectedItemForUse.unit})`}
                  value={useQty}
                  onChange={(e) => setUseQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItemForUse(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Update Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
