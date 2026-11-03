import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useHotel, playNotificationChime } from '../context/HotelContext';
import {
  Lock,
  Unlock,
  LayoutDashboard,
  UtensilsCrossed,
  BedDouble,
  Settings as SettingsIcon,
  ShoppingBag,
  Phone,
  MessageCircle,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Bell,
  Bike,
  Flame,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  Calendar,
  Eye,
  LogOut,
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Wifi,
  ShieldCheck,
  FileText,
  BarChart3,
  Boxes,
  Users,
  CheckSquare,
  ChefHat,
  Truck,
  Sparkle,
  Key,
  EyeOff,
  Mail,
  ShieldAlert,
  Fingerprint,
  Volume2,
  VolumeX,
  Tag,
  Percent,
  RefreshCw
} from 'lucide-react';

import { AnalyticsDesk } from './erp/AnalyticsDesk';
import { InventoryDesk } from './erp/InventoryDesk';
import { KitchenDesk } from './erp/KitchenDesk';
import { DeliveryDesk } from './erp/DeliveryDesk';
import { HousekeepingDesk } from './erp/HousekeepingDesk';
import { StaffRosterDesk } from './erp/StaffRosterDesk';
import { SecurityDesk } from './erp/SecurityDesk';

export const AdminPanel = ({ onExitAdmin }) => {
  const {
    hotelInfo,
    settings,
    updateSettings,
    menu,
    toggleDishStock,
    updateDishPrice,
    toggleDishBestSeller,
    addDish,
    deleteDish,
    rooms,
    updateRoom,
    physicalRooms,
    togglePhysicalRoom,
    orders,
    updateOrderStatus,
    bookings,
    updateRoomBookingStatus,
    eventEnquiries,
    updateEventEnquiryStatus,
    resetToDefaults,
    showToast,
    isAdminAuthenticated,
    currentUser,
    loginStep1,
    verifyMfa,
    adminLogin,
    adminLogout,
    forgotPassword,
    resetPassword,
    acceptInvitation,
    isCloudSynced,
    // ERP Ecosystem
    staffRoles,
    staff,
    rawInventory,
    expenses,
    tasks,
    staffSession,
    setStaffSession,
    updateHousekeeping,
    // Offers & Promos
    offers,
    addOffer,
    toggleOffer,
    deleteOffer,
    // Audible Alert System & Counters
    soundAlertsEnabled,
    toggleSoundAlerts,
    testSoundAlert,
    unreadAlertsCount,
    setUnreadAlertsCount,
    // Reports & Notifications
    fetchFinancialReport,
    fetchNotificationLogs,
    // 4-Team PIN Authentication, KYC & Export
    loginWithPin,
    verifyKyc,
    exportCustomersCsv,
    addTask
  } = useHotel();

  // Offers Management State
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [offerCode, setOfferCode] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('');
  const [offerMinOrder, setOfferMinOrder] = useState('399');
  const [offerMaxDiscount, setOfferMaxDiscount] = useState('150');
  const [offerValidUntil, setOfferValidUntil] = useState('2026-12-31');

  // Financial Reports State
  const [financialData, setFinancialData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Customer Notifications Outbox State
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Authentication & Multi-Factor State
  const [authMode, setAuthMode] = useState('PIN'); // 'PIN' | 'SIGNIN' | 'MFA' | 'FORGOT' | 'RESET' | 'INVITE'
  const [pinInput, setPinInput] = useState('');
  const [selectedPinMember, setSelectedPinMember] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Active Admin Tab: default based on user role
  const [activeTab, setActiveTab] = useState(() => {
    const role = currentUser?.role || staffSession?.role || 'owner';
    if (role === 'kitchen') return 'KITCHEN';
    if (role === 'housekeeping') return 'HOUSEKEEPING';
    if (role === 'reception' || role === 'manager') return 'ROOMS';
    return 'ANALYTICS';
  });

  // 4 Authorized Team Profiles for Instant Role Workspace Access
  const TEAM_PROFILES = [
    {
      id: 'STF-101',
      name: 'Shahidul Islam',
      role: 'owner',
      roleTitle: '👑 Proprietor / Super Admin',
      pin: '1234',
      badge: 'Super Admin',
      color: '#D4AF37',
      desc: 'Financial Command Center • P&L Analytics • Customer CRM Export • Expense Ledger'
    },
    {
      id: 'STF-102',
      name: 'Hafijur',
      role: 'reception',
      roleTitle: '🛎️ Reception, Billing & KYC Desk',
      pin: '2222',
      badge: 'Reception Desk',
      color: '#3B82F6',
      desc: 'All-in-One POS Billing (Print/WhatsApp) • Guest KYC Document Verification • Staff Dispatch'
    },
    {
      id: 'STF-103',
      name: 'Master Chef',
      role: 'kitchen',
      roleTitle: '👨‍🍳 Head Master Chef & KDS Lead',
      pin: '3333',
      badge: 'Master Chef',
      color: '#FF9900',
      desc: 'Dual-Lane KDS (VIP In-Room Lane 1 vs Dine-in Lane 2) • 1-Tap Stockout • Raw Ration Tracker'
    },
    {
      id: 'STF-105',
      name: 'Hafij',
      role: 'housekeeping',
      roleTitle: '🏃‍♂️ All-Rounder Caretaker & Housekeeping',
      pin: '5555',
      badge: 'Caretaker',
      color: '#A855F7',
      desc: 'Live Task & Alert Banner • 10-Room Readiness Grid (Red/Yellow/Green) • Daily Sanitization SOP'
    }
  ];

  const handlePinSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) {
      setAuthError('Please enter a 4-digit staff PIN.');
      return;
    }
    setAuthError('');
    setIsSubmittingAuth(true);
    const result = await loginWithPin(pin);
    setIsSubmittingAuth(false);
    if (result && result.success) {
      const role = result.user?.role;
      if (role === 'kitchen') setActiveTab('KITCHEN');
      else if (role === 'housekeeping') setActiveTab('HOUSEKEEPING');
      else if (role === 'reception') setActiveTab('ROOMS');
      else setActiveTab('ANALYTICS');
    } else {
      setAuthError(result?.error || 'Invalid PIN. Please try again.');
    }
  };
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState(null); // { tempToken, email, role, mfaSetupRequired, totpUri, secret, recoveryCodes }
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [mfaQrDataUrl, setMfaQrDataUrl] = useState('');
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [hasCopiedRecovery, setHasCopiedRecovery] = useState(false);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Accept Invitation State
  const [inviteTokenInput, setInviteTokenInput] = useState('');
  const [inviteNameInput, setInviteNameInput] = useState('');
  const [invitePasswordInput, setInvitePasswordInput] = useState('');

  // Active Admin Tab: default based on user role
  const [activeTab, setActiveTab] = useState(() => {
    const role = currentUser?.role || staffSession?.role || 'owner';
    if (role === 'staff') return 'KITCHEN';
    if (role === 'manager') return 'ROOMS';
    return 'ANALYTICS';
  });

  // Auto-fetch data for dynamic reports and notifications
  useEffect(() => {
    if (activeTab === 'REPORTS') {
      setIsLoadingReport(true);
      if (typeof fetchFinancialReport === 'function') {
        fetchFinancialReport().then(data => {
          setFinancialData(data);
          setIsLoadingReport(false);
        }).catch(() => setIsLoadingReport(false));
      } else {
        setIsLoadingReport(false);
      }
    } else if (activeTab === 'NOTIFICATIONS') {
      setIsLoadingNotifications(true);
      if (typeof fetchNotificationLogs === 'function') {
        fetchNotificationLogs().then(logs => {
          setNotificationLogs(logs || []);
          setIsLoadingNotifications(false);
        }).catch(() => setIsLoadingNotifications(false));
      } else {
        setIsLoadingNotifications(false);
      }
    }
  }, [activeTab, fetchFinancialReport, fetchNotificationLogs]);

  // Menu Search & Filter
  const [dishSearch, setDishSearch] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('ALL');
  const [showAddDishModal, setShowAddDishModal] = useState(false);

  // New Dish Form
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Biryani');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(false);
  const [newDishDesc, setNewDishDesc] = useState('');

  // Orders status filter
  const [orderFilter, setOrderFilter] = useState('ALL');

  // QR Code Generator States
  const [qrTargetType, setQrTargetType] = useState('ROOM'); // 'ROOM' | 'TABLE'
  const [qrTargetValue, setQrTargetValue] = useState('101');
  const [qrCustomDomain, setQrCustomDomain] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://jonakhotelgroup.in';
  });
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState('');
  const [viewKycBooking, setViewKycBooking] = useState(null);

  // Re-generate QR whenever parameters change
  useEffect(() => {
    const cleanBase = qrCustomDomain.replace(/\/+$/, '');
    const paramKey = qrTargetType === 'ROOM' ? 'room' : 'table';
    const targetUrl = `${cleanBase}/?${paramKey}=${encodeURIComponent(qrTargetValue)}`;

    QRCode.toDataURL(targetUrl, {
      width: 380,
      margin: 2,
      color: {
        dark: '#070B14',
        light: '#FFFFFF'
      }
    }).then(url => {
      setGeneratedQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR:', err);
    });
  }, [qrTargetType, qrTargetValue, qrCustomDomain]);

  // --------------------------------------------------------------------------
  // MODERN AUTHENTICATION & MULTI-FACTOR HANDLERS
  // --------------------------------------------------------------------------

  // Step 1: Email + Password Submission
  const handleSignInStep1 = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter both your work email and password.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await loginStep1({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });

      if (res.success && res.requiresMfa) {
        setMfaChallenge(res);
        setMfaCode('');
        setUseRecoveryCode(false);
        setAuthMode('MFA');

        // If first-time MFA setup, generate QR Code
        if (res.totpUri) {
          try {
            const qrUrl = await QRCode.toDataURL(res.totpUri, {
              width: 260,
              margin: 2,
              color: { dark: '#070B14', light: '#FFFFFF' }
            });
            setMfaQrDataUrl(qrUrl);
          } catch (qrErr) {
            console.error('Failed to generate MFA QR Code:', qrErr);
          }
        }
      } else {
        setAuthError(res.error || 'Invalid credentials or access denied.');
      }
    } catch (err) {
      setAuthError('Unable to connect to the authentication service. Please check your connection.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Step 2: MFA Authenticator / Recovery Code Verification
  const handleMfaVerify = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanCode = mfaCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setAuthError(useRecoveryCode ? 'Please enter an 8-character emergency recovery code.' : 'Please enter the 6-digit authenticator code.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await verifyMfa({
        tempToken: mfaChallenge?.tempToken,
        code: cleanCode,
        isRecoveryCode: useRecoveryCode
      });

      if (res.success && res.user) {
        setLoginPassword('');
        setMfaCode('');
        setMfaChallenge(null);

        // Switch to appropriate desk based on role
        if (res.user.role === 'staff') setActiveTab('KITCHEN');
        else if (res.user.role === 'manager') setActiveTab('ROOMS');
        else setActiveTab('ANALYTICS');
      } else {
        setAuthError(res.error || 'Invalid verification code. Please check your authenticator clock or code.');
      }
    } catch (err) {
      setAuthError('Verification failed. Please try again.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!resetEmail.trim()) {
      setAuthError('Please enter your registered account email.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await forgotPassword(resetEmail.trim().toLowerCase());
      setAuthSuccess(res.message || 'If an account exists, a recovery token has been issued.');
      if (res.resetToken) {
        setResetTokenInput(res.resetToken);
        setAuthMode('RESET');
      }
    } catch (err) {
      setAuthError('Failed to process recovery request.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Reset Password Execution
  const handleResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!resetTokenInput.trim()) {
      setAuthError('Reset token is required.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 8) {
      setAuthError('New password must be at least 8 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await resetPassword({
        token: resetTokenInput.trim(),
        newPassword: newPasswordInput
      });

      if (res.success) {
        showToast('Password reset successfully. Please sign in with your new password.', 'success');
        setAuthMode('SIGNIN');
        setLoginEmail(resetEmail || '');
        setLoginPassword('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setResetTokenInput('');
      } else {
        setAuthError(res.error || 'Failed to reset password. The link or token may be expired.');
      }
    } catch (err) {
      setAuthError('Failed to reset password.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Accept Staff / Manager Invitation
  const handleAcceptInvitation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!inviteTokenInput.trim() || !inviteNameInput.trim()) {
      setAuthError('Please provide your invitation token and full name.');
      return;
    }
    if (!invitePasswordInput || invitePasswordInput.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await acceptInvitation({
        token: inviteTokenInput.trim(),
        name: inviteNameInput.trim(),
        password: invitePasswordInput
      });

      if (res.success && res.requiresMfa) {
        setMfaChallenge(res);
        setMfaCode('');
        setUseRecoveryCode(false);
        setAuthMode('MFA');

        if (res.totpUri) {
          try {
            const qrUrl = await QRCode.toDataURL(res.totpUri, {
              width: 260,
              margin: 2,
              color: { dark: '#070B14', light: '#FFFFFF' }
            });
            setMfaQrDataUrl(qrUrl);
          } catch (qrErr) {
            console.error('Failed to generate MFA QR Code:', qrErr);
          }
        }
        showToast('Invitation accepted! Set up your Authenticator app to finalize access.', 'success');
      } else {
        setAuthError(res.error || 'Failed to activate account from invitation.');
      }
    } catch (err) {
      setAuthError('Failed to accept invitation.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Quick dish add submit
  const handleAddNewDish = (e) => {
    e.preventDefault();
    if (!newDishName.trim() || !newDishPrice) {
      showToast('Dish name and price are required.', 'danger');
      return;
    }
    addDish({
      name: newDishName.trim(),
      category: newDishCategory,
      price: parseFloat(newDishPrice),
      isVeg: newDishIsVeg,
      description: newDishDesc.trim() || 'Prepared fresh with authentic spices.'
    });
    setNewDishName('');
    setNewDishPrice('');
    setNewDishDesc('');
    setShowAddDishModal(false);
  };

  // Add promotional offer submit
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    const cleanCode = offerCode.trim().toUpperCase();
    const cleanTitle = offerTitle.trim();
    const pct = parseFloat(offerDiscount);
    const minOrd = parseFloat(offerMinOrder) || 0;
    const maxDisc = parseFloat(offerMaxDiscount) || null;

    if (!cleanCode || !cleanTitle || isNaN(pct) || pct <= 0) {
      showToast('Please provide valid coupon code, title, and discount percentage.', 'danger');
      return;
    }

    if (pct > 50) {
      const confirmMargin = window.confirm(`Margin Safeguard: ${pct}% discount exceeds 50%. Proceed with high discount?`);
      if (!confirmMargin) return;
    }

    await addOffer({
      code: cleanCode,
      title: cleanTitle,
      discountPercent: pct,
      minOrder: minOrd,
      maxDiscount: maxDisc,
      validUntil: offerValidUntil || '2026-12-31'
    });

    setOfferCode('');
    setOfferTitle('');
    setOfferDiscount('');
    setShowAddOfferModal(false);
  };

  // Categories for Menu Manager
  const menuCategories = ['ALL', 'Biryani', 'Chicken Specialties', 'Starters', 'Rolls', 'Momos', 'Fried Rice & Noodles', 'Paneer & Veg', 'Fish & Seafood', 'Tandoori & Kebabs', 'Sizzlers', 'Breads', 'Desserts & Beverages'];

  // Filtered Menu
  const filteredDishes = menu.filter((item) => {
    if (dishCategoryFilter !== 'ALL' && item.category !== dishCategoryFilter) return false;
    if (dishSearch.trim()) {
      const q = dishSearch.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === 'ALL') return true;
    return order.status === orderFilter;
  });

  // Counts for Badges & Summary Cards
  const inStockCount = menu.filter(m => m.inStock).length;
  const outOfStockCount = menu.length - inStockCount;
  const pendingOrdersCount = orders.filter(o => o.status === 'New' || o.status === 'Confirmed').length;
  const pendingBookingsCount = bookings.filter(b => b.status === 'New').length;
  const lowStockAlertCount = (rawInventory || []).filter(item => Number(item.currentStock) <= Number(item.minThreshold)).length;
  const dirtyRoomsCount = (physicalRooms || []).filter(r => r.cleaningStatus === 'Dirty').length;
  const pendingTasksCount = (tasks || []).filter(t => !t.completed).length;

  // Role permissions & visible tabs definition
  const currentRole = currentUser?.role || staffSession?.role || 'staff';

  const roleDefinitions = [
    {
      role: 'owner',
      title: 'Super Admin / Owner',
      icon: '👑',
      color: '#D4AF37',
      desc: 'Master ERP Control • P&L Analytics • Staff Accounts & Audit Log • Store & Rates'
    },
    {
      role: 'manager',
      title: 'Front Desk & Operations Manager',
      icon: '👔',
      color: '#3B82F6',
      desc: 'Rooms 101–304 Check-in/out • Food Orders • Live Menu • Events & Banquets'
    },
    {
      role: 'staff',
      title: 'Kitchen & Operations Staff',
      icon: '🛎️',
      color: '#10B981',
      desc: 'Live KDS Cooking Desk • Housekeeping 9-Rooms • Delivery GPS • Daily Tasks'
    }
  ];

  const allTabs = [
    { id: 'ANALYTICS', label: 'Executive Analytics & P&L', icon: BarChart3, roles: ['owner', 'manager'], badge: null },
    { id: 'ROOMS', label: 'Front Desk & Rooms (101-304)', icon: BedDouble, roles: ['owner', 'manager', 'reception'], badge: pendingBookingsCount > 0 ? pendingBookingsCount : null },
    { id: 'ORDERS', label: `Orders (${orders.length})`, icon: ShoppingBag, roles: ['owner', 'manager', 'reception'], badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: 'MENU', label: '1-Tap Menu Manager', icon: UtensilsCrossed, roles: ['owner', 'manager', 'reception', 'kitchen'], badge: outOfStockCount > 0 ? `${outOfStockCount} Out` : null, badgeColor: '#EF4444' },
    { id: 'EVENTS', label: `Events & Enquiries (${(eventEnquiries || []).length})`, icon: Calendar, roles: ['owner', 'manager', 'reception'], badge: (eventEnquiries || []).filter(e => e.status === 'New').length || null },
    { id: 'KITCHEN', label: 'Kitchen KDS', icon: ChefHat, roles: ['owner', 'manager', 'kitchen', 'staff'], badge: null },
    { id: 'INVENTORY', label: 'Store & Raw Materials', icon: Boxes, roles: ['owner', 'manager', 'kitchen', 'staff'], badge: lowStockAlertCount > 0 ? `${lowStockAlertCount} Low` : null, badgeColor: '#EF4444' },
    { id: 'DELIVERY', label: 'Delivery & Waiters', icon: Truck, roles: ['owner', 'manager', 'staff'], badge: null },
    { id: 'HOUSEKEEPING', label: 'Housekeeping Desk', icon: Sparkles, roles: ['owner', 'manager', 'housekeeping', 'staff'], badge: dirtyRoomsCount > 0 ? `${dirtyRoomsCount} Dirty` : null, badgeColor: '#F59E0B' },
    { id: 'STAFF_TASKS', label: 'Staff & Daily Tasks', icon: Users, roles: ['owner', 'manager', 'reception', 'housekeeping', 'staff'], badge: pendingTasksCount > 0 ? pendingTasksCount : null },
    { id: 'OFFERS', label: `Today's Offers (${(offers || []).length})`, icon: Tag, roles: ['owner', 'manager'], badge: null },
    { id: 'REPORTS', label: 'Financial Reports', icon: FileText, roles: ['owner', 'manager'], badge: null },
    { id: 'NOTIFICATIONS', label: 'Notifications Outbox', icon: Mail, roles: ['owner'], badge: null },
    { id: 'SECURITY', label: 'Staff Accounts & Audit Log', icon: ShieldCheck, roles: ['owner'], badge: null },
    { id: 'QR_CODES', label: 'Room & Table QR Codes', icon: QrCode, roles: ['owner', 'manager', 'reception'], badge: null },
    { id: 'SETTINGS', label: 'Rules & Settings', icon: SettingsIcon, roles: ['owner'], badge: null },
  ];

  const visibleTabs = allTabs.filter(t => t.roles.includes(currentRole));

  // Sync activeTab if current tab is restricted for newly switched role
  useEffect(() => {
    const allowed = allTabs.filter(t => t.roles.includes(currentRole)).map(t => t.id);
    if (!allowed.includes(activeTab)) {
      if (currentRole === 'kitchen') setActiveTab('KITCHEN');
      else if (currentRole === 'housekeeping') setActiveTab('HOUSEKEEPING');
      else if (currentRole === 'reception' || currentRole === 'manager') setActiveTab('ROOMS');
      else setActiveTab('ANALYTICS');
    }
  }, [currentRole]);

  // --------------------------------------------------------------------------
  // 1. MULTI-FACTOR AUTHENTICATION & PRIVATE SIGN-IN SCREEN
  // --------------------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div style={{
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(212,175,55,0.09) 0%, #070B14 75%)'
      }}>
        <div className="glass-card" style={{
          maxWidth: '540px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          position: 'relative'
        }}>
          {/* Back to Customer Site Button */}
          <button
            onClick={onExitAdmin}
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '1.25rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--gold-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              padding: '0.4rem 0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={14} />
            <span>Customer Website</span>
          </button>

          {/* Hotel Crest & Badge */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
            border: '2px solid var(--gold-primary)',
            color: 'var(--gold-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0.5rem auto 1rem',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)'
          }}>
            <Lock size={28} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34D399',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={13} />
            <span>SECURE ENTERPRISE OWNER & STAFF PORTAL</span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {authMode === 'PIN' && 'Team Role Workspaces (4-PIN Quick Login)'}
            {authMode === 'MFA' && 'Two-Factor Verification'}
            {authMode === 'SIGNIN' && 'Authorized Personnel Sign-In'}
            {authMode === 'FORGOT' && 'Reset Account Password'}
            {authMode === 'RESET' && 'Set New Password'}
            {authMode === 'INVITE' && 'Activate Staff Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Jonak Hotel & Restaurant • Barpeta District, Assam<br />
            {authMode === 'PIN' && 'Select your team profile and enter your 4-digit PIN to access your dedicated role workspace.'}
            {authMode === 'SIGNIN' && 'Enter your unique owner/staff credentials. Public self-registration is disabled.'}
            {authMode === 'MFA' && (mfaChallenge?.mfaSetupRequired ? 'First-time setup: Scan the QR code with your Authenticator app and enter the 6-digit code.' : 'Enter the 6-digit TOTP code from your Authenticator app or use an emergency recovery code.')}
            {authMode === 'FORGOT' && 'Enter your registered work email. A password reset token will be issued.'}
            {authMode === 'RESET' && 'Enter the reset token provided and choose a strong new password.'}
            {authMode === 'INVITE' && 'Enter your official invitation token to activate your account and configure 2FA.'}
          </p>

          {/* Feedback Messages */}
          {authError && (
            <div style={{
              color: '#EF4444',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.65rem',
              borderRadius: '8px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div style={{
              color: '#34D399',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.65rem',
              borderRadius: '8px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* MODE 0: 4-TEAM QUICK PIN LOGIN */}
          {authMode === 'PIN' && (
            <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                {TEAM_PROFILES.map((member) => {
                  const isSelected = selectedPinMember?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setSelectedPinMember(member);
                        setPinInput(member.pin);
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? `2px solid ${member.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: `${member.color}25`, color: member.color, fontWeight: 700 }}>
                          {member.badge}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          PIN: {member.pin}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.98rem' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: member.color, fontWeight: 600, marginBottom: '0.35rem' }}>
                        {member.roleTitle}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {member.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PIN Input & Submit */}
              <form onSubmit={handlePinSubmit} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Enter 4-Digit Staff PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="e.g. 1234, 2222, 3333, 5555"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        fontSize: '1.1rem',
                        letterSpacing: '0.2em',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        background: 'rgba(7, 11, 20, 0.9)',
                        border: '1px solid var(--gold-primary)',
                        borderRadius: '6px',
                        color: '#FFFFFF'
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="btn btn-primary"
                    style={{ height: '44px', marginTop: '1.25rem', minWidth: '130px', fontWeight: 800 }}
                  >
                    {isSubmittingAuth ? 'Verifying...' : 'Sign In ➔'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Quick Test: Tap any team card above to auto-fill PIN.</span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('SIGNIN'); setAuthError(''); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Use Email & Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 1: STEP 1 EMAIL & PASSWORD SIGN IN */}
          {authMode === 'SIGNIN' && (
            <form onSubmit={handleSignInStep1} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="e.g. owner@jonakhotelgroup.in"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setAuthError(''); }}
                    className="form-input"
                    autoComplete="username"
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('FORGOT'); setResetEmail(loginEmail); setAuthError(''); setAuthSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-light)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setAuthError(''); }}
                    className="form-input"
                    autoComplete="current-password"
                    style={{ width: '100%', fontSize: '0.9rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, fontSize: '0.95rem' }}
              >
                <Unlock size={16} />
                <span>{isSubmittingAuth ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>

              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Have an invitation token?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('INVITE'); setAuthError(''); setAuthSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Activate Account
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: STEP 2 MFA VERIFICATION & INITIAL SETUP */}
          {authMode === 'MFA' && (
            <form onSubmit={handleMfaVerify} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              {/* If First-Time MFA Provisioning Required */}
              {mfaChallenge?.mfaSetupRequired && (
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} color="var(--gold-primary)" />
                    <span>Setup Google Authenticator / Passkey MFA</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                    1. Open Google Authenticator, Microsoft Authenticator, or 1Password on your phone.<br />
                    2. Scan this QR code or manually paste the secret key below.
                  </div>

                  {mfaQrDataUrl && (
                    <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                      <img
                        src={mfaQrDataUrl}
                        alt="MFA QR Code"
                        style={{ width: '160px', height: '160px', borderRadius: '8px', border: '2px solid var(--gold-primary)', background: '#FFFFFF', padding: '4px' }}
                      />
                    </div>
                  )}

                  {mfaChallenge?.secret && (
                    <div style={{
                      background: '#070B14',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{ color: 'var(--gold-light)', letterSpacing: '0.05em' }}>
                        {mfaChallenge.secret}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(mfaChallenge.secret);
                          setHasCopiedSecret(true);
                          setTimeout(() => setHasCopiedSecret(false), 2000);
                        }}
                        style={{ background: 'none', border: 'none', color: hasCopiedSecret ? '#34D399' : 'var(--text-muted)', cursor: 'pointer' }}
                        title="Copy Secret"
                      >
                        {hasCopiedSecret ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}

                  {/* Single-Use Emergency Recovery Codes */}
                  {Array.isArray(mfaChallenge?.recoveryCodes) && mfaChallenge.recoveryCodes.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FBBF24' }}>
                          ⚠️ Single-Use Emergency Recovery Codes (Save these securely):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(mfaChallenge.recoveryCodes.join('\n'));
                            setHasCopiedRecovery(true);
                            setTimeout(() => setHasCopiedRecovery(false), 2000);
                          }}
                          style={{ background: 'none', border: 'none', color: hasCopiedRecovery ? '#34D399' : 'var(--gold-light)', fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          {hasCopiedRecovery ? 'Copied!' : 'Copy All'}
                        </button>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.35rem',
                        background: '#070B14',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {mfaChallenge.recoveryCodes.map((code, idx) => (
                          <div key={idx} style={{ textAlign: 'center' }}>{code}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MFA Code Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {useRecoveryCode ? 'Enter 8-Character Recovery Code' : 'Enter 6-Digit Authenticator Code'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    maxLength={useRecoveryCode ? 10 : 8}
                    placeholder={useRecoveryCode ? 'e.g. 7A9B3C2D' : '000000'}
                    value={mfaCode}
                    onChange={(e) => { setMfaCode(e.target.value); setAuthError(''); }}
                    className="form-input"
                    autoComplete="one-time-code"
                    autoFocus
                    style={{
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      letterSpacing: useRecoveryCode ? '0.15em' : '0.3em',
                      fontWeight: 800,
                      width: '100%'
                    }}
                  />
                  <Key size={18} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setUseRecoveryCode(!useRecoveryCode); setMfaCode(''); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-light)', cursor: 'pointer', padding: 0 }}
                >
                  {useRecoveryCode ? 'Use Authenticator Code instead' : 'Lost authenticator? Use Recovery Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem' }}
              >
                <ShieldCheck size={16} />
                <span>{isSubmittingAuth ? 'Verifying Code...' : 'Complete Verification'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('SIGNIN'); setMfaChallenge(null); setMfaCode(''); setAuthError(''); }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {authMode === 'FORGOT' && (
            <form onSubmit={handleForgotPassword} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Enter Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner@jonakhotelgroup.in"
                  value={resetEmail}
                  onChange={(e) => { setResetEmail(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}
              >
                <span>{isSubmittingAuth ? 'Processing...' : 'Request Password Recovery'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('SIGNIN'); setAuthError(''); setAuthSuccess(''); }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* MODE 4: RESET PASSWORD WITH TOKEN */}
          {authMode === 'RESET' && (
            <form onSubmit={handleResetPassword} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Password Reset Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 64-character token"
                  value={resetTokenInput}
                  onChange={(e) => { setResetTokenInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPasswordInput}
                  onChange={(e) => { setNewPasswordInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPasswordInput}
                  onChange={(e) => { setConfirmPasswordInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}
              >
                <span>{isSubmittingAuth ? 'Updating Password...' : 'Save New Password'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('SIGNIN'); setAuthError(''); setAuthSuccess(''); }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={14} />
                <span>Cancel & Return to Sign In</span>
              </button>
            </form>
          )}

          {/* MODE 5: ACCEPT INVITATION */}
          {authMode === 'INVITE' && (
            <form onSubmit={handleAcceptInvitation} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Invitation Token (from Owner)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 48-character invitation token"
                  value={inviteTokenInput}
                  onChange={(e) => { setInviteTokenInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.82rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biki Sharma"
                  value={inviteNameInput}
                  onChange={(e) => { setInviteNameInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Create Strong Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={invitePasswordInput}
                  onChange={(e) => { setInvitePasswordInput(e.target.value); setAuthError(''); }}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800, marginBottom: '0.75rem' }}
              >
                <span>{isSubmittingAuth ? 'Activating Account...' : 'Activate & Setup MFA'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setAuthMode('SIGNIN'); setAuthError(''); setAuthSuccess(''); }}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={14} />
                <span>Cancel</span>
              </button>
            </form>
          )}

          {/* Department Workstations Overview (Informational Only - No Exposed Credentials) */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontWeight: 600, textAlign: 'left' }}>
              Authorized Operational Desks:
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.65rem',
              textAlign: 'left'
            }}>
              {roleDefinitions.map(r => (
                <div
                  key={r.role}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${r.color}25`,
                    borderRadius: '8px',
                    padding: '0.65rem 0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{
                    fontSize: '1.25rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: `${r.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.25, marginTop: '2px' }}>
                      {r.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footnote */}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            🔒 Authenticated Session Management • Rate Limiting Active • Unauthorized Access Prohibited
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATED SMART ERP PORTAL
  // --------------------------------------------------------------------------
  const activeRoleMeta = roleDefinitions.find(r => r.role === currentRole) || roleDefinitions[0];

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', paddingBottom: '5rem' }}>

      {/* Top Admin Navigation Header */}
      <header style={{
        background: '#0B1120',
        borderBottom: '1px solid var(--border-gold)',
        padding: '0.75rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 850
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo & Portal Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/jonak.png" alt="Jonak Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--gold-light)' }}>
                  Jonak Portal
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: activeRoleMeta.color,
                  background: `${activeRoleMeta.color}18`,
                  border: `1px solid ${activeRoleMeta.color}45`,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {activeRoleMeta.icon} {currentUser?.role ? (currentUser.role === 'owner' ? 'Owner (Master Access)' : currentUser.role === 'manager' ? 'Manager (Front Desk & Ops)' : 'Staff (Operations Desk)') : activeRoleMeta.title}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                User: <strong style={{ color: '#FFFFFF' }}>{currentUser?.name || staffSession?.staffName || 'Admin'}</strong>
                {currentUser?.email && <span> ({currentUser.email})</span>}
                <span> • Barpeta District</span>
              </div>
            </div>
          </div>

          {/* Quick Sound Alert Test, Cloud Sync & Logout Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Live Cloud Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              color: isCloudSynced ? '#34D399' : '#FBBF24',
              background: isCloudSynced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isCloudSynced ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isCloudSynced ? '#10B981' : '#F59E0B',
                boxShadow: isCloudSynced ? '0 0 8px #10B981' : 'none'
              }} />
              <span className="hide-on-mobile">{isCloudSynced ? 'SSE Real-Time' : 'Syncing...'}</span>
            </div>

            {/* Unread Alerts Counter Badge */}
            {unreadAlertsCount > 0 && (
              <button
                onClick={() => {
                  setUnreadAlertsCount(0);
                  setActiveTab('ORDERS');
                }}
                className="btn btn-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #EF4444',
                  color: '#F87171',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Bell size={12} />
                <span>{unreadAlertsCount} Unread</span>
              </button>
            )}

            {/* Audible Sound Alerts Toggle */}
            <button
              onClick={toggleSoundAlerts}
              className="btn btn-secondary btn-sm"
              title={soundAlertsEnabled ? 'Sound Alerts: ON (Click to Mute)' : 'Sound Alerts: MUTED (Click to Unmute)'}
              style={{
                padding: '0.45rem 0.65rem',
                fontSize: '0.78rem',
                color: soundAlertsEnabled ? '#10B981' : 'var(--text-muted)',
                borderColor: soundAlertsEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {soundAlertsEnabled ? <Volume2 size={15} color="#10B981" /> : <VolumeX size={15} color="#94A3B8" />}
              <span className="hide-on-mobile">{soundAlertsEnabled ? 'Sound ON' : 'Muted'}</span>
            </button>

            {/* Test Chime */}
            <button
              onClick={testSoundAlert}
              className="btn btn-secondary btn-sm"
              title="Test Order Chime"
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            >
              <Bell size={14} color="var(--gold-primary)" />
              <span className="hide-on-mobile">Chime</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="btn btn-gold-outline btn-sm"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Eye size={14} />
              <span className="hide-on-mobile">Customer View</span>
            </button>

            <button
              onClick={() => adminLogout()}
              className="btn btn-secondary btn-sm"
              title="Sign Out of Portal"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogOut size={14} color="#EF4444" />
              <span style={{ color: '#EF4444', fontWeight: 700 }}>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Role-Restricted Tab Switcher Bar */}
        <div className="container" style={{ marginTop: '0.65rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'none'
          }}>
            {visibleTabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 800 : 600,
                    whiteSpace: 'nowrap',
                    borderColor: isActive ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <TabIcon size={14} color={isActive ? '#070B14' : 'var(--gold-primary)'} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span style={{
                      background: tab.badgeColor || '#EF4444',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 900
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Tab Body */}
      <main className="container" style={{ marginTop: '1.75rem' }}>

        {/* ==================================================================
            ERP WORK DESKS (ROLE BASED)
            ================================================================== */}
        {activeTab === 'ANALYTICS' && <AnalyticsDesk />}
        {activeTab === 'KITCHEN' && <KitchenDesk />}
        {activeTab === 'INVENTORY' && <InventoryDesk />}
        {activeTab === 'DELIVERY' && <DeliveryDesk />}
        {activeTab === 'HOUSEKEEPING' && <HousekeepingDesk />}
        {activeTab === 'STAFF_TASKS' && <StaffRosterDesk />}

        {/* ==================================================================
            TAB: OVERVIEW DASHBOARD (COMPATIBILITY)
            ================================================================== */}
        {activeTab === 'DASHBOARD' && (
          <div>
            {/* Top Stat Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {/* Card 1: Today's Food Orders */}
              <div
                className="glass-card"
                onClick={() => setActiveTab('ORDERS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--gold-primary)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Food Orders
                  </span>
                  <ShoppingBag size={20} color="var(--gold-primary)" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {orders.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  {pendingOrdersCount} Active / In Preparation
                </div>
              </div>

              {/* Card 2: Room Bookings */}
              <div
                className="glass-card"
                onClick={() => setActiveTab('ROOMS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #3B82F6' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Room Enquiries
                  </span>
                  <BedDouble size={20} color="#3B82F6" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {bookings.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-warm)', fontWeight: 600 }}>
                  {pendingBookingsCount} New reservation requests
                </div>
              </div>

              {/* Card 3: Active Menu Dishes */}
              <div
                className="glass-card"
                onClick={() => setActiveTab('MENU')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid #10B981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Menu Items
                  </span>
                  <UtensilsCrossed size={20} color="#10B981" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                  {inStockCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {menu.length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: outOfStockCount > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {outOfStockCount > 0 ? `${outOfStockCount} Out of Stock Today` : 'All items in stock'}
                </div>
              </div>

              {/* Card 4: Kitchen Status */}
              <div
                className="glass-card"
                onClick={() => setActiveTab('SETTINGS')}
                style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${settings.kitchenOpen ? '#10B981' : '#EF4444'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Kitchen Status
                  </span>
                  <Bike size={20} color={settings.kitchenOpen ? '#10B981' : '#EF4444'} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: settings.kitchenOpen ? '#10B981' : '#EF4444', marginTop: '0.5rem' }}>
                  {settings.kitchenOpen ? 'OPEN (Delivering)' : 'CLOSED (Offline)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Free Radius: {settings.freeDeliveryRadiusKm} KM
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Actions for Busy Owner */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--gold-light)' }}>
                ⚡ Quick Owner Shortcuts (1-Tap Controls)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* 1. Toggle Kitchen */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Kitchen Status</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepting food delivery</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ kitchenOpen: !settings.kitchenOpen })}
                    className={settings.kitchenOpen ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                    style={{ background: settings.kitchenOpen ? '#10B981' : '#EF4444', color: '#FFF' }}
                  >
                    {settings.kitchenOpen ? 'Open' : 'Closed'}
                  </button>
                </div>

                {/* 2. Announcement Banner Toggle */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Announcement Bar</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special offer marquee</div>
                  </div>
                  <button
                    onClick={() => updateSettings({ announcementActive: !settings.announcementActive })}
                    className="btn btn-sm"
                    style={{ background: settings.announcementActive ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)', color: settings.announcementActive ? '#070B14' : '#FFF' }}
                  >
                    {settings.announcementActive ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* 3. Add New Dish Quick Button */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Add New Dish</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Put item on menu in 10s</div>
                  </div>
                  <button
                    onClick={() => { setActiveTab('MENU'); setShowAddDishModal(true); }}
                    className="btn btn-gold-outline btn-sm"
                  >
                    <Plus size={14} />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview on Dashboard */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Recent Orders & Enquiries
                </h3>
                <button onClick={() => setActiveTab('ORDERS')} className="btn btn-secondary btn-sm">
                  View All Orders
                </button>
              </div>

              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>#{order.id}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{order.customerName}</span>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{order.mode}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {order.items.map(i => `${i.name} (${i.qty})`).join(', ')} • <strong>₹{order.total}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={`tel:${order.phone}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hello ${order.customerName}, regarding your Jonak Hotel order #${order.id}...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================================================================
            TAB 2: ORDERS & BOOKINGS LOG
            ================================================================== */}
        {activeTab === 'ORDERS' && (
          <div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Live Orders & Room Bookings
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Manage incoming food deliveries, in-room dining orders, and hotel room bookings
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['ALL', 'New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`btn btn-sm ${orderFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <ShoppingBag size={40} color="var(--gold-primary)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                <h4>No orders found with status "{orderFilter}"</h4>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      borderLeft: order.status === 'New' ? '4px solid #EF4444' : order.status === 'Delivered' ? '4px solid #10B981' : '4px solid var(--gold-primary)'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                          #{order.id}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {order.customerName}
                        </span>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                          {order.mode}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.time}
                        </span>
                      </div>

                      {/* Status Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="form-select"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--gold-primary)',
                            color: '#FFFFFF'
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr',
                      gap: '1rem',
                      alignItems: 'start'
                    }} className="order-details-grid">
                      <div>
                        {/* Address or Room */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          <strong>Location / Address:</strong> {order.address} {order.distanceKm > 0 && `(~${order.distanceKm} KM)`}
                        </div>

                        {/* Items list */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem'
                        }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                              <span>• {it.name} x {it.qty}</span>
                              <span style={{ fontWeight: 600 }}>₹{it.price * it.qty}</span>
                            </div>
                          ))}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '0.4rem',
                            marginTop: '0.4rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700,
                            color: 'var(--gold-light)'
                          }}>
                            <span>Total (incl. Delivery: ₹{order.deliveryFee || 0}):</span>
                            <span>₹{order.total} ({order.payment})</span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons for Owner */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <a
                          href={`tel:${order.phone}`}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <Phone size={14} color="#10B981" />
                          <span>Call: {order.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`Hello ${order.customerName}! Your order #${order.id} from Jonak Hotel & Restaurant is ${order.status.toLowerCase()}. Thank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <MessageCircle size={14} />
                          <span>Reply on WhatsApp</span>
                        </a>

                        {order.coordinates && (
                          <a
                            href={`https://maps.google.com/?q=${order.coordinates.lat},${order.coordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
                          >
                            <span>📍 View Customer GPS Map</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Room Bookings Log Subsection */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
                Recent Hotel Room Reservations ({bookings.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map((bkg) => (
                  <div
                    key={bkg.id}
                    className="glass-card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>#{bkg.id}</span>
                        <span style={{ fontWeight: 700 }}>{bkg.guestName}</span>
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{bkg.roomType}</span>
                        {bkg.roomNumber && (
                          <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                            Room {bkg.roomNumber}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10B981',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          <ShieldCheck size={12} />
                          e-KYC: {bkg.idType || 'Aadhaar'} ({bkg.maskedId || (bkg.idNumber ? `XXXX-XXXX-${bkg.idNumber.slice(-4)}` : 'Verified')})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Check-in: <strong>{bkg.checkIn}</strong> • Check-out: <strong>{bkg.checkOut}</strong> • {bkg.guests} • Estimated: <strong>₹{bkg.totalTariff}</strong>
                        {bkg.guestCity && <span> • Origin: <strong>{bkg.guestCity}</strong></span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setViewKycBooking(bkg)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          background: 'rgba(212, 175, 55, 0.12)',
                          borderColor: 'var(--gold-primary)',
                          color: 'var(--gold-light)',
                          padding: '0.3rem 0.65rem'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>e-KYC Proof</span>
                      </button>

                      <select
                        value={bkg.status}
                        onChange={(e) => updateRoomBookingStatus(bkg.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <option value="New">New</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <a href={`tel:${bkg.phone}`} className="btn btn-secondary btn-sm">
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================== */}
            {/* HAFIJUR'S STAFF DISPATCH CONTROLS & TASK ASSIGNMENT TO HAFIJ    */}
            {/* ============================================================== */}
            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="#3B82F6" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 800 }}>
                    🛎️ Hafijur's Staff Dispatch Controls (1-Tap Task Assignment to Hafij)
                  </h4>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sends instant notification chime & live task alert to Hafij's screen
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {[
                  { title: 'Show Room 201 to Guest', icon: '🔑' },
                  { title: 'Check Room before Checkout', icon: '🧹' },
                  { title: 'Carry Luggage to 1st Floor', icon: '🧳' },
                  { title: 'Deliver 2x Mineral Water to Room 102', icon: '💧' },
                  { title: 'Replace Extra Towel & Blanket for Room 303', icon: '🛏️' }
                ].map((disp, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (addTask) {
                        addTask({
                          title: disp.title,
                          assignedTo: 'Hafij',
                          assignedRole: 'housekeeping',
                          time: 'Immediate',
                          completed: false
                        });
                      }
                      showToast(`Dispatched to Hafij: "${disp.title}"`, 'success');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'rgba(59, 130, 246, 0.12)',
                      borderColor: '#3B82F6',
                      color: '#93C5FD',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.8rem'
                    }}
                  >
                    <span>{disp.icon}</span>
                    <span>{disp.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ============================================================== */}
            {/* e-KYC AADHAAR CARD PROOF INSPECTION MODAL */}
            {/* ============================================================== */}
            {viewKycBooking && (
              <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div className="modal-content" style={{ maxWidth: '600px', background: '#0B1120', border: '1.5px solid var(--gold-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={22} color="var(--gold-primary)" />
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800 }}>
                        Guest e-KYC & Document Verification Desk
                      </h3>
                    </div>
                    <button
                      onClick={() => setViewKycBooking(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Guest Name:</span>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{viewKycBooking.guestName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Contact Phone:</span>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>+91 {viewKycBooking.phone}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Allocated Room:</span>
                        <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                          Room {viewKycBooking.roomNumber || '101'} ({viewKycBooking.roomType})
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>KYC Status:</span>
                        <div style={{ fontWeight: 800, color: viewKycBooking.kycStatus === 'Verified' ? '#10B981' : (viewKycBooking.kycStatus === 'Rejected' ? '#EF4444' : '#F59E0B') }}>
                          {viewKycBooking.kycStatus || 'Pending Verification'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High-Resolution Document Inspection Canvas */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                      Attached Aadhaar / Govt ID Photo (Encrypted Cloud Vault)
                    </div>
                    
                    {viewKycBooking.kycDocUrl ? (
                      <div style={{
                        border: '1.5px solid var(--gold-primary)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.5)'
                      }}>
                        <img
                          src={viewKycBooking.kycDocUrl}
                          alt="Government ID"
                          style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '6px' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.4rem', fontWeight: 600 }}>
                          ✓ Stored in S3 / KYC Vault: {viewKycBooking.kycDocName || 'aadhaar_doc.jpg'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', marginBottom: '0.35rem' }}>Front Photo</div>
                          {viewKycBooking.aadhaarFront ? (
                            <img
                              src={viewKycBooking.aadhaarFront}
                              alt="Front ID"
                              style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px' }}
                            />
                          ) : (
                            <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              <FileText size={28} style={{ opacity: 0.5, marginBottom: '0.3rem' }} />
                              Physical ID presented at check-in
                            </div>
                          )}
                        </div>

                        <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)', marginBottom: '0.35rem' }}>Back Photo</div>
                          {viewKycBooking.aadhaarBack ? (
                            <img
                              src={viewKycBooking.aadhaarBack}
                              alt="Back ID"
                              style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px' }}
                            />
                          ) : (
                            <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              <FileText size={28} style={{ opacity: 0.5, marginBottom: '0.3rem' }} />
                              Address verified
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Decision Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={async () => {
                        if (verifyKyc) {
                          await verifyKyc(viewKycBooking.id, 'Verified', 'Approved by Hafijur (Reception)');
                          setViewKycBooking(prev => ({ ...prev, kycStatus: 'Verified' }));
                        }
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, minWidth: '160px', background: '#10B981', borderColor: '#10B981', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>✅ Approve & Verify KYC</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (verifyKyc) {
                          await verifyKyc(viewKycBooking.id, 'Rejected', 'Document unclear, please re-upload clear photo');
                          setViewKycBooking(prev => ({ ...prev, kycStatus: 'Rejected' }));
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      <span>❌ Request Re-upload</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Printer size={15} />
                      <span>Police Form C</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================
            TAB 3: ONE-TAP MENU & PRICE MANAGER (SWIGGY/ZOMATO PARTNER STYLE)
            ================================================================== */}
        {activeTab === 'MENU' && (
          <div>
            {/* Action Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  1-Tap Menu & Price Manager
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Tap the switch to immediately take any dish In/Out of Stock or edit prices live on the website
                </p>
              </div>

              <button
                onClick={() => setShowAddDishModal(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add New Dish (10 Seconds)</span>
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="glass-card" style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <div style={{ flex: '1 1 240px' }}>
                <input
                  type="text"
                  placeholder="Quick search dish by name..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={dishCategoryFilter}
                onChange={(e) => setDishCategoryFilter(e.target.value)}
                className="form-select"
                style={{ flex: '0 1 200px', fontSize: '0.85rem' }}
              >
                {menuCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Dish Rows Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="glass-card"
                  style={{
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderLeft: dish.inStock ? '4px solid #10B981' : '4px solid #EF4444'
                  }}
                >
                  {/* Left: Dish Info */}
                  <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={`food-type-icon ${dish.isVeg ? 'veg' : 'non-veg'}`}>
                      <div className="dot" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {dish.category} • {dish.isVeg ? 'Veg' : 'Non-Veg'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Best Seller & Price Editor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* 1-Tap Best Seller Toggle */}
                    <button
                      onClick={() => toggleDishBestSeller(dish.id)}
                      style={{
                        background: dish.bestSeller ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: dish.bestSeller ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                        color: dish.bestSeller ? '#FBBF24' : 'var(--text-muted)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontWeight: 600
                      }}
                      title="Toggle Best Seller Badge"
                    >
                      <Flame size={13} />
                      <span>{dish.bestSeller ? 'Special' : 'Normal'}</span>
                    </button>

                    {/* Inline Instant Price Editor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold-warm)', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        value={dish.price}
                        onChange={(e) => updateDishPrice(dish.id, e.target.value)}
                        style={{
                          width: '75px',
                          padding: '0.35rem 0.45rem',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: 1-Tap In Stock / Out of Stock Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => toggleDishStock(dish.id)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: 'var(--radius-full)',
                        background: dish.inStock ? '#10B981' : '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        minWidth: '110px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {dish.inStock ? <Check size={13} /> : <X size={13} />}
                      <span>{dish.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${dish.name} from menu?`)) {
                          deleteDish(dish.id);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.4rem'
                      }}
                      title="Remove Dish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Dish Modal */}
            {showAddDishModal && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '500px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add New Dish to Menu</h3>
                    <button onClick={() => setShowAddDishModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAddNewDish}>
                    <div className="form-group">
                      <label className="form-label">Dish Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Assamese Duck Roast with Gourd"
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Category *</label>
                        <select
                          value={newDishCategory}
                          onChange={(e) => setNewDishCategory(e.target.value)}
                          className="form-select"
                        >
                          {menuCategories.filter(c => c !== 'ALL').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 350"
                          value={newDishPrice}
                          onChange={(e) => setNewDishPrice(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Dietary Preference</label>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isVeg"
                            checked={newDishIsVeg}
                            onChange={() => setNewDishIsVeg(true)}
                          />
                          <span>Veg</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="isVeg"
                            checked={!newDishIsVeg}
                            onChange={() => setNewDishIsVeg(false)}
                          />
                          <span>Non-Veg</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Description</label>
                      <textarea
                        rows="2"
                        placeholder="Brief description of flavors & preparation..."
                        value={newDishDesc}
                        onChange={(e) => setNewDishDesc(e.target.value)}
                        className="form-textarea"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button type="button" onClick={() => setShowAddDishModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Save to Menu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================================
            TAB 4: ROOM TARIFF & AVAILABILITY CONTROLLER
            ================================================================== */}
        {/* ==================================================================
            TAB 4: OFFICIAL ROOM INVENTORY & TARIFF CONTROLLER (9 ROOMS)
            ================================================================== */}
        {activeTab === 'ROOMS' && (
          <div>
            {/* Header & Stats Banner */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BedDouble size={24} color="var(--gold-primary)" />
                    <span>Floor-wise Room Grid & Live Occupancy</span>
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Official 9 rooms across 3 floors. Tap any room number to switch between Available (Green) and Occupied/Booked (Red).
                  </p>
                </div>

                {/* 1-Tap Quick Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (window.confirm('Mark ALL 9 rooms as Available (Vacant)?')) {
                        (physicalRooms || []).forEach(r => {
                          if (!r.isAvailable) togglePhysicalRoom(r.roomNumber, true);
                        });
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span>✓ Mark All Available</span>
                  </button>
                </div>
              </div>

              {/* Occupancy Stats Bar */}
              {(() => {
                const totalRooms = (physicalRooms || []).length || 10;
                const vacantRooms = (physicalRooms || []).filter(r => r.isAvailable).length;
                const occupiedRooms = totalRooms - vacantRooms;
                const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1.25rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Physical Rooms</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF' }}>{totalRooms} Rooms (Floors 1-3)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981', textTransform: 'uppercase' }}>Vacant / Available Today</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>{vacantRooms} Rooms Free</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'uppercase' }}>Occupied / Booked</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444' }}>{occupiedRooms} Rooms Occupied</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-warm)', textTransform: 'uppercase' }}>Hotel Occupancy Rate</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-light)' }}>{occupancyRate}% Full</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Visual Floor-wise Room Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
              {[
                { floorNum: 1, title: '1st Floor (VIP & Presidential Suite)', filter: (r) => r.floorNumber === 1 || r.roomNumber.startsWith('1') },
                { floorNum: 2, title: '2nd Floor (Deluxe AC, Single AC & Twin AC)', filter: (r) => r.floorNumber === 2 || r.roomNumber.startsWith('2') },
                { floorNum: 3, title: '3rd Floor (Deluxe AC, Twin Non-AC & Single Non-AC)', filter: (r) => r.floorNumber === 3 || r.roomNumber.startsWith('3') }
              ].map((floorGroup) => {
                const floorRooms = (physicalRooms || []).filter(floorGroup.filter);
                return (
                  <div key={floorGroup.floorNum} style={{
                    background: 'rgba(11, 17, 32, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    {/* Floor Title */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '0.65rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                        {floorGroup.title}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {floorRooms.filter(r => r.isAvailable).length} of {floorRooms.length} Available
                      </span>
                    </div>

                    {/* Floor Room Cards Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                      gap: '1rem'
                    }}>
                      {floorRooms.map((rm) => {
                        const gstRate = 0.05;
                        const basePrice = rm.basePrice || 1400;
                        const gstAmount = Math.round(basePrice * gstRate);
                        const totalWithGst = basePrice + gstAmount;

                        return (
                          <div
                            key={rm.roomNumber}
                            style={{
                              background: rm.isAvailable
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(239, 68, 68, 0.1)',
                              border: `1.5px solid ${rm.isAvailable ? '#10B981' : '#EF4444'}`,
                              borderRadius: '10px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: rm.isAvailable
                                ? '0 4px 14px rgba(16, 185, 129, 0.15)'
                                : '0 4px 14px rgba(239, 68, 68, 0.15)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div>
                              {/* Room Number & Status Badge */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{
                                  fontSize: '1.6rem',
                                  fontWeight: 900,
                                  fontFamily: 'var(--font-serif)',
                                  color: '#FFFFFF',
                                  letterSpacing: '0.05em'
                                }}>
                                  Room {rm.roomNumber}
                                </div>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: rm.isAvailable ? '#10B981' : '#EF4444',
                                  color: '#FFFFFF',
                                  textTransform: 'uppercase'
                                }}>
                                  {rm.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                                </span>
                              </div>

                              {/* Category Name */}
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                {rm.categoryName}
                              </div>

                              {/* AC / Non-AC tag & Highlights */}
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  background: rm.ac ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 146, 60, 0.2)',
                                  color: rm.ac ? '#38BDF8' : '#FB923C',
                                  fontWeight: 700
                                }}>
                                  {rm.ac ? 'A/C' : 'Non-A/C'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {rm.highlights?.split(',')[0] || ''}
                                </span>
                              </div>

                              {/* Price + 5% GST breakdown */}
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.9rem',
                                padding: '0.4rem 0.55rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '6px'
                              }}>
                                <div>
                                  Tariff: <strong>₹{basePrice.toLocaleString()}</strong> / night
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
                                  + 5% GST (₹{gstAmount}) = <strong>₹{totalWithGst.toLocaleString()}</strong> net
                                </div>
                              </div>
                            </div>

                            {/* 1-Tap Toggle Button */}
                            <div>
                              <button
                                onClick={() => {
                                  togglePhysicalRoom(rm.roomNumber, !rm.isAvailable);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.5rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: rm.isAvailable ? '#EF4444' : '#10B981',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  transition: 'background 0.2s ease'
                                }}
                              >
                                {rm.isAvailable ? (
                                  <>
                                    <X size={14} />
                                    <span>Tap: Mark Occupied / Check-In</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} />
                                    <span>Tap: Check-Out / Mark Free</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room Categories & Base Tariffs Manager */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-light)', marginBottom: '0.35rem' }}>
                Official Room Category Rates & Base Tariffs
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Adjust nightly base tariffs for the 6 official categories. Availability status updates automatically based on the physical room occupancy above.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {rooms.map((room) => {
                  const catPhys = (physicalRooms || []).filter(pr => pr.categoryId === room.id);
                  const freeInCat = catPhys.filter(pr => pr.isAvailable);
                  const freeCount = freeInCat.length;

                  return (
                    <div
                      key={room.id}
                      className="glass-card room-admin-card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
                        <img
                          src={room.image}
                          alt={room.title}
                          style={{ width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                              {room.title}
                            </h4>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: room.ac ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 146, 60, 0.25)',
                              color: room.ac ? '#38BDF8' : '#FB923C'
                            }}>
                              {room.ac ? 'A/C' : 'Non-A/C'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {room.floor} • Capacity: {room.capacity} • {room.bed}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold-warm)', marginTop: '0.2rem' }}>
                            Physical Rooms: <strong>{room.assignedRooms?.join(', ')}</strong> ({freeCount} of {catPhys.length} free right now)
                          </div>
                        </div>
                      </div>

                      {/* Availability & Tariff Controls */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        {/* Auto-computed vs Manual Category Status */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Customer Website Status:
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {['Available', 'Filling Fast', 'Sold Out'].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateRoom(room.id, { status: st })}
                                className="btn btn-sm"
                                style={{
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.75rem',
                                  padding: '0.3rem 0.75rem',
                                  background: room.status === st
                                    ? st === 'Available' ? '#10B981' : st === 'Filling Fast' ? '#F59E0B' : '#EF4444'
                                    : 'rgba(255,255,255,0.06)',
                                  color: room.status === st ? '#FFFFFF' : 'var(--text-secondary)',
                                  fontWeight: room.status === st ? 800 : 500
                                }}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Nightly Base Tariff Editor */}
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Base Tariff (Excl. 5% GST):
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--gold-warm)' }}>₹</span>
                            <input
                              type="number"
                              value={room.tariff}
                              onChange={(e) => updateRoom(room.id, { tariff: parseFloat(e.target.value) || 0 })}
                              style={{
                                width: '100px',
                                padding: '0.35rem 0.55rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-gold)',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                textAlign: 'center'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#10B981' }}>
                              (+5% GST = ₹{Math.round(room.tariff * 1.05).toLocaleString()})
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================
            TAB 5: HOTEL SETTINGS & DELIVERY RULES
            ================================================================== */}
        {activeTab === 'SETTINGS' && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                Delivery Rules & Hotel Configuration
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Configure 5 KM free delivery radius, per-KM rates, kitchen operating hours, and top marquee banner
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>

              {/* 1. Free Delivery Radius & Extra Charge */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '1rem' }}>
                🚚 Delivery Radius & Fee Engine
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Free Delivery Radius (KM)</label>
                  <input
                    type="number"
                    value={settings.freeDeliveryRadiusKm}
                    onChange={(e) => updateSettings({ freeDeliveryRadiusKm: parseFloat(e.target.value) || 5 })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: 5 KM (₹0 delivery charge)</small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Extra Fee / KM after Free Radius (₹)</label>
                  <input
                    type="number"
                    value={settings.extraFeePerKm}
                    onChange={(e) => updateSettings({ extraFeePerKm: parseFloat(e.target.value) || 15 })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: ₹15 per extra KM</small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Free Delivery Min. Order (₹)</label>
                  <input
                    type="number"
                    value={settings.deliveryRules?.freeDeliveryThreshold ?? 199}
                    onChange={(e) => updateSettings({
                      deliveryRules: {
                        ...(settings.deliveryRules || {}),
                        freeDeliveryThreshold: parseFloat(e.target.value) || 199
                      }
                    })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Orders above this within 5 KM get free delivery</small>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Max Delivery Radius (KM)</label>
                  <input
                    type="number"
                    value={settings.deliveryRules?.maxRadiusKm ?? 15}
                    onChange={(e) => updateSettings({
                      deliveryRules: {
                        ...(settings.deliveryRules || {}),
                        maxRadiusKm: parseFloat(e.target.value) || 15
                      }
                    })}
                    className="form-input"
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Orders beyond this radius are rejected</small>
                </div>
              </div>

              {/* Cash on Delivery Toggle */}
              <div style={{
                background: 'var(--bg-surface)',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>
                    Cash on Delivery (COD) Checkout
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Allow customers to pay cash upon doorstep delivery or dine-in
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.codEnabled !== false}
                  onChange={(e) => updateSettings({ codEnabled: e.target.checked })}
                  style={{ accentColor: 'var(--gold-primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* 2. Kitchen Status & Operating Hours */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem' }}>
                🍳 Operating Hours & Kitchen Acceptance
              </h4>

              <div style={{
                background: 'var(--bg-surface)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                      Live Kitchen Order Acceptance
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Override switch: immediate pause on all incoming food orders
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateSettings({ kitchenOpen: !settings.kitchenOpen })}
                    className="btn btn-sm"
                    style={{
                      background: settings.kitchenOpen ? '#10B981' : '#EF4444',
                      color: '#FFF',
                      fontWeight: 800,
                      minWidth: '110px'
                    }}
                  >
                    {settings.kitchenOpen ? 'ACCEPTING' : 'PAUSED'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Daily Open Time (IST)</label>
                    <input
                      type="time"
                      value={settings.operatingHours?.openTime || '09:00'}
                      onChange={(e) => updateSettings({
                        operatingHours: {
                          ...(settings.operatingHours || {}),
                          openTime: e.target.value
                        }
                      })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Daily Close Time (IST)</label>
                    <input
                      type="time"
                      value={settings.operatingHours?.closeTime || '22:30'}
                      onChange={(e) => updateSettings({
                        operatingHours: {
                          ...(settings.operatingHours || {}),
                          closeTime: e.target.value
                        }
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Room Booking Tax & Direct Discount Policy */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem' }}>
                🏨 Room Booking GST & Direct Discount Policy
              </h4>

              <div style={{
                background: 'var(--bg-surface)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Apply 5% GST on Rooms</label>
                    <input
                      type="checkbox"
                      checked={settings.applyGst !== false}
                      onChange={(e) => updateSettings({ applyGst: e.target.checked })}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Adds statutory 5% GST to booking modal and invoice
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Direct Booking 5% Discount</label>
                    <input
                      type="checkbox"
                      checked={!!settings.directDiscountActive}
                      onChange={(e) => updateSettings({ directDiscountActive: e.target.checked })}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Toggles 5% instant discount banner for direct bookings
                  </div>
                </div>
              </div>

              {/* 4. Special Offer Banner Marquee */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem' }}>
                📢 Top Announcement Banner
              </h4>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Announcement Text</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.announcementActive}
                      onChange={(e) => updateSettings({ announcementActive: e.target.checked })}
                    />
                    <span>Show on Website</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => updateSettings({ announcementText: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Enterprise Security & Authentication Notice */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '0.75rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#10B981" />
                <span>Enterprise Authentication & RBAC Security</span>
              </h4>

              <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', color: '#10B981', fontWeight: 800, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Argon2id Passwords & TOTP MFA Active</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                  Legacy shared PINs have been permanently eliminated. All owner and staff logins now require individual accounts, MFA authenticator apps, session tokens, and audit logging.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('SECURITY')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Users size={13} />
                  <span>Manage Staff Accounts & View Security Audit Log</span>
                </button>
              </div>
              {/* Official Hotel Paytm UPI QR Integration */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#00BAF2', marginBottom: '0.75rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💳 Official Paytm UPI Payment QR
              </h4>

              <div style={{
                background: 'linear-gradient(145deg, rgba(7, 26, 44, 0.95), rgba(4, 15, 27, 0.98))',
                border: '1.5px solid rgba(0, 186, 242, 0.45)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src="/images/jonak-paytm-qr.png"
                      alt="Official Paytm QR"
                      style={{ width: '135px', height: 'auto', borderRadius: '8px', border: '2px solid #00BAF2', background: '#FFF' }}
                    />
                    <a
                      href="/images/jonak-paytm-qr.png"
                      download="Jonak-Hotel-Paytm-QR.png"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                      <Download size={12} />
                      Download QR
                    </a>
                  </div>

                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered Business Name:</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>JONAK HOTEL AND RESTAURANT</div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active UPI ID:</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00BAF2', fontFamily: 'monospace' }}>
                        paytm.s1i7is2@pty
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                      ✓ All customer food orders and room reservations display this official QR.<br />
                      ✓ Customers can 1-tap pay on mobile or enter their 12-digit UTR.<br />
                      ✓ Direct zero-commission settlement into Jonak Hotel's bank account.
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Reset to Defaults */}
              <div style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EF4444' }}>
                    Restore Initial Seed Data
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Reset all menu dishes and sample orders to original PDF defaults
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all menu items, settings and orders to factory defaults?')) {
                      resetToDefaults();
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#EF4444' }}
                >
                  <RotateCcw size={14} />
                  <span>Reset All</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================================
            TAB: TODAY'S OFFERS & PROMOTIONS MANAGEMENT
            ================================================================== */}
        {activeTab === 'OFFERS' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.3rem' }}>
                  Today's Verified Offers & Promos
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configure genuine discounts with minimum order thresholds. Active offers appear prominently on the customer homepage and cart.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddOfferModal(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} />
                <span>Create New Promo</span>
              </button>
            </div>

            {/* Margin Safeguard Notice */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <ShieldCheck size={20} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--gold-light)' }}>Margin Safeguard Protection Active:</strong> Offers cannot exceed 50% discount without explicit confirmation. Expired offers are auto-hidden from customer view.
              </div>
            </div>

            {/* Offers Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {(offers || []).map((offer) => (
                <div
                  key={offer.id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${offer.active ? '#10B981' : '#64748B'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid var(--gold-primary)',
                        color: 'var(--gold-light)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {offer.code}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: offer.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                        color: offer.active ? '#34D399' : '#94A3B8'
                      }}>
                        {offer.active ? 'Active Today' : 'Paused'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                      {offer.title}
                    </h4>

                    <div style={{ fontSize: '0.82rem', color: 'var(--gold-light)', fontWeight: 700, marginBottom: '0.45rem' }}>
                      {offer.discountPercent}% OFF {offer.maxDiscount ? `(Up to ₹${offer.maxDiscount})` : ''}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      • Min. Order: ₹{offer.minOrder || 0}<br />
                      • Valid Until: {offer.validUntil || 'Ongoing'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <button
                      type="button"
                      onClick={() => toggleOffer(offer.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }}
                    >
                      {offer.active ? 'Pause Deal' : 'Activate Deal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete coupon ${offer.code}?`)) {
                          deleteOffer(offer.id);
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#EF4444', padding: '0.35rem 0.6rem' }}
                      title="Delete Offer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Offer Modal */}
            {showAddOfferModal && (
              <div className="modal-overlay" style={{ zIndex: 99999 }}>
                <div className="modal-content" style={{ maxWidth: '440px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>Create Promotional Offer</h3>
                    <button onClick={() => setShowAddOfferModal(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateOffer}>
                    <div className="form-group">
                      <label className="form-label">Coupon Code (Uppercase) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BARPETA20"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                        className="form-input"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Promotion Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Barpeta Weekend Special"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Discount % *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="90"
                          placeholder="e.g. 15"
                          value={offerDiscount}
                          onChange={(e) => setOfferDiscount(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Min. Order (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 399"
                          value={offerMinOrder}
                          onChange={(e) => setOfferMinOrder(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Max Cap (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 150"
                          value={offerMaxDiscount}
                          onChange={(e) => setOfferMaxDiscount(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Valid Until</label>
                        <input
                          type="date"
                          value={offerValidUntil}
                          onChange={(e) => setOfferValidUntil(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button type="button" onClick={() => setShowAddOfferModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Save Offer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB: OWNER FINANCIAL & REVENUE REPORTS
            ================================================================== */}
        {activeTab === 'REPORTS' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.3rem' }}>
                  Financial & Revenue Reports
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Itemized accounting separating gross sales, discounts, statutory GST, delivery charges, and net totals
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLoadingReport(true);
                  fetchFinancialReport().then(data => {
                    setFinancialData(data);
                    setIsLoadingReport(false);
                    showToast('Financial report refreshed!', 'success');
                  });
                }}
                disabled={isLoadingReport}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={isLoadingReport ? 'spin' : ''} />
                <span>Refresh Report</span>
              </button>
            </div>

            {/* Revenue Metrics Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Sales</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0' }}>
                  ₹{(financialData?.grossSales ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#93C5FD' }}>Food & Room pre-discount totals</div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discounts Given</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F87171', margin: '0.25rem 0' }}>
                  -₹{(financialData?.discountsGiven ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#FCA5A5' }}>Promotional coupons subsidized</div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statutory 5% GST</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399', margin: '0.25rem 0' }}>
                  +₹{(financialData?.taxesAndGst ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>Room booking tax ledger</div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)', textTransform: 'uppercase', fontWeight: 700 }}>Total Net Revenue</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-light)', margin: '0.25rem 0' }}>
                  ₹{(financialData?.netRevenue ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Net realized revenue</div>
              </div>
            </div>

            {/* Department Breakdown: Food vs Rooms */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UtensilsCrossed size={16} color="var(--gold-primary)" />
                  <span>Restaurant Operations ({financialData?.foodOrdersCount ?? orders.length} Orders)</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gross Food Sales:</span>
                    <strong>₹{(financialData?.foodGross ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F87171' }}>
                    <span>Coupons Deducted:</span>
                    <strong>-₹{(financialData?.discountsGiven ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Delivery Fees Collected:</span>
                    <strong>+₹{(financialData?.deliveryFees ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--gold-light)', fontWeight: 800 }}>
                    <span>Net Food Total:</span>
                    <span>₹{((financialData?.foodGross ?? 0) - (financialData?.discountsGiven ?? 0) + (financialData?.deliveryFees ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BedDouble size={16} color="#3B82F6" />
                  <span>Hotel Rooms (9 Rooms • {financialData?.roomBookingsCount ?? bookings.length} Bookings)</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Tariff Subtotal:</span>
                    <strong>₹{(financialData?.roomsBase ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38BDF8' }}>
                    <span>Statutory 5% GST:</span>
                    <strong>+₹{(financialData?.taxesAndGst ?? 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: '#60A5FA', fontWeight: 800 }}>
                    <span>Total Room Tariff:</span>
                    <span>₹{((financialData?.roomsBase ?? 0) + (financialData?.taxesAndGst ?? 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB: CUSTOMER TRANSACTIONAL NOTIFICATIONS OUTBOX
            ================================================================== */}
        {activeTab === 'NOTIFICATIONS' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.3rem' }}>
                  Customer Notifications Outbox
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Audit log of transactional notifications dispatched for orders, room bookings, and status changes
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLoadingNotifications(true);
                  fetchNotificationLogs().then(logs => {
                    setNotificationLogs(logs || []);
                    setIsLoadingNotifications(false);
                    showToast('Notification outbox refreshed!', 'success');
                  });
                }}
                disabled={isLoadingNotifications}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={isLoadingNotifications ? 'spin' : ''} />
                <span>Refresh Outbox</span>
              </button>
            </div>

            {/* Provider Integration Status Banner */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <Mail size={20} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  Notification Engine Mode: Staging Outbox Active
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Transactional notifications are safely logged in the server outbox with full audit trail and zero external SMS cost. To enable live cellular SMS/WhatsApp delivery, provide provider API credentials (e.g. <code>TWILIO_AUTH_TOKEN</code>, <code>GUPSHUP_API_KEY</code>, or <code>WHATSAPP_CLOUD_KEY</code>) in your server environment variables.
                </div>
              </div>
            </div>

            {/* Outbox Table */}
            <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Recipient</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Channel</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Event Type</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs && notificationLogs.length > 0 ? (
                    notificationLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#FFFFFF' }}>
                          {log.recipient}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: log.channel === 'WhatsApp' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: log.channel === 'WhatsApp' ? '#25D366' : '#60A5FA'
                          }}>
                            {log.channel}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                          {log.type}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{ color: '#10B981', fontWeight: 600 }}>✓ {log.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No notifications sent yet. Order updates will appear here automatically.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: ROOM & TABLE QR CODE GENERATOR                               */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'QR_CODES' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.3rem' }}>
                  Smart Room & Table QR Code Generator
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Print instant scannable QR cards for hotel rooms and dining tables. When guests scan with their phone, their room or table number is automatically pre-filled in their cart!
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>Print QR Tent Card</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>

              {/* Left Column: QR Configuration Controls */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SettingsIcon size={18} />
                  <span>1. Configure Target QR</span>
                </h4>

                {/* Target Type Switcher: Hotel Room vs Table */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Select QR Location Type:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setQrTargetType('ROOM');
                        setQrTargetValue('101');
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: qrTargetType === 'ROOM' ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        color: qrTargetType === 'ROOM' ? '#070B14' : '#FFF',
                        border: qrTargetType === 'ROOM' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <BedDouble size={16} />
                      <span>Hotel Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQrTargetType('TABLE');
                        setQrTargetValue('Table 1');
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: qrTargetType === 'TABLE' ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        color: qrTargetType === 'TABLE' ? '#070B14' : '#FFF',
                        border: qrTargetType === 'TABLE' ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>Dining Table</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Chips */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Quick Select {qrTargetType === 'ROOM' ? 'Official Hotel Room (101 to 304)' : 'Restaurant Table (1 to 15)'}:
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                      {qrTargetType === 'ROOM' ? '10 Official Rooms' : '15 Tables'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(qrTargetType === 'ROOM'
                      ? ['101', '102', '201', '202', '203', '204', '301', '302', '303', '304']
                      : ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Table 11', 'Table 12', 'Table 13', 'Table 14', 'Table 15']
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQrTargetValue(preset)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          background: qrTargetValue === preset ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                          color: qrTargetValue === preset ? 'var(--gold-light)' : 'var(--text-secondary)',
                          border: qrTargetValue === preset ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {qrTargetType === 'ROOM' ? `Room ${preset}` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Name / Number Input */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">
                    Custom {qrTargetType === 'ROOM' ? 'Room Identifier' : 'Table Identifier'}:
                  </label>
                  <input
                    type="text"
                    value={qrTargetValue}
                    onChange={(e) => setQrTargetValue(e.target.value)}
                    placeholder="e.g. Room 105 or Garden Table 2"
                    className="form-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                {/* Website Base Domain Input */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Website Domain / Target URL:</label>
                  <input
                    type="text"
                    value={qrCustomDomain}
                    onChange={(e) => setQrCustomDomain(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setQrCustomDomain(window.location.origin)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      Use Current Local ({window.location.origin})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrCustomDomain('https://jonakhotelgroup.in')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      Use Official Domain (jonakhotelgroup.in)
                    </button>
                  </div>
                </div>

                {/* Direct Link & Quick Actions */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Generated Direct Customer Link:
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: 'var(--gold-warm)',
                    wordBreak: 'break-all',
                    marginBottom: '0.75rem'
                  }}>
                    {`${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = `${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`;
                        navigator.clipboard.writeText(targetUrl);
                        showToast('Link copied to clipboard!', 'success');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = `${qrCustomDomain.replace(/\/+$/, '')}/?${qrTargetType === 'ROOM' ? 'room' : 'table'}=${encodeURIComponent(qrTargetValue)}`;
                        window.open(targetUrl, '_blank');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <ExternalLink size={13} />
                      <span>Test in New Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!generatedQrDataUrl) return;
                        const a = document.createElement('a');
                        a.href = generatedQrDataUrl;
                        a.download = `jonak-${qrTargetType.toLowerCase()}-${qrTargetValue.replace(/\s+/g, '-')}-qr.png`;
                        a.click();
                        showToast('QR Code image downloaded!', 'success');
                      }}
                      className="btn btn-gold-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Download size={13} />
                      <span>Download QR PNG</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Printable Luxury Tent Card Preview */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>2. Printable Table Tent Card Preview:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Ready to Print / Laminate</span>
                </div>

                <div
                  id="printable-qr-card"
                  style={{
                    background: '#0B1120',
                    border: '3px solid var(--gold-primary)',
                    borderRadius: '16px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Luxury Top Header Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <img src="/jonak.png" alt="Jonak Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--gold-light)', textTransform: 'uppercase' }}>
                        Jonak Hotel & Restaurant
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        BH Road, Donakuchi, Barpeta, Assam 781314
                      </div>
                    </div>
                  </div>

                  {/* Target Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--gold-gradient)',
                    color: '#070B14',
                    padding: '0.4rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    letterSpacing: '0.08em',
                    margin: '0.75rem auto 1.25rem',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                  }}>
                    {qrTargetType === 'ROOM' ? `HOTEL ROOM • ${qrTargetValue}` : `DINING TABLE • ${qrTargetValue}`}
                  </div>

                  {/* QR Image Container with Crisp White Plate */}
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '12px',
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    marginBottom: '1.25rem'
                  }}>
                    {generatedQrDataUrl ? (
                      <img
                        src={generatedQrDataUrl}
                        alt="QR Code"
                        style={{ width: '220px', height: '220px', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                    SCAN TO ORDER FOOD & DRINKS
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gold-warm)', fontWeight: 600, marginBottom: '0.8rem' }}>
                    {qrTargetType === 'ROOM'
                      ? '✨ 100% Free In-Room Dining Delivery'
                      : '✨ Direct Kitchen-to-Table Service'}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    1. Open your phone camera & scan QR code<br />
                    2. Browse Digital Menu & select dishes<br />
                    3. Your {qrTargetType === 'ROOM' ? 'Room #' : 'Table #'} is pre-filled automatically!
                  </div>

                  {/* Footer Reception Line */}
                  <div style={{
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(212, 175, 55, 0.25)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}>
                    <Phone size={13} color="var(--gold-primary)" />
                    <span>Reception / WhatsApp: <strong>+91 96785 82286</strong></span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontWeight: 800 }}
                  >
                    <Printer size={16} />
                    <span>Print This Stand (Instant Clean PDF / Paper)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================================
            TAB: EVENTS & BANQUET ENQUIRIES (OWNER & MANAGER)
            ================================================================== */}
        {activeTab === 'EVENTS' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Events & Banquet Enquiries ({(eventEnquiries || []).length})
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Weddings, Birthdays, Corporate Banquets, and Cultural Stage Programmes at Jonak Hotel
                </p>
              </div>
            </div>

            {(!eventEnquiries || eventEnquiries.length === 0) ? (
              <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <Calendar size={42} style={{ color: 'var(--gold-primary)', opacity: 0.5, marginBottom: '0.75rem' }} />
                <h4 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Active Event Enquiries</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Customer event requests will appear here in real-time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {eventEnquiries.map((ev) => (
                  <div
                    key={ev.id}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      borderLeft: ev.status === 'Confirmed' ? '4px solid #10B981' : ev.status === 'New' ? '4px solid #F59E0B' : '4px solid var(--border-gold)'
                    }}
                  >
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>#{ev.id}</span>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>{ev.contactPerson || ev.name || 'Guest'}</span>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{ev.eventType || 'Banquet Event'}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: ev.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: ev.status === 'Confirmed' ? '#34D399' : '#FBBF24',
                          border: `1px solid ${ev.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                        }}>
                          {ev.status || 'New'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Event Date: <strong style={{ color: '#FFFFFF' }}>{ev.eventDate || ev.date || 'TBD'}</strong> • Guest Count: <strong style={{ color: '#FFFFFF' }}>{ev.guestCount || ev.guests || '50-100'}</strong>
                        {ev.venue && <span> • Venue: <strong>{ev.venue}</strong></span>}
                        {ev.phone && <span> • Contact: <strong>+91 {ev.phone}</strong></span>}
                      </div>
                      {ev.notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                          "{ev.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <select
                        value={ev.status || 'New'}
                        onChange={(e) => updateEventEnquiryStatus && updateEventEnquiryStatus(ev.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                      >
                        <option value="New">New</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {ev.phone && (
                        <>
                          <a href={`tel:${ev.phone}`} className="btn btn-secondary btn-sm" title="Call Guest">
                            <Phone size={14} color="var(--gold-primary)" />
                            <span className="hide-on-mobile">Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${ev.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${ev.contactPerson || ''}, greetings from Jonak Hotel & Restaurant! Regarding your event enquiry...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={14} color="#25D366" />
                            <span className="hide-on-mobile">WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB: OWNER-ONLY SECURITY DESK & AUDIT LOGS
            ================================================================== */}
        {activeTab === 'SECURITY' && (
          currentUser?.role === 'owner' ? (
            <SecurityDesk />
          ) : (
            <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800 }}>Restricted Security Desk</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0.5rem auto' }}>
                This workstation is restricted exclusively to the primary Hotel Owner (Super Admin). Manager and Staff accounts cannot access credentials, active sessions, or cryptographic audit logs.
              </p>
            </div>
          )
        )}

      </main>

      <style>{`
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
          .order-details-grid { grid-template-columns: 1fr !important; }
        }

        /* Clean Printable Tent Card CSS */
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-card, #printable-qr-card * {
            visibility: visible !important;
          }
          #printable-qr-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 360px !important;
            border: 3px solid #D4AF37 !important;
            background: #0B1120 !important;
            box-shadow: none !important;
            padding: 2rem !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};
