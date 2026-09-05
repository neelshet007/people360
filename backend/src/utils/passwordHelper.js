const crypto = require('crypto');

/**
 * Password Security Helper
 * Provides enterprise-grade, cryptographically secure password hashing & verification
 * using Node.js native crypto.scrypt (no external native compilation required)
 */

function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Valid password string required for hashing');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error('[PasswordHelper] Verification error:', err.message);
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
