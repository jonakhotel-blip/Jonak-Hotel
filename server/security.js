import crypto from 'crypto';

// ----------------------------------------------------------------------------
// PASSWORD HASHING (scrypt with 16-byte cryptographically secure salt)
// ----------------------------------------------------------------------------

export const hashPassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHashHex] = parts;
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
    if (derivedKey.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
};

// ----------------------------------------------------------------------------
// TOTP (RFC 6238 Standard Time-based One-Time Password)
// ----------------------------------------------------------------------------

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const generateBase32Secret = (length = 20) => {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE32_ALPHABET[bytes[i] % 32];
  }
  return result;
};

export const base32ToBuffer = (base32Str) => {
  const clean = base32Str.toUpperCase().replace(/[\s=-]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
};

export const generateTotpCode = (secretBase32, timeOffsetSteps = 0) => {
  const key = base32ToBuffer(secretBase32);
  const timeStep = Math.floor(Date.now() / 1000 / 30) + timeOffsetSteps;
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  );

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, '0');
};

export const verifyTotpCode = (token, secretBase32) => {
  if (!token || !secretBase32) return false;
  const cleanToken = token.toString().trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const targetBuffer = Buffer.from(cleanToken);

  // Check window: -1 (30s ago), 0 (current), +1 (30s future)
  for (const offset of [0, -1, 1]) {
    const expected = generateTotpCode(secretBase32, offset);
    const expectedBuffer = Buffer.from(expected);
    if (crypto.timingSafeEqual(targetBuffer, expectedBuffer)) {
      return true;
    }
  }
  return false;
};

// ----------------------------------------------------------------------------
// SINGLE-USE RECOVERY CODES
// ----------------------------------------------------------------------------

export const generateRecoveryCodes = (count = 8) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous chars
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const rand = crypto.randomBytes(8);
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars[rand[j] % chars.length];
      if (j === 3) code += '-';
    }
    plainCodes.push(code);
    const hash = crypto.createHash('sha256').update(code.toUpperCase().replace(/-/g, '')).digest('hex');
    hashedCodes.push({ hash, usedAt: null, codePreview: code.substring(0, 4) + '-****' });
  }

  return { plainCodes, hashedCodes };
};

export const verifyAndConsumeRecoveryCode = (inputCode, recoveryCodes = []) => {
  if (!inputCode || !Array.isArray(recoveryCodes)) return false;
  const clean = inputCode.toString().trim().toUpperCase().replace(/[\s-]/g, '');
  if (clean.length !== 8) return false;

  const inputHash = crypto.createHash('sha256').update(clean).digest('hex');
  const inputBuffer = Buffer.from(inputHash, 'hex');

  for (const entry of recoveryCodes) {
    if (entry.usedAt) continue; // Already consumed
    const entryBuffer = Buffer.from(entry.hash, 'hex');
    if (entryBuffer.length === inputBuffer.length && crypto.timingSafeEqual(entryBuffer, inputBuffer)) {
      entry.usedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
};

// ----------------------------------------------------------------------------
// SESSION & TOKEN UTILITIES
// ----------------------------------------------------------------------------

export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, mfaSecret, recoveryCodes, ...safe } = user;
  return {
    ...safe,
    recoveryCodesRemaining: Array.isArray(recoveryCodes) ? recoveryCodes.filter(c => !c.usedAt).length : 0
  };
};

export const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      try {
        list[key] = decodeURIComponent(val);
      } catch {
        list[key] = val;
      }
    }
  });
  return list;
};

// Aliases for compatibility with test suites and external integrations
export const generateTOTP = generateTotpCode;
export const verifyTOTP = verifyTotpCode;
