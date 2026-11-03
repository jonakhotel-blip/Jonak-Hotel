import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Key, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  Globe, 
  ShieldAlert, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';

export const SecurityDesk = () => {
  const { 
    currentUser, 
    fetchAuditLogs, 
    fetchUsersAndInvitations, 
    createInvitation, 
    updateUserStatus, 
    fetchActiveSessions, 
    revokeSession, 
    showToast 
  } = useHotel();

  // Sub-tab: 'USERS' | 'INVITATIONS' | 'SESSIONS' | 'AUDIT_LOGS' | 'ADVISORY'
  const [subTab, setSubTab] = useState('USERS');

  // Users & Invitations state
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Invite Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load data based on active subTab
  const loadUsersAndInvites = async () => {
    setIsLoadingUsers(true);
    const res = await fetchUsersAndInvitations();
    if (res.success) {
      setUsers(res.users || []);
      setInvitations(res.invitations || []);
    }
    setIsLoadingUsers(false);
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const res = await fetchActiveSessions();
    if (res.success) {
      setSessions(res.sessions || []);
    }
    setIsLoadingSessions(false);
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const filterEvent = logFilter === 'ALL' ? '' : logFilter;
    const res = await fetchAuditLogs(100, filterEvent);
    if (res.success) {
      setAuditLogs(res.logs || []);
    }
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    if (subTab === 'USERS' || subTab === 'INVITATIONS') {
      loadUsersAndInvites();
    } else if (subTab === 'SESSIONS') {
      loadSessions();
    } else if (subTab === 'AUDIT_LOGS') {
      loadLogs();
    }
  }, [subTab, logFilter]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      showToast('Please provide an email and full name.', 'error');
      return;
    }
    setIsSubmittingInvite(true);
    const res = await createInvitation({
      email: inviteEmail,
      name: inviteName,
      role: inviteRole
    });
    setIsSubmittingInvite(false);

    if (res.success && res.invitation) {
      setGeneratedInviteUrl(res.invitation.inviteUrl);
      showToast('Invitation generated successfully!', 'success');
      loadUsersAndInvites();
    } else {
      showToast(res.error || 'Failed to create invitation.', 'error');
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'suspend' : 'activate'} account ${user.email}?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await updateUserStatus(user.id, nextStatus);
    if (res.success) {
      showToast(`User ${user.email} is now ${nextStatus}.`, 'success');
      loadUsersAndInvites();
    } else {
      showToast(res.error || 'Failed to update user status.', 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Revoke this session immediately? The user will be signed out.')) return;
    const res = await revokeSession(sessionId);
    if (res.success) {
      showToast('Session revoked successfully.', 'success');
      loadSessions();
    } else {
      showToast(res.error || 'Failed to revoke session.', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Copied to clipboard!', 'info');
  };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      
      {/* Module Title & Owner Security Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        paddingBottom: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid var(--gold-primary)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Owner Security & Staff Access Control
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zero Shared PINs • Mandatory MFA • Role-Based Server Authorization • Cryptographic Audit Trails
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setGeneratedInviteUrl('');
            setInviteEmail('');
            setInviteName('');
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <UserPlus size={16} />
          <span>Invite Staff / Manager</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '0.75rem'
      }}>
        {[
          { id: 'USERS', label: `Registered Accounts (${users.length})`, icon: Users },
          { id: 'INVITATIONS', label: `Pending Invitations (${invitations.filter(i => !i.used).length})`, icon: Key },
          { id: 'SESSIONS', label: 'Active Sessions', icon: Globe },
          { id: 'AUDIT_LOGS', label: 'Security Audit Log', icon: History },
          { id: 'ADVISORY', label: 'Owner Rotation Advisory', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REGISTERED USERS */}
      {subTab === 'USERS' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Authorized User Accounts
            </h3>
            <button onClick={loadUsersAndInvites} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {isLoadingUsers ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading accounts...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No accounts registered.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User & Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>MFA Security</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Last Login</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = currentUser?.id === u.id;
                    const roleBadge = u.role === 'owner' 
                      ? { bg: 'rgba(212,175,55,0.2)', border: '#D4AF37', text: '#FDE047', label: '👑 Owner' }
                      : u.role === 'manager'
                      ? { bg: 'rgba(59,130,246,0.2)', border: '#3B82F6', text: '#93C5FD', label: '👔 Manager' }
                      : { bg: 'rgba(16,185,129,0.2)', border: '#10B981', text: '#6EE7B7', label: '🛎️ Staff' };

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{u.name} {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>(You)</span>}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: roleBadge.bg,
                            border: `1px solid ${roleBadge.border}`,
                            color: roleBadge.text,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {roleBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {u.mfaEnabled ? (
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                              <CheckCircle2 size={13} /> TOTP + Recovery Codes ({u.recoveryCodesRemaining || 8} left)
                            </span>
                          ) : (
                            <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                              <AlertTriangle size={13} /> Pending Setup
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: u.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: u.status === 'active' ? '#34D399' : '#EF4444',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {u.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              style={{
                                background: u.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                border: u.status === 'active' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                                color: u.status === 'active' ? '#EF4444' : '#10B981',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                fontWeight: 600
                              }}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVITATIONS */}
      {subTab === 'INVITATIONS' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Owner-Controlled Invitations
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Public self-registration is permanently disabled. New accounts must be invited by the Hotel Owner.
              </p>
            </div>
            <button onClick={loadUsersAndInvites} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {invitations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No pending invitations. Click "Invite Staff / Manager" above to create an access link.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Invited Candidate</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Target Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Expires In</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Invitation Token</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => {
                    const isExpired = Date.now() > inv.expiresAt;
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{inv.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: inv.role === 'manager' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                            color: inv.role === 'manager' ? '#93C5FD' : '#6EE7B7',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {inv.role === 'manager' ? '👔 Manager' : '🛎️ Staff'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {isExpired ? 'Expired' : new Date(inv.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: inv.used ? 'rgba(16,185,129,0.15)' : isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: inv.used ? '#34D399' : isExpired ? '#EF4444' : '#F59E0B',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {inv.used ? 'Claimed' : isExpired ? 'Expired' : 'Active Link'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          {!inv.used && !isExpired && (
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/#accept-invite?token=${inv.token}`)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            >
                              <Copy size={12} /> Copy Invite Link
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {subTab === 'SESSIONS' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Active Authenticated Sessions
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Sessions expire after 12 hours or 2 hours of inactivity. Any session can be revoked immediately.
              </p>
            </div>
            <button onClick={loadSessions} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {isLoadingSessions ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active sessions found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Client IP</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Last Active</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {s.name} {s.isCurrent && <span style={{ fontSize: '0.7rem', color: '#10B981' }}>(Current Device)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {s.ip}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {new Date(s.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#EF4444',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {subTab === 'AUDIT_LOGS' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Security & Critical Activity Audit Trail
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Immutable chronological log of authentications, role changes, settings updates, and security events.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
              >
                <option value="ALL">All Event Types</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                <option value="MFA_FAILED">MFA_FAILED</option>
                <option value="RECOVERY_CODE_USED">RECOVERY_CODE_USED</option>
                <option value="INVITATION_CREATED">INVITATION_CREATED</option>
                <option value="CSRF_VALIDATION_FAILED">CSRF_VALIDATION_FAILED</option>
                <option value="LOGOUT">LOGOUT</option>
              </select>
              <button onClick={loadLogs} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {isLoadingLogs ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit logs found for this filter.</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', position: 'sticky', top: 0, background: '#070B14' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Timestamp</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Event</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>User / Email</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>IP Address</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(l => {
                    const statusColor = l.status === 'SUCCESS' ? '#10B981' : l.status === 'FAILURE' ? '#EF4444' : l.status === 'WARNING' ? '#F59E0B' : '#60A5FA';
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                          <code>{l.event}</code>
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>
                          {l.email || 'Anonymous'}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.75rem' }}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {l.ip}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {l.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: OWNER ROTATION & SECURITY ADVISORY */}
      {subTab === 'ADVISORY' && (
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--gold-primary)' }}>
            <ShieldAlert size={28} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Owner Security & Credential Rotation Protocol
            </h3>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.4rem' }}>
                1. Immediate Rotation of Legacy PINs & Initial Passwords
              </div>
              <p style={{ margin: 0 }}>
                The legacy public footer PIN (<code>1234</code>) has been completely eradicated from the UI and client-side code.
                In your hosting environment (e.g. Render Dashboard / Hostinger Server), set the following environment variables before production launch:
              </p>
              <pre style={{ background: '#070B14', padding: '0.75rem', borderRadius: '6px', color: '#10B981', marginTop: '0.5rem', fontSize: '0.8rem', overflowX: 'auto' }}>
{`INITIAL_OWNER_PASSWORD=YourStrongUniquePassword2026!
NODE_ENV=production
SESSION_SECRET=a_random_32_character_cryptographic_secret`}
              </pre>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#34D399', marginBottom: '0.4rem' }}>
                2. Mandatory Multi-Factor Authentication (MFA)
              </div>
              <p style={{ margin: 0 }}>
                Every owner, manager, and staff account is required to complete RFC 6238 TOTP verification using Google Authenticator, Microsoft Authenticator, or Apple Keychain on every login.
                Keep your 8 single-use emergency recovery codes stored in an offline password manager.
              </p>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#93C5FD', marginBottom: '0.4rem' }}>
                3. Privacy & Government ID Compliance
              </div>
              <p style={{ margin: 0 }}>
                In strict compliance with privacy regulations, guest Aadhaar/Govt ID cards are <strong>never collected or stored through the website</strong>. Identity verification is conducted safely in-person at the front desk upon physical check-in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION MODAL */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Create Staff Invitation
              </h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {!generatedInviteUrl ? (
              <form onSubmit={handleCreateInvite}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kalita"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Official Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@jonakhotelgroup.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="staff">Staff (Kitchen, Housekeeping, Delivery)</option>
                    <option value="manager">Manager (Rooms, Bookings, Orders, Menu)</option>
                  </select>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Managers can update room tariffs and menu prices, but cannot access security settings or audit logs.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingInvite} className="btn btn-primary">
                    {isSubmittingInvite ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#10B981' }}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 700, color: '#fff' }}>Invitation Link Ready!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Share this one-time link with {inviteName}. Valid for 48 hours.
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.78rem',
                  wordBreak: 'break-all',
                  marginBottom: '1.25rem',
                  color: 'var(--gold-light)'
                }}>
                  {generatedInviteUrl}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Invitation Link'}</span>
                  </button>
                  <button onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
