const crypto = require('crypto');
const logger = require('./logger');

function hmacFingerprint(value) {
  const key = process.env.LOG_HMAC_KEY || process.env.JWT_SECRET || 'dev_fallback_key';
  try {
    return crypto.createHmac('sha256', key).update(String(value)).digest('hex');
  } catch (e) {
    logger.warn('Unable to create HMAC fingerprint, falling back to raw value');
    return String(value);
  }
}

module.exports = { hmacFingerprint };
