import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  CheckSquare, 
  Square, 
  Clock, 
  Phone, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Shield,
  Briefcase
} from 'lucide-react';

export const StaffRosterDesk = () => {
  const { 
    staff, 
    updateStaff, 
    tasks, 
    toggleTask, 
    addTask, 
    staffSession, 
    staffRoles 
  } = useHotel();

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('reception');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('+91 ');
  const [newStaffShift, setNewStaffShift] = useState('Day (8 AM - 4 PM)');

  // New task form state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskRole, setNewTaskRole] = useState('kitchen');
  const [newTaskTime, setNewTaskTime] = useState('10:00 AM');
  const [newTaskPriority, setNewTaskPriority] = useState('High');

  // Handle Attendance Toggle (On Duty -> Off Duty / Leave)
  const handleToggleAttendance = (staffMember) => {
    const nextStatus = staffMember.status === 'On Duty' ? 'Off Duty' : 'On Duty';
    updateStaff({ ...staffMember, status: nextStatus });
  };

  // Add new staff
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim()) return;

    const roleInfo = staffRoles[newStaffRole] || {};
    updateStaff({
      name: newStaffName.trim(),
      role: newStaffRole,
      roleTitle: roleInfo.title || newStaffRole,
      pin: newStaffPin.trim(),
      phone: newStaffPhone.trim(),
      shift: newStaffShift,
      status: 'On Duty',
      joinedDate: new Date().toISOString().split('T')[0]
    });

    setShowAddStaffModal(false);
    setNewStaffName('');
    setNewStaffPin('');
  };

  // Add new task
  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      assignedRole: newTaskRole,
      time: newTaskTime,
      priority: newTaskPriority
    });

    setShowAddTaskModal(false);
    setNewTaskTitle('');
  };

  return (
    <div className="staff-roster-wrapper">
      
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'rgba(212, 175, 55, 0.08)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Users size={22} color="var(--gold-primary)" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>
              Staff Duty Roster & Daily Operations Manager
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Monitor real-time employee attendance, role logins, and daily operational accountability checklists.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={15} />
            <span>+ Assign Daily Task</span>
          </button>

          {staffSession?.role === 'owner' && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={15} />
              <span>+ Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Roster Cards */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserCheck size={18} color="var(--gold-primary)" />
          <span>Active Employees & Department Work Desks ({staff.length})</span>
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.25rem'
        }}>
          {staff.map((member) => {
            const roleInfo = staffRoles[member.role] || {};
            const isOnDuty = member.status === 'On Duty';

            return (
              <div
                key={member.id}
                className="glass-card"
                style={{
                  padding: '1.35rem',
                  border: isOnDuty ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative'
                }}
              >
                {/* Role Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    background: 'rgba(212, 175, 55, 0.12)',
                    color: roleInfo.color || 'var(--gold-primary)'
                  }}>
                    {roleInfo.badge || member.roleTitle}
                  </span>

                  <button
                    onClick={() => handleToggleAttendance(member)}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isOnDuty ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                      color: isOnDuty ? '#10B981' : 'var(--text-muted)'
                    }}
                  >
                    ● {member.status || 'On Duty'}
                  </button>
                </div>

                {/* Name & Title */}
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                  {member.name}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {member.roleTitle}
                </div>

                {/* Shift & Phone */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <Clock size={13} />
                    <span>Shift: {member.shift || 'Full Day'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color="var(--gold-primary)" />
                    <a href={`tel:${member.phone}`} style={{ color: 'var(--gold-light)', textDecoration: 'none' }}>
                      {member.phone || '+91 96785 82286'}
                    </a>
                  </div>
                </div>

                {/* Login PIN Reminder (Only visible to Owner) */}
                {staffSession?.role === 'owner' && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Login PIN: <strong>{member.pin}</strong></span>
                    <span>Joined: {member.joinedDate || '2024'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Tasks Checklist */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
              Daily Operational Task Checklist
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Hotel staff can tick off duties as they are completed. All actions sync in real-time.
            </p>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--gold-light)', fontWeight: 700 }}>
            {tasks.filter(t => t.completed).length} of {tasks.length} Duties Completed
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task) => {
            const isDone = task.completed;
            const roleInfo = staffRoles[task.assignedRole] || {};

            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id, staffSession?.staffName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1.1rem',
                  borderRadius: '8px',
                  background: isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {isDone ? (
                  <CheckSquare size={20} color="#10B981" />
                ) : (
                  <Square size={20} color="var(--text-muted)" />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: isDone ? 'var(--text-muted)' : '#FFFFFF',
                    textDecoration: isDone ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span style={{ color: roleInfo.color || 'var(--gold-primary)' }}>
                      Assigned: {roleInfo.title || task.assignedRole}
                    </span>
                    <span>•</span>
                    <span>Schedule: {task.time}</span>
                    <span>•</span>
                    <span style={{ color: task.priority === 'High' ? '#EF4444' : '#F59E0B' }}>
                      Priority: {task.priority}
                    </span>
                  </div>
                </div>

                {isDone && task.completedBy && (
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    Verified by {task.completedBy}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ADD NEW EMPLOYEE                                                */}
      {/* ---------------------------------------------------------------------- */}
      {showAddStaffModal && (
        <div className="modal-backdrop" onClick={() => setShowAddStaffModal(false)} style={{
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
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              border: '2px solid var(--gold-primary)',
              borderRadius: 'var(--radius-lg)',
              background: '#070B14'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                Add New Staff Member
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Full Name: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pranab Kalita"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Role & Department: *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#0B1120',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF'
                  }}
                >
                  <option value="reception">🛎️ Front Desk / Reception</option>
                  <option value="kitchen">👨‍🍳 Kitchen Chef / Store</option>
                  <option value="delivery">🛵 Delivery Boy / Waiter</option>
                  <option value="housekeeping">🧹 Housekeeping / Room Staff</option>
                  <option value="owner">👑 Super Admin / Owner</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Login PIN: *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="e.g. 2345"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#FFFFFF'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Phone Number:
                  </label>
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Duty Shift Timing:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning (8 AM - 4 PM)"
                  value={newStaffShift}
                  onChange={(e) => setNewStaffShift(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: ASSIGN DAILY OPERATIONAL TASK                                   */}
      {/* ---------------------------------------------------------------------- */}
      {showAddTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)} style={{
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
                Assign Operational Duty
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Duty Description: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect commercial gas pipes & safety valves"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Assigned Role:
                  </label>
                  <select
                    value={newTaskRole}
                    onChange={(e) => setNewTaskRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0B1120',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#FFFFFF'
                    }}
                  >
                    <option value="kitchen">👨‍🍳 Kitchen</option>
                    <option value="reception">🛎️ Reception</option>
                    <option value="housekeeping">🧹 Housekeeping</option>
                    <option value="delivery">🛵 Delivery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Priority:
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#0B1120',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#FFFFFF'
                    }}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
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
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
