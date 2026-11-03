import QRCode from 'qrcode';
import { 
  hashPassword, 
  verifyPassword, 
  generateBase32Secret, 
  generateTotpCode, 
  verifyTotpCode, 
  generateRecoveryCodes, 
  verifyAndConsumeRecoveryCode, 
  generateSecureToken, 
  sanitizeUser, 
  parseCookies 
} from './security.js';

// ----------------------------------------------------------------------------
// CONSTANTS & CONFIGURATION
// ----------------------------------------------------------------------------
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours max lifetime
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout
const TEMP_MFA_TTL_MS = 5 * 60 * 1000; // 5 minutes temp token
const INVITATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// In-memory rate limiting and temporary MFA tokens
const loginRateLimiter = new Map(); // key (ip + ':' + email) => { attempts, lockedUntil, lastAttempt }
const tempMfaTokens = new Map(); // token => { userId, expiresAt, isSetup, secret, recoveryCodes }

// ----------------------------------------------------------------------------
// INITIAL SEED ACCOUNTS
// ----------------------------------------------------------------------------
export const initializeAuthStore = (db, saveCallback) => {
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.invitations)) db.invitations = [];
  if (!Array.isArray(db.passwordResets)) db.passwordResets = [];
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  if (!Array.isArray(db.sessions)) db.sessions = [];

  let changed = false;

  // 1. Seed Owner Account if none exists
  const existingOwner = db.users.find(u => u.role === 'owner');
  if (!existingOwner) {
    const ownerMfaSecret = generateBase32Secret(20);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    const defaultOwner = {
      id: 'usr_owner_001',
      email: 'owner@jonakhotelgroup.in',
      name: 'Shahidul Islam',
      role: 'owner',
      roleTitle: '👑 Proprietor / Super Admin',
      pin: '1234',
      passwordHash: hashPassword(process.env.INITIAL_OWNER_PASSWORD || 'JonakOwner#2026'),
      mfaEnabled: true,
      mfaSecret: ownerMfaSecret,
      recoveryCodes: hashedCodes,
      initialRecoveryCodesPlain: plainCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    };
    db.users.push(defaultOwner);
    changed = true;
  } else {
    existingOwner.name = 'Shahidul Islam';
    existingOwner.roleTitle = '👑 Proprietor / Super Admin';
    existingOwner.pin = '1234';
    changed = true;
  }

  // 2. Seed Reception & Billing Account: Hafijur (PIN 2222)
  let existingReception = db.users.find(u => u.role === 'reception' || u.email === 'hafijur@jonakhotelgroup.in');
  if (!existingReception) {
    const recSecret = generateBase32Secret(20);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    existingReception = {
      id: 'usr_rec_002',
      email: 'hafijur@jonakhotelgroup.in',
      name: 'Hafijur',
      role: 'reception',
      roleTitle: '🛎️ Reception, Billing & KYC Verification Desk',
      pin: '2222',
      passwordHash: hashPassword('JonakReception#2026'),
      mfaEnabled: false,
      mfaSecret: recSecret,
      recoveryCodes: hashedCodes,
      initialRecoveryCodesPlain: plainCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    };
    db.users.push(existingReception);
    changed = true;
  } else {
    existingReception.name = 'Hafijur';
    existingReception.role = 'reception';
    existingReception.roleTitle = '🛎️ Reception, Billing & KYC Verification Desk';
    existingReception.pin = '2222';
    changed = true;
  }

  // 3. Seed Kitchen Head Chef Account: Master Chef (PIN 3333)
  let existingChef = db.users.find(u => u.role === 'kitchen' || u.email === 'chef@jonakhotelgroup.in');
  if (!existingChef) {
    const chefSecret = generateBase32Secret(20);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    existingChef = {
      id: 'usr_chef_003',
      email: 'chef@jonakhotelgroup.in',
      name: 'Master Chef',
      role: 'kitchen',
      roleTitle: '👨‍🍳 Head Master Chef & KDS Lead',
      pin: '3333',
      passwordHash: hashPassword('JonakChef#2026'),
      mfaEnabled: false,
      mfaSecret: chefSecret,
      recoveryCodes: hashedCodes,
      initialRecoveryCodesPlain: plainCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    };
    db.users.push(existingChef);
    changed = true;
  } else {
    existingChef.name = 'Master Chef';
    existingChef.role = 'kitchen';
    existingChef.roleTitle = '👨‍🍳 Head Master Chef & KDS Lead';
    existingChef.pin = '3333';
    changed = true;
  }

  // 4. Seed Caretaker & Housekeeping Account: Hafij (PIN 5555)
  let existingHafij = db.users.find(u => u.role === 'housekeeping' || u.email === 'hafij@jonakhotelgroup.in');
  if (!existingHafij) {
    const hafijSecret = generateBase32Secret(20);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
    existingHafij = {
      id: 'usr_care_004',
      email: 'hafij@jonakhotelgroup.in',
      name: 'Hafij',
      role: 'housekeeping',
      roleTitle: '🏃‍♂️ All-Rounder Caretaker, Room Guide & Housekeeping',
      pin: '5555',
      passwordHash: hashPassword('JonakHafij#2026'),
      mfaEnabled: false,
      mfaSecret: hafijSecret,
      recoveryCodes: hashedCodes,
      initialRecoveryCodesPlain: plainCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    };
    db.users.push(existingHafij);
    changed = true;
  } else {
    existingHafij.name = 'Hafij';
    existingHafij.role = 'housekeeping';
    existingHafij.roleTitle = '🏃‍♂️ All-Rounder Caretaker, Room Guide & Housekeeping';
    existingHafij.pin = '5555';
    changed = true;
  }

  if (changed && typeof saveCallback === 'function') {
    saveCallback();
  }
};

// ----------------------------------------------------------------------------
// AUDIT LOGGING HELPER
// ----------------------------------------------------------------------------
export const logAuditEvent = (db, eventData, saveCallback) => {
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  const logEntry = {
    id: `aud_${Date.now()}_${generateSecureToken(4)}`,
    timestamp: new Date().toISOString(),
    event: eventData.event, // e.g. 'LOGIN_SUCCESS', 'MFA_FAILED', etc.
    eventType: eventData.event,
    userId: eventData.userId || null,
    email: eventData.email || null,
    role: eventData.role || null,
    ip: eventData.ip || 'unknown',
    userAgent: eventData.userAgent ? eventData.userAgent.substring(0, 150) : 'unknown',
    status: eventData.status || 'INFO', // 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO'
    details: eventData.details || ''
  };

  db.auditLogs.unshift(logEntry);
  // Cap at 1000 entries
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }

  if (typeof saveCallback === 'function') {
    saveCallback(false);
  }
  return logEntry;
};

// ----------------------------------------------------------------------------
// PROGRESSIVE RATE LIMITING HELPERS
// ----------------------------------------------------------------------------
const getRateLimitKey = (ip, email = '') => `${ip}:${email.toLowerCase().trim()}`;

const checkRateLimit = (ip, email = '') => {
  const key = getRateLimitKey(ip, email);
  const record = loginRateLimiter.get(key);
  const now = Date.now();
  if (record && record.lockedUntil && now < record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false, attempts: record ? record.attempts : 0 };
};

const recordFailedAttempt = (ip, email = '') => {
  const key = getRateLimitKey(ip, email);
  const now = Date.now();
  const record = loginRateLimiter.get(key) || { attempts: 0, lockedUntil: null, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginRateLimiter.set(key, record);
  return record;
};

const clearRateLimit = (ip, email = '') => {
  loginRateLimiter.delete(getRateLimitKey(ip, email));
};

// ----------------------------------------------------------------------------
// SESSION MANAGEMENT HELPERS
// ----------------------------------------------------------------------------
export const createSession = (db, user, req, saveCallback) => {
  if (!Array.isArray(db.sessions)) db.sessions = [];
  const sessionId = generateSecureToken(32);
  const csrfToken = generateSecureToken(16);
  const now = Date.now();

  const newSession = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + SESSION_MAX_AGE_MS,
    csrfToken
  };

  db.sessions.unshift(newSession);
  // Cap active sessions at 500
  if (db.sessions.length > 500) {
    db.sessions = db.sessions.slice(0, 500);
  }

  if (typeof saveCallback === 'function') {
    saveCallback(false);
  }
  return newSession;
};

export const findValidSession = (db, sessionId) => {
  if (!sessionId || !Array.isArray(db.sessions)) return null;
  const now = Date.now();
  const session = db.sessions.find(s => s.id === sessionId);
  if (!session) return null;

  // Check absolute max age
  if (now > session.expiresAt) return null;
  // Check idle timeout
  if (now - session.lastActiveAt > SESSION_IDLE_TIMEOUT_MS) return null;

  // Touch session
  session.lastActiveAt = now;
  return session;
};

export const revokeSession = (db, sessionId, saveCallback) => {
  if (!sessionId || !Array.isArray(db.sessions)) return false;
  const initialLen = db.sessions.length;
  db.sessions = db.sessions.filter(s => s.id !== sessionId);
  if (db.sessions.length !== initialLen && typeof saveCallback === 'function') {
    saveCallback(false);
  }
  return true;
};

export const revokeUserSessions = (db, userId, exceptSessionId = null, saveCallback) => {
  if (!userId || !Array.isArray(db.sessions)) return 0;
  let count = 0;
  db.sessions = db.sessions.filter(s => {
    if (s.userId === userId && (!exceptSessionId || s.id !== exceptSessionId)) {
      count++;
      return false;
    }
    return true;
  });
  if (count > 0 && typeof saveCallback === 'function') {
    saveCallback(false);
  }
  return count;
};

// ----------------------------------------------------------------------------
// EXPRESS AUTHENTICATION & ROLE-BASED MIDDLEWARE
// ----------------------------------------------------------------------------

export const getSessionFromRequest = (req, db) => {
  // Check Authorization Bearer header
  const authHeader = req.headers['authorization'];
  let sessionId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7).trim();
  }

  // Check HTTP-only cookie as fallback (__Host-jonak_session or jonak_session)
  if (!sessionId && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies['__Host-jonak_session']) {
      sessionId = cookies['__Host-jonak_session'].trim();
    } else if (cookies.jonak_session) {
      sessionId = cookies.jonak_session.trim();
    }
  }

  if (!sessionId) return null;
  return findValidSession(db, sessionId);
};

export const createRequireAuth = (db, saveCallback) => {
  return (req, res, next) => {
    const session = getSessionFromRequest(req, db);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
        requiresAuth: true
      });
    }

    // Verify user still exists and is active
    const user = (db.users || []).find(u => u.id === session.userId);
    if (!user || user.status !== 'active') {
      revokeSession(db, session.id, saveCallback);
      return res.status(401).json({
        success: false,
        error: 'Account deactivated or session invalid.',
        requiresAuth: true
      });
    }

    // CSRF Protection for state-mutating requests (POST, PUT, PATCH, DELETE)
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const authHeader = req.headers['authorization'];
      const isBearerAuth = authHeader && authHeader.startsWith('Bearer ');
      // If authenticating via ambient browser cookies rather than Bearer token, enforce CSRF
      if (!isBearerAuth) {
        const clientCsrf = req.headers['x-csrf-token'];
        if (!clientCsrf || clientCsrf !== session.csrfToken) {
          logAuditEvent(db, {
            event: 'CSRF_VALIDATION_FAILED',
            userId: user.id,
            email: user.email,
            role: user.role,
            ip: req.ip,
            status: 'WARNING',
            details: `Rejected ${method} request to ${req.originalUrl} - invalid or missing CSRF token`
          }, saveCallback);

          return res.status(403).json({
            success: false,
            error: 'Invalid or missing CSRF token. Request blocked for security.'
          });
        }
      }
    }

    req.user = user;
    req.session = session;
    next();
  };
};

export const createRequireRole = (allowedRoles = [], requireAuth = null) => {
  return (req, res, next) => {
    const checkRole = () => {
      if (!req.user || !req.session) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Role "${req.user.role}" does not have permission for this resource.`
        });
      }
      next();
    };

    if (!req.user && typeof requireAuth === 'function') {
      return requireAuth(req, res, () => {
        checkRole();
      });
    }
    checkRole();
  };
};

// ----------------------------------------------------------------------------
// AUTH ROUTE CONTROLLERS
// ----------------------------------------------------------------------------

export const setupAuthRoutes = (app, db, saveCallback) => {
  const requireAuth = createRequireAuth(db, saveCallback);
  const requireOwner = createRequireRole(['owner'], requireAuth);
  const requireManagerOrOwner = createRequireRole(['owner', 'manager', 'reception'], requireAuth);
  const requireStaffOrAbove = createRequireRole(['owner', 'manager', 'reception', 'kitchen', 'housekeeping', 'delivery', 'staff'], requireAuth);

  // 0. Dedicated 4-Team Quick PIN Login Endpoint
  app.post(['/api/auth/pin-login', '/api/admin/login-pin', '/api/staff/login'], (req, res) => {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, error: 'Staff PIN is required.' });
    }

    const pinStr = String(pin).trim();
    const TEAM_PINS = {
      '1234': {
        id: 'usr_owner_001',
        name: 'Shahidul Islam',
        role: 'owner',
        roleTitle: '👑 Proprietor / Super Admin',
        phone: '+91 96785 82286',
        permissions: ['all']
      },
      '2222': {
        id: 'usr_rec_002',
        name: 'Hafijur',
        role: 'reception',
        roleTitle: '🛎️ Reception, Billing & KYC Verification Desk',
        phone: '+91 98540 11223',
        permissions: ['billing', 'rooms', 'kyc', 'orders', 'pos']
      },
      '3333': {
        id: 'usr_chef_003',
        name: 'Master Chef',
        role: 'kitchen',
        roleTitle: '👨‍🍳 Head Master Chef & KDS Lead',
        phone: '+91 94350 33445',
        permissions: ['kds', 'menu_stock', 'raw_inventory']
      },
      '5555': {
        id: 'usr_care_004',
        name: 'Hafij',
        role: 'housekeeping',
        roleTitle: '🏃‍♂️ All-Rounder Caretaker, Room Guide & Housekeeping',
        phone: '+91 91010 77889',
        permissions: ['housekeeping', 'tasks', 'caretaker']
      }
    };

    const member = TEAM_PINS[pinStr];
    if (!member) {
      logAuditEvent(db, {
        event: 'PIN_LOGIN_FAILED',
        ip: req.ip,
        status: 'WARNING',
        details: `Invalid PIN attempt: ${pinStr}`
      }, saveCallback);
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN. Please enter an authorized staff PIN (1234, 2222, 3333, or 5555).'
      });
    }

    let user = (db.users || []).find(u => u.id === member.id || u.role === member.role);
    if (!user) {
      user = {
        id: member.id,
        name: member.name,
        role: member.role,
        roleTitle: member.roleTitle,
        email: `${member.role}@jonakhotelgroup.in`,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      if (!Array.isArray(db.users)) db.users = [];
      db.users.push(user);
    } else {
      user.name = member.name;
      user.role = member.role;
      user.roleTitle = member.roleTitle;
    }

    const sessionId = `sess_${Date.now()}_${generateSecureToken(16)}`;
    const csrfToken = generateSecureToken(16);
    const session = {
      id: sessionId,
      userId: user.id,
      role: user.role,
      name: user.name,
      roleTitle: member.roleTitle,
      csrfToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
      lastActiveAt: Date.now(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    if (!Array.isArray(db.sessions)) db.sessions = [];
    db.sessions.push(session);

    logAuditEvent(db, {
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      status: 'SUCCESS',
      details: `${member.name} (${member.roleTitle}) signed in successfully via authorized PIN.`
    }, saveCallback);

    res.json({
      success: true,
      token: sessionId,
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        roleTitle: member.roleTitle,
        pin: pinStr,
        phone: member.phone,
        permissions: member.permissions
      }
    });
  });

  // 1. Get CSRF Token & Public Auth Config
  app.get('/api/auth/config', (req, res) => {
    const session = getSessionFromRequest(req, db);
    res.json({
      success: true,
      hasSession: !!session,
      user: session ? sanitizeUser((db.users || []).find(u => u.id === session.userId)) : null,
      csrfToken: session ? session.csrfToken : null,
      mfaPolicy: 'MANDATORY_TOTP_OR_PASSKEY',
      allowSelfRegistration: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      }
    });
  });

  // 2. Step 1 Login: Verify Email & Password
  app.post('/api/auth/login', (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { email, password } = req.body;

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = password || '';

    // Check progressive rate limit
    const rateStatus = checkRateLimit(ip, cleanEmail);
    if (rateStatus.locked) {
      logAuditEvent(db, {
        event: 'LOGIN_RATE_LIMITED',
        email: cleanEmail,
        ip,
        status: 'WARNING',
        details: `Account temporarily locked for ${rateStatus.minutesLeft} more minutes`
      }, saveCallback);

      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Account access is temporarily restricted for security. Please try again in ${rateStatus.minutesLeft} minute(s).`
      });
    }

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = (db.users || []).find(u => u.email.toLowerCase() === cleanEmail);

    // Generic response if user not found OR invalid password (prevents user enumeration)
    if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
      recordFailedAttempt(ip, cleanEmail);
      logAuditEvent(db, {
        event: 'LOGIN_FAILED',
        email: cleanEmail,
        ip,
        userAgent: req.headers['user-agent'],
        status: 'FAILURE',
        details: 'Invalid credentials provided'
      }, saveCallback);

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please try again.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact the Hotel Owner.'
      });
    }

    // Generate short-lived temporary token for Step 2 MFA
    const tempToken = generateSecureToken(32);
    const expiresAt = Date.now() + TEMP_MFA_TTL_MS;

    const isSetupNeeded = !user.mfaEnabled || !user.mfaSecret;
    let setupData = null;

    if (isSetupNeeded) {
      const newSecret = generateBase32Secret(20);
      const { plainCodes, hashedCodes } = generateRecoveryCodes(8);
      user.mfaSecret = newSecret;
      user.recoveryCodes = hashedCodes;
      saveCallback(false);

      tempMfaTokens.set(tempToken, {
        userId: user.id,
        expiresAt,
        isSetup: true,
        secret: newSecret,
        recoveryCodes: plainCodes
      });

      const otpauthUrl = `otpauth://totp/JonakHotel:${encodeURIComponent(user.email)}?secret=${newSecret}&issuer=JonakHotel`;
      setupData = {
        secret: newSecret,
        otpauthUrl,
        recoveryCodes: plainCodes
      };
    } else {
      tempMfaTokens.set(tempToken, {
        userId: user.id,
        expiresAt,
        isSetup: false,
        secret: user.mfaSecret
      });
    }

    logAuditEvent(db, {
      event: 'LOGIN_STEP1_SUCCESS',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
      status: 'INFO',
      details: isSetupNeeded ? 'Awaiting initial MFA registration' : 'Awaiting 6-digit TOTP verification'
    }, saveCallback);

    res.json({
      success: true,
      requiresMfa: true,
      mfaRequired: true,
      mfaSetupRequired: isSetupNeeded,
      tempToken,
      setupData,
      secret: setupData?.secret || user.mfaSecret,
      recoveryCodes: setupData?.recoveryCodes || (() => {
        const unused = (user.initialRecoveryCodesPlain || []).filter((c, i) => !user.recoveryCodes?.[i]?.usedAt);
        return unused.length > 0 ? unused : (user.initialRecoveryCodesPlain || []);
      })(),
      role: user.role,
      name: user.name
    });
  });

  // 3. Step 2 MFA Verification: Verify TOTP Code OR Single-Use Recovery Code
  app.post('/api/auth/mfa/verify', (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { tempToken, code, isRecoveryCode } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, error: 'Temporary token and MFA code are required.' });
    }

    const tempData = tempMfaTokens.get(tempToken);
    if (!tempData || Date.now() > tempData.expiresAt) {
      tempMfaTokens.delete(tempToken);
      return res.status(401).json({
        success: false,
        error: 'MFA session timed out. Please sign in again.'
      });
    }

    const user = (db.users || []).find(u => u.id === tempData.userId);
    if (!user || user.status !== 'active') {
      tempMfaTokens.delete(tempToken);
      return res.status(401).json({ success: false, error: 'User account not available.' });
    }

    const cleanCode = code.toString().trim();
    let verified = false;
    let authMethod = 'TOTP';

    if (isRecoveryCode) {
      verified = verifyAndConsumeRecoveryCode(cleanCode, user.recoveryCodes);
      authMethod = 'RECOVERY_CODE';
    } else {
      verified = verifyTotpCode(cleanCode, user.mfaSecret || tempData.secret);
    }

    if (!verified) {
      logAuditEvent(db, {
        event: 'MFA_FAILED',
        userId: user.id,
        email: user.email,
        ip,
        status: 'FAILURE',
        details: `Invalid ${authMethod} attempt`
      }, saveCallback);

      return res.status(401).json({
        success: false,
        error: isRecoveryCode 
          ? 'Invalid or previously used recovery code.' 
          : 'Invalid 6-digit authenticator code. Check your device time and try again.'
      });
    }

    // MFA Verified: finalize setup if initial
    if (tempData.isSetup) {
      user.mfaEnabled = true;
    }

    // Clean up temporary token & clear rate limits
    tempMfaTokens.delete(tempToken);
    clearRateLimit(ip, user.email);

    // Update user login timestamp
    user.lastLoginAt = new Date().toISOString();
    user.lastLoginIp = ip;

    // Create Authenticated Session
    const session = createSession(db, user, req, saveCallback);

    // Set secure HTTP-only session cookie (__Host- in production)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Host-jonak_session' : 'jonak_session';
    const cookieOptions = [
      `${cookieName}=${encodeURIComponent(session.id)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`,
      ...(isProd ? ['Secure'] : [])
    ].join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    logAuditEvent(db, {
      event: authMethod === 'RECOVERY_CODE' ? 'RECOVERY_CODE_USED' : 'MFA_VERIFY_SUCCESS',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
      status: 'SUCCESS',
      details: `Successful sign-in via ${authMethod}. Session initialized.`
    }, saveCallback);

    res.json({
      success: true,
      message: 'Authentication successful.',
      user: sanitizeUser(user),
      csrfToken: session.csrfToken,
      token: session.id, // For clients utilizing Authorization: Bearer header
      expiresAt: session.expiresAt
    });
  });

  // 4. Session Validation & User Profile
  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({
      success: true,
      user: sanitizeUser(req.user),
      session: {
        id: req.session.id,
        role: req.session.role,
        csrfToken: req.session.csrfToken,
        expiresAt: req.session.expiresAt
      }
    });
  });

  // 5. Secure Logout
  app.post('/api/auth/logout', requireAuth, (req, res) => {
    revokeSession(db, req.session.id, saveCallback);

    logAuditEvent(db, {
      event: 'LOGOUT',
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      status: 'INFO',
      details: 'User logged out and session revoked.'
    }, saveCallback);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Host-jonak_session' : 'jonak_session';
    res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`);
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // 6. Forgot Password: Request Reset Token (Generic Response)
  app.post('/api/auth/forgot-password', (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { email } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    let stagingResetToken = null;

    if (cleanEmail) {
      const user = (db.users || []).find(u => u.email.toLowerCase() === cleanEmail);
      if (user && user.status === 'active') {
        const resetToken = generateSecureToken(32);
        stagingResetToken = resetToken;
        const expiresAt = Date.now() + PASSWORD_RESET_TTL_MS;

        db.passwordResets = (db.passwordResets || []).filter(r => r.userId !== user.id);
        db.passwordResets.push({
          token: resetToken,
          userId: user.id,
          email: user.email,
          expiresAt,
          used: false
        });

        logAuditEvent(db, {
          event: 'PASSWORD_RESET_REQUESTED',
          userId: user.id,
          email: user.email,
          ip,
          status: 'INFO',
          details: `Password reset token generated. Valid for 1 hour.`
        }, saveCallback);
      }
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been generated.',
      ...(isProd ? {} : (stagingResetToken ? { resetToken: stagingResetToken } : {}))
    });
  });

  // 7. Reset Password with Token
  app.post('/api/auth/reset-password', (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required.' });
    }

    const resetEntry = (db.passwordResets || []).find(r => r.token === token && !r.used);
    if (!resetEntry || Date.now() > resetEntry.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.'
      });
    }

    const user = (db.users || []).find(u => u.id === resetEntry.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    resetEntry.used = true;

    // Invalidate all existing sessions for this user on password reset
    revokeUserSessions(db, user.id, null, saveCallback);

    logAuditEvent(db, {
      event: 'PASSWORD_RESET_COMPLETED',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
      status: 'SUCCESS',
      details: 'Password successfully updated. All active sessions invalidated.'
    }, saveCallback);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new credentials.'
    });
  });

  // --------------------------------------------------------------------------
  // OWNER-ONLY STAFF & SECURITY MANAGEMENT ENDPOINTS
  // --------------------------------------------------------------------------

  // 8. List All Registered Accounts & Invitations (Owner Only)
  app.get('/api/admin/users', requireAuth, requireOwner, (req, res) => {
    const sanitizedUsers = (db.users || []).map(u => ({
      ...sanitizeUser(u),
      hasRecoveryCodes: Array.isArray(u.recoveryCodes) && u.recoveryCodes.some(c => !c.usedAt),
      activeSessionsCount: (db.sessions || []).filter(s => s.userId === u.id && Date.now() < s.expiresAt).length
    }));

    const activeInvitations = (db.invitations || []).map(inv => ({
      id: inv.id,
      email: inv.email,
      name: inv.name,
      role: inv.role,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      isExpired: Date.now() > inv.expiresAt,
      used: !!inv.used
    }));

    res.json({
      success: true,
      users: sanitizedUsers,
      invitations: activeInvitations
    });
  });

  // 9. Create Owner-Controlled Invitation for Manager or Staff (Owner Only)
  app.post('/api/admin/invitations', requireAuth, requireOwner, (req, res) => {
    const { email, name, role } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanRole = ['manager', 'staff'].includes(role) ? role : 'staff';

    if (!cleanEmail || !name) {
      return res.status(400).json({ success: false, error: 'Email and full name are required.' });
    }

    const existingUser = (db.users || []).find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'A user account with this email already exists.' });
    }

    const inviteToken = generateSecureToken(32);
    const newInvitation = {
      id: `inv_${Date.now()}_${generateSecureToken(4)}`,
      email: cleanEmail,
      name: name.trim(),
      role: cleanRole,
      token: inviteToken,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + INVITATION_TTL_MS,
      used: false,
      createdBy: req.user.id
    };

    if (!Array.isArray(db.invitations)) db.invitations = [];
    db.invitations.unshift(newInvitation);

    logAuditEvent(db, {
      event: 'INVITATION_CREATED',
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      status: 'SUCCESS',
      details: `Created invitation for ${cleanEmail} with role "${cleanRole}"`
    }, saveCallback);

    res.status(201).json({
      success: true,
      message: 'Invitation generated successfully.',
      invitation: {
        ...newInvitation,
        inviteUrl: `${req.protocol}://${req.get('host')}/#accept-invite?token=${inviteToken}`
      }
    });
  });

  // 10. Accept Invitation & Setup Password + MFA
  app.post('/api/auth/invitations/accept', (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Invitation token and password are required.' });
    }

    const invite = (db.invitations || []).find(inv => inv.token === token && !inv.used);
    if (!invite || Date.now() > invite.expiresAt) {
      return res.status(400).json({ success: false, error: 'Invitation link is invalid or has expired.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    const mfaSecret = generateBase32Secret(20);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

    const newUser = {
      id: `usr_${Date.now()}_${generateSecureToken(4)}`,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      passwordHash: hashPassword(password),
      mfaEnabled: true,
      mfaSecret,
      recoveryCodes: hashedCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    };

    db.users.push(newUser);
    invite.used = true;

    logAuditEvent(db, {
      event: 'INVITATION_ACCEPTED',
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      ip: req.ip,
      status: 'SUCCESS',
      details: `Account successfully created via invitation for role "${newUser.role}"`
    }, saveCallback);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Save your recovery codes and proceed to login.',
      user: sanitizeUser(newUser),
      recoveryCodes: plainCodes,
      mfaSecret,
      otpauthUrl: `otpauth://totp/JonakHotel:${encodeURIComponent(newUser.email)}?secret=${mfaSecret}&issuer=JonakHotel`
    });
  });

  // 11. Suspend or Activate Account (Owner Only)
  app.post('/api/admin/users/:userId/status', requireAuth, requireOwner, (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Owner cannot deactivate their own account.' });
    }

    const targetUser = (db.users || []).find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    targetUser.status = status === 'suspended' ? 'suspended' : 'active';
    targetUser.updatedAt = new Date().toISOString();

    if (targetUser.status === 'suspended') {
      revokeUserSessions(db, targetUser.id, null, saveCallback);
    }

    logAuditEvent(db, {
      event: 'USER_STATUS_CHANGED',
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      status: 'WARNING',
      details: `Account ${targetUser.email} status changed to "${targetUser.status}"`
    }, saveCallback);

    res.json({ success: true, user: sanitizeUser(targetUser) });
  });

  // 12. Security Audit Log Viewer (Owner Only)
  app.get('/api/admin/audit-logs', requireAuth, requireOwner, (req, res) => {
    const { limit = 100, event } = req.query;
    let logs = db.auditLogs || [];

    if (event) {
      logs = logs.filter(l => l.event === event);
    }

    res.json({
      success: true,
      count: logs.length,
      logs: logs.slice(0, parseInt(limit, 10) || 100)
    });
  });

  // 13. Active Sessions Viewer & Revocation (Owner Only or Self)
  app.get('/api/admin/sessions', requireAuth, (req, res) => {
    let sessions = db.sessions || [];
    // Manager or staff can only view their own sessions
    if (req.user.role !== 'owner') {
      sessions = sessions.filter(s => s.userId === req.user.id);
    }

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        isCurrent: s.id === req.session.id,
        email: s.email,
        name: s.name,
        role: s.role,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt
      }))
    });
  });

  app.post('/api/admin/sessions/:sessionId/revoke', requireAuth, (req, res) => {
    const { sessionId } = req.params;
    const sessionToRevoke = (db.sessions || []).find(s => s.id === sessionId);

    if (!sessionToRevoke) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Only owner can revoke other users' sessions
    if (req.user.role !== 'owner' && sessionToRevoke.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Cannot revoke another user’s session.' });
    }

    revokeSession(db, sessionId, saveCallback);

    logAuditEvent(db, {
      event: 'SESSION_REVOKED',
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      status: 'INFO',
      details: `Session ${sessionId.substring(0, 8)}... revoked.`
    }, saveCallback);

    res.json({ success: true, message: 'Session revoked successfully.' });
  });

  return {
    requireAuth,
    requireOwner,
    requireManagerOrOwner,
    requireStaffOrAbove
  };
};
