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
  Info
} from 'lucide-react';

export const HousekeepingDesk = () => {
  const { 
    physicalRooms, 
    updateHousekeeping, 
    togglePhysicalRoom,
    tasks, 
    toggleTask,
    staffSession 
  } = useHotel();

  // Housekeeping specific tasks
  const housekeepingTasks = tasks.filter(t => t.assignedRole === 'housekeeping' || t.title.toLowerCase().includes('clean') || t.title.toLowerCase().includes('linen'));

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
              Housekeeping & Room Hygiene Desk
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Live cleaning status across all 9 physical rooms (`101` to `304`). Tap a room to toggle cleaning progress.
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
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dirty / Needs Linen</div>
          </div>
        </div>
      </div>

      {/* 9 Rooms Grid Grouped by Floor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { floorTitle: '1st Floor • Luxury Suite', rooms: physicalRooms.filter(r => r.floorNumber === 1 || r.floor?.includes('1st')) },
          { floorTitle: '2nd Floor • Executive Deluxe & Twin Rooms', rooms: physicalRooms.filter(r => r.floorNumber === 2 || r.floor?.includes('2nd')) },
          { floorTitle: '3rd Floor • Deluxe & Budget Single Rooms', rooms: physicalRooms.filter(r => r.floorNumber === 3 || r.floor?.includes('3rd')) }
        ].map((floorGroup, fIdx) => (
          <div key={fIdx} className="glass-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold-light)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
              {floorGroup.floorTitle}
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem'
            }}>
              {floorGroup.rooms.map((room) => {
                const currentStatus = room.cleaningStatus || 'Clean & Ready';
                const statusColor = getStatusColor(currentStatus);
                const statusBg = getStatusBg(currentStatus);
                const nextStatus = getNextStatus(currentStatus);

                return (
                  <div
                    key={room.roomNumber}
                    style={{
                      padding: '1.2rem',
                      borderRadius: '8px',
                      background: 'rgba(7, 11, 20, 0.8)',
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
                      marginBottom: '1rem'
                    }}>
                      {currentStatus === 'Clean & Ready' && <CheckCircle2 size={16} />}
                      {currentStatus === 'Cleaning in Progress' && <Clock size={16} />}
                      {currentStatus === 'Dirty / Needs Cleaning' && <AlertCircle size={16} />}
                      <span>{currentStatus}</span>
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
                      <span>Change to: "{nextStatus}"</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Housekeeping SOP Checklist */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--gold-primary)" />
          <span>Housekeeping Daily Sanitization Checklist</span>
        </h4>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Tick off completed tasks as room cleaning and hotel grounds care are completed.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {housekeepingTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id, staffSession?.staffName)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                background: task.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: task.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer'
              }}
            >
              {task.completed ? (
                <CheckSquare size={18} color="#10B981" />
              ) : (
                <Square size={18} color="var(--text-muted)" />
              )}
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: task.completed ? 'var(--text-muted)' : '#FFFFFF',
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}>
                  {task.title}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginLeft: '0.75rem' }}>
                  ({task.time})
                </span>
              </div>
              {task.completedBy && (
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>
                  Done by {task.completedBy}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
