import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  Sparkles,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  Flame,
  Info,
  Bell,
  Check,
  CheckCheck,
  Droplets,
  Tv,
  Wind
} from 'lucide-react';

export const HousekeepingDesk = () => {
  const {
    physicalRooms,
    updateHousekeeping,
    tasks,
    toggleTask,
    staffSession,
    showToast
  } = useHotel();

  // Local state for room-level inspection checklists
  const [roomChecklists, setRoomChecklists] = useState({});

  // Caretaker Routine Checklist
  const [caretakerChecklist, setCaretakerChecklist] = useState({
    waterPump: false,
    corridors: true,
    lighting: false,
    parkingGate: false
  });

  const toggleRoomCheck = (roomNum, itemKey) => {
    setRoomChecklists(prev => {
      const roomState = prev[roomNum] || { towels: true, bedsheets: true, remotes: true, water: true };
      return {
        ...prev,
        [roomNum]: {
          ...roomState,
          [itemKey]: !roomState[itemKey]
        }
      };
    });
  };

  // Housekeeping & Caretaker live dispatch alerts
  const activeAlertTasks = tasks.filter(t => !t.completed && (
    t.assignedTo === 'Hafij' || 
    t.assignedRole === 'housekeeping' || 
    t.title.toLowerCase().includes('room') || 
    t.title.toLowerCase().includes('luggage') || 
    t.title.toLowerCase().includes('guest') ||
    t.title.toLowerCase().includes('clean')
  ));

  // Counters
  const cleanCount = physicalRooms.filter(r => r.cleaningStatus === 'Clean & Ready' || !r.cleaningStatus).length;
  const inProgressCount = physicalRooms.filter(r => r.cleaningStatus === 'Cleaning in Progress').length;
  const dirtyCount = physicalRooms.filter(r => r.cleaningStatus === 'Dirty / Needs Cleaning').length;

  // Status cycle: Dirty -> Cleaning -> Clean
  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'Clean & Ready' || !currentStatus) return 'Dirty / Needs Cleaning';
    if (currentStatus === 'Dirty / Needs Cleaning') return 'Cleaning in Progress';
    return 'Clean & Ready';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Clean & Ready':
        return '#10B981';
      case 'Cleaning in Progress':
        return '#F59E0B';
      case 'Dirty / Needs Cleaning':
        return '#EF4444';
      default:
        return '#10B981';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Clean & Ready':
        return 'rgba(16, 185, 129, 0.15)';
      case 'Cleaning in Progress':
        return 'rgba(245, 158, 11, 0.15)';
      case 'Dirty / Needs Cleaning':
        return 'rgba(239, 68, 68, 0.15)';
      default:
        return 'rgba(16, 185, 129, 0.15)';
    }
  };

  return (
    <div className="housekeeping-desk-wrapper">

      {/* 1. LIVE DISPATCH ALERT BANNER (FROM HAFIJUR / CHEF TO HAFIJ) */}
      {activeAlertTasks.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(239, 68, 68, 0.15))',
          border: '2px solid var(--gold-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.85rem',
                animation: 'pulse 1.5s infinite'
              }}>
                <Bell size={15} />
              </span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                🏃‍♂️ Hafij's Live Caretaker Alerts ({activeAlertTasks.length} Urgent Dispatch Tasks)
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', fontWeight: 600 }}>
              Dispatched by Hafijur (Reception) & Kitchen KDS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeAlertTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(7, 11, 20, 0.85)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem 1.15rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Time: {t.time || 'Immediate'} • Assigned to: <strong>Hafij (All-Rounder)</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    toggleTask(t.id, 'Hafij');
                    showToast(`👍 Task marked complete by Hafij: "${t.title}"`, 'success');
                  }}
                  className="btn"
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem 1.1rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCheck size={16} />
                  <span>👍 Task Completed</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Sparkles size={22} color="#A855F7" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              Hafij's 10-Room Readiness Grid & Caretaker Dashboard
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Live cleaning status across all 10 physical rooms (`101` to `304`). Tap status to advance: Needs Cleaning (Red) ➔ Cleaning Now (Yellow) ➔ Clean & Ready (Green).
          </p>
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>{cleanCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clean & Ready</div>
          </div>
          <div style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: '#F59E0B', fontSize: '1.1rem' }}>{inProgressCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cleaning in Progress</div>
          </div>
          <div style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '1.1rem' }}>{dirtyCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Needs Linen / Dirty</div>
          </div>
        </div>
      </div>

      {/* 10 Rooms Grid Grouped by Floor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { floorTitle: '1st Floor • Luxury Suites (Rooms 101 & 102)', rooms: physicalRooms.filter(r => r.floorNumber === 1 || r.floor?.includes('1st')) },
          { floorTitle: '2nd Floor • Executive Deluxe & Twin Rooms (Rooms 201–204)', rooms: physicalRooms.filter(r => r.floorNumber === 2 || r.floor?.includes('2nd')) },
          { floorTitle: '3rd Floor • Deluxe & Budget Single Rooms (Rooms 301–304)', rooms: physicalRooms.filter(r => r.floorNumber === 3 || r.floor?.includes('3rd')) }
        ].map((floorGroup, fIdx) => (
          <div key={fIdx} className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold-light)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
              {floorGroup.floorTitle}
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {floorGroup.rooms.map((room) => {
                const currentStatus = room.cleaningStatus || 'Clean & Ready';
                const statusColor = getStatusColor(currentStatus);
                const statusBg = getStatusBg(currentStatus);
                const nextStatus = getNextStatus(currentStatus);
                const chk = roomChecklists[room.roomNumber] || { towels: true, bedsheets: true, remotes: true, water: true };

                return (
                  <div
                    key={room.roomNumber}
                    style={{
                      padding: '1.2rem',
                      borderRadius: '8px',
                      background: 'rgba(7, 11, 20, 0.85)',
                      border: `1.5px solid ${statusColor}`,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                        Room {room.roomNumber}
                      </div>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: room.isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: room.isAvailable ? '#10B981' : '#EF4444',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}>
                        {room.isAvailable ? 'Vacant' : `Occupied (${room.guestName || 'Guest'})`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      {room.categoryName} • Tariff: ₹{room.tariff}
                    </div>

                    {/* Cleaning Status Indicator */}
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: statusBg,
                      color: statusColor,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.75rem'
                    }}>
                      {currentStatus === 'Clean & Ready' && <CheckCircle2 size={16} />}
                      {currentStatus === 'Cleaning in Progress' && <Clock size={16} />}
                      {currentStatus === 'Dirty / Needs Cleaning' && <AlertCircle size={16} />}
                      <span>{currentStatus}</span>
                    </div>

                    {/* 4-Item Hygiene & Readiness Checklist */}
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.35rem',
                      marginBottom: '0.85rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={chk.towels}
                          onChange={() => toggleRoomCheck(room.roomNumber, 'towels')}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>Fresh Towels</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={chk.bedsheets}
                          onChange={() => toggleRoomCheck(room.roomNumber, 'bedsheets')}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>Clean Bedsheet</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={chk.remotes}
                          onChange={() => toggleRoomCheck(room.roomNumber, 'remotes')}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>AC/TV Remotes</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={chk.water}
                          onChange={() => toggleRoomCheck(room.roomNumber, 'water')}
                          style={{ accentColor: '#10B981' }}
                        />
                        <span>Mineral Water</span>
                      </label>
                    </div>

                    {/* 1-Tap Toggle Button */}
                    <button
                      onClick={() => updateHousekeeping(room.roomNumber, nextStatus)}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Mark: "{nextStatus}"</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. MORNING-TO-EVENING CARETAKER CHECKLIST */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--gold-primary)" />
          <span>Hafij's Morning-to-Evening Caretaker Protocol</span>
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Key property maintenance checkpoints to guarantee guest comfort and uninterrupted utilities.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {[
            { key: 'waterPump', label: '07:00 AM • Water Pump & Overhead Tank Level Check', desc: 'Ensure 24/7 continuous running water in all 10 rooms.' },
            { key: 'corridors', label: '08:30 AM • Corridors & Staircase Mopping', desc: 'Disinfect Ground, 1st & 2nd floor guest corridors.' },
            { key: 'lighting', label: '05:30 PM • Entrance & Staircase Lighting Check', desc: 'Switch on illuminated hotel signboards & safety lamps.' },
            { key: 'parkingGate', label: '09:30 PM • Main Parking Gate & Vehicle Security Check', desc: 'Verify overnight guest car security and lock main gate.' }
          ].map(chk => (
            <div
              key={chk.key}
              onClick={() => {
                setCaretakerChecklist(prev => ({ ...prev, [chk.key]: !prev[chk.key] }));
                showToast(`Updated Caretaker Check: ${chk.label}`, 'info');
              }}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                background: caretakerChecklist[chk.key] ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: caretakerChecklist[chk.key] ? '1.5px solid #10B981' : '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                {caretakerChecklist[chk.key] ? <CheckSquare size={18} color="#10B981" /> : <Square size={18} color="var(--text-muted)" />}
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: caretakerChecklist[chk.key] ? '#10B981' : '#FFFFFF' }}>
                  {chk.label}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.6rem' }}>
                {chk.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
