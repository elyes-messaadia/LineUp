const pino = require('pino');

// Configure base logger. In production we set level via env var or default to 'info'
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  redact: {
    // Redact commonly sensitive fields if accidentally logged
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'req.headers.authorization'],
    remove: false
  }
});

module.exports = logger;
